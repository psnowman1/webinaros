import { memo } from 'react'
import type { NodeProps } from 'reactflow'
import { Target } from 'lucide-react'
import { BaseNode } from './base-node'
import type { GoalNodeData } from '@/types'

function GoalNodeComponent({ selected }: NodeProps<GoalNodeData>) {
  return (
    <BaseNode
      icon={<Target className="h-6 w-6" />}
      label="Goal"
      color="red"
      selected={selected}
      showSourceHandle={false}
    />
  )
}

export const GoalNode = memo(GoalNodeComponent)
