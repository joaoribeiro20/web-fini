import { Fragment, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { CategoryTotal, SavingsGoal } from '../../../../core/models/MonthlyBudget'
import { formatCurrency, formatPercent } from '../../../../shared/format'

interface Props {
  items: CategoryTotal[]
  committedRate: number
  goalsRate: number
  goals: SavingsGoal[]
  goalsTotal: number
}

export function CategoryBreakdown({ items, committedRate, goalsRate, goals, goalsTotal }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  const hasFixedCategory = items.some(({ category }) => category.id === 'fixed')
  const isGoalsOpen = openId === 'savings-goals'

  const renderGoalsRow = () => (
    <li className="category category--goal">
      <button
        className="category__row"
        type="button"
        aria-expanded={isGoalsOpen}
        onClick={() => setOpenId(isGoalsOpen ? null : 'savings-goals')}
      >
        <span className="category__dot" style={{ background: 'var(--color-positive)' }} />
        <span>Metas mensais</span>
        <span className="category__percent">{formatPercent(goalsRate)}</span>
        <span className="category__amount">{formatCurrency(goalsTotal)}</span>
        {isGoalsOpen ? <ChevronUp size={22} aria-hidden="true" /> : <ChevronDown size={22} aria-hidden="true" />}
      </button>
      {isGoalsOpen && (
        <ul className="category__items">
          {goals.length > 0 ? goals.map((goal) => (
            <li key={goal.id}>
              <span>{goal.name}</span>
              <span>{formatCurrency(goal.monthlyContribution)}</span>
            </li>
          )) : (
            <li>Nenhuma meta cadastrada.</li>
          )}
        </ul>
      )}
    </li>
  )

  return (
    <section className="breakdown">
      <h2>Detalhamento dos Gastos</h2>

      <div
        className="distribution"
        role="img"
        aria-label={`${formatPercent(committedRate)} da renda comprometida e ${formatPercent(goalsRate)} destinada a metas`}
      >
        {items.map(({ category, percentOfCommitted }, index) => (
          <div
            key={category.id}
            className="distribution__segment"
            style={{
              width: `${(percentOfCommitted * committedRate) / 100}%`,
              background: `var(--cat-${(index % 2) + 1})`,
            }}
          />
        ))}
        <div className="distribution__goals" style={{ width: `${goalsRate}%` }} />
        <div className="distribution__free" />
      </div>

      <ul className="distribution-legend" aria-label="Legenda da barra de distribuição">
        {items.map(({ category }, index) => (
          <li key={category.id}>
            <span
              className="distribution-legend__swatch"
              style={{ background: `var(--cat-${(index % 2) + 1})` }}
            />
            {category.name}
          </li>
        ))}
        <li>
          <span className="distribution-legend__swatch distribution-legend__swatch--goals" />
          Metas mensais
        </li>
        <li>
          <span className="distribution-legend__swatch distribution-legend__swatch--free" />
          Sobra livre
        </li>
      </ul>

      {items.length === 0 && <p className="empty-state">Nenhuma despesa registrada neste mês.</p>}

      <ul className="categories">
        {items.map(({ category, total, percentOfCommitted, expenses, subcategories }, index) => {
          const isOpen = openId === category.id
          return (
            <Fragment key={category.id}>
              <li className="category">
                <button
                  className="category__row"
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenId(isOpen ? null : category.id)}
                >
                  <span
                    className="category__dot"
                    style={{ background: `var(--cat-${(index % 2) + 1})` }}
                  />
                  <span>{category.name}</span>
                  <span className="category__percent">{formatPercent(percentOfCommitted)}</span>
                  <span className="category__amount">{formatCurrency(total)}</span>
                  {isOpen ? <ChevronUp size={22} aria-hidden="true" /> : <ChevronDown size={22} aria-hidden="true" />}
                </button>

                {isOpen && (
                  <ul className="category__items">
                    {subcategories.length > 0 ? (
                      <>
                        {subcategories.map((subcategory) => (
                          <li className="category__subcategory" key={subcategory.category.id}>
                            <div className="category__subcategory-summary">
                              <span>{subcategory.category.name}</span>
                              <strong>{formatCurrency(subcategory.total)}</strong>
                            </div>
                            <ul className="category__subcategory-items">
                              {subcategory.expenses.map((expense) => (
                                <li key={expense.id}>
                                  <span>{expense.description}</span>
                                  <span>{formatCurrency(expense.amount)}</span>
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                        {expenses.length > 0 && (
                          <li className="category__subcategory">
                            <div className="category__subcategory-summary">
                              <span>Sem subcategoria</span>
                              <strong>{formatCurrency(expenses.reduce((sum, expense) => sum + expense.amount, 0))}</strong>
                            </div>
                            <ul className="category__subcategory-items">
                              {expenses.map((expense) => (
                                <li key={expense.id}>
                                  <span>{expense.description}</span>
                                  <span>{formatCurrency(expense.amount)}</span>
                                </li>
                              ))}
                            </ul>
                          </li>
                        )}
                      </>
                    ) : expenses.map((expense) => (
                      <li key={expense.id}>
                        <span>{expense.description}</span>
                        <span>{formatCurrency(expense.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
              {category.id === 'fixed' && renderGoalsRow()}
            </Fragment>
          )
        })}
        {!hasFixedCategory && renderGoalsRow()}
      </ul>
    </section>
  )
}