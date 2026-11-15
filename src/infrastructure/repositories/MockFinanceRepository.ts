import type {
  MonthlyBudget,
  MonthlySpendingHistoryEntry,
  NewExpense,
  NewSavingsGoal,
  SavingsGoal,
} from '../../core/models/MonthlyBudget'
import type { IFinanceRepository } from '../../core/repositories/IFinanceRepository'

export class MockFinanceRepository implements IFinanceRepository {
  private goals: SavingsGoal[] = [
    { id: 'goal-1', name: 'Reserva', monthlyContribution: 500 },
    { id: 'goal-2', name: 'Viagem', monthlyContribution: 200 },
  ]

  private budget: MonthlyBudget = {
    month: '2026-11',
    income: 4500,
    categories: [
      { id: 'fixed', name: 'Gastos Fixos' },
      { id: 'monthly', name: 'Gastos Mensais' },
      { id: 'ecommerce', name: 'E-commerce', parentId: 'monthly' },
      { id: 'market', name: 'Mercado', parentId: 'monthly' },
      { id: 'other', name: 'Outros', parentId: 'monthly' },
    ],
    expenses: [
      { id: '1', description: 'Aluguel', amount: 700, categoryId: 'fixed', date: '2026-11-01' },
      { id: '2', description: 'Internet', amount: 120, categoryId: 'fixed', date: '2026-11-03' },
      { id: '3', description: 'Energia', amount: 120, categoryId: 'fixed', date: '2026-11-07' },
      { id: '4', description: 'Mercado', amount: 620, categoryId: 'market', date: '2026-11-11' },
      { id: '5', description: 'Combustível', amount: 311, categoryId: 'other', date: '2026-11-13' },
      { id: '6', description: 'Streaming e saídas', amount: 200, categoryId: 'other', date: '2026-11-14' },
      { id: '7', description: 'Contas e moradia', amount: 820, categoryId: 'fixed', date: '2026-06-05' },
      { id: '8', description: 'Compras e lazer', amount: 1020, categoryId: 'other', date: '2026-06-18' },
      { id: '9', description: 'Contas e moradia', amount: 950, categoryId: 'fixed', date: '2026-07-05' },
      { id: '10', description: 'Compras e lazer', amount: 1340, categoryId: 'other', date: '2026-07-18' },
      { id: '11', description: 'Contas e moradia', amount: 700, categoryId: 'fixed', date: '2026-08-05' },
      { id: '12', description: 'Compras e lazer', amount: 870, categoryId: 'other', date: '2026-08-18' },
      { id: '13', description: 'Contas e moradia', amount: 1300, categoryId: 'fixed', date: '2026-09-05' },
      { id: '14', description: 'Compras e lazer', amount: 1440, categoryId: 'other', date: '2026-09-18' },
      { id: '15', description: 'Contas e moradia', amount: 900, categoryId: 'fixed', date: '2026-10-05' },
      { id: '16', description: 'Compras e lazer', amount: 1030, categoryId: 'other', date: '2026-10-18' },
    ],
  }

  private nextExpenseId = 17
  private nextGoalId = 3

  async getSavingsGoals(): Promise<SavingsGoal[]> {
    return structuredClone(this.goals)
  }

  async addSavingsGoal(goal: NewSavingsGoal): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 250))
    this.goals = [
      ...this.goals,
      { ...goal, id: `goal-${this.nextGoalId++}` },
    ]
  }

  async removeSavingsGoal(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 250))
    if (!this.goals.some((goal) => goal.id === id)) {
      throw new Error('A meta não foi encontrada.')
    }
    this.goals = this.goals.filter((goal) => goal.id !== id)
  }

  async getMonthlyBudget(month: string): Promise<MonthlyBudget> {
    return structuredClone({
      ...this.budget,
      month,
      expenses: this.budget.expenses.filter((expense) => expense.date.slice(0, 7) === month),
    })
  }

  async getSpendingHistory(): Promise<MonthlySpendingHistoryEntry[]> {
    const monthlyTotals = new Map<string, number>()

    for (const expense of this.budget.expenses) {
      const month = expense.date.slice(0, 7)
      monthlyTotals.set(month, (monthlyTotals.get(month) ?? 0) + expense.amount)
    }
    if (!monthlyTotals.has(this.budget.month)) monthlyTotals.set(this.budget.month, 0)

    return structuredClone(
      Array.from(monthlyTotals, ([month, totalSpent]) => ({ month, totalSpent })),
    )
  }

  async addExpenses(_month: string, expenses: NewExpense[]): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 250))
    this.budget = {
      ...this.budget,
      expenses: [
        ...this.budget.expenses,
        ...expenses.map((expense) => ({
          ...expense,
          id: String(this.nextExpenseId++),
        })),
      ],
    }
  }
}