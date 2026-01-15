import { memo } from 'react'
import type { NodeProps } from 'reactflow'
import { GitBranch } from 'lucide-react'
import { BaseNode } from './base-node'
import type { BranchNodeData } from '@/types'

function BranchNodeComponent({ selected }: NodeProps<BranchNodeData>) {
  return (
    <BaseNode
      icon={<GitBranch className="h-6 w-6" />}
      label="Branch"
      color="yellow"
      selected={selected}
      sourceHandles={[
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
      ]}
    />
  )
}

export const BranchNode = memo(BranchNodeComponent)
