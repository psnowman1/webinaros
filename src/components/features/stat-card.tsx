import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: LucideIcon
}

export function StatCard({ title, value, change, changeLabel, icon: Icon }: StatCardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
          {Icon && <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />}
        </div>
        <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
          <p className="text-xl sm:text-2xl font-semibold">{value}</p>
          {change !== undefined && (
            <span
              className={cn(
                'flex items-center text-xs sm:text-sm font-medium',
                isPositive && 'text-success',
                isNegative && 'text-error',
                !isPositive && !isNegative && 'text-muted-foreground'
              )}
            >
              {isPositive ? (
                <TrendingUp className="mr-0.5 h-3 w-3 sm:h-4 sm:w-4" />
              ) : isNegative ? (
                <TrendingDown className="mr-0.5 h-3 w-3 sm:h-4 sm:w-4" />
              ) : null}
              {isPositive && '+'}
              {change.toFixed(1)}%
            </span>
          )}
        </div>
        {changeLabel && (
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-muted-foreground">{changeLabel}</p>
        )}
      </CardContent>
    </Card>
  )
}
