export interface Category {
  id: string
  name: string
  parentId?: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  categoryId: string
  date: string
  installmentNumber?: number
  installmentTotal?: number
}

export type NewExpense = Omit<Expense, 'id'>

export interface ExpenseDraft {
  description: string
  amount: number
  categoryId: string
  date: string
  installments: number
}

export interface SavingsGoal {
  id: string
  name: string
  monthlyContribution: number
}

export type NewSavingsGoal = Omit<SavingsGoal, 'id'>

export interface MonthlyBudget {
  month: string
  income: number
  categories: Category[]
  expenses: Expense[]
}

export interface MonthlySpendingHistoryEntry {
  month: string
  totalSpent: number
}

export interface CategoryTotal {
  category: Category
  total: number
  percentOfCommitted: number
  expenses: Expense[]
  subcategories: CategoryTotal[]
}

export interface DashboardSummary {
  income: number
  totalCommitted: number
  goals: SavingsGoal[]
  goalsTotal: number
  goalsRate: number
  committedRate: number
  remaining: number
  savingsRate: number
  byCategory: CategoryTotal[]
}