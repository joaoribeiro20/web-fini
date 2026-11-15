import { CategoryBreakdown } from './components/CategoryBreakdown'
import { SummaryStats } from './components/SummaryStats'
import { useDashboardViewModel } from './useDashboardViewModel'
import './DashboardPage.css'

export function DashboardPage() {
  const { summary, loading, error } = useDashboardViewModel()

  if (loading && !summary) return <p>Carregando...</p>
  if (error && !summary) return <p role="alert">{error}</p>
  if (!summary) return null

  return (
    <div className="dashboard">
      {error && <p role="alert" className="dashboard__error">{error}</p>}
      <SummaryStats
        totalCommitted={summary.totalCommitted}
        remaining={summary.remaining}
        savingsRate={summary.savingsRate}
      />
      <CategoryBreakdown
        items={summary.byCategory}
        committedRate={summary.committedRate}
        goalsRate={summary.goalsRate}
        goals={summary.goals}
        goalsTotal={summary.goalsTotal}
      />
    </div>
  )
}