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

  await updateGenerationJob(env.DB, jobId, {
    status: 'running',
    progress: 5,
    stage: 'Building prompt context',
    startedAt: nowIso(),
  })

  let generatedCount = 0
  let failureCount = 0

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
    await updateGenerationJob(env.DB, jobId, {
      status: 'failed',
      progress: 100,
      stage: 'Failed',
      errorJson: JSON.stringify({
        code: 'provider_timeout',
        message: 'All variants failed generation',
      }),
      completedAt: nowIso(),
    })
    return
  }

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
    completedAt: nowIso(),
  })

  console.info(
    JSON.stringify({
      requestId,
      jobId,
      event: 'job_completed',
      generatedCount,
      failureCount,
    }),
  )
}
