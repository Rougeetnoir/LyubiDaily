import { describe, expect, test } from 'vitest'
import { filterRecordsByDate, formatDateKey, isSameDay, startOfDay } from '../timeUtils'
import type { RecordItem } from '../types'

const makeRecord = (overrides: Partial<RecordItem>): RecordItem => ({
  id: overrides.id ?? crypto.randomUUID(),
  activityId: overrides.activityId ?? 'a1',
  start: overrides.start ?? Date.now(),
  end: overrides.end ?? Date.now(),
  duration: overrides.duration ?? 60,
  createdAt: overrides.createdAt ?? Date.now(),
  ...overrides,
})

describe('timeUtils', () => {
  test('isSameDay matches records on the same calendar day (local time)', () => {
    const a = new Date('2024-12-01T08:00:00')
    const b = new Date('2024-12-01T23:59:59')
    const c = new Date('2024-12-02T00:00:00')
    expect(isSameDay(a, b)).toBe(true)
    expect(isSameDay(a, c)).toBe(false)
  })

  test('formatDateKey returns YYYY-MM-DD', () => {
    const day = new Date('2024-07-09T12:34:56Z')
    expect(formatDateKey(day)).toBe('2024-07-09')
  })

  test('startOfDay zeroes time components', () => {
    const day = new Date('2024-07-09T12:34:56Z')
    const start = startOfDay(day)
    expect(start.getFullYear()).toBe(2024)
    expect(start.getMonth()).toBe(6)
    expect(start.getDate()).toBe(9)
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
    expect(start.getSeconds()).toBe(0)
    expect(start.getMilliseconds()).toBe(0)
  })

  test('filterRecordsByDate filters by record.date when present', () => {
    const target = new Date('2024-07-09T10:00:00Z')
    const records: RecordItem[] = [
      makeRecord({ id: '1', date: '2024-07-09' }),
      makeRecord({ id: '2', date: '2024-07-10' }),
      makeRecord({ id: '3', date: '2024-07-09' }),
    ]
    const result = filterRecordsByDate(records, target)
    expect(result.map((r) => r.id)).toEqual(['1', '3'])
  })

  test('filterRecordsByDate falls back to start timestamp when date missing', () => {
    const target = new Date('2024-07-09T00:00:00')
    const records: RecordItem[] = [
      makeRecord({ id: '1', start: new Date('2024-07-09T08:00:00').getTime() }),
      makeRecord({ id: '2', start: new Date('2024-07-10T08:00:00').getTime() }),
    ]
    const result = filterRecordsByDate(records, target)
    expect(result.map((r) => r.id)).toEqual(['1'])
  })
})
