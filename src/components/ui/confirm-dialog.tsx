import { useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Title displayed in the dialog header */
  title: string
  /** Description text explaining the action */
  description: string
  /** Text for the confirm button */
  confirmText?: string
  /** Text for the cancel button */
  cancelText?: string
  /** Variant affects styling of the confirm button */
  variant?: 'default' | 'destructive'
  /** Called when user confirms the action */
  onConfirm: () => void | Promise<void>
  /** Whether the confirm action is in progress */
  isLoading?: boolean
  /**
   * If provided, user must type this text to enable the confirm button
   * Useful for high-risk destructive actions
   */
  confirmationText?: string
}

/**
 * ConfirmDialog - A reusable confirmation dialog
 *
 * Use this for any action that requires explicit user confirmation,
 * especially destructive actions like delete operations.
 *
 * @example
 * // Simple confirmation
 * <ConfirmDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   title="Delete Webinar"
 *   description="Are you sure you want to delete this webinar?"
 *   variant="destructive"
 *   onConfirm={handleDelete}
 * />
 *
 * @example
 * // With text confirmation for high-risk actions
 * <ConfirmDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   title="Delete Workspace"
 *   description="This will permanently delete all data."
 *   variant="destructive"
 *   confirmationText={workspaceName}
 *   onConfirm={handleDelete}
 *   isLoading={isDeleting}
 * />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  isLoading = false,
  confirmationText,
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('')

  const requiresTextConfirmation = !!confirmationText
  const canConfirm = requiresTextConfirmation
    ? inputValue === confirmationText
    : true

  const handleConfirm = useCallback(async () => {
    await onConfirm()
    setInputValue('')
  }, [onConfirm])

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setInputValue('')
      }
      onOpenChange(newOpen)
    },
    [onOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className={variant === 'destructive' ? 'text-destructive' : ''}>
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {requiresTextConfirmation && (
          <div className="space-y-3 py-4">
            {variant === 'destructive' && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium">
                  This action cannot be undone.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="confirm-input">
                Type <span className="font-semibold">{confirmationText}</span> to
                confirm
              </Label>
              <Input
                id="confirm-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter text to confirm"
                autoComplete="off"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook to manage confirm dialog state
 *
 * @example
 * const { dialogProps, confirm } = useConfirmDialog()
 *
 * const handleDelete = async (item: Item) => {
 *   const confirmed = await confirm({
 *     title: 'Delete Item',
 *     description: `Are you sure you want to delete "${item.name}"?`,
 *     variant: 'destructive',
 *   })
 *   if (confirmed) {
 *     await deleteItem(item.id)
 *   }
 * }
 *
 * return (
 *   <>
 *     <Button onClick={() => handleDelete(item)}>Delete</Button>
 *     <ConfirmDialog {...dialogProps} />
 *   </>
 * )
 */
export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
    confirmationText?: string
    resolve?: (value: boolean) => void
  }>({
    open: false,
    title: '',
    description: '',
  })

  const [isLoading, setIsLoading] = useState(false)

  const confirm = useCallback(
    (options: {
      title: string
      description: string
      confirmText?: string
      cancelText?: string
      variant?: 'default' | 'destructive'
      confirmationText?: string
    }): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          open: true,
          ...options,
          resolve,
        })
      })
    },
    []
  )

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open && state.resolve) {
      state.resolve(false)
    }
    setState((prev) => ({ ...prev, open }))
  }, [state.resolve])

  const handleConfirm = useCallback(() => {
    if (state.resolve) {
      state.resolve(true)
    }
    setState((prev) => ({ ...prev, open: false }))
  }, [state.resolve])

  const dialogProps: ConfirmDialogProps = {
    open: state.open,
    onOpenChange: handleOpenChange,
    title: state.title,
    description: state.description,
    confirmText: state.confirmText,
    cancelText: state.cancelText,
    variant: state.variant,
    confirmationText: state.confirmationText,
    onConfirm: handleConfirm,
    isLoading,
  }

  return {
    dialogProps,
    confirm,
    setIsLoading,
  }
}
