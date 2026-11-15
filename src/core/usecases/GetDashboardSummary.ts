import type { CategoryTotal, DashboardSummary } from '../models/MonthlyBudget'
import type { IFinanceRepository } from '../repositories/IFinanceRepository'

export class GetDashboardSummary {
  private readonly repository: IFinanceRepository

  constructor(repository: IFinanceRepository) {
    this.repository = repository
  }

  async execute(month: string): Promise<DashboardSummary> {
    const [budget, goals] = await Promise.all([
      this.repository.getMonthlyBudget(month),
      this.repository.getSavingsGoals(),
    ])
    const totalCommitted = budget.expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const goalsTotal = goals.reduce((sum, goal) => sum + goal.monthlyContribution, 0)
    const remaining = budget.income - totalCommitted - goalsTotal
    const hasIncome = budget.income > 0
    const committedRate = hasIncome ? Math.min((totalCommitted / budget.income) * 100, 100) : 0
    const goalsRate = hasIncome
      ? Math.min((goalsTotal / budget.income) * 100, Math.max(100 - committedRate, 0))
      : 0
    const savingsRateBeforeGoals = hasIncome
      ? Math.round(((budget.income - totalCommitted) / budget.income) * 100)
      : 0

    const categoryTotals: CategoryTotal[] = budget.categories
      .map((category) => {
        const expenses = budget.expenses.filter((expense) => expense.categoryId === category.id)
        const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)

        return {
          category,
          total,
          expenses,
          percentOfCommitted: totalCommitted > 0 ? (total / totalCommitted) * 100 : 0,
          subcategories: [],
        }
      })

    const byCategory = categoryTotals
      .filter(({ category }) => !category.parentId)
      .map((categoryTotal) => {
        const subcategories = categoryTotals.filter(
          ({ category }) => category.parentId === categoryTotal.category.id,
        )
        const total = categoryTotal.total
          + subcategories.reduce((sum, subcategory) => sum + subcategory.total, 0)

        return {
          ...categoryTotal,
          total,
          percentOfCommitted: totalCommitted > 0 ? (total / totalCommitted) * 100 : 0,
          subcategories: subcategories.filter((subcategory) => subcategory.total > 0),
        }
      })
      .filter((categoryTotal) => categoryTotal.total > 0)
      .sort((first, second) => second.total - first.total)

    return {
      income: budget.income,
      totalCommitted,
      goals,
      goalsTotal,
      goalsRate,
      committedRate,
      remaining,
      savingsRate: hasIncome
        ? savingsRateBeforeGoals + (goalsTotal / budget.income) * 100
        : 0,
      byCategory,
    }
  }
}