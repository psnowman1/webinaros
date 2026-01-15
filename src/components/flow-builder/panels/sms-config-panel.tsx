import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SMSNodeData } from '@/types'

interface SMSConfigPanelProps {
  data: SMSNodeData
  onChange: (data: SMSNodeData) => void
  onOpenAIWriter: () => void
}

const variableHints = [
  { variable: '{{firstName}}', description: 'First name' },
  { variable: '{{joinUrl}}', description: 'Join link' },
]

export function SMSConfigPanel({ data, onChange, onOpenAIWriter }: SMSConfigPanelProps) {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')
  const charCount = data.message?.length || 0
  const isOverLimit = charCount > 160

  const insertVariable = (variable: string) => {
    onChange({ ...data, message: data.message + variable })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          variant={mode === 'manual' ? 'default' : 'outline'}
          onClick={() => setMode('manual')}
          className="text-xs"
        >
          Write manually
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === 'ai' ? 'default' : 'outline'}
          onClick={() => setMode('ai')}
          className="text-xs"
        >
          <Sparkles className="mr-1.5 h-3 w-3" />
          Use AI Writer
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message" className="text-xs">Message</Label>
        <Textarea
          id="message"
          placeholder="Enter SMS message..."
          value={data.message}
          onChange={(e) => onChange({ ...data, message: e.target.value })}
          rows={4}
          className="text-sm"
        />
        <p className={cn(
          "text-xs",
          isOverLimit ? "text-error" : "text-muted-foreground"
        )}>
          {charCount}/160 characters
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Variables</Label>
        <div className="flex flex-wrap gap-1.5">
          {variableHints.map((hint) => (
            <Badge
              key={hint.variable}
              variant="outline"
              className="cursor-pointer text-[10px] hover:bg-accent"
              onClick={() => insertVariable(hint.variable)}
            >
              {hint.variable}
            </Badge>
          ))}
        </div>
      </div>

      {mode === 'ai' && (
        <Button onClick={onOpenAIWriter} className="w-full" size="sm">
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Open AI SMS Writer
        </Button>
      )}
    </div>
  )
}
