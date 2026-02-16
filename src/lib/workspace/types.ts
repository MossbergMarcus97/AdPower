import type {
  AppView,
  CampaignObjective,
  ExportSettings,
  GenerationMode,
  JobStatus,
  ReviewVariant,
  VariantStatus,
} from '../../types'
import type { WorkspacePreferences } from '../storage/prefs'

export interface ToastState {
  id: string
  tone: 'info' | 'success' | 'error'
  message: string
}

export interface AuthState {
  status: 'checking' | 'authenticating' | 'authenticated' | 'unauthenticated'
  error: string | null
}

export interface GenerationState {
  mode: GenerationMode
  targetCount: number
  headlineVariations: number
  visualVariations: number
  status: JobStatus
  progress: number
  stage: string
  loadingMessage: string
  feedbackMessage: string
  jobId: string | null
  secondsElapsed: number
}

export interface WorkspaceState {
  view: AppView
  wizardStep: number
  objective: CampaignObjective
  generation: GenerationState
  reviewVariants: ReviewVariant[]
  selectedVariantIds: string[]
  reviewLoading: boolean
  reviewError: string | null
  exportSettings: ExportSettings
  exportLoading: boolean
  exportError: string | null
  exportDownloadUrl: string | null
  lastExportId: string | null
  auth: AuthState
  liveMessage: string
  toast: ToastState | null
  debugMode: boolean
}

export interface WorkspaceInitOptions {
  initialView: AppView
  initialStep: number
  preferences: WorkspacePreferences
  debugMode: boolean
}

export type WorkspaceAction =
  | { type: 'NAVIGATE_VIEW'; view: AppView; step?: number }
  | { type: 'SET_WIZARD_STEP'; step: number }
  | { type: 'SET_OBJECTIVE'; objective: CampaignObjective }
  | { type: 'SET_GENERATION_MODE'; mode: GenerationMode }
  | {
      type: 'SET_GENERATION_TUNING'
      targetCount?: number
      headlineVariations?: number
      visualVariations?: number
    }
  | { type: 'GENERATION_JOB_CREATED'; jobId: string; message: string }
  | {
      type: 'GENERATION_PROGRESS'
      progress: number
      stage: string
      loadingMessage: string
      secondsElapsed: number
      status: Exclude<JobStatus, 'idle'>
    }
  | {
      type: 'GENERATION_COMPLETED'
      feedbackMessage: string
      liveMessage: string
    }
  | { type: 'GENERATION_FAILED'; feedbackMessage: string; liveMessage: string }
  | { type: 'SET_REVIEW_VARIANTS'; variants: ReviewVariant[] }
  | { type: 'UPSERT_REVIEW_VARIANTS'; variants: ReviewVariant[] }
  | { type: 'SET_REVIEW_LOADING'; loading: boolean }
  | { type: 'SET_REVIEW_ERROR'; error: string | null }
  | { type: 'TOGGLE_VARIANT_SELECTION'; variantId: string }
  | { type: 'TOGGLE_SELECT_ALL_VARIANTS' }
  | { type: 'CLEAR_VARIANT_SELECTION' }
  | { type: 'PATCH_VARIANT_STATUS'; variantId: string; status: VariantStatus }
  | { type: 'BATCH_UPDATE_VARIANT_STATUS'; status: VariantStatus }
  | { type: 'SET_EXPORT_SETTINGS'; exportSettings: Partial<ExportSettings> }
  | { type: 'EXPORT_REQUESTED' }
  | { type: 'EXPORT_COMPLETED'; exportId: string; downloadUrl: string | null }
  | { type: 'EXPORT_FAILED'; error: string }
  | { type: 'AUTH_CHECK_STARTED' }
  | { type: 'AUTHENTICATING' }
  | { type: 'AUTH_SUCCESS'; liveMessage?: string }
  | { type: 'AUTH_FAILURE'; error: string }
  | { type: 'AUTH_REQUIRED' }
  | { type: 'SET_LIVE_MESSAGE'; message: string }
  | { type: 'CLEAR_LIVE_MESSAGE' }
  | { type: 'SET_TOAST'; toast: ToastState }
  | { type: 'CLEAR_TOAST' }
