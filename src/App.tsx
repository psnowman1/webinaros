import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { MainLayout } from '@/components/layout'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { LoginPage, SignupPage } from '@/pages/auth'
import {
  DashboardPage,
  WebinarsListPage,
  WebinarDetailPage,
  WebinarFormPage,
  WebinarWizardPage,
  WorkspaceWizardPage,
  AnalyticsPage,
  EmailsListPage,
  EmailComposerPage,
  SequencesPage,
  SequenceBuilderPage,
  MessagingPage,
  IntegrationsPage,
  SettingsPage,
  OnboardingPage,
} from '@/pages'
import { useAppStore } from '@/stores/app-store'

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center animate-pulse">
            <span className="text-xl font-bold text-primary-foreground">W</span>
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  return <>{children}</>
}

// Public route wrapper (redirects to dashboard if logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center animate-pulse">
            <span className="text-xl font-bold text-primary-foreground">W</span>
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  const { theme } = useAppStore()
  const { user, workspaces } = useAuth()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // If user is logged in but has no workspaces, redirect to create one
  const needsWorkspace = user && workspaces.length === 0

  return (
    <Routes>
      {/* Auth routes */}
      <Route
        path="/auth/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/auth/signup"
        element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        }
      />

      {/* Onboarding */}
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Workspace creation (protected) */}
      <Route
        path="/workspace/new"
        element={
          <ProtectedRoute>
            <WorkspaceWizardPage />
          </ProtectedRoute>
        }
      />

      {/* Email composer (full page, protected) */}
      <Route
        path="/emails/new"
        element={
          <ProtectedRoute>
            <EmailComposerPage />
          </ProtectedRoute>
        }
      />

      {/* Redirect to workspace creation if needed */}
      {needsWorkspace && (
        <Route path="*" element={<Navigate to="/workspace/new" replace />} />
      )}

      {/* Main app routes (protected) */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/webinars" element={<WebinarsListPage />} />
        <Route path="/webinars/new" element={<WebinarWizardPage />} />
        <Route path="/webinars/:id" element={<WebinarDetailPage />} />
        <Route path="/webinars/:id/edit" element={<WebinarFormPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/messaging" element={<MessagingPage />} />
        <Route path="/emails" element={<EmailsListPage />} />
        <Route path="/sequences" element={<SequencesPage />} />
        <Route path="/sequences/:id" element={<SequenceBuilderPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  )
}

export default App
