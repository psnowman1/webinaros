import { useState } from 'react'
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  isToday,
} from 'date-fns'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'

export interface DateRange {
  start: Date
  end: Date
}

type PresetKey = 'today' | 'yesterday' | '7days' | '30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'all' | 'custom'

interface Preset {
  label: string
  getValue: () => DateRange | null
}

const presets: Record<PresetKey, Preset> = {
  today: {
    label: 'Today',
    getValue: () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return { start: today, end: new Date() }
    },
  },
  yesterday: {
    label: 'Yesterday',
    getValue: () => {
      const yesterday = subDays(new Date(), 1)
      yesterday.setHours(0, 0, 0, 0)
      const end = subDays(new Date(), 1)
      end.setHours(23, 59, 59, 999)
      return { start: yesterday, end }
    },
  },
  '7days': {
    label: 'Last 7 Days',
    getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }),
  },
  '30days': {
    label: 'Last 30 Days',
    getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }),
  },
  thisMonth: {
    label: 'This Month',
    getValue: () => ({ start: startOfMonth(new Date()), end: new Date() }),
  },
  lastMonth: {
    label: 'Last Month',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1)
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }
    },
  },
  thisYear: {
    label: 'This Year',
    getValue: () => ({ start: startOfYear(new Date()), end: new Date() }),
  },
  lastYear: {
    label: 'Last Year',
    getValue: () => {
      const lastYear = new Date()
      lastYear.setFullYear(lastYear.getFullYear() - 1)
      return { start: startOfYear(lastYear), end: endOfMonth(new Date(lastYear.getFullYear(), 11, 31)) }
    },
  },
  all: {
    label: 'All Time',
    getValue: () => null,
  },
  custom: {
    label: 'Custom Range',
    getValue: () => null,
  },
}

interface DateRangePickerProps {
  value: DateRange | null
  onChange: (range: DateRange | null) => void
  presetKeys?: PresetKey[]
  className?: string
}

export function DateRangePicker({
  value,
  onChange,
  presetKeys = ['today', 'yesterday', '7days', '30days', 'thisMonth', 'lastMonth', 'thisYear', 'lastYear', 'all', 'custom'],
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [leftMonth, setLeftMonth] = useState(subMonths(new Date(), 1))
  const [rightMonth, setRightMonth] = useState(new Date())
  const [selectionStart, setSelectionStart] = useState<Date | null>(null)
  const [tempRange, setTempRange] = useState<DateRange | null>(value)

  const handlePresetClick = (key: PresetKey) => {
    if (key === 'custom') {
      setShowCalendar(true)
      return
    }
    const range = presets[key].getValue()
    setTempRange(range)
    onChange(range)
    setSelectionStart(null)
    setShowCalendar(false)
    setIsOpen(false)
  }

  const handleDayClick = (day: Date) => {
    if (!selectionStart) {
      setSelectionStart(day)
      setTempRange({ start: day, end: day })
    } else {
      const start = day < selectionStart ? day : selectionStart
      const end = day < selectionStart ? selectionStart : day
      setTempRange({ start, end })
      setSelectionStart(null)
    }
  }

  const handleApply = () => {
    if (tempRange) {
      onChange(tempRange)
    }
    setIsOpen(false)
  }

  const handleCancel = () => {
    setTempRange(value)
    setSelectionStart(null)
    setShowCalendar(false)
    setIsOpen(false)
  }

  const getDisplayValue = () => {
    if (!value) return 'All time'

    for (const key of presetKeys) {
      if (key === 'custom') continue
      const presetValue = presets[key].getValue()
      if (!presetValue && !value) return presets[key].label
      if (presetValue && value) {
        const daysDiff = Math.round((value.end.getTime() - value.start.getTime()) / (1000 * 60 * 60 * 24))
        const presetDaysDiff = Math.round((presetValue.end.getTime() - presetValue.start.getTime()) / (1000 * 60 * 60 * 24))
        if (Math.abs(daysDiff - presetDaysDiff) <= 1) {
          return presets[key].label
        }
      }
    }

    return `${format(value.start, 'MMM d')} - ${format(value.end, 'MMM d, yyyy')}`
  }

  const getSelectedPreset = (): PresetKey | null => {
    if (!value) return 'all'

    const daysDiff = Math.round((value.end.getTime() - value.start.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff <= 1) return 'today'
    if (daysDiff >= 6 && daysDiff <= 8) return '7days'
    if (daysDiff >= 29 && daysDiff <= 31) return '30days'

    return 'custom'
  }

  const selectedPreset = getSelectedPreset()

  const getCalendarDays = (month: Date) => {
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(month)),
      end: endOfWeek(endOfMonth(month)),
    })
  }

  const isInRange = (day: Date) => {
    const range = tempRange || value
    if (!range) return false
    return isWithinInterval(day, { start: range.start, end: range.end })
  }

  const isRangeStart = (day: Date) => {
    const range = tempRange || value
    if (!range) return false
    return isSameDay(day, range.start)
  }

  const isRangeEnd = (day: Date) => {
    const range = tempRange || value
    if (!range) return false
    return isSameDay(day, range.end)
  }

  const renderCalendar = (month: Date, showPrevArrow: boolean, showNextArrow: boolean) => {
    const days = getCalendarDays(month)

    return (
      <div className="w-[280px]">
        <div className="flex items-center justify-between mb-3 px-1">
          {showPrevArrow ? (
            <button
              onClick={() => {
                setLeftMonth(subMonths(leftMonth, 1))
                setRightMonth(subMonths(rightMonth, 1))
              }}
              className="p-1.5 hover:bg-muted rounded-full transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : (
            <div className="w-7" />
          )}
          <span className="text-sm font-semibold text-foreground">
            {format(month, 'MMM yyyy')}
          </span>
          {showNextArrow ? (
            <button
              onClick={() => {
                setLeftMonth(addMonths(leftMonth, 1))
                setRightMonth(addMonths(rightMonth, 1))
              }}
              className="p-1.5 hover:bg-muted rounded-full transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : (
            <div className="w-7" />
          )}
        </div>

        <div className="grid grid-cols-7 mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div key={day} className="text-xs text-muted-foreground font-medium py-2 text-center">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const inCurrentMonth = isSameMonth(day, month)
            const inRange = isInRange(day)
            const rangeStart = isRangeStart(day)
            const rangeEnd = isRangeEnd(day)
            const today = isToday(day)

            return (
              <button
                key={idx}
                onClick={() => handleDayClick(day)}
                disabled={!inCurrentMonth}
                className={cn(
                  'h-9 w-full text-sm transition-all relative flex items-center justify-center',
                  !inCurrentMonth && 'text-muted-foreground/30 cursor-default',
                  inCurrentMonth && !inRange && 'text-foreground hover:bg-muted',
                  inRange && !rangeStart && !rangeEnd && 'bg-primary/10 text-foreground',
                  rangeStart && 'bg-primary text-primary-foreground rounded-l-full',
                  rangeEnd && 'bg-primary text-primary-foreground rounded-r-full',
                  rangeStart && rangeEnd && 'rounded-full',
                  today && !inRange && 'font-semibold text-primary',
                )}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('justify-between gap-2 font-normal min-w-[140px]', className)}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{getDisplayValue()}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-popover text-popover-foreground shadow-xl rounded-xl border border-border overflow-hidden"
        align="end"
        sideOffset={8}
      >
        <div className="flex">
          {/* Presets sidebar */}
          <div className={cn("py-2", showCalendar ? "border-r border-border w-[140px]" : "w-[160px]")}>
            <div className="flex flex-col">
              {presetKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => handlePresetClick(key)}
                  className={cn(
                    'w-full text-left px-4 py-2 text-sm transition-colors',
                    'hover:bg-muted',
                    (selectedPreset === key || (key === 'custom' && showCalendar)) ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                >
                  {presets[key].label}
                </button>
              ))}
            </div>
          </div>

          {/* Calendars - only show when custom is selected */}
          {showCalendar && (
            <div className="p-4">
              <div className="flex gap-6">
                {renderCalendar(leftMonth, true, false)}
                {renderCalendar(rightMonth, false, true)}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  {tempRange ? (
                    `${format(tempRange.start, 'MM/dd/yyyy')} - ${format(tempRange.end, 'MM/dd/yyyy')}`
                  ) : (
                    'Select a date range'
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApply}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
