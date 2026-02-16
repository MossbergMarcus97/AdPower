import { createAuthedClient, sleep } from './api-client.mjs'

const apiBaseUrl =
  process.env.API_BASE_URL ?? 'https://adpower-api.swarm-consensus.workers.dev/v1'
const passphrase = process.env.PASSPHRASE ?? process.env.SESSION_PASSPHRASE
const origin = process.env.APP_ORIGIN ?? 'https://adpower.pages.dev'
const requireRealProvider = process.env.REQUIRE_REAL_PROVIDER !== 'false'
const runFailoverScenarios = process.env.RUN_FAILOVER_SCENARIOS !== 'false'

function randomId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

async function waitForJob(client, jobId, timeoutMs = 150_000) {
  const started = Date.now()

  while (Date.now() - started < timeoutMs) {
    const status = await client.get(`/generation-jobs/${jobId}`)
    if (status.status === 'completed' || status.status === 'failed') {
      return status
    }

    await sleep(1_500)
  }

  throw new Error(`Timed out waiting for job ${jobId}`)
}

async function waitForExport(client, exportId, timeoutMs = 60_000) {
  const started = Date.now()

  while (Date.now() - started < timeoutMs) {
    const status = await client.get(`/exports/${exportId}`)
    if (status.status === 'completed' || status.status === 'failed') {
      return status
    }

    await sleep(1_000)
  }

  throw new Error(`Timed out waiting for export ${exportId}`)
}

function summarizeProviders(variants) {
  const copyProviders = {}
  const imageProviders = {}

  for (const variant of variants) {
    const copyProvider = variant.providerCopy ?? 'unknown'
    const imageProvider = variant.providerImage ?? 'unknown'
    copyProviders[copyProvider] = (copyProviders[copyProvider] ?? 0) + 1
    imageProviders[imageProvider] = (imageProviders[imageProvider] ?? 0) + 1
  }

  return { copyProviders, imageProviders }
}

function hasRealProvider(variants) {
  return variants.some(
    (variant) =>
      variant.providerCopy !== 'fallback' || variant.providerImage !== 'fallback',
  )
}

async function runScenario(client, scenario) {
  const campaignId = randomId(`cap-${scenario.id}`)

  const job = await client.post('/generation-jobs', {
    campaignId,
    mode: 'quick',
    targetCount: 3,
    headlineVariations: 3,
    visualVariations: 3,
    messages: [
      'Swiss precision, measurable uplift.',
      'Clear proof, no guesswork.',
      'Move from creative drift to disciplined output.',
    ],
    platforms: ['Meta Ads', 'Google Ads'],
    ...(scenario.testMode ? { testMode: scenario.testMode } : {}),
  })

  const finalJob = await waitForJob(client, job.jobId)
  if (finalJob.status !== 'completed') {
    throw new Error(
      `Scenario ${scenario.id} failed with status ${finalJob.status} (${finalJob.error ?? 'no error'})`,
    )
  }

  const variantsPayload = await client.get(
    `/campaigns/${campaignId}/variants?limit=50`,
  )
  const variants = variantsPayload.items ?? []
  if (variants.length === 0) {
    throw new Error(`Scenario ${scenario.id} created no variants`)
  }

  const targetVariant = variants[0]
  await client.patch(`/variants/${targetVariant.id}/status`, { status: 'approved' })
  await client.patch(`/variants/${targetVariant.id}/status`, { status: 'pending' })

  const exportPayload = await client.post('/exports', {
    campaignId,
    variantIds: [targetVariant.id],
    platforms: ['Meta Ads'],
    format: 'PNG',
    grouping: 'By Platform',
  })

  const finalExport = await waitForExport(client, exportPayload.exportId)
  if (finalExport.status !== 'completed' || !finalExport.downloadUrl) {
    throw new Error(`Scenario ${scenario.id} export did not complete`)
  }

  await client.get(finalExport.downloadUrl.replace(/^\/v1/, ''))

  return {
    scenarioId: scenario.id,
    campaignId,
    jobId: job.jobId,
    variantsGenerated: variants.length,
    providers: summarizeProviders(variants),
    hasRealProvider: hasRealProvider(variants),
  }
}

async function main() {
  if (!passphrase) {
    throw new Error('Set PASSPHRASE or SESSION_PASSPHRASE before running this script.')
  }

  const client = await createAuthedClient({
    apiBaseUrl,
    passphrase,
    origin,
  })

  const scenarios = [
    { id: 'normal', testMode: undefined },
    ...(runFailoverScenarios
      ? [
          { id: 'copy-primary-failover', testMode: 'force_copy_primary_failure' },
          { id: 'image-primary-failover', testMode: 'force_image_primary_failure' },
        ]
      : []),
  ]

  const results = []
  for (const scenario of scenarios) {
    try {
      const result = await runScenario(client, scenario)
      results.push({ ok: true, ...result })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)

      if (
        scenario.testMode &&
        message.toLowerCase().includes('provider test mode is disabled')
      ) {
        results.push({
          ok: false,
          scenarioId: scenario.id,
          skipped: true,
          reason: 'Provider test mode is disabled on the Worker environment.',
        })
        continue
      }

      throw error
    }
  }

  const normal = results.find((item) => item.scenarioId === 'normal')
  if (!normal || !normal.ok) {
    throw new Error('Normal scenario did not complete successfully.')
  }

  if (requireRealProvider && !normal.hasRealProvider) {
    throw new Error(
      'Normal scenario used fallback-only providers. Configure provider API keys before capability testing.',
    )
  }

  const failoverResults = results.filter(
    (item) =>
      item.ok &&
      (item.scenarioId === 'copy-primary-failover' ||
        item.scenarioId === 'image-primary-failover'),
  )

  for (const result of failoverResults) {
    if (result.scenarioId === 'copy-primary-failover') {
      if ('anthropic' in result.providers.copyProviders) {
        throw new Error(
          'copy-primary-failover scenario unexpectedly used anthropic provider.',
        )
      }
    }

    if (result.scenarioId === 'image-primary-failover') {
      if ('openai' in result.providers.imageProviders) {
        throw new Error(
          'image-primary-failover scenario unexpectedly used openai provider.',
        )
      }
    }
  }

  console.log('Capability validation passed.')
  console.log(JSON.stringify(results, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
