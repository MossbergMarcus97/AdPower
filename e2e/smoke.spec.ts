import { expect, test } from '@playwright/test'

test('smoke flow: campaign -> generate -> review -> export', async ({ page }) => {
  let jobPollCount = 0

  await page.route('**/v1/session', async (route) => {
    const method = route.request().method()

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: true }),
      })
      return
    }

    await route.fulfill({ status: 204 })
  })

  await page.route('**/v1/generation-jobs', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ jobId: 'job-e2e-1', status: 'queued' }),
      })
      return
    }

    await route.continue()
  })

  await page.route('**/v1/generation-jobs/job-e2e-1', async (route) => {
    jobPollCount += 1

    if (jobPollCount < 2) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobId: 'job-e2e-1',
          status: 'running',
          progress: 46,
          stage: 'Generating visuals',
        }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jobId: 'job-e2e-1',
        status: 'completed',
        progress: 100,
        stage: 'Completed',
      }),
    })
  })

  await page.route('**/v1/campaigns/**/variants**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 'var-e2e-1',
            title: 'Variant #201',
            headline: 'Generated headline for smoke test',
            cta: 'Generate More',
            confidence: 4.5,
            status: 'pending',
            aiGenerated: true,
          },
        ],
        nextCursor: null,
      }),
    })
  })

  await page.route('**/v1/variants/**/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
  })

  await page.route('**/v1/exports', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ exportId: 'exp-e2e-1', status: 'completed' }),
    })
  })

  await page.route('**/v1/exports/exp-e2e-1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        exportId: 'exp-e2e-1',
        status: 'completed',
        downloadUrl: '/v1/exports/exp-e2e-1/download',
      }),
    })
  })

  await page.goto('/?view=dashboard')
  const primaryNav = page.getByRole('navigation', { name: 'Primary' })

  await expect(page.getByText('Systematic Creative Production')).toBeVisible()
  await primaryNav.getByRole('button', { name: 'Campaigns', exact: true }).click()
  await expect(page.getByText(/Campaign Creation Wizard/)).toBeVisible()

  await primaryNav.getByRole('button', { name: 'Generate', exact: true }).click()
  await expect(page.getByText('Generate Ad Variants')).toBeVisible()

  await page
    .getByRole('main')
    .getByRole('button', { name: 'Generate Variants', exact: true })
    .click()
  await expect(page.getByText('Review Grid & Batch Actions')).toBeVisible()

  await page.getByRole('checkbox', { name: 'Variant #201' }).check()
  await page.getByRole('button', { name: 'Approve Selected' }).click()

  await page.getByRole('button', { name: 'Generate Export Package' }).click()
  await expect(page.getByText('Latest export ready')).toBeVisible()
})
