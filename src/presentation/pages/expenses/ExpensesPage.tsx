import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { ArrowDownWideNarrow, ChevronDown, CreditCard, Filter, Plus, Search, Store, Upload, X } from 'lucide-react'
import { useDependencies } from '../../../app/di/DependencyProvider'
import type { ExpenseDraft, MonthlyBudget } from '../../../core/models/MonthlyBudget'
import { formatCurrency } from '../../../shared/format'
import { parseExpenseCsv, type ExpenseCsvPreviewRow } from './parseExpenseCsv'
import './ExpensesPage.css'

interface ExpenseForm {
  description: string
  amount: string
  categoryId: string
  date: string
  installments: string
}

type ExpenseSortOrder = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'

const CATALOGED_STORES = ['Shopee', 'Amazon', 'Mercado Livre', 'Carrefour', 'Assaí', 'iFood']

function currentDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function dateForMonth(month: string): string {
  return month === new Date().toISOString().slice(0, 7) ? currentDate() : `${month}-01`
}

function lastDateOfMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10)
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00.000Z`))
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const CATEGORY_EXAMPLES: Record<string, string> = {
  ecommerce: 'Exemplos: Shopee, Amazon e Mercado Livre.',
  market: 'Exemplos: Carrefour, Assaí e iFood.',
}

export function ExpensesPage() {
  const { addExpenses, getMonthlyBudget } = useDependencies()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const installmentsDialogRef = useRef<HTMLDialogElement>(null)
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [budget, setBudget] = useState<MonthlyBudget | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showInstallmentsModal, setShowInstallmentsModal] = useState(false)
  const [isInstallment, setIsInstallment] = useState(false)
  const [nameFilter, setNameFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [storeFilters, setStoreFilters] = useState<string[]>([])
  const [sortOrder, setSortOrder] = useState<ExpenseSortOrder>('date-desc')
  const [preview, setPreview] = useState<ExpenseCsvPreviewRow[] | null>(null)
  const [fileName, setFileName] = useState('')
  const [form, setForm] = useState<ExpenseForm>({
    description: '',
    amount: '',
    categoryId: '',
    date: currentDate(),
    installments: '2',
  })

  useEffect(() => {
    let active = true

    getMonthlyBudget.execute(selectedMonth)
      .then((monthlyBudget) => {
        if (active) setBudget(monthlyBudget)
      })
      .catch((loadError: unknown) => {
        if (active) setError(getErrorMessage(loadError, 'Erro ao carregar os gastos.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [getMonthlyBudget, selectedMonth])

  useEffect(() => {
    const dialog = installmentsDialogRef.current
    if (!dialog) return

    if (showInstallmentsModal && !dialog.open) dialog.showModal()
    if (!showInstallmentsModal && dialog.open) dialog.close()
  }, [showInstallmentsModal])

  const refreshBudget = async () => {
    const updatedBudget = await getMonthlyBudget.execute(selectedMonth)
    setBudget(updatedBudget)
  }

  const handleMonthChange = (month: string) => {
    if (!month || month === selectedMonth) return
    setSelectedMonth(month)
    setBudget(null)
    setError(null)
    setNotice(null)
    setPreview(null)
    setFileName('')
    setLoading(true)
    setForm((current) => ({ ...current, date: dateForMonth(month) }))
  }

  const handleAddExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!budget) return

    const newExpense: ExpenseDraft = {
      date: form.date,
      description: form.description,
      amount: Number(form.amount.replace(',', '.')),
      categoryId: form.categoryId || budget.categories[0]?.id || '',
      installments: isInstallment ? Number(form.installments) : 1,
    }

    setSaving(true)
    setError(null)
    setNotice(null)

    try {
      await addExpenses.execute(selectedMonth, [newExpense])
      await refreshBudget()
      setForm({
        description: '',
        amount: '',
        categoryId: budget.categories[0]?.id ?? '',
        date: dateForMonth(selectedMonth),
        installments: '2',
      })
      setIsInstallment(false)
      setShowForm(false)
      setNotice(isInstallment ? `${newExpense.installments} parcelas cadastradas.` : 'Gasto cadastrado.')
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, 'Erro ao cadastrar o gasto.'))
    } finally {
      setSaving(false)
    }
  }

  const handleCsvChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file || !budget) return

    setError(null)
    setNotice(null)
    setPreview(null)
    setFileName(file.name)

    try {
      const contents = await file.text()
      setPreview(parseExpenseCsv(contents, budget.categories, selectedMonth))
    } catch (parseError: unknown) {
      setFileName('')
      setError(getErrorMessage(parseError, 'Não foi possível ler o arquivo CSV.'))
    } finally {
      input.value = ''
    }
  }

  const validPreviewRows = preview?.filter((row) => row.expense) ?? []
  const hasInvalidPreviewRows = preview?.some((row) => row.error) ?? false

  const handleConfirmImport = async () => {
    if (!preview || validPreviewRows.length === 0 || hasInvalidPreviewRows) return

    const expenses = validPreviewRows.flatMap((row) => row.expense ? [row.expense] : [])
    setSaving(true)
    setError(null)
    setNotice(null)

    try {
      await addExpenses.execute(selectedMonth, expenses)
      await refreshBudget()
      setPreview(null)
      setFileName('')
      setNotice(`${expenses.length} ${expenses.length === 1 ? 'gasto cadastrado' : 'gastos cadastrados'}.`)
    } catch (importError: unknown) {
      setError(getErrorMessage(importError, 'Erro ao importar os gastos.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Carregando gastos...</p>
  if (error && !budget) return <p role="alert">{error}</p>
  if (!budget) return null

  const categoryName = (categoryId: string) =>
    budget.categories.find((category) => category.id === categoryId)?.name ?? 'Sem categoria'
  const categoryGroups = budget.categories
    .filter((category) => !category.parentId)
    .map((category) => ({
      category,
      children: budget.categories.filter((candidate) => candidate.parentId === category.id),
    }))
  const renderCategoryOptions = (includeParents: boolean) => categoryGroups.map(({ category, children }) => (
    children.length > 0 ? (
      <optgroup key={category.id} label={category.name}>
        {includeParents && <option value={category.id}>{category.name} — todas</option>}
        {children.map((child) => (
          <option key={child.id} value={child.id}>{child.name}</option>
        ))}
      </optgroup>
    ) : (
      <option key={category.id} value={category.id}>{category.name}</option>
    )
  ))
  const categoryFilterIds = categoryFilter
    ? [
        categoryFilter,
        ...budget.categories
          .filter((category) => category.parentId === categoryFilter)
          .map((category) => category.id),
      ]
    : []
  const normalizedNameFilter = normalizeSearchText(nameFilter)
  const installmentExpenses = budget.expenses
    .filter((expense) => expense.installmentTotal !== undefined)
    .sort((first, second) => first.date.localeCompare(second.date))
  const expenses = budget.expenses
    .filter((expense) => !normalizedNameFilter
      || normalizeSearchText(expense.description).includes(normalizedNameFilter))
    .filter((expense) => categoryFilterIds.length === 0 || categoryFilterIds.includes(expense.categoryId))
    .filter((expense) => storeFilters.length === 0 || storeFilters.some((store) =>
      normalizeSearchText(expense.description).includes(normalizeSearchText(store))))
    .sort((first, second) => {
      if (sortOrder === 'date-asc') return first.date.localeCompare(second.date)
      if (sortOrder === 'amount-desc') {
        return second.amount - first.amount || second.date.localeCompare(first.date)
      }
      if (sortOrder === 'amount-asc') {
        return first.amount - second.amount || second.date.localeCompare(first.date)
      }
      return second.date.localeCompare(first.date)
    })
  const totalSpent = expenses.reduce((total, expense) => total + expense.amount, 0)

  return (
    <section className="expenses">
      <header className="expenses__header">
        <div>
          <h1>Gastos</h1>
          <p>Cadastre seus gastos ou importe um extrato bancário.</p>
        </div>
        <div className="expenses__month-control">
          <label htmlFor="expenses-month">Mês</label>
          <input
            id="expenses-month"
            type="month"
            value={selectedMonth}
            onChange={(event) => handleMonthChange(event.target.value)}
          />
        </div>
      </header>

      <div className="expenses__actions">
        <button
          type="button"
          className="expenses__button expenses__button--primary"
          onClick={() => {
            setShowForm((open) => !open)
            setError(null)
            setNotice(null)
          }}
        >
          <Plus size={18} aria-hidden="true" />
          Novo gasto
        </button>
        <button
          type="button"
          className="expenses__button"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={18} aria-hidden="true" />
          Importar extrato CSV
        </button>
        <button
          type="button"
          className="expenses__button"
          aria-haspopup="dialog"
          onClick={() => setShowInstallmentsModal(true)}
        >
          <CreditCard size={18} aria-hidden="true" />
          Ver gastos parcelados
        </button>
        <input
          ref={fileInputRef}
          className="expenses__file-input"
          type="file"
          accept=".csv,text/csv"
          aria-label="Selecionar extrato bancário CSV"
          onChange={handleCsvChange}
        />
      </div>

      {error && <p className="expenses__message expenses__message--error" role="alert">{error}</p>}
      {notice && <p className="expenses__message" role="status">{notice}</p>}

      <dialog
        ref={installmentsDialogRef}
        className="expenses__installments-modal"
        aria-labelledby="installments-modal-title"
        onCancel={() => setShowInstallmentsModal(false)}
        onClose={() => setShowInstallmentsModal(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setShowInstallmentsModal(false)
        }}
      >
        <div className="expenses__modal-header">
          <div>
            <h2 id="installments-modal-title">Gastos parcelados</h2>
            <p>{selectedMonth} · {installmentExpenses.length} {installmentExpenses.length === 1 ? 'parcela neste mês' : 'parcelas neste mês'}</p>
          </div>
          <button
            type="button"
            className="expenses__icon-button"
            aria-label="Fechar gastos parcelados"
            onClick={() => setShowInstallmentsModal(false)}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {installmentExpenses.length === 0 ? (
          <p className="expenses__empty">Nenhuma parcela cadastrada neste mês.</p>
        ) : (
          <div className="expenses__table-scroll">
            <table className="expenses__table">
              <thead>
                <tr>
                  <th scope="col">Loja / gasto</th>
                  <th scope="col">Valor</th>
                  <th scope="col">Parcela</th>
                  <th scope="col">Restantes</th>
                </tr>
              </thead>
              <tbody>
                {installmentExpenses.map((expense) => {
                  const store = CATALOGED_STORES.find((catalogedStore) =>
                    normalizeSearchText(expense.description).includes(normalizeSearchText(catalogedStore)))
                  const installmentNumber = expense.installmentNumber
                  const installmentTotal = expense.installmentTotal ?? 0
                  const remainingInstallments = installmentNumber === undefined
                    ? null
                    : Math.max(installmentTotal - installmentNumber, 0)

                  return (
                    <tr key={expense.id}>
                      <td>
                        <strong>{store ?? expense.description}</strong>
                        {store && store !== expense.description && (
                          <span className="expenses__installment">{expense.description}</span>
                        )}
                      </td>
                      <td>{formatCurrency(expense.amount, 2)}</td>
                      <td>{installmentNumber === undefined ? '—' : `${installmentNumber}/${installmentTotal}`}</td>
                      <td>
                        {remainingInstallments === null
                          ? 'Não informado'
                          : remainingInstallments === 0
                            ? 'Última parcela'
                            : `${remainingInstallments} ${remainingInstallments === 1 ? 'parcela' : 'parcelas'} após esta`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </dialog>

      {showForm && (
        <form className="expenses__panel expenses__form" onSubmit={handleAddExpense}>
          <div className="expenses__panel-header">
            <h2>Novo gasto</h2>
            <button
              type="button"
              className="expenses__icon-button"
              aria-label="Fechar formulário"
              onClick={() => setShowForm(false)}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <label>
            Descrição
            <input
              required
              maxLength={100}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Ex.: compra na Shopee ou no Carrefour"
            />
            <small>Inclua o nome da loja na descrição para usar o filtro de lojas catalogadas.</small>
          </label>
          <div className="expenses__form-row">
            <label>
              {isInstallment ? 'Valor por parcela' : 'Valor'}
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
                placeholder="0,00"
              />
            </label>
            <label>
              Data
              <input
                required
                type="date"
                min={`${selectedMonth}-01`}
                max={lastDateOfMonth(selectedMonth)}
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
              />
            </label>
          </div>
          <label className="expenses__checkbox">
            <input
              type="checkbox"
              checked={isInstallment}
              onChange={(event) => setIsInstallment(event.target.checked)}
            />
            <span>Este gasto é parcelado</span>
          </label>
          {isInstallment && (
            <label>
              Número de parcelas
              <input
                required
                type="number"
                min="2"
                max="120"
                step="1"
                value={form.installments}
                onChange={(event) => setForm({ ...form, installments: event.target.value })}
              />
              <small>
                O valor informado é o de cada parcela. Serão criadas parcelas mensais a partir da data escolhida (máximo de 120).
              </small>
            </label>
          )}
          <label>
            Categoria
            <select
              required
              value={form.categoryId || budget.categories[0]?.id || ''}
              onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
            >
              {renderCategoryOptions(false)}
            </select>
            {CATEGORY_EXAMPLES[form.categoryId || budget.categories[0]?.id || ''] && (
              <small>{CATEGORY_EXAMPLES[form.categoryId || budget.categories[0]?.id || '']}</small>
            )}
          </label>
          <div className="expenses__form-actions">
            <button
              type="button"
              className="expenses__button"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="expenses__button expenses__button--primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Cadastrar gasto'}
            </button>
          </div>
        </form>
      )}

      {preview && (
        <section className="expenses__panel expenses__preview" aria-labelledby="expenses-preview-title">
          <div className="expenses__panel-header">
            <div>
              <h2 id="expenses-preview-title">Prévia da importação</h2>
              <p>{fileName} · {validPreviewRows.length} de {preview.length} lançamentos válidos</p>
            </div>
            <button
              type="button"
              className="expenses__icon-button"
              aria-label="Cancelar importação"
              onClick={() => {
                setPreview(null)
                setFileName('')
              }}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <p className="expenses__help">
            Use as colunas data, descricao, valor e categoria. Exemplo: {formatDate(dateForMonth(selectedMonth))};Mercado;123,45;Outros.
            Aceita datas DD/MM/AAAA ou AAAA-MM-DD; use E-commerce, Mercado ou Outros para classificar Gastos Mensais.
            Para filtrar por loja, inclua o nome cadastrado da loja na descrição.
          </p>
          <div className="expenses__table-scroll">
            <table className="expenses__table expenses__table--preview">
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Descrição</th>
                  <th scope="col">Categoria</th>
                  <th scope="col">Valor</th>
                  <th scope="col">Validação</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => (
                  <tr key={row.rowNumber} className={row.error ? 'is-invalid' : ''}>
                    <td>{row.expense ? formatDate(row.expense.date) : row.values.date || '—'}</td>
                    <td>{row.values.description || '—'}</td>
                    <td>{row.values.category || '—'}</td>
                    <td>{row.expense ? formatCurrency(row.expense.amount, 2) : row.values.amount || '—'}</td>
                    <td>{row.error ?? 'Pronto para cadastrar'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="expenses__form-actions">
            <button
              type="button"
              className="expenses__button"
              onClick={() => {
                setPreview(null)
                setFileName('')
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="expenses__button expenses__button--primary"
              disabled={saving || validPreviewRows.length === 0 || hasInvalidPreviewRows}
              onClick={handleConfirmImport}
            >
              {saving
                ? 'Cadastrando...'
                : `Cadastrar ${validPreviewRows.length} ${validPreviewRows.length === 1 ? 'gasto' : 'gastos'}`}
            </button>
          </div>
        </section>
      )}

      <section className="expenses__list" aria-labelledby="expenses-list-title">
        <div className="expenses__list-header">
          <h2 id="expenses-list-title">Lançamentos</h2>
          <div className="expenses__list-summary">
            <span>{expenses.length} {expenses.length === 1 ? 'gasto' : 'gastos'}</span>
            <strong>{formatCurrency(totalSpent, 2)}</strong>
          </div>
        </div>
        <div className="expenses__filters" role="group" aria-label="Filtros e ordenação dos gastos">
          <div className="expenses__search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              aria-label="Buscar por nome"
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              placeholder="Buscar por nome..."
            />
          </div>
          <div className="expenses__filter-select">
            <Filter size={17} aria-hidden="true" />
            <select
              aria-label="Filtrar por categoria"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">Todas as categorias</option>
              {renderCategoryOptions(true)}
            </select>
          </div>
          <details className="expenses__store-filter">
            <summary>
              <Store size={17} aria-hidden="true" />
              <span>{storeFilters.length ? `Lojas (${storeFilters.length})` : 'Lojas'}</span>
              <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <div className="expenses__store-menu">
              <p>Selecione uma ou mais lojas. O nome deve aparecer na descrição.</p>
              {CATALOGED_STORES.map((store) => (
                <label key={store}>
                  <input
                    type="checkbox"
                    checked={storeFilters.includes(store)}
                    onChange={(event) => {
                      const isSelected = event.currentTarget.checked
                      setStoreFilters((current) => isSelected
                        ? [...current, store]
                        : current.filter((selectedStore) => selectedStore !== store))
                    }}
                  />
                  {store}
                </label>
              ))}
            </div>
          </details>
          <div className="expenses__sort-select">
            <ArrowDownWideNarrow size={17} aria-hidden="true" />
            <select
              aria-label="Ordenar por"
              value={sortOrder}
              onChange={(event) => {
                const value = event.currentTarget.value
                if (
                  value === 'date-desc'
                  || value === 'date-asc'
                  || value === 'amount-desc'
                  || value === 'amount-asc'
                ) setSortOrder(value)
              }}
            >
              <option value="date-desc">Data: mais recente</option>
              <option value="date-asc">Data: mais antiga</option>
              <option value="amount-desc">Valor: maior</option>
              <option value="amount-asc">Valor: menor</option>
            </select>
          </div>
          {(nameFilter.trim() || categoryFilter || storeFilters.length > 0) && (
            <button
              type="button"
              className="expenses__clear-filters"
              onClick={() => {
                setNameFilter('')
                setCategoryFilter('')
                setStoreFilters([])
              }}
            >
              Limpar
            </button>
          )}
        </div>
        {expenses.length === 0 ? (
          <p className="expenses__empty">
            {nameFilter || categoryFilter || storeFilters.length > 0
              ? 'Nenhum gasto corresponde aos filtros selecionados.'
              : 'Nenhum gasto cadastrado neste mês.'}
          </p>
        ) : (
          <div className="expenses__table-scroll">
            <table className="expenses__table">
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Descrição</th>
                  <th scope="col">Categoria</th>
                  <th scope="col">Valor</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{formatDate(expense.date)}</td>
                    <td>
                      {expense.description}
                      {expense.installmentTotal !== undefined && (
                        <span className="expenses__installment">
                          Parcela {expense.installmentNumber}/{expense.installmentTotal}
                        </span>
                      )}
                    </td>
                    <td>{categoryName(expense.categoryId)}</td>
                    <td>{formatCurrency(expense.amount, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  )
}
