import type { NewSavingsGoal } from '../models/MonthlyBudget'
import type { IFinanceRepository } from '../repositories/IFinanceRepository'

export class AddSavingsGoal {
  private readonly repository: IFinanceRepository

  constructor(repository: IFinanceRepository) {
    this.repository = repository
  }

  async execute(goal: NewSavingsGoal): Promise<void> {
    const name = goal.name.trim()
    if (!name) throw new Error('Informe o nome da meta.')
    if (!Number.isFinite(goal.monthlyContribution) || goal.monthlyContribution <= 0) {
      throw new Error('O aporte mensal deve ser maior que zero.')
    }

    await this.repository.addSavingsGoal({ name, monthlyContribution: goal.monthlyContribution })
  }
}
