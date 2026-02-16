import type { TopNavItem, VariantStatus } from '../../types'
import type { WorkspaceState } from './types'

export function selectedVariantCount(state: WorkspaceState): number {
  return state.selectedVariantIds.length
}

export function approvedVariantCount(state: WorkspaceState): number {
  return state.reviewVariants.filter((variant) => variant.status === 'approved').length
}

export function pendingVariantCount(state: WorkspaceState): number {
  return state.reviewVariants.filter((variant) => variant.status === 'pending').length
}

export function rejectedVariantCount(state: WorkspaceState): number {
  return state.reviewVariants.filter((variant) => variant.status === 'rejected').length
}

export function variantCountByStatus(
  state: WorkspaceState,
  status: VariantStatus,
): number {
  return state.reviewVariants.filter((variant) => variant.status === status).length
}

export function navIsActive(state: WorkspaceState, item: TopNavItem): boolean {
  if (item.id === 'assets') {
    return state.view === 'campaign' && state.wizardStep === 5
  }

  return state.view === item.view
}

export function selectedPlatformsLabel(state: WorkspaceState): string {
  const selected = [
    state.exportSettings.meta ? 'Meta Ads' : null,
    state.exportSettings.instagram ? 'Instagram' : null,
    state.exportSettings.google ? 'Google Ads' : null,
    state.exportSettings.linkedIn ? 'LinkedIn' : null,
  ].filter(Boolean)

  if (selected.length === 0) {
    return 'No platform selected'
  }

  return selected.join(', ')
}

export function progressPercent(state: WorkspaceState): string {
  return `${Math.max(0, Math.min(state.generation.progress, 100)).toFixed(0)}%`
}
