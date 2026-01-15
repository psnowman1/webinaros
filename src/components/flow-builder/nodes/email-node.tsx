import { memo } from 'react'
import type { NodeProps } from 'reactflow'
import { Mail } from 'lucide-react'
import { BaseNode } from './base-node'
import type { EmailNodeData } from '@/types'

function EmailNodeComponent({ selected }: NodeProps<EmailNodeData>) {
  return (
    <BaseNode
      icon={<Mail className="h-6 w-6" />}
      label="Email"
      color="blue"
      selected={selected}
    />
  )
}

export const EmailNode = memo(EmailNodeComponent)
