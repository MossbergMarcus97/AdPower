import { describe, expect, it } from 'vitest'
import { defaultPreferences } from '../storage/prefs'
import { workspaceActions } from './actions'
import { createInitialWorkspaceState, workspaceReducer } from './reducer'

describe('workspaceReducer', () => {
  const baseState = createInitialWorkspaceState({
    initialView: 'dashboard',
    initialStep: 1,
    preferences: defaultPreferences,
    debugMode: false,
  })

  it('navigates between views and maps wizard steps', () => {
    const next = workspaceReducer(
      baseState,
      workspaceActions.navigateView('campaign', 6),
    )

    expect(next.view).toBe('campaign')
    expect(next.wizardStep).toBe(5)
  })

  it('updates generation tuning', () => {
    const next = workspaceReducer(
      baseState,
      workspaceActions.setGenerationTuning({
        targetCount: 70,
        headlineVariations: 12,
      }),
    )

    expect(next.generation.targetCount).toBe(70)
    expect(next.generation.headlineVariations).toBe(12)
    expect(next.generation.visualVariations).toBe(baseState.generation.visualVariations)
  })

  it('applies batch status updates and clears selection', () => {
    const withSelection = {
      ...baseState,
      selectedVariantIds: [baseState.reviewVariants[0].id, baseState.reviewVariants[1].id],
    }

    const updated = workspaceReducer(
      withSelection,
      workspaceActions.batchUpdateVariantStatus('approved'),
    )

    expect(updated.selectedVariantIds).toHaveLength(0)
    expect(updated.reviewVariants[0].status).toBe('approved')
    expect(updated.reviewVariants[1].status).toBe('approved')
  })
})
