import type { GenerationJobConfig } from '../types'

export interface GenerationJobRecord {
  id: string
  campaign_id: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  mode: 'quick' | 'custom' | 'iterate'
  config_json: string
  progress: number
  stage: string
  error_json: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

export interface VariantRecord {
  id: string
  campaign_id: string
  job_id: string
  headline: string
  body: string | null
  cta: string
  image_r2_key: string | null
  provider_copy: string | null
  provider_image: string | null
  confidence: number
  status: 'pending' | 'approved' | 'rejected'
  ai_generated: number
  created_at: string
}

export interface ExportRecord {
  id: string
  campaign_id: string
  config_json: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  artifact_r2_key: string | null
  created_at: string
  completed_at: string | null
}

export interface MetricsSummary {
  windowHours: number
  generatedAt: string
  jobs: {
    total: number
    queued: number
    running: number
    completed: number
    failed: number
    successRate: number
    failureRate: number
    avgQueueWaitMs: number | null
    avgRunDurationMs: number | null
    p95RunDurationMs: number | null
  }
  variants: {
    total: number
    copyFallbackRate: number
    imageFallbackRate: number
    copyProviderCounts: Record<string, number>
    imageProviderCounts: Record<string, number>
  }
  errors: Record<string, number>
}

export function nowIso(): string {
  return new Date().toISOString()
}

export async function ensureCampaignExists(
  db: D1Database,
  campaignId: string,
): Promise<void> {
  const existing = await db
    .prepare(`SELECT id FROM campaigns WHERE id = ?1`)
    .bind(campaignId)
    .first<{ id: string }>()

  if (existing) {
    return
  }

  const now = nowIso()
  await db
    .prepare(
      `INSERT INTO campaigns (id, name, objective, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5)`,
    )
    .bind(campaignId, 'Imported Campaign', 'Conversion', now, now)
    .run()
}

export async function createGenerationJob(
  db: D1Database,
  payload: {
    id: string
    campaignId: string
    mode: 'quick' | 'custom' | 'iterate'
    config: GenerationJobConfig
    stage: string
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO generation_jobs (
        id, campaign_id, status, mode, config_json, progress, stage, created_at
      ) VALUES (?1, ?2, 'queued', ?3, ?4, 0, ?5, ?6)`,
    )
    .bind(
      payload.id,
      payload.campaignId,
      payload.mode,
      JSON.stringify(payload.config),
      payload.stage,
      nowIso(),
    )
    .run()
}

export async function getGenerationJob(
  db: D1Database,
  jobId: string,
): Promise<GenerationJobRecord | null> {
  const job = await db
    .prepare(`SELECT * FROM generation_jobs WHERE id = ?1`)
    .bind(jobId)
    .first<GenerationJobRecord>()

  return job ?? null
}

export async function updateGenerationJob(
  db: D1Database,
  jobId: string,
  payload: {
    status: 'queued' | 'running' | 'completed' | 'failed'
    progress?: number
    stage?: string
    errorJson?: string | null
    startedAt?: string | null
    completedAt?: string | null
  },
): Promise<void> {
  const current = await getGenerationJob(db, jobId)
  if (!current) {
    return
  }

  await db
    .prepare(
      `UPDATE generation_jobs
       SET status = ?2,
           progress = ?3,
           stage = ?4,
           error_json = ?5,
           started_at = ?6,
           completed_at = ?7
       WHERE id = ?1`,
    )
    .bind(
      jobId,
      payload.status,
      payload.progress ?? current.progress,
      payload.stage ?? current.stage,
      payload.errorJson ?? current.error_json,
      payload.startedAt ?? current.started_at,
      payload.completedAt ?? current.completed_at,
    )
    .run()
}

export async function insertVariant(
  db: D1Database,
  payload: {
    id: string
    campaignId: string
    jobId: string
    headline: string
    body: string
    cta: string
    imageR2Key: string | null
    providerCopy: string
    providerImage: string
    confidence: number
    status: 'pending' | 'approved' | 'rejected'
    aiGenerated: boolean
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO variants (
        id, campaign_id, job_id, headline, body, cta, image_r2_key,
        provider_copy, provider_image, confidence, status, ai_generated, created_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`,
    )
    .bind(
      payload.id,
      payload.campaignId,
      payload.jobId,
      payload.headline,
      payload.body,
      payload.cta,
      payload.imageR2Key,
      payload.providerCopy,
      payload.providerImage,
      payload.confidence,
      payload.status,
      payload.aiGenerated ? 1 : 0,
      nowIso(),
    )
    .run()
}

export async function listVariants(
  db: D1Database,
  payload: {
    campaignId: string
    status?: 'pending' | 'approved' | 'rejected'
    limit: number
    cursor: number
  },
): Promise<{ items: VariantRecord[]; nextCursor: string | null }> {
  const whereClauses = ['campaign_id = ?1']
  const binds: Array<string | number> = [payload.campaignId]

  if (payload.status) {
    whereClauses.push(`status = ?${binds.length + 1}`)
    binds.push(payload.status)
  }

  binds.push(payload.limit)
  binds.push(payload.cursor)

  const query = `
    SELECT *
    FROM variants
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY created_at DESC
    LIMIT ?${binds.length - 1} OFFSET ?${binds.length}
  `

  const result = await db
    .prepare(query)
    .bind(...binds)
    .all<VariantRecord>()

  const items = result.results ?? []
  const nextCursor = items.length === payload.limit
    ? String(payload.cursor + payload.limit)
    : null

  return {
    items,
    nextCursor,
  }
}

export async function updateVariantStatus(
  db: D1Database,
  variantId: string,
  status: 'pending' | 'approved' | 'rejected',
): Promise<VariantRecord | null> {
  await db
    .prepare(`UPDATE variants SET status = ?2 WHERE id = ?1`)
    .bind(variantId, status)
    .run()

  return db
    .prepare(`SELECT * FROM variants WHERE id = ?1`)
    .bind(variantId)
    .first<VariantRecord>()
}

export async function createExportRecord(
  db: D1Database,
  payload: {
    id: string
    campaignId: string
    configJson: string
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO exports (id, campaign_id, config_json, status, created_at)
       VALUES (?1, ?2, ?3, 'processing', ?4)`,
    )
    .bind(payload.id, payload.campaignId, payload.configJson, nowIso())
    .run()
}

export async function finalizeExportRecord(
  db: D1Database,
  payload: {
    exportId: string
    status: 'completed' | 'failed'
    artifactKey?: string | null
  },
): Promise<void> {
  await db
    .prepare(
      `UPDATE exports
       SET status = ?2,
           artifact_r2_key = ?3,
           completed_at = ?4
       WHERE id = ?1`,
    )
    .bind(payload.exportId, payload.status, payload.artifactKey ?? null, nowIso())
    .run()
}

export async function getExportRecord(
  db: D1Database,
  exportId: string,
): Promise<ExportRecord | null> {
  return db
    .prepare(`SELECT * FROM exports WHERE id = ?1`)
    .bind(exportId)
    .first<ExportRecord>()
}

export async function listVariantsByIds(
  db: D1Database,
  variantIds: string[],
): Promise<VariantRecord[]> {
  if (variantIds.length === 0) {
    return []
  }

  const placeholders = variantIds.map((_, index) => `?${index + 1}`).join(', ')
  const query = `SELECT * FROM variants WHERE id IN (${placeholders})`

  const result = await db
    .prepare(query)
    .bind(...variantIds)
    .all<VariantRecord>()

  return result.results ?? []
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function normalizedRate(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0
  }

  return Number((numerator / denominator).toFixed(4))
}

function percentile(values: number[], ratio: number): number | null {
  if (values.length === 0) {
    return null
  }

  const ordered = [...values].sort((left, right) => left - right)
  const index = Math.min(
    ordered.length - 1,
    Math.max(0, Math.ceil(ordered.length * ratio) - 1),
  )
  const selected = ordered[index]
  return Number(selected.toFixed(2))
}

export async function getMetricsSummary(
  db: D1Database,
  windowHours: number,
): Promise<MetricsSummary> {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString()

  const statusRows = await db
    .prepare(
      `SELECT status, COUNT(*) AS count
       FROM generation_jobs
       WHERE created_at >= ?1
       GROUP BY status`,
    )
    .bind(since)
    .all<{ status: string; count: number }>()

  const counts = {
    queued: 0,
    running: 0,
    completed: 0,
    failed: 0,
  }

  for (const row of statusRows.results ?? []) {
    if (row.status === 'queued') {
      counts.queued = toNumber(row.count)
    } else if (row.status === 'running') {
      counts.running = toNumber(row.count)
    } else if (row.status === 'completed') {
      counts.completed = toNumber(row.count)
    } else if (row.status === 'failed') {
      counts.failed = toNumber(row.count)
    }
  }

  const totalJobs =
    counts.queued + counts.running + counts.completed + counts.failed

  const timingRow = await db
    .prepare(
      `SELECT
         AVG(
           CASE
             WHEN started_at IS NOT NULL
             THEN (julianday(started_at) - julianday(created_at)) * 86400000.0
           END
         ) AS avg_queue_wait_ms,
         AVG(
           CASE
             WHEN started_at IS NOT NULL AND completed_at IS NOT NULL
             THEN (julianday(completed_at) - julianday(started_at)) * 86400000.0
           END
         ) AS avg_run_duration_ms
       FROM generation_jobs
       WHERE created_at >= ?1`,
    )
    .bind(since)
    .first<{ avg_queue_wait_ms: number | null; avg_run_duration_ms: number | null }>()

  const runRows = await db
    .prepare(
      `SELECT
         (julianday(completed_at) - julianday(started_at)) * 86400000.0 AS run_duration_ms
       FROM generation_jobs
       WHERE created_at >= ?1
         AND started_at IS NOT NULL
         AND completed_at IS NOT NULL`,
    )
    .bind(since)
    .all<{ run_duration_ms: number }>()

  const runDurations = (runRows.results ?? [])
    .map((row) => toNumber(row.run_duration_ms))
    .filter((value) => value >= 0)

  const variantTotals = await db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN provider_copy = 'fallback' THEN 1 ELSE 0 END) AS copy_fallback,
         SUM(CASE WHEN provider_image = 'fallback' THEN 1 ELSE 0 END) AS image_fallback
       FROM variants
       WHERE created_at >= ?1`,
    )
    .bind(since)
    .first<{ total: number; copy_fallback: number | null; image_fallback: number | null }>()

  const copyProviderRows = await db
    .prepare(
      `SELECT provider_copy AS provider, COUNT(*) AS count
       FROM variants
       WHERE created_at >= ?1
       GROUP BY provider_copy`,
    )
    .bind(since)
    .all<{ provider: string | null; count: number }>()

  const imageProviderRows = await db
    .prepare(
      `SELECT provider_image AS provider, COUNT(*) AS count
       FROM variants
       WHERE created_at >= ?1
       GROUP BY provider_image`,
    )
    .bind(since)
    .all<{ provider: string | null; count: number }>()

  const copyProviderCounts: Record<string, number> = {}
  for (const row of copyProviderRows.results ?? []) {
    copyProviderCounts[row.provider ?? 'unknown'] = toNumber(row.count)
  }

  const imageProviderCounts: Record<string, number> = {}
  for (const row of imageProviderRows.results ?? []) {
    imageProviderCounts[row.provider ?? 'unknown'] = toNumber(row.count)
  }

  const errorRows = await db
    .prepare(
      `SELECT error_json
       FROM generation_jobs
       WHERE created_at >= ?1
         AND error_json IS NOT NULL`,
    )
    .bind(since)
    .all<{ error_json: string }>()

  const errors: Record<string, number> = {}
  for (const row of errorRows.results ?? []) {
    let code = 'unknown_error'
    try {
      const parsed = JSON.parse(row.error_json) as { code?: string; message?: string }
      code = parsed.code ?? (parsed.message ? 'message_error' : 'unknown_error')
    } catch {
      code = 'unparsed_error'
    }

    errors[code] = (errors[code] ?? 0) + 1
  }

  const totalVariants = toNumber(variantTotals?.total)
  const copyFallbackCount = toNumber(variantTotals?.copy_fallback)
  const imageFallbackCount = toNumber(variantTotals?.image_fallback)

  return {
    windowHours,
    generatedAt: nowIso(),
    jobs: {
      total: totalJobs,
      queued: counts.queued,
      running: counts.running,
      completed: counts.completed,
      failed: counts.failed,
      successRate: normalizedRate(counts.completed, totalJobs),
      failureRate: normalizedRate(counts.failed, totalJobs),
      avgQueueWaitMs:
        timingRow && timingRow.avg_queue_wait_ms != null
          ? Number(toNumber(timingRow.avg_queue_wait_ms).toFixed(2))
          : null,
      avgRunDurationMs:
        timingRow && timingRow.avg_run_duration_ms != null
          ? Number(toNumber(timingRow.avg_run_duration_ms).toFixed(2))
          : null,
      p95RunDurationMs: percentile(runDurations, 0.95),
    },
    variants: {
      total: totalVariants,
      copyFallbackRate: normalizedRate(copyFallbackCount, totalVariants),
      imageFallbackRate: normalizedRate(imageFallbackCount, totalVariants),
      copyProviderCounts,
      imageProviderCounts,
    },
    errors,
  }
}
