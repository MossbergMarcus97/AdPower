import type {
  AppView,
  CampaignObjective,
  ExportSettings,
  GenerationMode,
  ReviewVariant,
  VariantStatus,
} from '../../types'
import type { ToastState, WorkspaceAction } from './types'

export const workspaceActions = {
  navigateView: (view: AppView, step?: number): WorkspaceAction => ({
    type: 'NAVIGATE_VIEW',
    view,
    step,
  }),

  setWizardStep: (step: number): WorkspaceAction => ({
    type: 'SET_WIZARD_STEP',
    step,
  }),

  setObjective: (objective: CampaignObjective): WorkspaceAction => ({
    type: 'SET_OBJECTIVE',
    objective,
  }),

  setGenerationMode: (mode: GenerationMode): WorkspaceAction => ({
    type: 'SET_GENERATION_MODE',
    mode,
  }),

  setGenerationTuning: (payload: {
    targetCount?: number
    headlineVariations?: number
    visualVariations?: number
  }): WorkspaceAction => ({
    type: 'SET_GENERATION_TUNING',
    ...payload,
  }),

  generationJobCreated: (jobId: string, message: string): WorkspaceAction => ({
    type: 'GENERATION_JOB_CREATED',
    jobId,
    message,
  }),

  generationProgress: (payload: {
    progress: number
    stage: string
    loadingMessage: string
    secondsElapsed: number
    status: 'queued' | 'running' | 'completed' | 'failed'
  }): WorkspaceAction => ({
    type: 'GENERATION_PROGRESS',
    ...payload,
  }),

  generationCompleted: (feedbackMessage: string, liveMessage: string): WorkspaceAction => ({
    type: 'GENERATION_COMPLETED',
    feedbackMessage,
    liveMessage,
  }),

  generationFailed: (feedbackMessage: string, liveMessage: string): WorkspaceAction => ({
    type: 'GENERATION_FAILED',
    feedbackMessage,
    liveMessage,
  }),

  setReviewVariants: (variants: ReviewVariant[]): WorkspaceAction => ({
    type: 'SET_REVIEW_VARIANTS',
    variants,
  }),

  upsertReviewVariants: (variants: ReviewVariant[]): WorkspaceAction => ({
    type: 'UPSERT_REVIEW_VARIANTS',
    variants,
  }),

  setReviewLoading: (loading: boolean): WorkspaceAction => ({
    type: 'SET_REVIEW_LOADING',
    loading,
  }),

  setReviewError: (error: string | null): WorkspaceAction => ({
    type: 'SET_REVIEW_ERROR',
    error,
  }),

  toggleVariantSelection: (variantId: string): WorkspaceAction => ({
    type: 'TOGGLE_VARIANT_SELECTION',
    variantId,
  }),

  toggleSelectAllVariants: (): WorkspaceAction => ({
    type: 'TOGGLE_SELECT_ALL_VARIANTS',
  }),

  clearVariantSelection: (): WorkspaceAction => ({
    type: 'CLEAR_VARIANT_SELECTION',
  }),

  patchVariantStatus: (variantId: string, status: VariantStatus): WorkspaceAction => ({
    type: 'PATCH_VARIANT_STATUS',
    variantId,
    status,
  }),

  batchUpdateVariantStatus: (status: VariantStatus): WorkspaceAction => ({
    type: 'BATCH_UPDATE_VARIANT_STATUS',
    status,
  }),

  setExportSettings: (exportSettings: Partial<ExportSettings>): WorkspaceAction => ({
    type: 'SET_EXPORT_SETTINGS',
    exportSettings,
  }),

  exportRequested: (): WorkspaceAction => ({
    type: 'EXPORT_REQUESTED',
  }),

  exportCompleted: (exportId: string, downloadUrl: string | null): WorkspaceAction => ({
    type: 'EXPORT_COMPLETED',
    exportId,
    downloadUrl,
  }),

  exportFailed: (error: string): WorkspaceAction => ({
    type: 'EXPORT_FAILED',
    error,
  }),

  authCheckStarted: (): WorkspaceAction => ({
    type: 'AUTH_CHECK_STARTED',
  }),

  authenticating: (): WorkspaceAction => ({
    type: 'AUTHENTICATING',
  }),

  authSuccess: (liveMessage?: string): WorkspaceAction => ({
    type: 'AUTH_SUCCESS',
    liveMessage,
  }),

  authFailure: (error: string): WorkspaceAction => ({
    type: 'AUTH_FAILURE',
    error,
  }),

  authRequired: (): WorkspaceAction => ({
    type: 'AUTH_REQUIRED',
  }),

  setLiveMessage: (message: string): WorkspaceAction => ({
    type: 'SET_LIVE_MESSAGE',
    message,
  }),

  clearLiveMessage: (): WorkspaceAction => ({
    type: 'CLEAR_LIVE_MESSAGE',
  }),

  setToast: (toast: ToastState): WorkspaceAction => ({
    type: 'SET_TOAST',
    toast,
  }),

  clearToast: (): WorkspaceAction => ({
    type: 'CLEAR_TOAST',
  }),
}
