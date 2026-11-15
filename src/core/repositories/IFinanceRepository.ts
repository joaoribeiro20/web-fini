import type {
  MonthlyBudget,
  MonthlySpendingHistoryEntry,
  NewExpense,
  NewSavingsGoal,
  SavingsGoal,
} from '../models/MonthlyBudget'

export interface IFinanceRepository {
  getMonthlyBudget(month: string): Promise<MonthlyBudget>
  getSpendingHistory(): Promise<MonthlySpendingHistoryEntry[]>
  getSavingsGoals(): Promise<SavingsGoal[]>
  addExpenses(month: string, expenses: NewExpense[]): Promise<void>
  addSavingsGoal(goal: NewSavingsGoal): Promise<void>
  removeSavingsGoal(id: string): Promise<void>
}