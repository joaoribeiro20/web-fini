import type { MonthlyBudget } from '../models/MonthlyBudget'
import type { IFinanceRepository } from '../repositories/IFinanceRepository'

export class GetMonthlyBudget {
  private readonly repository: IFinanceRepository

  constructor(repository: IFinanceRepository) {
    this.repository = repository
  }

  execute(month: string): Promise<MonthlyBudget> {
    return this.repository.getMonthlyBudget(month)
  }
}
