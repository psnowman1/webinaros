import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BranchNodeData, BranchCondition } from '@/types'

interface BranchConfigPanelProps {
  data: BranchNodeData
  onChange: (data: BranchNodeData) => void
}

const conditions: { value: BranchCondition; label: string }[] = [
  { value: 'is_vip', label: 'Is VIP' },
  { value: 'attended', label: 'Attended webinar' },
  { value: 'opened_email', label: 'Opened email' },
  { value: 'clicked_link', label: 'Clicked link in email' },
  { value: 'has_tag', label: 'Has tag' },
  { value: 'custom', label: 'Custom field equals' },
]

export function BranchConfigPanel({ data, onChange }: BranchConfigPanelProps) {
  const needsValue = ['opened_email', 'has_tag', 'custom'].includes(data.condition)

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">If registrant:</Label>
        <Select
          value={data.condition}
          onValueChange={(value: BranchCondition) => onChange({ ...data, condition: value, conditionValue: '' })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {conditions.map((condition) => (
              <SelectItem key={condition.value} value={condition.value}>
                {condition.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {needsValue && (
        <div className="space-y-1.5">
          <Label className="text-xs">
            {data.condition === 'opened_email' && 'Email to check'}
            {data.condition === 'has_tag' && 'Tag name'}
            {data.condition === 'custom' && 'Custom value'}
          </Label>
          <Input
            placeholder={
              data.condition === 'opened_email'
                ? 'Select which email...'
                : data.condition === 'has_tag'
                ? 'Enter tag name...'
                : 'Enter value...'
            }
            value={data.conditionValue || ''}
            onChange={(e) => onChange({ ...data, conditionValue: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
      )}

      <div className="rounded-lg bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground">
          <strong>Available conditions:</strong>
        </p>
        <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
          <li>• is VIP</li>
          <li>• attended webinar</li>
          <li>• opened email [select which]</li>
          <li>• clicked link in email</li>
          <li>• has tag [tag name]</li>
          <li>• custom field equals</li>
        </ul>
      </div>
    </div>
  )
}
