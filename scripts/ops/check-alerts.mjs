import { createAuthedClient } from './api-client.mjs'

const apiBaseUrl =
  process.env.API_BASE_URL ?? 'https://adpower-api.swarm-consensus.workers.dev/v1'
const passphrase = process.env.PASSPHRASE ?? process.env.SESSION_PASSPHRASE
const origin = process.env.APP_ORIGIN ?? 'https://adpower.pages.dev'

const windowHours = Number(process.env.WINDOW_HOURS ?? '24')
const failOnAlert = process.env.FAIL_ON_ALERT !== 'false'

const thresholds = {
  minSuccessRate: Number(process.env.ALERT_MIN_SUCCESS_RATE ?? '0.85'),
  maxFailureRate: Number(process.env.ALERT_MAX_FAILURE_RATE ?? '0.15'),
  maxCopyFallbackRate: Number(process.env.ALERT_MAX_COPY_FALLBACK_RATE ?? '0.6'),
  maxImageFallbackRate: Number(process.env.ALERT_MAX_IMAGE_FALLBACK_RATE ?? '0.6'),
  maxAvgQueueWaitMs: Number(process.env.ALERT_MAX_AVG_QUEUE_WAIT_MS ?? '45000'),
  maxP95RunDurationMs: Number(process.env.ALERT_MAX_P95_RUN_MS ?? '180000'),
}

function evaluateAlerts(summary) {
  const alerts = []
  const { jobs, variants } = summary

  if (jobs.total === 0) {
    alerts.push({
      key: 'no_recent_jobs',
      severity: 'warning',
      message: 'No jobs in selected metrics window.',
    })
    return alerts
  }

  if (jobs.successRate < thresholds.minSuccessRate) {
    alerts.push({
      key: 'success_rate_low',
      severity: 'critical',
      message: `Success rate ${jobs.successRate} below ${thresholds.minSuccessRate}.`,
    })
  }

  if (jobs.failureRate > thresholds.maxFailureRate) {
    alerts.push({
      key: 'failure_rate_high',
      severity: 'critical',
      message: `Failure rate ${jobs.failureRate} above ${thresholds.maxFailureRate}.`,
    })
  }

  if (jobs.avgQueueWaitMs != null && jobs.avgQueueWaitMs > thresholds.maxAvgQueueWaitMs) {
    alerts.push({
      key: 'queue_wait_high',
      severity: 'warning',
      message: `Avg queue wait ${jobs.avgQueueWaitMs}ms above ${thresholds.maxAvgQueueWaitMs}ms.`,
    })
  }

  if (
    jobs.p95RunDurationMs != null &&
    jobs.p95RunDurationMs > thresholds.maxP95RunDurationMs
  ) {
    alerts.push({
      key: 'run_duration_high',
      severity: 'warning',
      message: `P95 run duration ${jobs.p95RunDurationMs}ms above ${thresholds.maxP95RunDurationMs}ms.`,
    })
  }

  if (variants.total > 0 && variants.copyFallbackRate > thresholds.maxCopyFallbackRate) {
    alerts.push({
      key: 'copy_fallback_high',
      severity: 'warning',
      message: `Copy fallback rate ${variants.copyFallbackRate} above ${thresholds.maxCopyFallbackRate}.`,
    })
  }

  if (variants.total > 0 && variants.imageFallbackRate > thresholds.maxImageFallbackRate) {
    alerts.push({
      key: 'image_fallback_high',
      severity: 'warning',
      message: `Image fallback rate ${variants.imageFallbackRate} above ${thresholds.maxImageFallbackRate}.`,
    })
  }

  return alerts
}

async function main() {
  if (!passphrase) {
    throw new Error('Set PASSPHRASE or SESSION_PASSPHRASE before running this script.')
  }

  if (!Number.isFinite(windowHours) || windowHours <= 0) {
    throw new Error('WINDOW_HOURS must be a positive number.')
  }

  const client = await createAuthedClient({
    apiBaseUrl,
    passphrase,
    origin,
  })

  const summary = await client.get(`/metrics/summary?windowHours=${Math.floor(windowHours)}`)
  const alerts = evaluateAlerts(summary)

  console.log('Metrics summary:')
  console.log(JSON.stringify(summary, null, 2))
  console.log('\nAlert evaluation:')
  console.log(JSON.stringify(alerts, null, 2))

  const hasCritical = alerts.some((alert) => alert.severity === 'critical')
  if (failOnAlert && hasCritical) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
