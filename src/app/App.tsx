import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DependencyProvider } from './di/DependencyProvider'
import { AppLayout } from '../presentation/layout/AppLayout'
import { DashboardPage } from '../presentation/pages/dashboard/DashboardPage'
import { HistoryPage } from '../presentation/pages/history/HistoryPage'
import { ExpensesPage } from '../presentation/pages/expenses/ExpensesPage'
import { GoalsPage } from '../presentation/pages/goals/GoalsPage'

export default function App() {
  return (
    <DependencyProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="historico" element={<HistoryPage />} />
            <Route path="gastos" element={<ExpensesPage />} />
            <Route path="despesas" element={<Navigate to="/gastos" replace />} />
            <Route path="metas" element={<GoalsPage />} />
            <Route path="configuracoes" element={<h1>Configurações</h1>} />
            <Route path="login" element={<h1>Entrar</h1>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DependencyProvider>
  )
}
