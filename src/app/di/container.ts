import type { IFinanceRepository } from '../../core/repositories/IFinanceRepository'
import { AddExpenses } from '../../core/usecases/AddExpenses'
import { AddSavingsGoal } from '../../core/usecases/AddSavingsGoal'
import { GetDashboardSummary } from '../../core/usecases/GetDashboardSummary'
import { GetMonthlyBudget } from '../../core/usecases/GetMonthlyBudget'
import { GetSavingsGoals } from '../../core/usecases/GetSavingsGoals'
import { GetSpendingHistory } from '../../core/usecases/GetSpendingHistory'
import { RemoveSavingsGoal } from '../../core/usecases/RemoveSavingsGoal'
import { MockFinanceRepository } from '../../infrastructure/repositories/MockFinanceRepository'

export interface Container {
  addExpenses: AddExpenses
  addSavingsGoal: AddSavingsGoal
  getDashboardSummary: GetDashboardSummary
  getMonthlyBudget: GetMonthlyBudget
  getSavingsGoals: GetSavingsGoals
  getSpendingHistory: GetSpendingHistory
  removeSavingsGoal: RemoveSavingsGoal
}

export function createContainer(overrides?: {
  financeRepository?: IFinanceRepository
}): Container {
  const financeRepository = overrides?.financeRepository ?? new MockFinanceRepository()

  return {
    addExpenses: new AddExpenses(financeRepository),
    addSavingsGoal: new AddSavingsGoal(financeRepository),
    getDashboardSummary: new GetDashboardSummary(financeRepository),
    getMonthlyBudget: new GetMonthlyBudget(financeRepository),
    getSavingsGoals: new GetSavingsGoals(financeRepository),
    getSpendingHistory: new GetSpendingHistory(financeRepository),
    removeSavingsGoal: new RemoveSavingsGoal(financeRepository),
  }
}