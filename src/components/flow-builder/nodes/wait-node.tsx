import { memo } from 'react'
import type { NodeProps } from 'reactflow'
import { Clock } from 'lucide-react'
import { BaseNode } from './base-node'
import type { WaitNodeData } from '@/types'

function WaitNodeComponent({ data, selected }: NodeProps<WaitNodeData>) {
  const label = `${data.duration}${data.unit === 'hours' ? 'h' : 'd'}`

  return (
    <BaseNode
      icon={<Clock className="h-6 w-6" />}
      label={label}
      color="gray"
      selected={selected}
    />
  )
}

export const WaitNode = memo(WaitNodeComponent)
