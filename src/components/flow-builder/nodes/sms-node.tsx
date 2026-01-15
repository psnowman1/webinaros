import { memo } from 'react'
import type { NodeProps } from 'reactflow'
import { MessageSquare } from 'lucide-react'
import { BaseNode } from './base-node'
import type { SMSNodeData } from '@/types'

function SMSNodeComponent({ selected }: NodeProps<SMSNodeData>) {
  return (
    <BaseNode
      icon={<MessageSquare className="h-6 w-6" />}
      label="SMS"
      color="green"
      selected={selected}
    />
  )
}

export const SMSNode = memo(SMSNodeComponent)
