import { formatCurrency, formatPercent } from '../../../../shared/format'

interface Props {
  totalCommitted: number
  remaining: number
  savingsRate: number
}

export function SummaryStats({ totalCommitted, remaining, savingsRate }: Props) {
  return (
    <section className="stats" aria-label="Resumo do mês">
      <div className="stat">
        <span className="stat__label">Total de Gastos Comprometidos</span>
        <strong className="stat__value">{formatCurrency(totalCommitted)}</strong>
      </div>
      <div className="stat stat--highlight stat--positive">
        <span className="stat__label">Sobra mensal para Gastos Livres</span>
        <strong className="stat__value">{formatCurrency(remaining)}</strong>
      </div>
      <div className="stat stat--positive">
        <span className="stat__label">Taxa de Poupança</span>
        <strong className="stat__value">{formatPercent(savingsRate, 1)}</strong>
      </div>
    </section>
  )
}