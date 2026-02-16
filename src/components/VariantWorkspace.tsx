import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  activeTheme,
  campaigns,
  defaultCampaignId,
  generationModes,
  statCards,
  topNavItems,
  viewOptions,
  wizardSteps,
} from '../data'
import { errorMessages, getLoadingMessage, successMessages } from '../microcopy'
import { apiClient, ApiError } from '../lib/api/client'
import { workspaceActions } from '../lib/workspace/actions'
import { workspaceReducer, createInitialWorkspaceState } from '../lib/workspace/reducer'
import {
  approvedVariantCount,
  navIsActive,
  selectedPlatformsLabel,
} from '../lib/workspace/selectors'
import {
  loadWorkspacePreferences,
  saveWorkspacePreferences,
} from '../lib/storage/prefs'
import type { AppView, ReviewVariant, ThemeDefinition, TopNavItem, VariantStatus } from '../types'
import { AuthGate } from './AuthGate'
import { Button } from './ui/Button'
import { DashboardView } from '../features/dashboard/DashboardView'
import { CampaignWizardView } from '../features/campaign/CampaignWizardView'
import { GenerateView } from '../features/generate/GenerateView'
import { ReviewExportView } from '../features/review/ReviewExportView'
import { TopNav } from '../features/navigation/TopNav'
import { Sidebar } from '../features/navigation/Sidebar'

const VALID_VIEWS: AppView[] = ['dashboard', 'campaign', 'generate', 'review']

function parseView(value: string | null): AppView | undefined {
  if (!value) {
    return undefined
  }

  return VALID_VIEWS.includes(value as AppView) ? (value as AppView) : undefined
}

function parseStep(value: string | null): number | undefined {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed)) {
    return undefined
  }

  return Math.max(1, Math.min(parsed, 6))
}

function pickRandom(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)]
}

function toUserMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export function VariantWorkspace({ theme = activeTheme }: { theme?: ThemeDefinition }) {
  const [searchParams, setSearchParams] = useSearchParams()

  const initialOptionsRef = useRef<Parameters<typeof createInitialWorkspaceState>[0] | null>(
    null,
  )

  if (!initialOptionsRef.current) {
    const preferences = loadWorkspacePreferences()
    const queryView = parseView(searchParams.get('view'))
    const queryStep = parseStep(searchParams.get('step'))
    const debugMode = searchParams.get('debug') === '1'

    initialOptionsRef.current = {
      initialView: queryView ?? preferences.lastView,
      initialStep: queryStep ?? 1,
      preferences,
      debugMode,
    }
  }

  const [state, dispatch] = useReducer(
    workspaceReducer,
    initialOptionsRef.current,
    createInitialWorkspaceState,
  )

  const campaignIdRef = useRef(defaultCampaignId)
  const internalUrlUpdateRef = useRef(false)

  const refreshVariants = useCallback(async (): Promise<ReviewVariant[]> => {
    dispatch(workspaceActions.setReviewLoading(true))
    dispatch(workspaceActions.setReviewError(null))

    try {
      const result = await apiClient.getVariants(campaignIdRef.current, {
        limit: 100,
      })
      dispatch(workspaceActions.setReviewVariants(result.items))
      return result.items
    } catch (error) {
      const message = toUserMessage(
        error,
        'Unable to load variants. Please retry in a moment.',
      )
      dispatch(workspaceActions.setReviewError(message))
      return []
    } finally {
      dispatch(workspaceActions.setReviewLoading(false))
    }
  }, [])

  useEffect(() => {
    let isActive = true

    async function checkSession(): Promise<void> {
      dispatch(workspaceActions.authCheckStarted())
      try {
        await apiClient.getSession()
        if (!isActive) {
          return
        }

        dispatch(
          workspaceActions.authSuccess('Authenticated. Swiss Precision workspace unlocked.'),
        )
      } catch (error) {
        if (!isActive) {
          return
        }

        if (error instanceof ApiError && error.status === 401) {
          dispatch(workspaceActions.authRequired())
          return
        }

        dispatch(
          workspaceActions.authFailure(
            toUserMessage(error, 'Unable to reach API. Check backend connectivity.'),
          ),
        )
      }
    }

    void checkSession()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (!state.toast) {
      return
    }

    const timeout = window.setTimeout(() => {
      dispatch(workspaceActions.clearToast())
    }, 3500)

    return () => window.clearTimeout(timeout)
  }, [state.toast])

  useEffect(() => {
    const searchKey = searchParams.toString()
    const next = new URLSearchParams(searchParams)
    next.set('view', state.view)

    if (state.view === 'campaign') {
      next.set('step', String(state.wizardStep + 1))
    } else {
      next.delete('step')
    }

    if (state.debugMode) {
      next.set('debug', '1')
    }

    const current = searchKey
    const target = next.toString()

    if (current !== target) {
      internalUrlUpdateRef.current = true
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams, state.debugMode, state.view, state.wizardStep])

  useEffect(() => {
    if (internalUrlUpdateRef.current) {
      internalUrlUpdateRef.current = false
      return
    }

    const queryView = parseView(searchParams.get('view'))
    const queryStep = parseStep(searchParams.get('step'))

    if (queryView && queryView !== state.view) {
      dispatch(workspaceActions.navigateView(queryView))
    }

    if (queryView === 'campaign' && typeof queryStep === 'number' && queryStep - 1 !== state.wizardStep) {
      dispatch(workspaceActions.setWizardStep(queryStep - 1))
    }
  }, [searchParams, state.view, state.wizardStep])

  useEffect(() => {
    saveWorkspacePreferences({
      lastView: state.view,
      generationMode: state.generation.mode,
      exportSettings: state.exportSettings,
    })
  }, [state.exportSettings, state.generation.mode, state.view])

  useEffect(() => {
    if (state.auth.status !== 'authenticated') {
      return
    }

    if (state.view !== 'review') {
      return
    }

    void refreshVariants()
  }, [refreshVariants, state.auth.status, state.view])

  useEffect(() => {
    if (state.auth.status !== 'authenticated') {
      return
    }

    if (!state.generation.jobId) {
      return
    }

    if (state.generation.status !== 'queued' && state.generation.status !== 'running') {
      return
    }

    let timeoutId: number | undefined
    let stopped = false
    const startedAt = Date.now()

    const poll = async (): Promise<void> => {
      try {
        const result = await apiClient.getGenerationJob(state.generation.jobId ?? '')
        if (stopped) {
          return
        }

        const elapsed = Math.max(1, Math.floor((Date.now() - startedAt) / 1000))

        dispatch(
          workspaceActions.generationProgress({
            progress: result.progress ?? state.generation.progress,
            stage: result.stage ?? state.generation.stage,
            loadingMessage: getLoadingMessage(elapsed),
            secondsElapsed: elapsed,
            status: result.status === 'running' ? 'running' : 'queued',
          }),
        )

        if (result.status === 'completed') {
          const success = pickRandom(successMessages)
          dispatch(
            workspaceActions.generationCompleted(
              success,
              'Generation complete. Review workspace loaded.',
            ),
          )
          await refreshVariants()
          return
        }

        if (result.status === 'failed') {
          dispatch(
            workspaceActions.generationFailed(
              result.error ?? pickRandom(errorMessages),
              'Generation failed. Check configuration and retry.',
            ),
          )
          return
        }

        timeoutId = window.setTimeout(() => {
          void poll()
        }, 1500)
      } catch (error) {
        if (stopped) {
          return
        }

        dispatch(
          workspaceActions.generationFailed(
            toUserMessage(error, pickRandom(errorMessages)),
            'Generation polling failed. Please retry.',
          ),
        )
      }
    }

    void poll()

    return () => {
      stopped = true
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [
    refreshVariants,
    state.auth.status,
    state.generation.jobId,
    state.generation.progress,
    state.generation.stage,
    state.generation.status,
  ])

  const approvedCount = approvedVariantCount(state)

  function navigateTo(view: AppView, message: string, step?: number): void {
    dispatch(workspaceActions.navigateView(view, step))
    dispatch(workspaceActions.setLiveMessage(message))
  }

  async function handlePassphraseSubmit(passphrase: string): Promise<void> {
    dispatch(workspaceActions.authenticating())

    try {
      await apiClient.createSession(passphrase)
      dispatch(workspaceActions.authSuccess('Access granted. Workspace unlocked.'))
      await refreshVariants()
    } catch (error) {
      dispatch(
        workspaceActions.authFailure(
          toUserMessage(error, 'Authentication failed. Verify passphrase and retry.'),
        ),
      )
    }
  }

  async function startGeneration(): Promise<void> {
    dispatch(workspaceActions.setLiveMessage('Submitting generation job...'))

    try {
      const activeCampaign = campaigns[0]
      const response = await apiClient.createGenerationJob({
        campaignId: activeCampaign.id,
        mode: state.generation.mode,
        targetCount: state.generation.targetCount,
        headlineVariations: state.generation.headlineVariations,
        visualVariations: state.generation.visualVariations,
        messages: wizardSteps[4]?.fields ?? [],
        platforms: activeCampaign.platforms,
      })

      dispatch(
        workspaceActions.generationJobCreated(
          response.jobId,
          'Generation queued. We are building a fresh Swiss-precision batch.',
        ),
      )
    } catch (error) {
      dispatch(
        workspaceActions.generationFailed(
          toUserMessage(error, pickRandom(errorMessages)),
          'Unable to queue generation. Please retry.',
        ),
      )
    }
  }

  function simulateFailure(): void {
    if (!state.debugMode) {
      return
    }

    dispatch(
      workspaceActions.generationFailed(
        pickRandom(errorMessages),
        'Debug failure triggered.',
      ),
    )
  }

  async function updateVariantStatus(variantId: string, status: VariantStatus): Promise<void> {
    dispatch(workspaceActions.patchVariantStatus(variantId, status))

    try {
      await apiClient.patchVariantStatus(variantId, status)
    } catch (error) {
      dispatch(
        workspaceActions.setToast({
          id: `toast_${Date.now()}`,
          tone: 'error',
          message: toUserMessage(error, 'Failed to persist variant status.'),
        }),
      )
      await refreshVariants()
    }
  }

  async function batchUpdateVariantStatus(status: VariantStatus): Promise<void> {
    const selectedIds = [...state.selectedVariantIds]
    dispatch(workspaceActions.batchUpdateVariantStatus(status))

    if (selectedIds.length === 0) {
      return
    }

    try {
      await Promise.all(
        selectedIds.map((variantId) => apiClient.patchVariantStatus(variantId, status)),
      )
      dispatch(
        workspaceActions.setLiveMessage(
          `Updated ${selectedIds.length} variants to ${status}.`,
        ),
      )
    } catch (error) {
      dispatch(
        workspaceActions.setToast({
          id: `toast_${Date.now()}`,
          tone: 'error',
          message: toUserMessage(error, 'Failed to persist batch update.'),
        }),
      )
      await refreshVariants()
    }
  }

  async function queueExportPackage(): Promise<void> {
    dispatch(workspaceActions.exportRequested())

    try {
      const platformLabel = selectedPlatformsLabel(state)
      const platforms =
        platformLabel === 'No platform selected'
          ? []
          : platformLabel
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean)

      const result = await apiClient.createExport({
        campaignId: campaignIdRef.current,
        variantIds:
          state.selectedVariantIds.length > 0
            ? state.selectedVariantIds
            : state.reviewVariants.map((variant) => variant.id),
        platforms,
        format: state.exportSettings.format,
        grouping: state.exportSettings.grouping,
      })

      const refreshed = await apiClient.getExport(result.exportId)
      dispatch(
        workspaceActions.exportCompleted(
          result.exportId,
          refreshed.downloadUrl ?? result.downloadUrl ?? null,
        ),
      )

      dispatch(
        workspaceActions.setLiveMessage(
          `Export package queued: ${platformLabel} · ${state.exportSettings.format} · ${state.exportSettings.grouping}.`,
        ),
      )
    } catch (error) {
      dispatch(
        workspaceActions.exportFailed(
          toUserMessage(error, 'Failed to queue export package.'),
        ),
      )
    }
  }

  function handleTopNavSelection(item: TopNavItem): void {
    navigateTo(
      item.view,
      item.id === 'assets'
        ? 'Asset setup loaded in Campaign step 6.'
        : `${item.label} workspace loaded.`,
      item.step,
    )
  }

  if (state.auth.status !== 'authenticated') {
    return (
      <AuthGate
        status={state.auth.status}
        error={state.auth.error}
        onSubmitPassphrase={handlePassphraseSubmit}
      />
    )
  }

  return (
    <div className={`variant-shell ${theme.className}`}>
      <div className="ambient-layer" aria-hidden />
      <div className="sr-only-live" aria-live="polite">
        {state.liveMessage}
      </div>

      <TopNav
        items={topNavItems}
        isActive={(item) => navIsActive(state, item)}
        onSelectItem={handleTopNavSelection}
        onQuickGenerate={() =>
          navigateTo('generate', 'Quick generation controls opened.')
        }
        onOpenExport={() =>
          navigateTo('review', 'Review and export workspace opened.')
        }
      />

      <div className="workspace-grid">
        <Sidebar
          viewOptions={viewOptions}
          activeView={state.view}
          queueStatus={state.generation.status.toUpperCase()}
          queueStage={state.generation.stage}
          progress={state.generation.progress}
          elapsedSeconds={state.generation.secondsElapsed}
          ctaLabel={theme.ctaLabel}
          isGenerating={state.generation.status === 'running'}
          onSelectView={(view) => navigateTo(view, `${view} workspace loaded.`)}
          onStartGeneration={() => {
            void startGeneration()
          }}
        />

        <main className="main-column">
          <section className="panel hero-panel">
            <p className="kicker">{theme.label}</p>
            <h1>{theme.heroTitle}</h1>
            <p className="hero-subtitle">{theme.heroSubtitle}</p>
            <p className="hero-greeting">Creative operations ready for launch.</p>

            <div className="hero-actions">
              <Button
                variant="primary"
                onClick={() => {
                  void startGeneration()
                }}
              >
                {theme.ctaLabel}
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigateTo('campaign', 'Campaign wizard opened.')}
              >
                Create Campaign
              </Button>
            </div>

            {state.exportDownloadUrl ? (
              <p className="action-message" role="status">
                Latest export ready: <a href={state.exportDownloadUrl}>Download package</a>
              </p>
            ) : null}
          </section>

          {state.view === 'dashboard' ? (
            <DashboardView
              stats={statCards}
              campaigns={campaigns}
              onViewAllCampaigns={() =>
                navigateTo('dashboard', 'Showing all active campaigns.')
              }
              onNewCampaign={() =>
                navigateTo('campaign', 'New campaign setup initialized.')
              }
              onGenerateMore={() => {
                void startGeneration()
              }}
              onExportCampaign={(campaign) =>
                navigateTo('review', `Export workspace opened for ${campaign.name}.`)
              }
            />
          ) : null}

          {state.view === 'campaign' ? (
            <CampaignWizardView
              steps={wizardSteps}
              stepIndex={state.wizardStep}
              objective={state.objective}
              onSetStep={(step) => dispatch(workspaceActions.setWizardStep(step))}
              onSetObjective={(objective) =>
                dispatch(workspaceActions.setObjective(objective))
              }
              onMoveStep={(direction) =>
                dispatch(
                  workspaceActions.setWizardStep(
                    direction === 'prev' ? state.wizardStep - 1 : state.wizardStep + 1,
                  ),
                )
              }
              onSaveDraft={() =>
                dispatch(
                  workspaceActions.setLiveMessage(
                    'Draft locked in. You can continue anytime.',
                  ),
                )
              }
            />
          ) : null}

          {state.view === 'generate' ? (
            <GenerateView
              modes={generationModes}
              selectedMode={state.generation.mode}
              targetCount={state.generation.targetCount}
              headlineVariations={state.generation.headlineVariations}
              visualVariations={state.generation.visualVariations}
              status={state.generation.status}
              stage={state.generation.stage}
              progress={state.generation.progress}
              loadingMessage={state.generation.loadingMessage}
              feedbackMessage={state.generation.feedbackMessage}
              debugEnabled={state.debugMode}
              onSelectMode={(mode) => dispatch(workspaceActions.setGenerationMode(mode))}
              onSetTargetCount={(value) =>
                dispatch(workspaceActions.setGenerationTuning({ targetCount: value }))
              }
              onSetHeadlineVariations={(value) =>
                dispatch(
                  workspaceActions.setGenerationTuning({
                    headlineVariations: value,
                  }),
                )
              }
              onSetVisualVariations={(value) =>
                dispatch(
                  workspaceActions.setGenerationTuning({
                    visualVariations: value,
                  }),
                )
              }
              onGenerate={() => {
                void startGeneration()
              }}
              onSimulateFailure={simulateFailure}
            />
          ) : null}

          {state.view === 'review' ? (
            <ReviewExportView
              variants={state.reviewVariants}
              selectedVariantIds={state.selectedVariantIds}
              approvedCount={approvedCount}
              onToggleSelectAll={() =>
                dispatch(workspaceActions.toggleSelectAllVariants())
              }
              onToggleVariantSelection={(variantId) =>
                dispatch(workspaceActions.toggleVariantSelection(variantId))
              }
              onBatchStatusUpdate={(status) => {
                void batchUpdateVariantStatus(status)
              }}
              onVariantStatusUpdate={(variantId, status) => {
                void updateVariantStatus(variantId, status)
              }}
              exportSettings={state.exportSettings}
              onUpdateExportSettings={(settings) =>
                dispatch(workspaceActions.setExportSettings(settings))
              }
              onQueueExport={() => {
                void queueExportPackage()
              }}
              isLoading={state.reviewLoading || state.exportLoading}
              errorMessage={state.reviewError ?? state.exportError}
            />
          ) : null}
        </main>
      </div>

      {state.toast ? (
        <aside className={`toast toast-${state.toast.tone}`} role="status">
          <p>{state.toast.message}</p>
          <button
            className="toast-close"
            type="button"
            aria-label="Dismiss notification"
            onClick={() => dispatch(workspaceActions.clearToast())}
          >
            ×
          </button>
        </aside>
      ) : null}
    </div>
  )
}
