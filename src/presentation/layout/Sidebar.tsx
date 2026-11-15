import { History, LayoutDashboard, LogIn, Receipt, Settings, Target } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import './Sidebar.css'

const items = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/historico', label: 'Histórico', icon: History },
  { to: '/gastos', label: 'Gastos', icon: Receipt },
  { to: '/metas', label: 'Metas', icon: Target },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">Webfini</div>
      <nav aria-label="Navegação principal">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <nav className="sidebar__footer" aria-label="Configuração e acesso">
        <NavLink
          to="/configuracoes"
          aria-label="Configurações"
          title="Configurações"
          className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}
        >
          <Settings size={20} aria-hidden="true" />
        </NavLink>
        <NavLink
          to="/login"
          aria-label="Entrar"
          title="Entrar"
          className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}
        >
          <LogIn size={20} aria-hidden="true" />
        </NavLink>
      </nav>
    </aside>
  )
}