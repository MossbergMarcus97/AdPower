import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { z } from 'zod'
import { createSignedSessionToken, getSessionCookieName, verifySignedSessionToken } from './lib/auth'
import {
  createExportRecord,
  createGenerationJob,
  ensureCampaignExists,
  finalizeExportRecord,
  getExportRecord,
  getGenerationJob,
  getMetricsSummary,
  listVariants,
  listVariantsByIds,
  updateVariantStatus,
} from './lib/db'
import { consumeDailyJobQuota, enforceRateLimit } from './lib/rateLimit'
import { processGenerationJob } from './lib/queue'
import type { AppVariables, Env, QueueMessage } from './types'

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>()

const sessionCookieName = getSessionCookieName()
const corsMethods = 'GET,POST,PATCH,OPTIONS'
const corsHeaders = 'Content-Type'

function resolveCorsOrigin(origin: string | undefined, env: Env): string | null {
  if (!origin) {
    return null
  }

  const configuredOrigin = env.APP_ORIGIN ?? 'https://adpower.pages.dev'
  if (origin === configuredOrigin || origin === 'http://localhost:5173') {
    return origin
  }

  try {
    const appHost = new URL(configuredOrigin).hostname
    const originHost = new URL(origin).hostname

    if (originHost === appHost || originHost.endsWith(`.${appHost}`)) {
      return origin
    }
  } catch {
    return null
  }

  return null
}

function parseIntSafe(value: string | null, fallback: number): number {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return parsed
}

function classifyError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return 'provider_timeout'
    }

    if (error.message.includes('auth')) {
      return 'provider_auth'
    }

    if (error.message.includes('db')) {
      return 'db_error'
    }
  }

  return 'unknown_error'
}

function toApiError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

app.use('*', async (c, next) => {
  const requestId = crypto.randomUUID()
  const start = Date.now()

  c.set('requestId', requestId)
  c.set('sessionId', null)

  await next()

  const duration = Date.now() - start
  console.info(
    JSON.stringify({
      requestId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: duration,
    }),
  )
})

app.use('/v1/*', async (c, next) => {
  const allowedOrigin = resolveCorsOrigin(c.req.header('origin'), c.env)

  if (c.req.method === 'OPTIONS') {
    if (allowedOrigin) {
      c.header('Access-Control-Allow-Origin', allowedOrigin)
      c.header('Access-Control-Allow-Credentials', 'true')
      c.header('Access-Control-Allow-Methods', corsMethods)
      c.header('Access-Control-Allow-Headers', corsHeaders)
      c.header('Vary', 'Origin')
    }

    return c.body(null, 204)
  }

  if (c.req.path === '/v1/session') {
    await next()

    if (allowedOrigin) {
      c.header('Access-Control-Allow-Origin', allowedOrigin)
      c.header('Access-Control-Allow-Credentials', 'true')
      c.header('Access-Control-Allow-Methods', corsMethods)
      c.header('Access-Control-Allow-Headers', corsHeaders)
      c.header('Vary', 'Origin')
    }

    return
  }

  const sessionToken = getCookie(c, sessionCookieName)
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const sessionId = await verifySignedSessionToken(
    sessionToken,
    c.env.SESSION_SECRET,
  )

  if (!sessionId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  c.set('sessionId', sessionId)

  const ip = c.req.header('cf-connecting-ip') ?? 'local'
  const limit = enforceRateLimit(`req:${ip}`, 240, 60_000)
  if (!limit.allowed) {
    return c.json({ error: 'Rate limit exceeded' }, 429)
  }

  await next()

  if (allowedOrigin) {
    c.header('Access-Control-Allow-Origin', allowedOrigin)
    c.header('Access-Control-Allow-Credentials', 'true')
    c.header('Access-Control-Allow-Methods', corsMethods)
    c.header('Access-Control-Allow-Headers', corsHeaders)
    c.header('Vary', 'Origin')
  }
})

app.get('/health', (c) => {
  return c.json({ ok: true })
})

app.get('/v1/session', async (c) => {
  const sessionToken = getCookie(c, sessionCookieName)
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const sessionId = await verifySignedSessionToken(
    sessionToken,
    c.env.SESSION_SECRET,
  )
  if (!sessionId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return c.json({ authenticated: true })
})

app.post('/v1/session', async (c) => {
  const body = await c.req.json().catch(() => null)
  const schema = z.object({ passphrase: z.string().min(1) })
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return c.json({ error: 'Invalid request body' }, 400)
  }

  if (parsed.data.passphrase !== c.env.SESSION_PASSPHRASE) {
    return c.json({ error: 'Invalid passphrase' }, 401)
  }

  const sessionId = crypto.randomUUID()
  const token = await createSignedSessionToken(sessionId, c.env.SESSION_SECRET)

  setCookie(c, sessionCookieName, token, {
    httpOnly: true,
    secure: true,
    path: '/',
    sameSite: 'None',
    maxAge: 60 * 60 * 12,
  })

  return c.body(null, 204)
})

const generationJobSchema = z.object({
  campaignId: z.string().min(1),
  mode: z.enum(['quick', 'custom', 'iterate']),
  targetCount: z.number().int().min(1).max(500),
  headlineVariations: z.number().int().min(1).max(50),
  visualVariations: z.number().int().min(1).max(50),
  messages: z.array(z.string()).default([]),
  platforms: z.array(z.string()).default([]),
  testMode: z
    .enum([
      'none',
      'force_copy_primary_failure',
      'force_image_primary_failure',
      'force_copy_fallback',
      'force_image_fallback',
    ])
    .optional(),
})

app.post('/v1/generation-jobs', async (c) => {
  const payload = await c.req.json().catch(() => null)
  const parsed = generationJobSchema.safeParse(payload)

  if (!parsed.success) {
    return c.json({ error: 'Invalid generation configuration' }, 400)
  }

  const testModeEnabled = c.env.ENABLE_PROVIDER_TEST_MODE === 'true'
  if (parsed.data.testMode && parsed.data.testMode !== 'none' && !testModeEnabled) {
    return c.json({ error: 'Provider test mode is disabled' }, 400)
  }

  const sessionId = c.get('sessionId')
  if (!sessionId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const maxJobsPerDay = parseIntSafe(c.env.MAX_JOBS_PER_DAY ?? '20', 20)
  const quota = await consumeDailyJobQuota(c.env.DB, sessionId, maxJobsPerDay)
  if (!quota.allowed) {
    return c.json(
      { error: 'Daily generation quota reached for this session' },
      429,
    )
  }

  try {
    await ensureCampaignExists(c.env.DB, parsed.data.campaignId)

    const jobId = crypto.randomUUID()
    const targetCap = parseIntSafe(c.env.MAX_VARIANTS_PER_JOB ?? '20', 20)

    await createGenerationJob(c.env.DB, {
      id: jobId,
      campaignId: parsed.data.campaignId,
      mode: parsed.data.mode,
      config: {
        ...parsed.data,
        targetCount: Math.min(parsed.data.targetCount, targetCap),
      },
      stage: 'Queued',
    })

    await c.env.GEN_QUEUE.send({ jobId } satisfies QueueMessage)

    return c.json({ jobId, status: 'queued' })
  } catch (error) {
    console.error(
      JSON.stringify({
        requestId: c.get('requestId'),
        event: 'generation_job_create_failed',
        error: toApiError(error, 'generation_job_create_failed'),
        code: classifyError(error),
      }),
    )

    return c.json({ error: 'Failed to create generation job' }, 500)
  }
})

app.get('/v1/generation-jobs/:jobId', async (c) => {
  const job = await getGenerationJob(c.env.DB, c.req.param('jobId'))
  if (!job) {
    return c.json({ error: 'Job not found' }, 404)
  }

  let parsedError: string | null = null
  if (job.error_json) {
    try {
      const asObject = JSON.parse(job.error_json) as { message?: string; code?: string }
      parsedError = asObject.message ?? asObject.code ?? null
    } catch {
      parsedError = job.error_json
    }
  }

  return c.json({
    jobId: job.id,
    status: job.status,
    progress: Number(job.progress.toFixed(0)),
    stage: job.stage,
    error: parsedError,
    startedAt: job.started_at,
    completedAt: job.completed_at,
  })
})

app.get('/v1/metrics/summary', async (c) => {
  const windowHours = Math.max(
    1,
    Math.min(parseIntSafe(c.req.query('windowHours') ?? null, 24), 24 * 14),
  )

  try {
    const summary = await getMetricsSummary(c.env.DB, windowHours)
    return c.json(summary)
  } catch (error) {
    console.error(
      JSON.stringify({
        requestId: c.get('requestId'),
        event: 'metrics_summary_failed',
        error: toApiError(error, 'metrics_summary_failed'),
        code: classifyError(error),
      }),
    )

    return c.json({ error: 'Failed to load metrics summary' }, 500)
  }
})

app.get('/v1/campaigns/:campaignId/variants', async (c) => {
  const status = c.req.query('status') as 'pending' | 'approved' | 'rejected' | undefined
  const limit = Math.max(1, Math.min(parseIntSafe(c.req.query('limit') ?? null, 40), 200))
  const cursor = Math.max(0, parseIntSafe(c.req.query('cursor') ?? null, 0))

  const result = await listVariants(c.env.DB, {
    campaignId: c.req.param('campaignId'),
    status,
    limit,
    cursor,
  })

  return c.json({
    items: result.items.map((variant) => ({
      id: variant.id,
      title: `Variant ${variant.id.slice(0, 8)}`,
      headline: variant.headline,
      body: variant.body,
      cta: variant.cta,
      confidence: variant.confidence,
      status: variant.status,
      aiGenerated: variant.ai_generated === 1,
      providerCopy: variant.provider_copy,
      providerImage: variant.provider_image,
      createdAt: variant.created_at,
      imageUrl: variant.image_r2_key
        ? `/v1/exports/asset/${encodeURIComponent(variant.image_r2_key)}`
        : null,
    })),
    nextCursor: result.nextCursor,
  })
})

const variantStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
})

app.patch('/v1/variants/:variantId/status', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = variantStatusSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ error: 'Invalid variant status payload' }, 400)
  }

  const updated = await updateVariantStatus(
    c.env.DB,
    c.req.param('variantId'),
    parsed.data.status,
  )

  if (!updated) {
    return c.json({ error: 'Variant not found' }, 404)
  }

  return c.json({
    id: updated.id,
    title: `Variant ${updated.id.slice(0, 8)}`,
    headline: updated.headline,
    body: updated.body,
    cta: updated.cta,
    confidence: updated.confidence,
    status: updated.status,
    aiGenerated: updated.ai_generated === 1,
    providerCopy: updated.provider_copy,
    providerImage: updated.provider_image,
    createdAt: updated.created_at,
  })
})

const exportSchema = z.object({
  campaignId: z.string().min(1),
  variantIds: z.array(z.string()).default([]),
  platforms: z.array(z.string()).default([]),
  format: z.enum(['PNG', 'JPG', 'PDF']),
  grouping: z.enum(['By Platform', 'By Variant Group', 'Flat']),
})

app.post('/v1/exports', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = exportSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ error: 'Invalid export payload' }, 400)
  }

  const exportId = crypto.randomUUID()

  try {
    await createExportRecord(c.env.DB, {
      id: exportId,
      campaignId: parsed.data.campaignId,
      configJson: JSON.stringify(parsed.data),
    })

    const variants = await listVariantsByIds(c.env.DB, parsed.data.variantIds)
    const artifactKey = `exports/${parsed.data.campaignId}/${exportId}.json`

    const manifest = {
      exportId,
      generatedAt: new Date().toISOString(),
      config: parsed.data,
      variants,
    }

    await c.env.ASSETS.put(artifactKey, JSON.stringify(manifest, null, 2), {
      httpMetadata: {
        contentType: 'application/json',
      },
    })

    await finalizeExportRecord(c.env.DB, {
      exportId,
      status: 'completed',
      artifactKey,
    })

    return c.json({
      exportId,
      status: 'completed',
      downloadUrl: `/v1/exports/${exportId}/download`,
    })
  } catch (error) {
    await finalizeExportRecord(c.env.DB, {
      exportId,
      status: 'failed',
    })

    console.error(
      JSON.stringify({
        requestId: c.get('requestId'),
        event: 'export_failed',
        error: toApiError(error, 'export_failed'),
        code: classifyError(error),
      }),
    )

    return c.json({ error: 'Failed to generate export package' }, 500)
  }
})

app.get('/v1/exports/:exportId', async (c) => {
  const exportRecord = await getExportRecord(c.env.DB, c.req.param('exportId'))
  if (!exportRecord) {
    return c.json({ error: 'Export not found' }, 404)
  }

  return c.json({
    exportId: exportRecord.id,
    status: exportRecord.status,
    downloadUrl:
      exportRecord.status === 'completed' && exportRecord.artifact_r2_key
        ? `/v1/exports/${exportRecord.id}/download`
        : null,
  })
})

app.get('/v1/exports/:exportId/download', async (c) => {
  const exportRecord = await getExportRecord(c.env.DB, c.req.param('exportId'))
  if (!exportRecord || !exportRecord.artifact_r2_key) {
    return c.json({ error: 'Export artifact not found' }, 404)
  }

  const object = await c.env.ASSETS.get(exportRecord.artifact_r2_key)
  if (!object) {
    return c.json({ error: 'Export artifact not found' }, 404)
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/json',
      'Content-Disposition': `attachment; filename="${exportRecord.id}.json"`,
    },
  })
})

app.get('/v1/exports/asset/:encodedKey', async (c) => {
  const key = decodeURIComponent(c.req.param('encodedKey'))
  const object = await c.env.ASSETS.get(key)
  if (!object) {
    return c.json({ error: 'Asset not found' }, 404)
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=300',
    },
  })
})

export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const requestId = crypto.randomUUID()

      try {
        await processGenerationJob(env, message.body.jobId, requestId)
        message.ack()
      } catch (error) {
        console.error(
          JSON.stringify({
            requestId,
            event: 'queue_processing_failed',
            error: toApiError(error, 'queue_processing_failed'),
            code: classifyError(error),
          }),
        )
        message.retry()
      }
    }
  },
}
