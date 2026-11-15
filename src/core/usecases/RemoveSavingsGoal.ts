import type { IFinanceRepository } from '../repositories/IFinanceRepository'

export class RemoveSavingsGoal {
  private readonly repository: IFinanceRepository

  constructor(repository: IFinanceRepository) {
    this.repository = repository
  }

  async execute(id: string): Promise<void> {
    if (!id.trim()) throw new Error('A meta informada é inválida.')
    await this.repository.removeSavingsGoal(id)
  }
}
