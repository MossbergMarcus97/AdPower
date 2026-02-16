import { describe, expect, it } from 'vitest'
import { topNavItems } from '../../data'
import { defaultPreferences } from '../storage/prefs'
import { createInitialWorkspaceState } from './reducer'
import {
  approvedVariantCount,
  navIsActive,
  selectedPlatformsLabel,
  selectedVariantCount,
} from './selectors'

describe('workspace selectors', () => {
  const state = createInitialWorkspaceState({
    initialView: 'campaign',
    initialStep: 6,
    preferences: defaultPreferences,
    debugMode: false,
  })

  it('computes selected and approved counts', () => {
    const withSelection = {
      ...state,
      selectedVariantIds: [state.reviewVariants[0].id],
    }

    expect(selectedVariantCount(withSelection)).toBe(1)
    expect(approvedVariantCount(withSelection)).toBeGreaterThan(0)
  })

  it('matches nav active state for assets step', () => {
    const assetsItem = topNavItems.find((item) => item.id === 'assets')
    expect(assetsItem).toBeDefined()
    expect(navIsActive(state, assetsItem!)).toBe(true)
  })

  it('builds selected platform label', () => {
    expect(selectedPlatformsLabel(state)).toContain('Meta Ads')
    expect(selectedPlatformsLabel(state)).toContain('Google Ads')
  })
})
