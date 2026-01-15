import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TriggerNodeData, SequenceTrigger } from '@/types'

interface TriggerConfigPanelProps {
  data: TriggerNodeData
  onChange: (data: TriggerNodeData) => void
}

const triggers: { value: SequenceTrigger; label: string; description: string }[] = [
  { value: 'registration', label: 'New Registration', description: 'When someone registers for a webinar' },
  { value: 'vip_purchase', label: 'VIP Purchase', description: 'When someone purchases VIP access' },
  { value: 'attendance', label: 'Attended Webinar', description: 'When someone attends the webinar' },
  { value: 'no_show', label: 'No Show', description: 'When someone registers but doesn\'t attend' },
]

export function TriggerConfigPanel({ data, onChange }: TriggerConfigPanelProps) {
  const selectedTrigger = triggers.find(t => t.value === data.triggerType)

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Start sequence when:</Label>
        <Select
          value={data.triggerType}
          onValueChange={(value: SequenceTrigger) => onChange({
            ...data,
            triggerType: value,
            label: triggers.find(t => t.value === value)?.label || value
          })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {triggers.map((trigger) => (
              <SelectItem key={trigger.value} value={trigger.value}>
                {trigger.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedTrigger && (
          <p className="text-[10px] text-muted-foreground">{selectedTrigger.description}</p>
        )}
      </div>

      <div className="rounded-lg bg-muted/50 p-3">
        <p className="text-xs font-medium">How triggers work:</p>
        <ul className="mt-1.5 space-y-1 text-[10px] text-muted-foreground">
          <li>• Each sequence has exactly one trigger</li>
          <li>• Registrants enter the sequence when the trigger fires</li>
          <li>• They then proceed through each step in order</li>
        </ul>
      </div>
    </div>
  )
}
