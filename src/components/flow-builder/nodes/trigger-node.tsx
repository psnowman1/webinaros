import { memo } from 'react'
import type { NodeProps } from 'reactflow'
import { Zap } from 'lucide-react'
import { BaseNode } from './base-node'
import type { TriggerNodeData } from '@/types'

function TriggerNodeComponent({ data, selected }: NodeProps<TriggerNodeData>) {
  return (
    <BaseNode
      icon={<Zap className="h-6 w-6" />}
      label={data.label || 'Trigger'}
      color="orange"
      selected={selected}
      showTargetHandle={false}
    />
  )
}

export const TriggerNode = memo(TriggerNodeComponent)
