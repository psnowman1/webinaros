import { useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface AISMSWriterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUseMessage: (message: string) => void
}

const smsTypes = [
  { value: 'confirmation', label: 'Registration Confirmation' },
  { value: '24hr_reminder', label: '24hr Reminder' },
  { value: '1hr_reminder', label: '1hr Reminder' },
  { value: 'starting_now', label: 'Starting Now' },
  { value: 'replay', label: 'Replay Available' },
  { value: 'no_show', label: 'No Show Follow-up' },
]

const tones = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'friendly', label: 'Friendly' },
]

const sampleMessages: Record<string, string> = {
  confirmation: 'Hey {{firstName}}! You\'re registered for the Apex Masterclass. Save this link: {{joinUrl}}',
  '24hr_reminder': 'Hey {{firstName}}! Apex Masterclass is TOMORROW at 7pm EST. Don\'t miss it → {{joinUrl}}',
  '1hr_reminder': '{{firstName}}, starting in 1 HOUR! Apex Masterclass - join now: {{joinUrl}}',
  starting_now: '{{firstName}} - We\'re LIVE! Join the Apex Masterclass now: {{joinUrl}}',
  replay: 'Hey {{firstName}}, the replay is ready! Watch it here: {{joinUrl}}',
  no_show: 'Hey {{firstName}}, missed the webinar? No worries - catch the replay: {{joinUrl}}',
}

export function AISMSWriterDialog({ open, onOpenChange, onUseMessage }: AISMSWriterDialogProps) {
  const [smsType, setSmsType] = useState('24hr_reminder')
  const [tone, setTone] = useState('casual')
  const [includeTitle, setIncludeTitle] = useState(true)
  const [includeTime, setIncludeTime] = useState(true)
  const [includeLink, setIncludeLink] = useState(true)
  const [includeHost, setIncludeHost] = useState(false)
  const [generatedMessage, setGeneratedMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const charCount = generatedMessage.length
  const isOverLimit = charCount > 160

  const handleGenerate = () => {
    setIsGenerating(true)
    // Simulate AI generation
    setTimeout(() => {
      setGeneratedMessage(sampleMessages[smsType] || sampleMessages['24hr_reminder'])
      setIsGenerating(false)
    }, 800)
  }

  const handleUse = () => {
    onUseMessage(generatedMessage)
    onOpenChange(false)
    setGeneratedMessage('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI SMS Writer
          </DialogTitle>
          <DialogDescription>
            Generate an SMS message using AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">SMS Type</Label>
              <Select value={smsType} onValueChange={setSmsType}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {smsTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tones.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Key info to include</Label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={includeTitle} onCheckedChange={(c: boolean | 'indeterminate') => setIncludeTitle(!!c)} />
                Webinar title
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={includeTime} onCheckedChange={(c: boolean | 'indeterminate') => setIncludeTime(!!c)} />
                Time
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={includeLink} onCheckedChange={(c: boolean | 'indeterminate') => setIncludeLink(!!c)} />
                Join link
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={includeHost} onCheckedChange={(c: boolean | 'indeterminate') => setIncludeHost(!!c)} />
                Host name
              </label>
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full" size="sm">
            {isGenerating ? (
              <>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Generate SMS
              </>
            )}
          </Button>

          {generatedMessage && (
            <div className="space-y-1.5">
              <Label className="text-xs">Output</Label>
              <Textarea
                value={generatedMessage}
                onChange={(e) => setGeneratedMessage(e.target.value)}
                rows={3}
                className="text-sm"
              />
              <p className={cn(
                "text-xs",
                isOverLimit ? "text-error" : "text-muted-foreground"
              )}>
                {charCount}/160 characters
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {generatedMessage && (
            <Button variant="outline" onClick={handleGenerate} size="sm">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Regenerate
            </Button>
          )}
          <Button onClick={handleUse} disabled={!generatedMessage} size="sm">
            Use This
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
