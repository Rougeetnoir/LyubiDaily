import { useMemo, useState } from 'react'
import type { Activity, RecordItem } from '@/types'
import { formatClock, formatDuration } from '@/timeUtils'
import { cn } from '@/lib/utils'

const MINUTES_IN_DAY = 24 * 60

const normalizeHexColor = (input?: string) => {
  if (!input) return undefined
  let hex = input.trim()
  if (!hex) return undefined
  if (!hex.startsWith('#')) hex = `#${hex}`
  const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
  if (!hexRegex.test(hex)) return undefined
  if (hex.length === 4) {
    hex = `#${hex
      .slice(1)
      .split('')
      .map((ch) => `${ch}${ch}`)
      .join('')}`
  }
  return hex.toUpperCase()
}

const getAlphaColor = (input: string | undefined, alpha: number) => {
  const hex = normalizeHexColor(input)
  if (!hex) return undefined
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const getMinutesSinceMidnight = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60
}

interface TimeBarViewProps {
  entries: RecordItem[]
  activities: Activity[]
  className?: string
}

export function TimeBarView({ entries, activities, className }: TimeBarViewProps) {
  const activityMap = useMemo(() => {
    const map = new Map<string, Activity>()
    for (const activity of activities) {
      map.set(activity.id, activity)
    }
    return map
  }, [activities])

  const segments = useMemo(() => {
    return entries
      .map((entry) => {
        const activity = activityMap.get(entry.activityId)
        const startMinutes = Math.max(0, Math.min(MINUTES_IN_DAY, getMinutesSinceMidnight(entry.start)))
        const endTimestamp = entry.end ?? entry.start + entry.duration * 1000
        const endMinutes = Math.max(0, Math.min(MINUTES_IN_DAY, getMinutesSinceMidnight(endTimestamp)))
        const widthPct = ((endMinutes - startMinutes) / MINUTES_IN_DAY) * 100
        if (widthPct <= 0) return null
        const startPct = (startMinutes / MINUTES_IN_DAY) * 100
        const baseColor = getAlphaColor(activity?.color, 0.2) ?? 'rgba(0,0,0,0.2)'
        const hoverColor = getAlphaColor(activity?.color, 0.26) ?? 'rgba(0,0,0,0.26)'
        const labelParts = [
          `${activity?.icon ? `${activity.icon} ` : ''}${activity?.name ?? '未知活动'}`,
          `${formatClock(entry.start)}–${formatClock(endTimestamp)} (${formatDuration(entry.duration)})`,
        ]
        if (entry.remark) {
          labelParts.push(`备注：${entry.remark}`)
        }
        return {
          id: entry.id,
          startPct,
          widthPct,
          baseColor,
          hoverColor,
          label: labelParts.join('\n'),
        }
      })
      .filter((segment): segment is NonNullable<typeof segment> => Boolean(segment))
      .sort((a, b) => a.startPct - b.startPct)
  }, [activityMap, entries])

  const ticks = useMemo(() => {
    const list: { pct: number; strong: boolean; id: string }[] = []
    for (let hour = 0; hour <= 24; hour += 2) {
      list.push({
        pct: (hour / 24) * 100,
        strong: hour % 6 === 0,
        id: `tick-${hour}`,
      })
    }
    return list
  }, [])

  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div
      className={cn(
        'relative h-[22px] w-full overflow-hidden rounded-[12px] border border-[#E6E6E6]',
        className,
      )}
      style={{
        background: 'linear-gradient(90deg, #f7f7f7 0%, #f7f7f7 50%, #f4f4f4 100%)',
      }}
    >
      {ticks.map((tick) => (
        <div
          key={tick.id}
          className="pointer-events-none absolute top-[20%] bottom-[20%] w-px"
          style={{
            left: `${tick.pct}%`,
            backgroundColor: tick.strong ? '#dcdcdc' : 'rgba(0,0,0,0.05)',
          }}
          aria-hidden
        />
      ))}
      {segments.map((segment) => (
        <div
          key={segment.id}
          title={segment.label}
          className="absolute inset-y-0 cursor-pointer border-r border-[rgba(0,0,0,0.08)] transition"
          style={{
            left: `${segment.startPct}%`,
            width: `${segment.widthPct}%`,
            minWidth: '2px',
            backgroundColor: hoveredId === segment.id ? segment.hoverColor : segment.baseColor,
          }}
          onMouseEnter={() => setHoveredId(segment.id)}
          onMouseLeave={() => setHoveredId((prev) => (prev === segment.id ? null : prev))}
          aria-label={segment.label}
        />
      ))}
    </div>
  )
}
