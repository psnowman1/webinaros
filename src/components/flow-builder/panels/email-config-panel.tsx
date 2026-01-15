import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { EmailNodeData } from '@/types'

interface EmailConfigPanelProps {
  data: EmailNodeData
  onChange: (data: EmailNodeData) => void
  onOpenAIWriter: () => void
}

const variableHints = [
  { variable: '{{firstName}}', description: 'First name' },
  { variable: '{{lastName}}', description: 'Last name' },
  { variable: '{{email}}', description: 'Email' },
  { variable: '{{joinUrl}}', description: 'Join link' },
]

export function EmailConfigPanel({ data, onChange, onOpenAIWriter }: EmailConfigPanelProps) {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')

  const insertVariable = (variable: string) => {
    onChange({ ...data, body: data.body + variable })
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
        <Label htmlFor="subject" className="text-xs">Subject</Label>
        <Input
          id="subject"
          placeholder="Enter email subject..."
          value={data.subject}
          onChange={(e) => onChange({ ...data, subject: e.target.value })}
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="body" className="text-xs">Body</Label>
        <Textarea
          id="body"
          placeholder="Enter email content..."
          value={data.body}
          onChange={(e) => onChange({ ...data, body: e.target.value })}
          rows={8}
          className="text-sm"
        />
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
          Open AI Email Writer
        </Button>
      )}
    </div>
  )
}
