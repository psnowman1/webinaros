import { memo } from 'react'
import type { NodeProps } from 'reactflow'
import { Tag } from 'lucide-react'
import { BaseNode } from './base-node'
import type { TagNodeData } from '@/types'

function TagNodeComponent({ selected }: NodeProps<TagNodeData>) {
  return (
    <BaseNode
      icon={<Tag className="h-6 w-6" />}
      label="Tag"
      color="purple"
      selected={selected}
    />
  )
}

export const TagNode = memo(TagNodeComponent)
