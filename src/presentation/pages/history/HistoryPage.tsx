import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useDependencies } from '../../../app/di/DependencyProvider'
import type { MonthlyBudget, MonthlySpendingHistoryEntry } from '../../../core/models/MonthlyBudget'
import { formatCurrency } from '../../../shared/format'
import './HistoryPage.css'

type MonthDetailState =
  | { status: 'loading' }
  | { status: 'loaded'; budget: MonthlyBudget }
  | { status: 'error'; message: string }

function formatMonth(month: string): string {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T00:00:00Z`))

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00.000Z`))
}

export function HistoryPage() {
  const { getMonthlyBudget, getSpendingHistory } = useDependencies()
  const [history, setHistory] = useState<MonthlySpendingHistoryEntry[] | null>(null)
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null)
  const [monthDetails, setMonthDetails] = useState<Record<string, MonthDetailState>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    getSpendingHistory.execute()
      .then((entries) => {
        if (active) setHistory(entries)
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar o histórico.')
        }
      })

    return () => {
      active = false
    }
  }, [getSpendingHistory])

  const toggleMonthDetails = async (month: string) => {
    if (expandedMonth === month) {
      setExpandedMonth(null)
      return
    }

    setExpandedMonth(month)
    if (monthDetails[month]?.status === 'loading' || monthDetails[month]?.status === 'loaded') return

    setMonthDetails((current) => ({ ...current, [month]: { status: 'loading' } }))
    try {
      const budget = await getMonthlyBudget.execute(month)
      setMonthDetails((current) => ({ ...current, [month]: { status: 'loaded', budget } }))
    } catch (loadError: unknown) {
      setMonthDetails((current) => ({
        ...current,
        [month]: {
          status: 'error',
          message: loadError instanceof Error ? loadError.message : 'Erro ao carregar os detalhes do mês.',
        },
      }))
    }
  }

  if (error) return <p role="alert">{error}</p>
  if (!history) return <p>Carregando histórico...</p>

  const amounts = history.map((entry) => entry.totalSpent)
  const lowestAmount = Math.min(...amounts)
  const highestAmount = Math.max(...amounts)

  return (
    <section className="history">
      <header className="history__header">
        <h1>Histórico</h1>
        <p>Total gasto por mês</p>
      </header>

      {history.length === 0 ? (
        <p>Nenhum gasto registrado.</p>
      ) : (
        <ol className="history__timeline" aria-label="Gastos mensais em ordem cronológica">
          {history.map((entry) => {
            const intensity = highestAmount === lowestAmount
              ? 62
              : 25 + ((entry.totalSpent - lowestAmount) / (highestAmount - lowestAmount)) * 75
            const details = monthDetails[entry.month]
            const isExpanded = expandedMonth === entry.month

            return (
              <li className="history__entry" key={entry.month}>
                <span
                  className="history__dot"
                  aria-hidden="true"
                  style={{
                    backgroundColor: `color-mix(in srgb, var(--color-accent) ${intensity}%, var(--color-bg))`,
                  }}
                />
                <div className="history__entry-title">
                  <span className="history__month">{formatMonth(entry.month)}</span>
                  <button
                    className="history__details-button"
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={`history-details-${entry.month}`}
                    onClick={() => void toggleMonthDetails(entry.month)}
                  >
                    {isExpanded ? (
                      <>Ocultar detalhes <ChevronUp size={16} aria-hidden="true" /></>
                    ) : (
                      <>Ver detalhes <ChevronDown size={16} aria-hidden="true" /></>
                    )}
                  </button>
                </div>
                <strong className="history__total">{formatCurrency(entry.totalSpent)}</strong>
                <div
                  className="history__details"
                  id={`history-details-${entry.month}`}
                  hidden={!isExpanded}
                >
                  {isExpanded && (
                    <>
                      {details?.status === 'loading' && (
                        <p>Carregando os gastos de {formatMonth(entry.month)}...</p>
                      )}
                      {details?.status === 'error' && (
                        <p role="alert">{details.message}</p>
                      )}
                      {details?.status === 'loaded' && (
                        details.budget.expenses.length === 0 ? (
                          <p>Nenhum gasto registrado neste mês.</p>
                        ) : (
                          <div className="history__table-scroll">
                            <table className="history__table">
                              <thead>
                                <tr>
                                  <th scope="col">Data</th>
                                  <th scope="col">Gasto</th>
                                  <th scope="col">Categoria</th>
                                  <th scope="col">Valor</th>
                                </tr>
                              </thead>
                              <tbody>
                                {details.budget.expenses.map((expense) => (
                                  <tr key={expense.id}>
                                    <td>{formatDate(expense.date)}</td>
                                    <td>
                                      {expense.description}
                                      {expense.installmentTotal !== undefined && (
                                        <span className="history__installment">
                                          Parcela {expense.installmentNumber}/{expense.installmentTotal}
                                        </span>
                                      )}
                                    </td>
                                    <td>
                                      {details.budget.categories.find(
                                        (category) => category.id === expense.categoryId,
                                      )?.name ?? 'Sem categoria'}
                                    </td>
                                    <td>{formatCurrency(expense.amount)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      )}
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
