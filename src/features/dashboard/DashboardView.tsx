import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import type { CampaignCard, StatCard } from '../../types'

interface DashboardViewProps {
  stats: StatCard[]
  campaigns: CampaignCard[]
  onViewAllCampaigns: () => void
  onNewCampaign: () => void
  onGenerateMore: (campaign: CampaignCard) => void
  onExportCampaign: (campaign: CampaignCard) => void
}

function campaignStatusTone(status: CampaignCard['status']):
  | 'active'
  | 'generating'
  | 'needs-review' {
  switch (status) {
    case 'Active':
      return 'active'
    case 'Generating':
      return 'generating'
    default:
      return 'needs-review'
  }
}

export function DashboardView({
  stats,
  campaigns,
  onViewAllCampaigns,
  onNewCampaign,
  onGenerateMore,
  onExportCampaign,
}: DashboardViewProps) {
  return (
    <section className="panel-stack">
      <Card>
        <div className="section-head">
          <h2>Campaign Operations Dashboard</h2>
          <Button variant="ghost" onClick={onViewAllCampaigns}>
            View All Campaigns
          </Button>
        </div>

        <div className="stats-grid">
          {stats.map((stat) => (
            <article className="stat-card" key={stat.id}>
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
              <p className="stat-hint">{stat.hint}</p>
            </article>
          ))}
        </div>
      </Card>

      <Card>
        <div className="section-head">
          <h2>Active Campaigns</h2>
          <Button variant="ghost" onClick={onNewCampaign}>
            + New Campaign
          </Button>
        </div>

        <div className="campaign-grid">
          {campaigns.map((campaign) => (
            <article className="campaign-card" key={campaign.id}>
              <div className="card-row">
                <p className="campaign-name">{campaign.name}</p>
                <Badge tone={campaignStatusTone(campaign.status)}>{campaign.status}</Badge>
              </div>

              <p className="campaign-meta">
                Objective: {campaign.objective} · Updated {campaign.updated}
              </p>
              <p className="campaign-meta">
                Platforms: {campaign.platforms.join(', ')}
              </p>

              <div className="card-row split">
                <p>{campaign.variantsGenerated} variants</p>
                <p>{campaign.approved} approved</p>
              </div>

              <div className="card-actions">
                <Button variant="ghost" onClick={() => onGenerateMore(campaign)}>
                  Generate More
                </Button>
                <Button variant="secondary" onClick={() => onExportCampaign(campaign)}>
                  Export
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Card>
    </section>
  )
}
