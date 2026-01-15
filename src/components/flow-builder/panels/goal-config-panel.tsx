import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { GoalNodeData, GoalCondition } from '@/types'

interface GoalConfigPanelProps {
  data: GoalNodeData
  onChange: (data: GoalNodeData) => void
}

const goals: { value: GoalCondition; label: string }[] = [
  { value: 'purchased', label: 'Made Purchase' },
  { value: 'booked_call', label: 'Booked Call' },
  { value: 'attended', label: 'Attended Webinar' },
  { value: 'clicked_link', label: 'Clicked Link' },
  { value: 'custom', label: 'Custom Goal' },
]

export function GoalConfigPanel({ data, onChange }: GoalConfigPanelProps) {
  const needsValue = data.condition === 'custom'

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Exit flow when registrant:</Label>
        <Select
          value={data.condition}
          onValueChange={(value: GoalCondition) => onChange({ ...data, condition: value, conditionValue: '' })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {goals.map((goal) => (
              <SelectItem key={goal.value} value={goal.value}>
                {goal.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {needsValue && (
        <div className="space-y-1.5">
          <Label className="text-xs">Custom condition</Label>
          <Input
            placeholder="Enter custom condition..."
            value={data.conditionValue || ''}
            onChange={(e) => onChange({ ...data, conditionValue: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
      )}

      <div className="rounded-lg bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground">
          When a registrant meets this goal condition, they will be removed from the sequence and won't receive any more messages.
        </p>
      </div>
    </div>
  )
}
