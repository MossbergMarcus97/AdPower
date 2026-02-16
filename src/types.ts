export type ThemeId = 'swiss' | 'neon' | 'soft-tech' | 'dark-luxury'

export type AppView = 'dashboard' | 'campaign' | 'generate' | 'review'

export type GenerationMode = 'quick' | 'custom' | 'iterate'

export type CampaignObjective = 'Awareness' | 'Consideration' | 'Conversion'

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
  cta: string
  confidence: number
  status: 'pending' | 'approved' | 'rejected'
  aiGenerated: boolean
}

export interface WizardStep {
  id: string
  title: string
  detail: string
  fields: string[]
  aiAssist: string
}
