import { Handle, Position } from 'reactflow'
import { cn } from '@/lib/utils'

interface BaseNodeProps {
  icon: React.ReactNode
  label?: string
  selected?: boolean
  color: 'blue' | 'green' | 'gray' | 'yellow' | 'purple' | 'red' | 'orange'
  showSourceHandle?: boolean
  showTargetHandle?: boolean
  sourceHandles?: { id: string; label?: string }[]
}

const colorClasses = {
  blue: 'text-blue-500 border-blue-500',
  green: 'text-green-500 border-green-500',
  gray: 'text-gray-500 border-gray-500',
  yellow: 'text-yellow-500 border-yellow-500',
  purple: 'text-purple-500 border-purple-500',
  red: 'text-red-500 border-red-500',
  orange: 'text-orange-500 border-orange-500',
}

const selectedRingClasses = {
  blue: 'ring-[3px] ring-blue-500/40',
  green: 'ring-[3px] ring-green-500/40',
  gray: 'ring-[3px] ring-gray-500/40',
  yellow: 'ring-[3px] ring-yellow-500/40',
  purple: 'ring-[3px] ring-purple-500/40',
  red: 'ring-[3px] ring-red-500/40',
  orange: 'ring-[3px] ring-orange-500/40',
}

export function BaseNode({
  icon,
  label,
  selected,
  color,
  showSourceHandle = true,
  showTargetHandle = true,
  sourceHandles,
}: BaseNodeProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          'relative flex h-14 w-14 items-center justify-center rounded-2xl border-2 bg-white shadow-lg transition-all',
          colorClasses[color],
          selected && selectedRingClasses[color]
        )}
      >
        {/* Left input handle */}
        {showTargetHandle && (
          <Handle
            type="target"
            position={Position.Left}
            className="!-left-[5px] !h-2.5 !w-2.5 !rounded-full !border-2 !border-white !bg-gray-400"
          />
        )}
        {icon}
        {/* Right output handle(s) */}
        {sourceHandles ? (
          sourceHandles.map((handle, index) => (
            <Handle
              key={handle.id}
              id={handle.id}
              type="source"
              position={Position.Right}
              className="!-right-[5px] !h-2.5 !w-2.5 !rounded-full !border-2 !border-white !bg-gray-400"
              style={{ top: `${((index + 1) / (sourceHandles.length + 1)) * 100}%` }}
            />
          ))
        ) : showSourceHandle ? (
          <Handle
            type="source"
            position={Position.Right}
            className="!-right-[5px] !h-2.5 !w-2.5 !rounded-full !border-2 !border-white !bg-gray-400"
          />
        ) : null}
      </div>
      {label && (
        <span className="max-w-[80px] truncate text-center text-xs font-medium text-foreground">
          {label}
        </span>
      )}
    </div>
  )
}
