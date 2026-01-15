import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { TagNodeData } from '@/types'

interface TagConfigPanelProps {
  data: TagNodeData
  onChange: (data: TagNodeData) => void
}

export function TagConfigPanel({ data, onChange }: TagConfigPanelProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Action</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={data.action === 'add' ? 'default' : 'outline'}
            onClick={() => onChange({ ...data, action: 'add' })}
            className="flex-1 text-xs"
          >
            Add Tag
          </Button>
          <Button
            type="button"
            size="sm"
            variant={data.action === 'remove' ? 'default' : 'outline'}
            onClick={() => onChange({ ...data, action: 'remove' })}
            className="flex-1 text-xs"
          >
            Remove Tag
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tagName" className="text-xs">Tag Name</Label>
        <Input
          id="tagName"
          placeholder="Enter tag name..."
          value={data.tagName}
          onChange={(e) => onChange({ ...data, tagName: e.target.value })}
          className="h-8 text-sm"
        />
        <p className="text-[10px] text-muted-foreground">
          This tag will be {data.action === 'add' ? 'added to' : 'removed from'} the registrant
        </p>
      </div>
    </div>
  )
}
