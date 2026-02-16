export interface Env {
  DB: D1Database
  ASSETS: R2Bucket
  GEN_QUEUE: Queue
  RATE_LIMIT_KV?: KVNamespace

  SESSION_PASSPHRASE: string
  SESSION_SECRET: string
  APP_ORIGIN?: string
  MAX_VARIANTS_PER_JOB?: string
  MAX_JOBS_PER_DAY?: string
  ENABLE_PROVIDER_TEST_MODE?: string

  OPENAI_API_KEY?: string
  OPENAI_MODEL?: string
  ANTHROPIC_API_KEY?: string
  ANTHROPIC_MODEL?: string
  GOOGLE_API_KEY?: string
}

export interface AppVariables {
  requestId: string
  sessionId: string | null
}

export type GenerationTestMode =
  | 'none'
  | 'force_copy_primary_failure'
  | 'force_image_primary_failure'
  | 'force_copy_fallback'
  | 'force_image_fallback'

export interface GenerationJobConfig {
  targetCount: number
  headlineVariations: number
  visualVariations: number
  messages: string[]
  platforms: string[]
  mode: 'quick' | 'custom' | 'iterate'
  testMode?: GenerationTestMode
}

export interface QueueMessage {
  jobId: string
}

export interface CopyResult {
  headline: string
  body: string
  cta: string
  provider: 'anthropic' | 'openai' | 'fallback'
}

export interface ImageResult {
  bytes: Uint8Array
  contentType: string
  provider: 'openai' | 'google' | 'fallback'
}
