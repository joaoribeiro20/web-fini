import type { SavingsGoal } from '../models/MonthlyBudget'
import type { IFinanceRepository } from '../repositories/IFinanceRepository'

export class GetSavingsGoals {
  private readonly repository: IFinanceRepository

  constructor(repository: IFinanceRepository) {
    this.repository = repository
  }

  execute(): Promise<SavingsGoal[]> {
    return this.repository.getSavingsGoals()
  }
}
