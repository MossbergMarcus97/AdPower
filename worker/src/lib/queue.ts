import {
  getGenerationJob,
  insertVariant,
  nowIso,
  updateGenerationJob,
} from './db'
import { generateCopyVariant } from './providers/copy'
import { generateImageVariant } from './providers/image'
import type { Env, GenerationJobConfig } from '../types'

function parseMaxVariants(env: Env): number {
  const parsed = Number(env.MAX_VARIANTS_PER_JOB ?? '20')
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 20
  }

  return parsed
}

function extensionFromContentType(contentType: string): string {
  if (contentType.includes('svg')) {
    return 'svg'
  }

  if (contentType.includes('jpeg') || contentType.includes('jpg')) {
    return 'jpg'
  }

  return 'png'
}

function parseTimestamp(value: string): number {
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : Date.now()
}

function computeConfidence(params: {
  headline: string
  body: string
  cta: string
  providerCopy: string
  providerImage: string
}): number {
  let score = 3.6

  if (params.headline.length > 24 && params.headline.length < 96) {
    score += 0.5
  }

  if (params.body.length > 32) {
    score += 0.3
  }

  if (params.cta.length > 3) {
    score += 0.2
  }

  if (params.providerCopy === 'fallback') {
    score -= 0.4
  }

  if (params.providerImage === 'fallback') {
    score -= 0.35
  }

  return Math.max(0, Math.min(5, Number(score.toFixed(2))))
}

export async function processGenerationJob(
  env: Env,
  jobId: string,
  requestId: string,
): Promise<void> {
  const job = await getGenerationJob(env.DB, jobId)
  if (!job) {
    console.warn(JSON.stringify({ requestId, jobId, event: 'job_missing' }))
    return
  }

  if (job.status === 'completed' || job.status === 'failed') {
    return
  }

  const config = JSON.parse(job.config_json) as GenerationJobConfig
  const variantsTarget = Math.max(
    1,
    Math.min(config.targetCount, parseMaxVariants(env)),
  )
  const startedAtIso = nowIso()
  const queueWaitMs = Math.max(0, Date.now() - parseTimestamp(job.created_at))

  await updateGenerationJob(env.DB, jobId, {
    status: 'running',
    progress: 5,
    stage: 'Building prompt context',
    startedAt: startedAtIso,
  })

  let generatedCount = 0
  let failureCount = 0
  let copyFallbackCount = 0
  let imageFallbackCount = 0

  for (let index = 0; index < variantsTarget; index += 1) {
    const progress = Math.floor(((index + 1) / variantsTarget) * 90)
    await updateGenerationJob(env.DB, jobId, {
      status: 'running',
      progress,
      stage: index % 2 === 0 ? 'Generating visuals' : 'Writing copy variants',
    })

    try {
      const [copy, image] = await Promise.all([
        generateCopyVariant(env, config, index),
        generateImageVariant(env, config, index),
      ])

      const variantId = `var_${jobId}_${index + 1}_${Date.now()}`
      const extension = extensionFromContentType(image.contentType)
      const imageKey = `variants/${job.campaign_id}/${variantId}.${extension}`

      await env.ASSETS.put(imageKey, image.bytes, {
        httpMetadata: {
          contentType: image.contentType,
        },
      })

      const confidence = computeConfidence({
        headline: copy.headline,
        body: copy.body,
        cta: copy.cta,
        providerCopy: copy.provider,
        providerImage: image.provider,
      })

      if (copy.provider === 'fallback') {
        copyFallbackCount += 1
      }

      if (image.provider === 'fallback') {
        imageFallbackCount += 1
      }

      await insertVariant(env.DB, {
        id: variantId,
        campaignId: job.campaign_id,
        jobId,
        headline: copy.headline,
        body: copy.body,
        cta: copy.cta,
        imageR2Key: imageKey,
        providerCopy: copy.provider,
        providerImage: image.provider,
        confidence,
        status: 'pending',
        aiGenerated: true,
      })

      generatedCount += 1
    } catch (error) {
      failureCount += 1
      console.error(
        JSON.stringify({
          requestId,
          jobId,
          event: 'variant_generation_failed',
          error: error instanceof Error ? error.message : String(error),
        }),
      )
    }
  }

  if (generatedCount === 0) {
    const completedAtIso = nowIso()
    const runDurationMs = Math.max(
      0,
      parseTimestamp(completedAtIso) - parseTimestamp(startedAtIso),
    )

    await updateGenerationJob(env.DB, jobId, {
      status: 'failed',
      progress: 100,
      stage: 'Failed',
      errorJson: JSON.stringify({
        code: 'provider_timeout',
        message: 'All variants failed generation',
      }),
      completedAt: completedAtIso,
    })

    console.error(
      JSON.stringify({
        requestId,
        jobId,
        event: 'job_failed',
        queueWaitMs,
        runDurationMs,
        generatedCount,
        failureCount,
        code: 'provider_timeout',
      }),
    )
    return
  }

  const completedAtIso = nowIso()
  const runDurationMs = Math.max(
    0,
    parseTimestamp(completedAtIso) - parseTimestamp(startedAtIso),
  )

  await updateGenerationJob(env.DB, jobId, {
    status: 'completed',
    progress: 100,
    stage: 'Completed',
    errorJson:
      failureCount > 0
        ? JSON.stringify({
            code: 'partial_failure',
            generatedCount,
            failureCount,
          })
        : null,
    completedAt: completedAtIso,
  })

  console.info(
    JSON.stringify({
      requestId,
      jobId,
      event: 'job_completed',
      queueWaitMs,
      runDurationMs,
      generatedCount,
      failureCount,
      copyFallbackCount,
      imageFallbackCount,
      copyFallbackRate: Number((copyFallbackCount / generatedCount).toFixed(4)),
      imageFallbackRate: Number((imageFallbackCount / generatedCount).toFixed(4)),
    }),
  )
}
