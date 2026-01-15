import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { WaitNodeData } from '@/types'

interface WaitConfigPanelProps {
  data: WaitNodeData
  onChange: (data: WaitNodeData) => void
}

export function WaitConfigPanel({ data, onChange }: WaitConfigPanelProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Wait Type</Label>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="sm"
            variant={data.durationType === 'fixed' ? 'default' : 'outline'}
            onClick={() => onChange({ ...data, durationType: 'fixed', relativeTo: undefined })}
            className="justify-start text-xs"
          >
            Fixed delay
          </Button>
          <Button
            type="button"
            size="sm"
            variant={data.durationType === 'relative' ? 'default' : 'outline'}
            onClick={() => onChange({ ...data, durationType: 'relative', relativeTo: 'before_webinar' })}
            className="justify-start text-xs"
          >
            Relative to webinar
          </Button>
        </div>
      </div>

      {data.durationType === 'fixed' ? (
        <div className="space-y-1.5">
          <Label className="text-xs">Wait duration</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Wait</span>
            <Input
              type="number"
              min={1}
              value={data.duration}
              onChange={(e) => onChange({ ...data, duration: parseInt(e.target.value) || 1 })}
              className="h-8 w-20 text-sm"
            />
            <Select
              value={data.unit}
              onValueChange={(value: 'hours' | 'days') => onChange({ ...data, unit: value })}
            >
              <SelectTrigger className="h-8 w-24 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hours">hours</SelectItem>
                <SelectItem value="days">days</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">after prev step</span>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label className="text-xs">Relative timing</Label>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Wait until</span>
            <Input
              type="number"
              min={1}
              value={data.duration}
              onChange={(e) => onChange({ ...data, duration: parseInt(e.target.value) || 1 })}
              className="h-8 w-20 text-sm"
            />
            <Select
              value={data.unit}
              onValueChange={(value: 'hours' | 'days') => onChange({ ...data, unit: value })}
            >
              <SelectTrigger className="h-8 w-24 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hours">hours</SelectItem>
                <SelectItem value="days">days</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={data.relativeTo}
              onValueChange={(value: 'before_webinar' | 'after_webinar') => onChange({ ...data, relativeTo: value })}
            >
              <SelectTrigger className="h-8 w-32 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="before_webinar">before</SelectItem>
                <SelectItem value="after_webinar">after</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">the webinar</span>
          </div>
        </div>
      )}
    </div>
  )
}
