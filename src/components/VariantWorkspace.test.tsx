import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VariantWorkspace } from './VariantWorkspace'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

describe('VariantWorkspace interactions', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method ?? 'GET'

      if (url.endsWith('/v1/session') && method === 'GET') {
        return jsonResponse({ authenticated: true })
      }

      if (url.includes('/v1/campaigns/') && url.includes('/variants')) {
        return jsonResponse({
          items: [
            {
              id: 'var-test-1',
              title: 'Variant #101',
              headline: 'Test headline',
              cta: 'Test CTA',
              confidence: 4.3,
              status: 'pending',
              aiGenerated: true,
            },
          ],
          nextCursor: null,
        })
      }

      if (url.endsWith('/v1/generation-jobs') && method === 'POST') {
        return jsonResponse({ jobId: 'job-1', status: 'queued' })
      }

      if (url.endsWith('/v1/generation-jobs/job-1')) {
        return jsonResponse({
          jobId: 'job-1',
          status: 'completed',
          progress: 100,
          stage: 'Completed',
        })
      }

      if (url.includes('/v1/variants/') && method === 'PATCH') {
        return jsonResponse({ success: true })
      }

      if (url.endsWith('/v1/exports') && method === 'POST') {
        return jsonResponse({ exportId: 'exp-1', status: 'completed' })
      }

      if (url.endsWith('/v1/exports/exp-1')) {
        return jsonResponse({
          exportId: 'exp-1',
          status: 'completed',
          downloadUrl: '/v1/exports/exp-1/download',
        })
      }

      return jsonResponse({ error: 'Unhandled route' }, 500)
    })

    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('switches top-nav views deterministically', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/?view=dashboard']}>
        <VariantWorkspace />
      </MemoryRouter>,
    )

    await screen.findByText('Systematic Creative Production')

    await user.click(screen.getByRole('button', { name: 'Campaigns' }))
    expect(
      await screen.findByText(/Campaign Creation Wizard/),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Generate' }))
    expect(await screen.findByText('Generate Ad Variants')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Review' }))
    expect(await screen.findByText('Review Grid & Batch Actions')).toBeInTheDocument()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })
  })
})
