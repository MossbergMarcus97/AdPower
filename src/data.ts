import type {
  CampaignCard,
  GenerationModeOption,
  GenerationStage,
  ReviewVariant,
  StatCard,
  ThemeDefinition,
  TopNavItem,
  WizardStep,
} from './types'

export const activeTheme: ThemeDefinition = {
  id: 'swiss',
  route: '',
  label: 'Swiss Precision',
  tagline: 'Grid-first minimalism for ruthless clarity',
  summary:
    'Square geometry, strict hierarchy, and functional accents. Built for teams that value signal over decoration.',
  mode: 'light',
  className: 'theme-swiss',
  heroTitle: 'Systematic Creative Production',
  heroSubtitle:
    'International Typographic Style applied to high-volume ad generation workflows.',
  ctaLabel: 'Build With Precision',
}

export const statCards: StatCard[] = [
  {
    id: 'active-campaigns',
    label: 'Active Campaigns',
    value: '12',
    hint: '+2 week-over-week',
  },
  {
    id: 'variants-generated',
    label: 'Variants Generated',
    value: '847',
    hint: '63 approved today',
  },
  {
    id: 'ai-jobs',
    label: 'AI Jobs Running',
    value: '4',
    hint: 'Avg completion 11m',
  },
  {
    id: 'export-ready',
    label: 'Exports Ready',
    value: '19',
    hint: 'Last package 8 min ago',
  },
]

export const campaigns: CampaignCard[] = [
  {
    id: 'cmp-summer-sale',
    name: 'Summer Sale Momentum',
    objective: 'Conversion',
    platforms: ['Meta', 'Instagram', 'Google Display'],
    variantsGenerated: 156,
    approved: 87,
    status: 'Active',
    updated: '2 hours ago',
  },
  {
    id: 'cmp-launch',
    name: 'Product Launch 2.0',
    objective: 'Awareness',
    platforms: ['LinkedIn', 'Meta', 'YouTube'],
    variantsGenerated: 234,
    approved: 112,
    status: 'Generating',
    updated: '14 minutes ago',
  },
  {
    id: 'cmp-retargeting',
    name: 'Retention Retargeting',
    objective: 'Consideration',
    platforms: ['Meta', 'TikTok'],
    variantsGenerated: 89,
    approved: 45,
    status: 'Needs Review',
    updated: 'Yesterday',
  },
]

export const defaultCampaignId = campaigns[0].id

export const wizardSteps: WizardStep[] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    detail: 'Define campaign name, timeline, and outcome expectations.',
    fields: [
      'Campaign name: Spring Sprint 2026',
      'Date range: March 1 - April 15',
      'Primary KPI: Cost per qualified lead',
    ],
    aiAssist: 'Suggested names: Spring Demand Wave, 45-Day Conversion Push.',
  },
  {
    id: 'objective',
    title: 'Objective Selection',
    detail: 'Choose the conversion intent and algorithmic optimization target.',
    fields: [
      'Objective: Conversion',
      'Success metric: CPA below $38',
      'Optimization event: Completed checkout',
    ],
    aiAssist:
      'Recommendation: Conversion objective aligns with your historical best performers.',
  },
  {
    id: 'platform-format',
    title: 'Platform & Format',
    detail: 'Map placements and output dimensions before generation.',
    fields: [
      'Meta: Feed 1080x1350, Story 1080x1920',
      'Google: Responsive display set',
      'LinkedIn: Sponsored single image',
    ],
    aiAssist: 'AI flags Story + Feed as your best CTR combination this quarter.',
  },
  {
    id: 'audience',
    title: 'Target Audience',
    detail: 'Combine owned audience intelligence with suggested lookalikes.',
    fields: [
      'Primary persona: Growth-minded marketers',
      'Lookalike source: Top 5% converters',
      'Exclusions: Existing customers (last 30 days)',
    ],
    aiAssist: 'Persona suggestion: Performance Lead Priya (SaaS, 8-20 person team).',
  },
  {
    id: 'messages-cta',
    title: 'Key Messages & CTAs',
    detail: 'Define message pillars and conversion-focused call-to-actions.',
    fields: [
      'Message 1: Generate 100+ on-brand ads in minutes',
      'Message 2: Brand consistency at scale',
      'CTA set: Start Trial, See Demo, Get Creative Plan',
    ],
    aiAssist: 'High-converting CTA variation: Build It Faster.',
  },
  {
    id: 'assets',
    title: 'Asset Upload',
    detail: 'Upload brand assets and validate visual consistency constraints.',
    fields: [
      'Assets uploaded: 42 images, 6 logos, 3 font files',
      'Brand palette detected: 5 primary, 3 accent colors',
      'Compliance check: 96% pass rate',
    ],
    aiAssist: 'AI tagged 14 lifestyle shots as top-fit for conversion campaigns.',
  },
]

export const generationStages: GenerationStage[] = [
  { id: 'queued', label: 'Queued' },
  { id: 'prompt', label: 'Building prompt set' },
  { id: 'image', label: 'Generating visuals' },
  { id: 'copy', label: 'Writing copy variants' },
  { id: 'score', label: 'Scoring brand consistency' },
  { id: 'packaging', label: 'Packaging review set' },
  { id: 'completed', label: 'Completed' },
]

export const generationModes: GenerationModeOption[] = [
  {
    id: 'quick',
    label: 'Quick Generate',
    description: '20-50 variants generated automatically from campaign context.',
  },
  {
    id: 'custom',
    label: 'Custom Generate',
    description:
      'Control headlines, visuals, CTAs, layouts, and color scheme tests.',
  },
  {
    id: 'iterate',
    label: 'Iterate Existing',
    description: 'Produce subtle and radical variations from a winning ad base.',
  },
]

export const topNavItems: TopNavItem[] = [
  { id: 'clients', label: 'Clients', view: 'dashboard' },
  { id: 'campaigns', label: 'Campaigns', view: 'campaign' },
  { id: 'generate', label: 'Generate', view: 'generate' },
  { id: 'review', label: 'Review', view: 'review' },
  { id: 'assets', label: 'Assets', view: 'campaign', step: 6 },
]

export const viewOptions: Array<{ id: 'dashboard' | 'campaign' | 'generate' | 'review'; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'campaign', label: 'New Campaign' },
  { id: 'generate', label: 'Generate Variants' },
  { id: 'review', label: 'Review & Export' },
]

export const fallbackReviewVariants: ReviewVariant[] = [
  {
    id: 'var-001',
    title: 'Variant #001',
    headline: 'Generate 100 campaign-ready ads before your next coffee refill.',
    cta: 'Start Creating',
    confidence: 4.9,
    status: 'approved',
    aiGenerated: true,
  },
  {
    id: 'var-002',
    title: 'Variant #002',
    headline: 'Scale your creative without losing your brand signal.',
    cta: 'Book A Demo',
    confidence: 4.6,
    status: 'pending',
    aiGenerated: true,
  },
  {
    id: 'var-003',
    title: 'Variant #003',
    headline: 'Move from idea to launch-ready ads in one workspace.',
    cta: 'Generate Variants',
    confidence: 4.2,
    status: 'pending',
    aiGenerated: false,
  },
]
