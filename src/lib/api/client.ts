import type { GenerationMode, ReviewVariant, VariantStatus } from '../../types'

export interface GenerationJobRequest {
  campaignId: string
  mode: GenerationMode
  targetCount: number
  headlineVariations: number
  visualVariations: number
  messages: string[]
  platforms: string[]
}

export interface GenerationJobResponse {
  jobId: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  progress?: number
  stage?: string
  error?: string | null
  startedAt?: string | null
  completedAt?: string | null
}

export interface VariantListResponse {
  items: ReviewVariant[]
  nextCursor: string | null
}

export interface CreateExportRequest {
  campaignId: string
  variantIds: string[]
  platforms: string[]
  format: 'PNG' | 'JPG' | 'PDF'
  grouping: 'By Platform' | 'By Variant Group' | 'Flat'
}

export interface ExportResponse {
  exportId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  downloadUrl?: string | null
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

function getBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL ?? '/v1').replace(/\/$/, '')
}

async function request<T>(
  path: string,
  init?: RequestInit,
  parseAs: 'json' | 'text' | 'none' = 'json',
): Promise<T> {
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const payload = (await response.json()) as { error?: string }
      if (payload.error) {
        message = payload.error
      }
    } catch {
      // ignore parse failures
    }

    throw new ApiError(response.status, message)
  }

  if (parseAs === 'none') {
    return undefined as T
  }

  if (parseAs === 'text') {
    return (await response.text()) as T
  }

  return (await response.json()) as T
}

export const apiClient = {
  getSession: async (): Promise<{ authenticated: true }> =>
    request<{ authenticated: true }>('/session'),

  createSession: async (passphrase: string): Promise<void> =>
    request('/session', {
      method: 'POST',
      body: JSON.stringify({ passphrase }),
    }, 'none'),

  createGenerationJob: async (
    payload: GenerationJobRequest,
  ): Promise<GenerationJobResponse> =>
    request<GenerationJobResponse>('/generation-jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getGenerationJob: async (jobId: string): Promise<GenerationJobResponse> =>
    request<GenerationJobResponse>(`/generation-jobs/${jobId}`),

  getVariants: async (
    campaignId: string,
    options?: { status?: VariantStatus; limit?: number; cursor?: string },
  ): Promise<VariantListResponse> => {
    const params = new URLSearchParams()
    if (options?.status) {
      params.set('status', options.status)
    }
    if (typeof options?.limit === 'number') {
      params.set('limit', String(options.limit))
    }
    if (options?.cursor) {
      params.set('cursor', options.cursor)
    }

    const query = params.toString()
    return request<VariantListResponse>(
      `/campaigns/${campaignId}/variants${query ? `?${query}` : ''}`,
    )
  },

  patchVariantStatus: async (
    variantId: string,
    status: VariantStatus,
  ): Promise<ReviewVariant> =>
    request<ReviewVariant>(`/variants/${variantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  createExport: async (payload: CreateExportRequest): Promise<ExportResponse> =>
    request<ExportResponse>('/exports', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getExport: async (exportId: string): Promise<ExportResponse> =>
    request<ExportResponse>(`/exports/${exportId}`),
}
