import type { ExpenseDraft, NewExpense } from '../models/MonthlyBudget'
import type { IFinanceRepository } from '../repositories/IFinanceRepository'

const MAX_INSTALLMENTS = 120

function addMonths(date: string, monthOffset: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const targetMonth = new Date(Date.UTC(year, month - 1 + monthOffset, 1))
  const lastDay = new Date(
    Date.UTC(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth() + 1, 0),
  ).getUTCDate()

  targetMonth.setUTCDate(Math.min(day, lastDay))
  return targetMonth.toISOString().slice(0, 10)
}

export class AddExpenses {
  private readonly repository: IFinanceRepository

  constructor(repository: IFinanceRepository) {
    this.repository = repository
  }

  async execute(month: string, expenses: ExpenseDraft[]): Promise<void> {
    if (expenses.length === 0) {
      throw new Error('Adicione ao menos um gasto.')
    }

    for (const expense of expenses) {
      const date = new Date(`${expense.date}T00:00:00.000Z`)
      const validDate = /^\d{4}-\d{2}-\d{2}$/.test(expense.date)
        && !Number.isNaN(date.getTime())
        && date.toISOString().slice(0, 10) === expense.date

      if (!expense.description.trim()) {
        throw new Error('Informe a descrição do gasto.')
      }
      if (!Number.isFinite(expense.amount) || expense.amount <= 0) {
        throw new Error('O valor do gasto deve ser maior que zero.')
      }
      if (!expense.categoryId) {
        throw new Error('Selecione uma categoria para o gasto.')
      }
      if (!validDate) {
        throw new Error('Informe uma data válida para o gasto.')
      }
      if (expense.date.slice(0, 7) !== month) {
        throw new Error('A data do gasto deve estar no mês selecionado.')
      }
      if (
        !Number.isInteger(expense.installments)
        || expense.installments < 1
        || expense.installments > MAX_INSTALLMENTS
      ) {
        throw new Error(`O parcelamento deve ter entre 1 e ${MAX_INSTALLMENTS} parcelas.`)
      }
    }

    const newExpenses: NewExpense[] = expenses.flatMap((expense) =>
      Array.from({ length: expense.installments }, (_, index) => ({
        date: addMonths(expense.date, index),
        description: expense.description.trim(),
        amount: expense.amount,
        categoryId: expense.categoryId,
        ...(expense.installments > 1
          ? {
              installmentNumber: index + 1,
              installmentTotal: expense.installments,
            }
          : {}),
      })),
    )

    await this.repository.addExpenses(
      month,
      newExpenses,
    )
  }
}
