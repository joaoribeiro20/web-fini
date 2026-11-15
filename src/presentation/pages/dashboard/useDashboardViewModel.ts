import { useCallback, useEffect, useState } from 'react'
import { useDependencies } from '../../../app/di/DependencyProvider'
import type { DashboardSummary } from '../../../core/models/MonthlyBudget'

const CURRENT_MONTH = new Date().toISOString().slice(0, 7)

export function useDashboardViewModel() {
  const { getDashboardSummary } = useDependencies()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setSummary(await getDashboardSummary.execute(CURRENT_MONTH))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar o dashboard.')
    } finally {
      setLoading(false)
    }
  }, [getDashboardSummary])

  useEffect(() => {
    void load()
  }, [load])

  return { summary, loading, error }
}