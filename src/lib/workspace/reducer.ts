import { fallbackReviewVariants, generationStages } from '../../data'
import { getLoadingMessage } from '../../microcopy'
import type { WorkspaceInitOptions, WorkspaceState, WorkspaceAction } from './types'

const defaultGenerationStage = generationStages[0]?.label ?? 'Queued'

function clampStep(step: number): number {
  return Math.max(0, Math.min(step, 5))
}

function createToastId(): string {
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createInitialWorkspaceState(
  options: WorkspaceInitOptions,
): WorkspaceState {
  return {
    view: options.initialView,
    wizardStep: clampStep(options.initialStep),
    objective: 'Conversion',
    generation: {
      mode: options.preferences.generationMode,
      targetCount: 48,
      headlineVariations: 8,
      visualVariations: 6,
      status: 'idle',
      progress: 0,
      stage: defaultGenerationStage,
      loadingMessage: getLoadingMessage(0),
      feedbackMessage: '',
      jobId: null,
      secondsElapsed: 0,
    },
    reviewVariants: fallbackReviewVariants,
    selectedVariantIds: [],
    reviewLoading: false,
    reviewError: null,
    exportSettings: options.preferences.exportSettings,
    exportLoading: false,
    exportError: null,
    exportDownloadUrl: null,
    lastExportId: null,
    auth: {
      status: 'checking',
      error: null,
    },
    liveMessage: 'Swiss Precision workspace ready.',
    toast: null,
    debugMode: options.debugMode,
  }
}

export function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState {
  switch (action.type) {
    case 'NAVIGATE_VIEW': {
      return {
        ...state,
        view: action.view,
        wizardStep:
          typeof action.step === 'number' ? clampStep(action.step - 1) : state.wizardStep,
      }
    }

    case 'SET_WIZARD_STEP': {
      return {
        ...state,
        wizardStep: clampStep(action.step),
      }
    }

    case 'SET_OBJECTIVE': {
      return {
        ...state,
        objective: action.objective,
      }
    }

    case 'SET_GENERATION_MODE': {
      return {
        ...state,
        generation: {
          ...state.generation,
          mode: action.mode,
        },
      }
    }

    case 'SET_GENERATION_TUNING': {
      return {
        ...state,
        generation: {
          ...state.generation,
          targetCount: action.targetCount ?? state.generation.targetCount,
          headlineVariations:
            action.headlineVariations ?? state.generation.headlineVariations,
          visualVariations:
            action.visualVariations ?? state.generation.visualVariations,
        },
      }
    }

    case 'GENERATION_JOB_CREATED': {
      return {
        ...state,
        view: 'generate',
        generation: {
          ...state.generation,
          status: 'queued',
          progress: 0,
          stage: defaultGenerationStage,
          feedbackMessage: '',
          jobId: action.jobId,
          secondsElapsed: 0,
          loadingMessage: getLoadingMessage(0),
        },
        liveMessage: action.message,
        exportError: null,
        toast: {
          id: createToastId(),
          tone: 'info',
          message: action.message,
        },
      }
    }

    case 'GENERATION_PROGRESS': {
      return {
        ...state,
        generation: {
          ...state.generation,
          status: action.status,
          progress: action.progress,
          stage: action.stage,
          loadingMessage: action.loadingMessage,
          secondsElapsed: action.secondsElapsed,
        },
      }
    }

    case 'GENERATION_COMPLETED': {
      return {
        ...state,
        view: 'review',
        generation: {
          ...state.generation,
          status: 'completed',
          progress: 100,
          stage: generationStages[generationStages.length - 1]?.label ?? 'Completed',
          feedbackMessage: action.feedbackMessage,
        },
        liveMessage: action.liveMessage,
        toast: {
          id: createToastId(),
          tone: 'success',
          message: action.feedbackMessage,
        },
      }
    }

    case 'GENERATION_FAILED': {
      return {
        ...state,
        generation: {
          ...state.generation,
          status: 'failed',
          feedbackMessage: action.feedbackMessage,
        },
        liveMessage: action.liveMessage,
        toast: {
          id: createToastId(),
          tone: 'error',
          message: action.feedbackMessage,
        },
      }
    }

    case 'SET_REVIEW_VARIANTS': {
      return {
        ...state,
        reviewVariants: action.variants,
        reviewError: null,
      }
    }

    case 'UPSERT_REVIEW_VARIANTS': {
      const known = new Map(state.reviewVariants.map((variant) => [variant.id, variant]))
      for (const incoming of action.variants) {
        known.set(incoming.id, incoming)
      }

      return {
        ...state,
        reviewVariants: Array.from(known.values()),
        reviewError: null,
      }
    }

    case 'SET_REVIEW_LOADING': {
      return {
        ...state,
        reviewLoading: action.loading,
      }
    }

    case 'SET_REVIEW_ERROR': {
      return {
        ...state,
        reviewError: action.error,
      }
    }

    case 'TOGGLE_VARIANT_SELECTION': {
      const selected = state.selectedVariantIds.includes(action.variantId)
        ? state.selectedVariantIds.filter((id) => id !== action.variantId)
        : [...state.selectedVariantIds, action.variantId]

      return {
        ...state,
        selectedVariantIds: selected,
      }
    }

    case 'TOGGLE_SELECT_ALL_VARIANTS': {
      if (state.selectedVariantIds.length > 0) {
        return {
          ...state,
          selectedVariantIds: [],
        }
      }

      return {
        ...state,
        selectedVariantIds: state.reviewVariants.map((variant) => variant.id),
      }
    }

    case 'CLEAR_VARIANT_SELECTION': {
      return {
        ...state,
        selectedVariantIds: [],
      }
    }

    case 'PATCH_VARIANT_STATUS': {
      return {
        ...state,
        reviewVariants: state.reviewVariants.map((variant) =>
          variant.id === action.variantId
            ? {
                ...variant,
                status: action.status,
              }
            : variant,
        ),
      }
    }

    case 'BATCH_UPDATE_VARIANT_STATUS': {
      if (state.selectedVariantIds.length === 0) {
        return state
      }

      const selectedSet = new Set(state.selectedVariantIds)

      return {
        ...state,
        reviewVariants: state.reviewVariants.map((variant) =>
          selectedSet.has(variant.id)
            ? {
                ...variant,
                status: action.status,
              }
            : variant,
        ),
        selectedVariantIds: [],
      }
    }

    case 'SET_EXPORT_SETTINGS': {
      return {
        ...state,
        exportSettings: {
          ...state.exportSettings,
          ...action.exportSettings,
        },
      }
    }

    case 'EXPORT_REQUESTED': {
      return {
        ...state,
        exportLoading: true,
        exportError: null,
      }
    }

    case 'EXPORT_COMPLETED': {
      return {
        ...state,
        exportLoading: false,
        exportError: null,
        exportDownloadUrl: action.downloadUrl,
        lastExportId: action.exportId,
        liveMessage: 'Export package completed and ready.',
        toast: {
          id: createToastId(),
          tone: 'success',
          message: action.downloadUrl
            ? 'Export package generated. Download is ready.'
            : 'Export package generated.',
        },
      }
    }

    case 'EXPORT_FAILED': {
      return {
        ...state,
        exportLoading: false,
        exportError: action.error,
        toast: {
          id: createToastId(),
          tone: 'error',
          message: action.error,
        },
      }
    }

    case 'AUTH_CHECK_STARTED': {
      return {
        ...state,
        auth: {
          status: 'checking',
          error: null,
        },
      }
    }

    case 'AUTHENTICATING': {
      return {
        ...state,
        auth: {
          status: 'authenticating',
          error: null,
        },
      }
    }

    case 'AUTH_SUCCESS': {
      return {
        ...state,
        auth: {
          status: 'authenticated',
          error: null,
        },
        liveMessage: action.liveMessage ?? 'Authenticated. Swiss workspace unlocked.',
      }
    }

    case 'AUTH_FAILURE': {
      return {
        ...state,
        auth: {
          status: 'unauthenticated',
          error: action.error,
        },
      }
    }

    case 'AUTH_REQUIRED': {
      return {
        ...state,
        auth: {
          status: 'unauthenticated',
          error: null,
        },
      }
    }

    case 'SET_LIVE_MESSAGE': {
      return {
        ...state,
        liveMessage: action.message,
      }
    }

    case 'CLEAR_LIVE_MESSAGE': {
      return {
        ...state,
        liveMessage: '',
      }
    }

    case 'SET_TOAST': {
      return {
        ...state,
        toast: action.toast,
      }
    }

    case 'CLEAR_TOAST': {
      return {
        ...state,
        toast: null,
      }
    }

    default:
      return state
  }
}
