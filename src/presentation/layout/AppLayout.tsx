import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <>
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
    </>
  )
}