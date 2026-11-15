import type { MonthlySpendingHistoryEntry } from '../models/MonthlyBudget'
import type { IFinanceRepository } from '../repositories/IFinanceRepository'

export class GetSpendingHistory {
  private readonly repository: IFinanceRepository

  constructor(repository: IFinanceRepository) {
    this.repository = repository
  }

  async execute(): Promise<MonthlySpendingHistoryEntry[]> {
    const history = await this.repository.getSpendingHistory()
    return [...history].sort((first, second) => first.month.localeCompare(second.month))
  }
}
