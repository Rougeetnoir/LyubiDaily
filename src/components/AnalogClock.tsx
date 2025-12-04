import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface AnalogClockProps {
  className?: string
}

const CLOCK_SIZE = 96
const CENTER = CLOCK_SIZE / 2

const rad = (deg: number) => ((deg - 90) * Math.PI) / 180

const getHandCoordinates = (length: number, angleDeg: number) => {
  return {
    x: CENTER + length * Math.cos(rad(angleDeg)),
    y: CENTER + length * Math.sin(rad(angleDeg)),
  }
}

export function AnalogClock({ className }: AnalogClockProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const hours = now.getHours()
  const minutes = now.getMinutes()
  const seconds = now.getSeconds()

  const hourAngle = (hours % 12) * 30 + minutes * 0.5
  const minuteAngle = minutes * 6
  const secondAngle = seconds * 6

  const hourHand = getHandCoordinates(28, hourAngle)
  const minuteHand = getHandCoordinates(36, minuteAngle)
  const secondHand = getHandCoordinates(42, secondAngle)

  return (
    <div
      className={cn(
        'inline-flex h-[96px] w-[96px] items-center justify-center rounded-full border-2 border-[#E0E0E0] bg-white',
        className,
      )}
    >
      <svg width={CLOCK_SIZE} height={CLOCK_SIZE} viewBox={`0 0 ${CLOCK_SIZE} ${CLOCK_SIZE}`}>
        <circle cx={CENTER} cy={CENTER} r={46} fill="none" stroke="#E0E0E0" strokeWidth={2} />
        <line
          x1={CENTER}
          y1={CENTER}
          x2={hourHand.x}
          y2={hourHand.y}
          stroke="#555555"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <line
          x1={CENTER}
          y1={CENTER}
          x2={minuteHand.x}
          y2={minuteHand.y}
          stroke="#777777"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <line
          x1={CENTER}
          y1={CENTER}
          x2={secondHand.x}
          y2={secondHand.y}
          stroke="#C65B5B"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeOpacity={0.85}
        />
        <circle cx={CENTER} cy={CENTER} r={2} fill="#555555" />
      </svg>
    </div>
  )
}
