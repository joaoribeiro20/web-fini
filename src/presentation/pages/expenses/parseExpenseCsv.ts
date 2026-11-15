import type { Category, ExpenseDraft } from '../../../core/models/MonthlyBudget'

export interface ExpenseCsvPreviewRow {
  rowNumber: number
  values: {
    date: string
    description: string
    amount: string
    category: string
  }
  expense?: ExpenseDraft
  error?: string
}

function countDelimiter(line: string, delimiter: string): number {
  let count = 0
  let insideQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (character === '"') {
      if (insideQuotes && line[index + 1] === '"') {
        index += 1
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (character === delimiter && !insideQuotes) {
      count += 1
    }
  }

  return count
}

function parseRecords(content: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let insideQuotes = false
  const source = content.replace(/^\uFEFF/, '')

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]

    if (character === '"') {
      if (insideQuotes && source[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (character === delimiter && !insideQuotes) {
      row.push(field)
      field = ''
    } else if ((character === '\n' || character === '\r') && !insideQuotes) {
      row.push(field)
      if (row.some((cell) => cell.trim())) rows.push(row)
      row = []
      field = ''
      if (character === '\r' && source[index + 1] === '\n') index += 1
    } else {
      field += character
    }
  }

  if (insideQuotes) throw new Error('O CSV contém aspas sem fechamento.')

  row.push(field)
  if (row.some((cell) => cell.trim())) rows.push(row)
  return rows
}

function normalizeText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function parseDate(value: string): string | null {
  const trimmed = value.trim()
  let isoDate = trimmed

  const brazilianDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed)
  if (brazilianDate) {
    isoDate = `${brazilianDate[3]}-${brazilianDate[2].padStart(2, '0')}-${brazilianDate[1].padStart(2, '0')}`
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null
  const parsedDate = new Date(`${isoDate}T00:00:00.000Z`)
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === isoDate
    ? isoDate
    : null
}

function parseAmount(value: string): number | null {
  const normalized = value.trim().replace(/R\$/gi, '').replace(/\s/g, '')
  const decimalValue = normalized.includes(',')
    ? normalized.replace(/\./g, '').replace(',', '.')
    : normalized
  const amount = Number(decimalValue)

  return Number.isFinite(amount) && amount > 0 ? amount : null
}

export function parseExpenseCsv(
  content: string,
  categories: Category[],
  selectedMonth: string,
): ExpenseCsvPreviewRow[] {
  if (!content.trim()) throw new Error('O arquivo CSV está vazio.')

  const firstLine = content.replace(/^\uFEFF/, '').split(/\r?\n/).find((line) => line.trim()) ?? ''
  const delimiter = countDelimiter(firstLine, ';') >= countDelimiter(firstLine, ',') ? ';' : ','
  const records = parseRecords(content, delimiter)
  if (records.length < 2) throw new Error('O CSV não contém lançamentos para importar.')

  const headers = records[0].map(normalizeText)
  const indexOf = (...names: string[]) => headers.findIndex((header) => names.includes(header))
  const dateIndex = indexOf('data', 'date')
  const descriptionIndex = indexOf('descricao', 'description')
  const amountIndex = indexOf('valor', 'amount')
  const categoryIndex = indexOf('categoria', 'category')

  if ([dateIndex, descriptionIndex, amountIndex, categoryIndex].some((index) => index < 0)) {
    throw new Error('A primeira linha deve conter as colunas data, descricao, valor e categoria.')
  }

  return records.slice(1).map((cells, index) => {
    const values = {
      date: cells[dateIndex]?.trim() ?? '',
      description: cells[descriptionIndex]?.trim() ?? '',
      amount: cells[amountIndex]?.trim() ?? '',
      category: cells[categoryIndex]?.trim() ?? '',
    }

    const date = parseDate(values.date)
    if (!date) return { rowNumber: index + 2, values, error: 'Data inválida.' }
    if (date.slice(0, 7) !== selectedMonth) {
      return { rowNumber: index + 2, values, error: 'A data não pertence ao mês selecionado.' }
    }
    if (!values.description) {
      return { rowNumber: index + 2, values, error: 'Descrição não informada.' }
    }

    const amount = parseAmount(values.amount)
    if (amount === null) {
      return { rowNumber: index + 2, values, error: 'Valor inválido ou menor que zero.' }
    }

    const category = categories.find(
      (candidate) => normalizeText(candidate.name) === normalizeText(values.category),
    )
    if (!category) {
      return { rowNumber: index + 2, values, error: 'Categoria não encontrada.' }
    }

    return {
      rowNumber: index + 2,
      values,
      expense: {
        date,
        description: values.description,
        amount,
        categoryId: category.id,
        installments: 1,
      },
    }
  })
}
