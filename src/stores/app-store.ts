import { create } from 'zustand'
import type { ToastProps } from '@/components/ui/toast'

interface AppState {
  // Theme
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void

  // Toasts
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, 'id'>) => void
  dismissToast: (id: string) => void

  // Onboarding
  hasCompletedOnboarding: boolean
  setOnboardingComplete: (complete: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Theme
  theme: (typeof window !== 'undefined' && localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  setTheme: (theme) => {
    localStorage.setItem('theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },
  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light'
    get().setTheme(newTheme)
  },

  // Toasts
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${Date.now()}`
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    setTimeout(() => get().dismissToast(id), 5000)
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  // Onboarding
  hasCompletedOnboarding: localStorage.getItem('onboarding_complete') === 'true',
  setOnboardingComplete: (complete) => {
    localStorage.setItem('onboarding_complete', String(complete))
    set({ hasCompletedOnboarding: complete })
  },
}))
