import { Outlet } from 'react-router-dom'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { ToastContainer } from '@/components/ui/toast'
import { useAppStore } from '@/stores/app-store'

export function MainLayout() {
  const { toasts, dismissToast } = useAppStore()

  return (
    <div className="min-h-screen bg-background-secondary">
      <Header />
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
