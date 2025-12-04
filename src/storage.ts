import type { Activity, RecordItem, RunningRecord } from './types'

const STORAGE_KEYS = {
  activities: 'lyubi.activities',
  records: 'lyubi.records',
  runningRecord: 'lyubi.runningRecord',
} as const

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadActivities(): Activity[] {
  const stored = safeParse<Activity[]>(localStorage.getItem(STORAGE_KEYS.activities), [])
  if (stored.length > 0) return stored

  const now = Date.now()
  const defaults: Activity[] = [
    { id: crypto.randomUUID(), name: '工作', icon: '💼', color: '#F97316', createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), name: '阅读', icon: '📚', color: '#22C55E', createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), name: '学习', icon: '🧠', color: '#06B6D4', createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), name: '健身', icon: '🏃‍♂️', color: '#EF4444', createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), name: '家务', icon: '🏠', color: '#A855F7', createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), name: '休闲', icon: '🎮', color: '#3B82F6', createdAt: now, updatedAt: now },
  ]
  saveActivities(defaults)
  return defaults
}

export function saveActivities(list: Activity[]) {
  localStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(list))
}

export function loadRecords(): RecordItem[] {
  return safeParse<RecordItem[]>(localStorage.getItem(STORAGE_KEYS.records), [])
}

export function saveRecords(list: RecordItem[]) {
  localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(list))
}

export function loadRunningRecord(): RunningRecord | null {
  return safeParse<RunningRecord | null>(localStorage.getItem(STORAGE_KEYS.runningRecord), null)
}

export function saveRunningRecord(record: RunningRecord | null) {
  if (!record) {
    localStorage.removeItem(STORAGE_KEYS.runningRecord)
    return
  }
  localStorage.setItem(STORAGE_KEYS.runningRecord, JSON.stringify(record))
}
