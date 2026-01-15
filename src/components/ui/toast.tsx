import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'error'
  onDismiss?: (id: string) => void
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps & React.HTMLAttributes<HTMLDivElement>>(
  ({ className, title, description, variant = 'default', id, onDismiss, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 shadow-lg transition-all',
          variant === 'default' && 'border-border bg-card',
          variant === 'success' && 'border-success bg-success-background',
          variant === 'error' && 'border-error bg-error-background',
          className
        )}
        {...props}
      >
        <div className="grid gap-1">
          {title && <div className="text-sm font-semibold">{title}</div>}
          {description && (
            <div className="text-sm text-muted-foreground">{description}</div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={() => onDismiss(id)}
            className="rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Toast.displayName = 'Toast'

interface ToastContainerProps {
  toasts: ToastProps[]
  onDismiss: (id: string) => void
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

export { Toast, ToastContainer }
