import type {
  CampaignCard,
  ReviewVariant,
  StatCard,
  ThemeDefinition,
  WizardStep,
} from './types'

export const themes: ThemeDefinition[] = [
  {
    id: 'swiss',
    route: 'swiss',
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
  },
]

export const archivedThemes: ThemeDefinition[] = [
  {
    id: 'neon',
    route: 'neon',
    label: 'Neon Editorial',
    tagline: 'Archived visual direction',
    summary: 'Archived in favor of Swiss Precision.',
    mode: 'dark',
    className: 'theme-neon',
    heroTitle: 'Archived',
    heroSubtitle: 'Archived',
    ctaLabel: 'Archived',
  },
  {
    id: 'soft-tech',
    route: 'soft-tech',
    label: 'Soft Tech',
    tagline: 'Archived visual direction',
    summary: 'Archived in favor of Swiss Precision.',
    mode: 'light',
    className: 'theme-soft-tech',
    heroTitle: 'Archived',
    heroSubtitle: 'Archived',
    ctaLabel: 'Archived',
  },
  {
    id: 'dark-luxury',
    route: 'dark-luxury',
    label: 'Dark Luxury',
    tagline: 'Archived visual direction',
    summary: 'Archived in favor of Swiss Precision.',
    mode: 'dark',
    className: 'theme-dark-luxury',
    heroTitle: 'Archived',
    heroSubtitle: 'Archived',
    ctaLabel: 'Archived',
  },
]

export const activeTheme = themes[0]

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
    aiAssist: 'Recommendation: Conversion objective aligns with your historical best performers.',
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

export const baseReviewVariants: ReviewVariant[] = [
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
  {
    id: 'var-004',
    title: 'Variant #004',
    headline: 'Creative velocity for teams shipping every week.',
    cta: 'Launch Campaign',
    confidence: 4.1,
    status: 'rejected',
    aiGenerated: true,
  },
  {
    id: 'var-005',
    title: 'Variant #005',
    headline: 'From source assets to platform exports, no workflow gaps.',
    cta: 'Take It With You',
    confidence: 4.7,
    status: 'approved',
    aiGenerated: false,
  },
]

export const generationStages = [
  'Queued',
  'Building prompt set',
  'Generating visuals',
  'Writing copy variants',
  'Scoring brand consistency',
  'Packaging review set',
]

export const generationModes = [
  {
    id: 'quick',
    label: 'Quick Generate',
    description: '20-50 variants generated automatically from campaign context.',
  },
  {
    id: 'custom',
    label: 'Custom Generate',
    description: 'Control headlines, visuals, CTAs, layouts, and color scheme tests.',
  },
  {
    id: 'iterate',
    label: 'Iterate Existing',
    description: 'Produce subtle and radical variations from a winning ad base.',
  },
] as const

export const topNavLinks = ['Clients', 'Campaigns', 'Generate', 'Review', 'Assets']
