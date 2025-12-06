import { supabase } from './supabaseClient'
import type { Activity, RecordItem, RunningRecord } from './types'

const STORAGE_KEYS = {
  activities: 'lyubi.activities',
  records: 'lyubi.records',
  runningRecord: 'lyubi.runningRecord',
} as const

const ACTIVITIES_TABLE = 'activities'
const RECORDS_TABLE = 'records'

type ActivityRow = {
  id: string
  name: string
  icon: string | null
  color: string | null
  created_at: string
  updated_at: string
}

const mapRowToActivity = (row: ActivityRow): Activity => ({
  id: row.id,
  name: row.name,
  icon: row.icon ?? undefined,
  color: row.color ?? undefined,
  createdAt: Date.parse(row.created_at),
  updatedAt: Date.parse(row.updated_at),
})

const mapActivityToRow = (activity: Activity): ActivityRow => ({
  id: activity.id,
  name: activity.name,
  icon: activity.icon ?? null,
  color: activity.color ?? null,
  created_at: new Date(activity.createdAt).toISOString(),
  updated_at: new Date(activity.updatedAt).toISOString(),
})

type RecordRow = {
  id: string
  activity_id: string
  date: string
  start_time: string
  end_time: string
  remark?: string | null
  created_at: string
  updated_at: string
}

const padTime = (input: string) => (input.length === 5 ? `${input}:00` : input)

const mapRowToRecord = (row: RecordRow): RecordItem => {
  const startMs = Date.parse(`${row.date}T${padTime(row.start_time)}`)
  const endMs = Date.parse(`${row.date}T${padTime(row.end_time)}`)
  const safeStart = Number.isFinite(startMs) ? startMs : Date.now()
  const safeEnd = Number.isFinite(endMs) ? endMs : safeStart
  const durationSeconds = Math.max(1, Math.floor(Math.max(0, safeEnd - safeStart) / 1000))

  return {
    id: row.id,
    activityId: row.activity_id,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    start: safeStart,
    end: safeEnd,
    duration: durationSeconds,
    remark: row.remark ?? undefined,
    createdAt: Date.parse(row.created_at),
    updatedAt: Date.parse(row.updated_at),
  }
}

const formatDateKeyFromMs = (value: number) => {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatTimeFromMs = (value: number) => {
  const date = new Date(value)
  const hh = `${date.getHours()}`.padStart(2, '0')
  const mm = `${date.getMinutes()}`.padStart(2, '0')
  return `${hh}:${mm}`
}

const mapRecordToRow = (record: RecordItem): RecordRow => {
  const createdAt = record.createdAt ?? Date.now()
  const updatedAt = record.updatedAt ?? createdAt

  const startMs =
    record.start ??
    (record.date && record.startTime ? Date.parse(`${record.date}T${padTime(record.startTime)}`) : undefined) ??
    Date.now()
  const endMs =
    record.end ??
    (record.date && record.endTime ? Date.parse(`${record.date}T${padTime(record.endTime)}`) : undefined) ??
    (record.duration ? startMs + record.duration * 1000 : startMs)

  const date = record.date ?? formatDateKeyFromMs(startMs)
  const startTime = record.startTime ?? formatTimeFromMs(startMs)
  const endTime = record.endTime ?? formatTimeFromMs(endMs)

  return {
    id: record.id,
    activity_id: record.activityId,
    date,
    start_time: startTime,
    end_time: endTime,
    remark: record.remark ?? null,
    created_at: new Date(createdAt).toISOString(),
    updated_at: new Date(updatedAt).toISOString(),
  }
}

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

export async function fetchActivitiesFromSupabase(): Promise<Activity[]> {
  const { data, error } = await supabase.from(ACTIVITIES_TABLE).select('*').order('created_at', { ascending: true }).returns<ActivityRow[]>()

  if (error) {
    console.error('Failed to fetch activities from Supabase', error)
    throw error
  }
  if (!data) return []
  return data.map(mapRowToActivity)
}

export async function upsertActivitiesToSupabase(list: Activity[]): Promise<Activity[]> {
  if (list.length === 0) return []
  const payload = list.map(mapActivityToRow)
  const { data, error } = await supabase
    .from(ACTIVITIES_TABLE)
    .upsert(payload, { onConflict: 'id' })
    .select()
    .returns<ActivityRow[]>()

  if (error) {
    console.error('Failed to upsert activities to Supabase', error)
    throw error
  }
  const rows = data && data.length > 0 ? data : payload
  return rows.map(mapRowToActivity)
}

export async function deleteActivity(id: string): Promise<void> {
  try {
    const { error } = await supabase.from(ACTIVITIES_TABLE).delete().eq('id', id)
    if (error) throw error
  } catch (error) {
    console.error(`Failed to delete activity ${id} from Supabase`, error)
  }
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

export async function fetchRecordsByDate(date: string): Promise<RecordItem[]> {
  const { data, error } = await supabase.from(RECORDS_TABLE).select('*').eq('date', date).order('start_time', { ascending: true }).returns<RecordRow[]>()

  if (error) {
    console.error('Failed to fetch records from Supabase', error)
    throw error
  }
  if (!data) return []
  return data.map(mapRowToRecord)
}

export async function insertRecord(item: RecordItem): Promise<RecordItem> {
  const payload = mapRecordToRow(item)
  const { data, error } = await supabase.from(RECORDS_TABLE).insert(payload).select().returns<RecordRow[]>().maybeSingle()
  if (error) {
    console.error('Failed to insert record into Supabase', error)
    throw error
  }
  if (!data) return item
  return mapRowToRecord(data)
}

export async function updateRecord(item: RecordItem): Promise<RecordItem> {
  const nextUpdatedAt = Date.now()
  const payload = mapRecordToRow({ ...item, updatedAt: nextUpdatedAt })
  const { data, error } = await supabase
    .from(RECORDS_TABLE)
    .update(payload)
    .eq('id', item.id)
    .select()
    .returns<RecordRow[]>()
    .maybeSingle()
  if (error) {
    console.error('Failed to update record in Supabase', error)
    throw error
  }
  if (!data) return item
  return mapRowToRecord(data)
}

export async function deleteRecord(id: string): Promise<void> {
  try {
    const { error } = await supabase.from(RECORDS_TABLE).delete().eq('id', id)
    if (error) throw error
  } catch (error) {
    console.error(`Failed to delete record ${id} from Supabase`, error)
  }
}
