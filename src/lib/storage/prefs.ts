import type { AppView, ExportSettings, GenerationMode } from '../../types'

const STORAGE_KEY = 'adpower.workspace.prefs.v1'

export interface WorkspacePreferences {
  lastView: AppView
  generationMode: GenerationMode
  exportSettings: ExportSettings
}

export const defaultPreferences: WorkspacePreferences = {
  lastView: 'dashboard',
  generationMode: 'custom',
  exportSettings: {
    meta: true,
    instagram: true,
    google: true,
    linkedIn: false,
    format: 'PNG',
    grouping: 'By Platform',
  },
}

export function loadWorkspacePreferences(): WorkspacePreferences {
  if (typeof window === 'undefined') {
    return defaultPreferences
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultPreferences
    }

    const parsed = JSON.parse(raw) as Partial<WorkspacePreferences>
    return {
      lastView: parsed.lastView ?? defaultPreferences.lastView,
      generationMode: parsed.generationMode ?? defaultPreferences.generationMode,
      exportSettings: {
        ...defaultPreferences.exportSettings,
        ...parsed.exportSettings,
      },
    }
  } catch {
    return defaultPreferences
  }
}

export function saveWorkspacePreferences(preferences: WorkspacePreferences): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // Intentionally ignore persistence failures.
  }
}
