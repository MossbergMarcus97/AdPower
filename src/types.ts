export type ThemeId = 'swiss'

export type AppView = 'dashboard' | 'campaign' | 'generate' | 'review'

export type GenerationMode = 'quick' | 'custom' | 'iterate'

export type CampaignObjective = 'Awareness' | 'Consideration' | 'Conversion'

export type VariantStatus = 'pending' | 'approved' | 'rejected'

export type JobStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed'

export interface ThemeDefinition {
  id: ThemeId
  route: string
  label: string
  tagline: string
  summary: string
  mode: 'light' | 'dark'
  className: string
  heroTitle: string
  heroSubtitle: string
  ctaLabel: string
}

export interface CampaignCard {
  id: string
  name: string
  objective: CampaignObjective
  platforms: string[]
  variantsGenerated: number
  approved: number
  status: 'Active' | 'Generating' | 'Needs Review'
  updated: string
}

export interface StatCard {
  id: string
  label: string
  value: string
  hint: string
}

export interface ReviewVariant {
  id: string
  title: string
  headline: string
  body?: string
  cta: string
  confidence: number
  status: VariantStatus
  aiGenerated: boolean
  imageUrl?: string
  providerCopy?: string
  providerImage?: string
  createdAt?: string
}

export interface WizardStep {
  id: string
  title: string
  detail: string
  fields: string[]
  aiAssist: string
}

export interface GenerationStage {
  id: string
  label: string
}

export interface GenerationModeOption {
  id: GenerationMode
  label: string
  description: string
}

export interface TopNavItem {
  id: string
  label: string
  view: AppView
  step?: number
}

export interface ExportSettings {
  meta: boolean
  instagram: boolean
  google: boolean
  linkedIn: boolean
  format: 'PNG' | 'JPG' | 'PDF'
  grouping: 'By Platform' | 'By Variant Group' | 'Flat'
}
