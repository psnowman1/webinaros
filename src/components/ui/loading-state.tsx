import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  /** Optional message to display below the spinner */
  message?: string
  /** Size variant for the spinner */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to render as a full-page centered state */
  fullPage?: boolean
  /** Additional CSS classes */
  className?: string
}

const sizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

/**
 * LoadingState - A reusable loading spinner component
 *
 * Use this for:
 * - Initial page data loading (fullPage=true)
 * - Section loading states
 * - Inline loading indicators
 *
 * @example
 * // Full page loading
 * if (isLoading) return <LoadingState fullPage />
 *
 * @example
 * // With message
 * <LoadingState message="Loading webinars..." />
 *
 * @example
 * // Inline small spinner
 * <LoadingState size="sm" />
 */
export function LoadingState({
  message,
  size = 'md',
  fullPage = false,
  className,
}: LoadingStateProps) {
  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullPage && 'min-h-[400px]',
        className
      )}
      role="status"
      aria-label={message || 'Loading'}
    >
      <Loader2
        className={cn(
          'animate-spin text-muted-foreground',
          sizeClasses[size]
        )}
        aria-hidden="true"
      />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
      <span className="sr-only">{message || 'Loading...'}</span>
    </div>
  )

  return content
}

/**
 * Inline loading spinner for buttons
 * Use this inside buttons to show loading state
 *
 * @example
 * <Button disabled={isLoading}>
 *   {isLoading && <ButtonSpinner />}
 *   Save Changes
 * </Button>
 */
export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn('mr-2 h-4 w-4 animate-spin', className)}
      aria-hidden="true"
    />
  )
}
