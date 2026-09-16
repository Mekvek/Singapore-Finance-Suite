import { Outlet } from 'react-router-dom'
import AppSidebar from '../components/Sidebar'

export default function AppLayout() {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: 'var(--color-bg)',
        overflow: 'hidden',
      }}
    >
      <AppSidebar />
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--color-bg)',
          color: 'var(--color-text)',
        }}
      >
        <Outlet />
      </main>
    </div>
  )
}
