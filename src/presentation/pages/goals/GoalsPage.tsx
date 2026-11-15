import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useDependencies } from '../../../app/di/DependencyProvider'
import type { SavingsGoal } from '../../../core/models/MonthlyBudget'
import { formatCurrency } from '../../../shared/format'
import './GoalsPage.css'

export function GoalsPage() {
  const { addSavingsGoal, getSavingsGoals, removeSavingsGoal } = useDependencies()
  const [goals, setGoals] = useState<SavingsGoal[] | null>(null)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    getSavingsGoals.execute()
      .then((items) => {
        if (active) setGoals(items)
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar as metas.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [getSavingsGoals])

  const refreshGoals = async () => {
    setGoals(await getSavingsGoals.execute())
  }

  const handleAddGoal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setNotice(null)

    try {
      await addSavingsGoal.execute({
        name,
        monthlyContribution: Number(amount.replace(',', '.')),
      })
      await refreshGoals()
      setName('')
      setAmount('')
      setNotice('Meta adicionada.')
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'Erro ao adicionar a meta.')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveGoal = async (goal: SavingsGoal) => {
    setRemovingId(goal.id)
    setError(null)
    setNotice(null)

    try {
      await removeSavingsGoal.execute(goal.id)
      await refreshGoals()
      setNotice(`Meta “${goal.name}” removida.`)
    } catch (removeError: unknown) {
      setError(removeError instanceof Error ? removeError.message : 'Erro ao remover a meta.')
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) return <p>Carregando metas...</p>
  if (error && goals === null) return <p role="alert">{error}</p>
  if (goals === null) return null

  const totalMonthly = goals.reduce((total, goal) => total + goal.monthlyContribution, 0)

  return (
    <section className="goals">
      <header className="goals__header">
        <div>
          <h1>Metas</h1>
          <p>Defina quanto deseja guardar por mês para cada objetivo.</p>
        </div>
        <div className="goals__total">
          <span>Total mensal destinado</span>
          <strong>{formatCurrency(totalMonthly, 2)}</strong>
        </div>
      </header>

      {error && <p className="goals__message goals__message--error" role="alert">{error}</p>}
      {notice && <p className="goals__message" role="status">{notice}</p>}

      <form className="goals__form" onSubmit={handleAddGoal}>
        <h2>Adicionar meta</h2>
        <div className="goals__form-fields">
          <label>
            Nome da meta
            <input
              required
              maxLength={60}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Reserva de emergência"
            />
          </label>
          <label>
            Aporte mensal
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0,00"
            />
          </label>
          <button type="submit" className="goals__button" disabled={saving}>
            <Plus size={18} aria-hidden="true" />
            {saving ? 'Adicionando...' : 'Adicionar meta'}
          </button>
        </div>
      </form>

      <section className="goals__list" aria-labelledby="goals-list-title">
        <h2 id="goals-list-title">Seus objetivos</h2>
        {goals.length === 0 ? (
          <p className="goals__empty">Você ainda não adicionou metas.</p>
        ) : (
          <ul>
            {goals.map((goal) => (
              <li className="goals__item" key={goal.id}>
                <div>
                  <strong>{goal.name}</strong>
                  <span>Aporte mensal</span>
                </div>
                <strong className="goals__amount">
                  {formatCurrency(goal.monthlyContribution, 2)}
                </strong>
                <button
                  type="button"
                  className="goals__remove"
                  aria-label={`Remover meta ${goal.name}`}
                  title={`Remover meta ${goal.name}`}
                  disabled={saving || removingId !== null}
                  onClick={() => void handleRemoveGoal(goal)}
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}
