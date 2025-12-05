import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { AnalogClock } from '@/components/AnalogClock'
import { EditEntryModal } from '@/components/EditEntryModal'
import { ManualEntryModal } from '@/components/ManualEntryModal'
import { TimeBarView } from '@/components/TimeBarView'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { Activity, RecordItem, RunningRecord } from './types'
import {
  loadActivities,
  loadRecords,
  loadRunningRecord,
  saveActivities,
  saveRecords,
  saveRunningRecord,
  fetchActivitiesFromSupabase,
  upsertActivitiesToSupabase,
  fetchRecordsByDate,
  insertRecord,
  updateRecord,
  deleteRecord,
  deleteActivity,
} from './storage'
import {
  filterRecordsByDate,
  formatClock,
  formatDateKey,
  formatDuration,
  formatDurationHMS,
  isSameDay,
  startOfDay,
} from './timeUtils'

type TabKey = 'summary' | 'timeline'

type ManualEntryPayload = {
  activityId: string
  start: number
  end: number
  remark?: string
}

const COLOR_PRESETS = [
  '#FDCEDF',
  '#DBE2EF',
  '#DCD6F7',
  '#EEE3CB',
  '#D7C0AE',
  '#967E76',
  '#BDD2B6',
  '#F67280',
  '#E0F9B5',
  '#FEFDCA',
] as const

const EMOJI_PRESETS = ['💼', '📚', '🧠', '🏃‍♂️', '🏠', '🎮', '✍️', '🧩', '🧘‍♀️', '🧑‍💻'] as const

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

const padTime = (time: string) => (time.length === 5 ? `${time}:00` : time)

const parseDateTimeToMs = (dateKey?: string, time?: string) => {
  if (!dateKey || !time) return undefined
  const parsed = Date.parse(`${dateKey}T${padTime(time)}`)
  return Number.isFinite(parsed) ? parsed : undefined
}

const deriveRecordFields = (record: RecordItem): RecordItem => {
  const startMs = record.start ?? parseDateTimeToMs(record.date, record.startTime) ?? Date.now()
  const endMs =
    record.end ??
    parseDateTimeToMs(record.date, record.endTime) ??
    (record.duration ? startMs + record.duration * 1000 : startMs)
  const durationSeconds = Math.max(1, Math.floor(Math.max(0, endMs - startMs) / 1000))
  const dateKey = record.date ?? formatDateKey(startMs)
  const startTime = record.startTime ?? formatClock(startMs)
  const endTime = record.endTime ?? formatClock(endMs)

  return {
    ...record,
    start: startMs,
    end: endMs,
    duration: durationSeconds,
    date: dateKey,
    startTime,
    endTime,
  }
}

const ensureRecordsDerived = (list: RecordItem[]) => list.map(deriveRecordFields)

const getRecordDateKey = (record: RecordItem) => record.date ?? (record.start ? formatDateKey(record.start) : '')

const replaceRecordsForDate = (allRecords: RecordItem[], dateKey: string, dateRecords: RecordItem[]) => {
  const derived = ensureRecordsDerived(dateRecords)
  const others = allRecords.filter((record) => getRecordDateKey(record) !== dateKey)
  return [...others, ...derived]
}

const useSyncBanner = () => {
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const syncMessageTimer = useRef<number | null>(null)

  const showSyncMessage = (message = 'Cloud sync failed, using local data.') => {
    if (syncMessageTimer.current) {
      window.clearTimeout(syncMessageTimer.current)
    }
    setSyncMessage(message)
    syncMessageTimer.current = window.setTimeout(() => setSyncMessage(null), 4000)
  }

  useEffect(() => {
    return () => {
      if (syncMessageTimer.current) {
        window.clearTimeout(syncMessageTimer.current)
      }
    }
  }, [])

  return { syncMessage, showSyncMessage }
}

function App() {
  const [activities, setActivities] = useState<Activity[]>(() => loadActivities())
  const [records, setRecords] = useState<RecordItem[]>(() => ensureRecordsDerived(loadRecords()))
  const [runningRecord, setRunningRecord] = useState<RunningRecord | null>(() => loadRunningRecord())
  const [activeTab, setActiveTab] = useState<TabKey>('summary')
  const [selectedActivityId, setSelectedActivityId] = useState<string>('')
  const [remark, setRemark] = useState('')
  const [tick, setTick] = useState(() => Date.now())
  const [isAddingActivity, setIsAddingActivity] = useState(false)
  const [newActivityName, setNewActivityName] = useState('')
  const [newActivityIcon, setNewActivityIcon] = useState('')
  const [newActivityColor, setNewActivityColor] = useState('')
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [isActivityManagerOpen, setIsActivityManagerOpen] = useState(false)
  const [activityDrafts, setActivityDrafts] = useState<Activity[]>([])
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false)
  const [isEditEntryOpen, setIsEditEntryOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<RecordItem | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const datePickerRef = useRef<HTMLDivElement | null>(null)
  const { syncMessage, showSyncMessage } = useSyncBanner()
  const [isInitialized, setIsInitialized] = useState(false)
  const lastSyncedDateRef = useRef<string | null>(null)
  const [openRecordMenuId, setOpenRecordMenuId] = useState<string | null>(null)

  const persistRecord = async (record: RecordItem) => {
    const derived = deriveRecordFields(record)
    const dateKey = getRecordDateKey(derived)
    setRecords((prev) => [...prev.filter((r) => r.id !== derived.id), derived])

    try {
      const remote = await insertRecord(derived)
      const normalized = deriveRecordFields(remote)
      const normalizedDateKey = getRecordDateKey(normalized)
      setRecords((prev) => {
        const withoutTemp = prev.filter((r) => r.id !== derived.id)
        const merged = replaceRecordsForDate(withoutTemp, normalizedDateKey, [normalized])
        saveRecords(merged)
        return merged
      })
    } catch (error) {
      console.error('Failed to sync record to Supabase', error)
      showSyncMessage()
      setRecords((prev) => {
        saveRecords(prev)
        return prev
      })
    }
  }
  const selectedDateKey = useMemo(() => formatDateKey(selectedDate), [selectedDate])
  const recordsForSelectedDate = useMemo(
    () => filterRecordsByDate(records, selectedDate),
    [records, selectedDate],
  )

  const runningMatchesSelectedDate = useMemo(() => {
    if (!runningRecord) return false
    return runningRecord.dateKey ? runningRecord.dateKey === selectedDateKey : isSameDay(runningRecord.start, selectedDate)
  }, [runningRecord, selectedDate, selectedDateKey])

  const runningDurationSeconds = useMemo(() => {
    if (!runningRecord) return 0
    const base = runningRecord.realStart ?? runningRecord.start
    return Math.max(0, Math.floor((tick - base) / 1000))
  }, [runningRecord, tick])

  useEffect(() => {
    if (!runningRecord) return
    const id = window.setInterval(() => {
      setTick(Date.now())
    }, 1000)
    return () => window.clearInterval(id)
  }, [runningRecord])

  useEffect(() => {
    if (!isDatePickerOpen) return
    const handleClick = (event: MouseEvent) => {
      if (!datePickerRef.current) return
      if (!datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isDatePickerOpen])

  useEffect(() => {
    if (isInitialized) return
    const bootstrap = async () => {
      const localActivities = loadActivities()
      setActivities(localActivities)

      let nextActivities = localActivities
      try {
        const remoteActivities = await fetchActivitiesFromSupabase()
        if (remoteActivities.length > 0) {
          nextActivities = remoteActivities
        } else {
          const synced = await upsertActivitiesToSupabase(localActivities)
          nextActivities = synced
        }
        saveActivities(nextActivities)
      } catch (error) {
        console.error('Failed to load activities from Supabase, using local fallback', error)
        showSyncMessage()
      }
      setActivities(nextActivities)
      setSelectedActivityId((prev) => (nextActivities.some((a) => a.id === prev) ? prev : ''))

      const localRecords = ensureRecordsDerived(loadRecords())
      let nextRecords = localRecords
      const initialDateKey = formatDateKey(selectedDate)
      try {
        const remoteRecords = await fetchRecordsByDate(initialDateKey)
        const derivedRemote = ensureRecordsDerived(remoteRecords)
        nextRecords = replaceRecordsForDate(localRecords, initialDateKey, derivedRemote)
        saveRecords(nextRecords)
      } catch (error) {
        console.error('Failed to load records from Supabase, using local fallback for selected date', error)
        showSyncMessage()
        const fallbackForDate = ensureRecordsDerived(filterRecordsByDate(localRecords, selectedDate))
        nextRecords = replaceRecordsForDate(localRecords, initialDateKey, fallbackForDate)
      }
      setRecords(nextRecords)
      lastSyncedDateRef.current = initialDateKey
      setIsInitialized(true)
    }
    bootstrap()
  }, [isInitialized, selectedDate])

  useEffect(() => {
    if (!isInitialized) return
    const dateKey = formatDateKey(selectedDate)
    if (lastSyncedDateRef.current === dateKey) return
    const syncRecordsForDate = async () => {
      try {
        const remote = await fetchRecordsByDate(dateKey)
        const derivedRemote = ensureRecordsDerived(remote)
        setRecords((prev) => {
          const merged = replaceRecordsForDate(prev, dateKey, derivedRemote)
          saveRecords(merged)
          return merged
        })
        lastSyncedDateRef.current = dateKey
      } catch (error) {
        console.error('Failed to load records for date from Supabase, using local fallback', error)
        showSyncMessage()
        const fallback = ensureRecordsDerived(filterRecordsByDate(loadRecords(), selectedDate))
        setRecords((prev) => replaceRecordsForDate(prev, dateKey, fallback))
        lastSyncedDateRef.current = dateKey
      }
    }
    syncRecordsForDate()
  }, [isInitialized, selectedDate])

  const selectedDateTotalSeconds = useMemo(() => {
    const base = recordsForSelectedDate.reduce((sum, r) => sum + r.duration, 0)
    return base + (runningMatchesSelectedDate ? runningDurationSeconds : 0)
  }, [recordsForSelectedDate, runningMatchesSelectedDate, runningDurationSeconds])

  const selectedDateLabel = useMemo(
    () =>
      selectedDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [selectedDate],
  )

  const isFutureSelectedDate = useMemo(() => startOfDay(selectedDate).getTime() > startOfDay(new Date()).getTime(), [selectedDate])

  const resetActivityForm = () => {
    setNewActivityName('')
    setNewActivityIcon('')
    setNewActivityColor('')
    setIsEmojiPickerOpen(false)
  }

  const handleSaveManualEntry = async ({ activityId, start, end, remark }: ManualEntryPayload) => {
    const now = Date.now()
    const duration = Math.max(1, Math.floor((end - start) / 1000))
    const record = {
      id: crypto.randomUUID(),
      activityId,
      start,
      end,
      duration,
      remark,
      createdAt: now,
      updatedAt: now,
      date: formatDateKey(start),
      startTime: formatClock(start),
      endTime: formatClock(end),
    }
    await persistRecord(record)
    setIsManualEntryOpen(false)
  }

  const handleUpdateEntry = async ({ id, activityId, start, end, remark }: { id: string } & ManualEntryPayload) => {
    const now = Date.now()
    const existing = records.find((r) => r.id === id)
    const updated = deriveRecordFields({
      ...existing,
      id,
      activityId,
      start,
      end,
      duration: Math.max(1, Math.floor((end - start) / 1000)),
      remark,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      date: formatDateKey(start),
      startTime: formatClock(start),
      endTime: formatClock(end),
    })
    const newDateKey = getRecordDateKey(updated)

    setRecords((prev) => replaceRecordsForDate(prev.filter((r) => r.id !== id), newDateKey, [updated]))

    try {
      const remote = await updateRecord(updated)
      const normalized = deriveRecordFields(remote)
      setRecords((prev) => {
        const withoutOld = prev.filter((r) => r.id !== id)
        const merged = replaceRecordsForDate(withoutOld, getRecordDateKey(normalized), [normalized])
        saveRecords(merged)
        return merged
      })
    } catch (error) {
      console.error('Failed to update record in Supabase', error)
        showSyncMessage()
      setRecords((prev) => {
        saveRecords(prev)
        return prev
      })
    }
    setIsEditEntryOpen(false)
    setEditingEntry(null)
  }

  const handleOpenEditEntry = (entry: RecordItem) => {
    setEditingEntry(entry)
    setIsEditEntryOpen(true)
  }

  const handleDeleteEntry = async (entry: RecordItem) => {
    const confirmed = window.confirm('Delete this entry?\nThis action cannot be undone.')
    if (!confirmed) return
    const dateKey = getRecordDateKey(entry)
    setOpenRecordMenuId(null)
    setIsEditEntryOpen(false)
    setEditingEntry(null)

    setRecords((prev) => replaceRecordsForDate(prev.filter((r) => r.id !== entry.id), dateKey, []))
    try {
      await deleteRecord(entry.id)
      setRecords((prev) => {
        saveRecords(prev)
        return prev
      })
    } catch (error) {
      console.error('Failed to delete record from Supabase', error)
      showSyncMessage()
    }
  }

  const closeActivityForm = () => {
    setIsAddingActivity(false)
    resetActivityForm()
  }

  const handleOpenCreateActivity = () => {
    resetActivityForm()
    setIsAddingActivity(true)
  }

  const handleOpenActivityManager = () => {
    setActivityDrafts(activities.map((activity) => ({ ...activity })))
    setIsActivityManagerOpen(true)
  }

  const handleCloseActivityManager = () => {
    setIsActivityManagerOpen(false)
    setActivityDrafts([])
  }

  const handleActivityDraftChange = (id: string, changes: Partial<Activity>) => {
    setActivityDrafts((prev) => prev.map((draft) => (draft.id === id ? { ...draft, ...changes } : draft)))
  }

  const handleSelectDraftColor = (id: string, color: string) => {
    handleActivityDraftChange(id, { color })
  }

  const handleSelectDraftEmoji = (id: string, emoji: string) => {
    handleActivityDraftChange(id, { icon: emoji })
  }

  const handleDeleteActivityDraft = async (id: string) => {
    const confirmed = window.confirm('Delete this activity?\nThis will remove the activity and may also remove any associated records.')
    if (!confirmed) return

    setActivityDrafts((prev) => prev.filter((draft) => draft.id !== id))
    setActivities((prev) => prev.filter((activity) => activity.id !== id))
    setRecords((prev) => {
      const next = prev.filter((record) => record.activityId !== id)
      saveRecords(next)
      return next
    })
    if (selectedActivityId === id) {
      setSelectedActivityId('')
    }
    try {
      await deleteActivity(id)
      setActivities((prev) => {
        saveActivities(prev)
        return prev
      })
    } catch (error) {
      console.error('Failed to delete activity from Supabase', error)
      showSyncMessage()
    }
  }

  const handleSaveActivityDrafts = async () => {
    if (activityDrafts.some((draft) => !draft.name.trim())) {
      window.alert('活动名称不能为空。')
      return
    }

    const now = Date.now()
    const normalizedDrafts = activityDrafts.map((draft) => ({
      ...draft,
      name: draft.name.trim(),
      icon: draft.icon?.trim() || undefined,
      color: normalizeHexColor(draft.color) ?? undefined,
      updatedAt: now,
    }))

    setActivities(normalizedDrafts)
    saveActivities(normalizedDrafts)
    try {
      const synced = await upsertActivitiesToSupabase(normalizedDrafts)
      setActivities(synced)
      saveActivities(synced)
    } catch (error) {
      console.error('Failed to sync activities to Supabase', error)
      showSyncMessage('活动已保存到本地，但同步到 Supabase 失败。')
    }
    setSelectedActivityId((prev) => (normalizedDrafts.some((activity) => activity.id === prev) ? prev : ''))
    handleCloseActivityManager()
  }

  const handleStart = async () => {
    if (!selectedActivityId) {
      window.alert('请选择一个活动再开始计时。')
      return
    }
    if (isFutureSelectedDate) {
      window.alert('无法在未来日期启动计时。')
      return
    }

    const now = Date.now()
    const activity = activities.find((a) => a.id === selectedActivityId)
    if (!activity) {
      window.alert('所选活动不存在，请重试。')
      return
    }

    // 如果已经有正在计时的记录，先补全它
    if (runningRecord) {
      const end = now
      const duration = Math.max(1, Math.floor((end - runningRecord.start) / 1000))
      const finished: RecordItem = {
        id: runningRecord.id,
        activityId: runningRecord.activityId,
        start: runningRecord.start,
        end,
        duration,
        remark: runningRecord.remark,
        createdAt: runningRecord.createdAt,
        updatedAt: now,
        date: runningRecord.dateKey ?? formatDateKey(runningRecord.start),
        startTime: formatClock(runningRecord.start),
        endTime: formatClock(end),
      }
      await persistRecord(finished)
    }

    const currentInstant = new Date()
    const startDateTime = new Date(selectedDate)
    startDateTime.setHours(currentInstant.getHours(), currentInstant.getMinutes(), currentInstant.getSeconds(), currentInstant.getMilliseconds())
    const alignedStart = startDateTime.getTime()
    const id = crypto.randomUUID()
    const newRunning: RunningRecord = {
      id,
      activityId: activity.id,
      start: alignedStart,
      realStart: now,
      dateKey: selectedDateKey,
      remark: remark.trim() || undefined,
      createdAt: now,
    }
    setRunningRecord(newRunning)
    saveRunningRecord(newRunning)
    setRemark('')
  }

  const handleStop = async () => {
    if (!runningRecord) return

    const now = Date.now()
    const elapsedSeconds = Math.max(1, Math.floor((now - (runningRecord.realStart ?? runningRecord.start)) / 1000))
    const end = runningRecord.start + elapsedSeconds * 1000
    const finished: RecordItem = {
      id: runningRecord.id,
      activityId: runningRecord.activityId,
      start: runningRecord.start,
      end,
      duration: elapsedSeconds,
      remark: runningRecord.remark,
      createdAt: runningRecord.createdAt,
      updatedAt: now,
      date: runningRecord.dateKey ?? formatDateKey(runningRecord.start),
      startTime: formatClock(runningRecord.start),
      endTime: formatClock(end),
    }
    await persistRecord(finished)
    setRunningRecord(null)
    saveRunningRecord(null)
  }

  const chronologicalRecords = useMemo(() => {
    return [...recordsForSelectedDate].sort((a, b) => a.start - b.start)
  }, [recordsForSelectedDate])

  const isRunning = Boolean(runningRecord)
  const startButtonDisabled = isRunning ? false : !selectedActivityId || isFutureSelectedDate
  const startButtonClassName = cn(
    'h-10 rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
    isRunning
      ? 'border border-[#FFDBD2] bg-[#FFECE8] text-[#D64545] hover:bg-[#FFE0D8] active:bg-[#FFD6CF]'
      : 'border border-[#D0D0D0] bg-[#F0F0F0] text-[#333333] hover:bg-[#E8E8E8] active:bg-[#DDDDDD]'
  )
  const startButtonTitle = !isRunning && isFutureSelectedDate ? 'Cannot start timer for a future date.' : undefined

  const handleCreateActivity = async () => {
    const name = newActivityName.trim()
    if (!name) {
      window.alert('活动名称不能为空。')
      return
    }

    const now = Date.now()
    const normalizedColor = normalizeHexColor(newActivityColor)
    const icon = newActivityIcon.trim() || undefined

    const next: Activity[] = [
      ...activities,
      {
        id: crypto.randomUUID(),
        name,
        icon,
        color: normalizedColor,
        createdAt: now,
        updatedAt: now,
      },
    ]
    setActivities(next)
    saveActivities(next)
    try {
      const synced = await upsertActivitiesToSupabase(next)
      setActivities(synced)
      saveActivities(synced)
    } catch (error) {
      console.error('Failed to create activity in Supabase', error)
      showSyncMessage('活动已保存到本地，但同步到 Supabase 失败。')
    }
    closeActivityForm()
  }

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        {syncMessage && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            {syncMessage}
          </div>
        )}
        <header className="flex flex-col gap-4 border-b border-[#E5E5E5] py-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 text-left">
            <h1 className="text-[28px] font-bold text-[#1F1F1F]">Daily time ledger</h1>
            <p className="text-base text-[#888888]">
              A lightweight companion to keep Lyubischev-inspired records.
            </p>
          </div>
          <div className="relative flex flex-col items-start text-sm text-[#888888] md:items-end">
            <button
              type="button"
              onClick={() => setIsDatePickerOpen((prev) => !prev)}
              className="text-left text-base font-medium text-[#1F1F1F] hover:text-[#555555]"
            >
              {isSameDay(selectedDate, new Date()) ? `Today · ${selectedDateLabel}` : selectedDateLabel}
            </button>
            <p className="text-sm">Total {formatDuration(selectedDateTotalSeconds)}</p>
            {isDatePickerOpen && (
              <div
                ref={datePickerRef}
                className="absolute right-0 top-full z-20 mt-2 rounded-[12px] border border-[#E0E0E0] bg-white p-3 shadow-lg"
              >
                <Input
                  type="date"
                  value={formatDateKey(selectedDate)}
                  onChange={(event) => {
                    if (!event.target.value) return
                    const next = startOfDay(new Date(event.target.value))
                    setSelectedDate(next)
                    setIsDatePickerOpen(false)
                  }}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </header>

        <section className="flex flex-col gap-3 rounded-[12px] border border-[#E5E5E5] bg-white p-5">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="ghost"
              onClick={handleOpenCreateActivity}
              className="h-9 rounded-lg border border-[#E5E5E5] bg-[#F7F7F7] px-3 py-1.5 text-sm font-medium text-[#1F1F1F] hover:bg-[#F0F0F0]"
            >
              + Add Activity
            </Button>
            <Button
              variant="ghost"
              onClick={handleOpenActivityManager}
              disabled={activities.length === 0}
              className="h-9 rounded-lg border border-[#E5E5E5] bg-[#F7F7F7] px-3 py-1.5 text-sm font-medium text-[#1F1F1F] hover:bg-[#F0F0F0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Edit Activities
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsManualEntryOpen(true)}
              disabled={activities.length === 0}
              className="h-9 rounded-lg border border-[#E5E5E5] bg-[#F7F7F7] px-3 py-1.5 text-sm font-medium text-[#1F1F1F] hover:bg-[#F0F0F0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              + Add Manual Entry
            </Button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex w-full max-w-[380px] flex-col gap-3">
              <Select
                value={selectedActivityId || undefined}
                onValueChange={(value: string) => setSelectedActivityId(value)}
                disabled={activities.length === 0}
              >
                <SelectTrigger className="h-10 w-full rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#333333] shadow-none focus:border-[#C5C5C5] focus:ring-0 focus:ring-offset-0 [&[data-placeholder]]:text-[#A0A0A0]">
                  <SelectValue placeholder={activities.length ? 'Select activity' : 'Add an activity first'} />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="flex items-center gap-2">
                        {a.icon && <span>{a.icon}</span>}
                        <span>{a.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Remark (optional)"
                value={remark}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setRemark(event.target.value)}
                className="h-10 w-full rounded-lg border border-[#E0E0E0] px-3 text-sm text-[#333333] placeholder:text-[#A0A0A0] focus:border-[#C5C5C5] focus:ring-0"
              />
            </div>
            <div className="flex flex-col gap-3 sm:ml-4 sm:w-auto sm:flex-row sm:items-center">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  onClick={isRunning ? handleStop : handleStart}
                  disabled={startButtonDisabled}
                  className={startButtonClassName}
                  title={startButtonTitle}
                >
                  <span className="mr-2 text-base">{isRunning ? '■' : '▶'}</span>
                  {isRunning ? 'Stop' : 'Start'}
                </Button>
                {isRunning && (
                  <span className="text-sm text-[#555555] sm:ml-3">{formatDurationHMS(runningDurationSeconds)}</span>
                )}
              </div>
              <AnalogClock className="sm:ml-6" />
            </div>
          </div>
          {runningRecord && (
            <p className="text-xs text-muted-foreground">
              计时中：
              {activities.find((a) => a.id === runningRecord.activityId)?.name ?? '未知活动'} ·{' '}
              {formatDurationHMS(runningDurationSeconds)}
            </p>
          )}
        </section>

        {isAddingActivity && (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>New activity</CardTitle>
                <CardDescription>Create an activity shortcut with an optional icon and color.</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeActivityForm}
              >
                Close
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="activity-name">Name *</Label>
                  <Input
                    id="activity-name"
                    placeholder="写作、项目 A"
                    value={newActivityName}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setNewActivityName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activity-color">#Color (optional)</Label>
                  <Input
                    id="activity-color"
                    placeholder="#2563eb"
                    value={newActivityColor}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setNewActivityColor(event.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          'h-8 w-8 rounded-full border border-border transition hover:scale-[1.05]',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          newActivityColor?.toLowerCase() === color.toLowerCase() && 'ring-2 ring-ring border-ring',
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewActivityColor(color)}
                        aria-label={`选择颜色 ${color}`}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="activity-icon">Icon</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="activity-icon"
                    placeholder="😊"
                    value={newActivityIcon}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setNewActivityIcon(event.target.value)}
                    className="max-w-[120px]"
                  />
                  <Button variant="outline" size="icon" onClick={() => setIsEmojiPickerOpen((v) => !v)}>
                    😊
                  </Button>
                  {isEmojiPickerOpen && (
                    <div className="relative">
                      <div className="absolute right-0 top-2 z-10 flex max-w-xs flex-wrap gap-1 rounded-md border bg-popover p-2 text-lg shadow-lg">
                        {EMOJI_PRESETS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setNewActivityIcon(emoji)
                              setIsEmojiPickerOpen(false)
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-muted"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleCreateActivity}>Save</Button>
                <Button
                  variant="outline"
                  onClick={closeActivityForm}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isActivityManagerOpen && (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Manage activities</CardTitle>
                <CardDescription>Inline edit names, emoji and colors for all activities.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCloseActivityManager}>
                  Close
                </Button>
                <Button size="sm" onClick={handleSaveActivityDrafts}>
                  Save all
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {activityDrafts.length === 0 ? (
                <p className="text-sm text-muted-foreground">没有可编辑的活动。</p>
              ) : (
                <div className="space-y-3">
                  <div className="hidden grid-cols-[1.5fr_minmax(0,0.6fr)_minmax(0,0.9fr)_auto] gap-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
                    <div>Name</div>
                    <div>Emoji</div>
                    <div>Color</div>
                    <div />
                  </div>
                  {activityDrafts.map((activity) => {
                    const previewColor = normalizeHexColor(activity.color)
                    const rowBackground = getAlphaColor(previewColor, 0.2)
                    const rowBorder = getAlphaColor(previewColor, 0.5)
                    return (
                      <div
                        key={activity.id}
                        className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:grid sm:grid-cols-[1.5fr_minmax(0,0.6fr)_minmax(0,0.9fr)_auto] sm:items-center sm:gap-4"
                        style={{
                          backgroundColor: rowBackground ?? undefined,
                          borderColor: rowBorder ?? undefined,
                        }}
                      >
                        <Input
                          value={activity.name}
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            handleActivityDraftChange(activity.id, { name: event.target.value })
                          }
                          placeholder="Activity name"
                        />
                        <div className="space-y-2">
                          <Input
                            value={activity.icon ?? ''}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              handleActivityDraftChange(activity.id, { icon: event.target.value || undefined })
                            }
                            placeholder="😊"
                            className="sm:max-w-[120px]"
                          />
                          <div className="flex flex-wrap gap-1">
                            {EMOJI_PRESETS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                className={cn(
                                  'inline-flex h-8 w-8 items-center justify-center rounded-md border text-lg transition hover:bg-muted',
                                  activity.icon === emoji && 'border-ring bg-muted ring-2 ring-ring',
                                )}
                                onClick={() => handleSelectDraftEmoji(activity.id, emoji)}
                                aria-label={`选择表情 ${emoji}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={activity.color ?? ''}
                              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                handleActivityDraftChange(activity.id, { color: event.target.value })
                              }
                              placeholder="#2563eb"
                              className="sm:max-w-[160px]"
                            />
                            <span
                              className="h-8 w-8 rounded-full border"
                              style={{ backgroundColor: previewColor ?? 'transparent' }}
                              aria-label={`当前颜色 ${previewColor ?? '无'}`}
                            />
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {COLOR_PRESETS.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={cn(
                                  'h-7 w-7 rounded-full border border-border transition hover:scale-[1.05]',
                                  previewColor?.toLowerCase() === color.toLowerCase() && 'ring-2 ring-ring border-ring',
                                )}
                                style={{ backgroundColor: color }}
                                onClick={() => handleSelectDraftColor(activity.id, color)}
                                aria-label={`选择颜色 ${color}`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteActivityDraft(activity.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabKey)}
          className="space-y-4"
        >
          <TabsList className="mx-auto flex w-fit items-center gap-1 rounded-[12px] border border-[#E5E5E5] bg-[#F6F6F6] p-1">
            <TabsTrigger
              value="summary"
              className="rounded-[8px] border border-transparent bg-[#F2F2F2] px-5 py-2 text-base font-medium text-[#777777] transition-all hover:bg-[#EDEDED] data-[state=active]:border-[#E5E5E5] data-[state=active]:bg-white data-[state=active]:text-[#333333] data-[state=active]:shadow-sm data-[state=active]:font-semibold"
            >
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="rounded-[8px] border border-transparent bg-[#F2F2F2] px-5 py-2 text-base font-medium text-[#777777] transition-all hover:bg-[#EDEDED] data-[state=active]:border-[#E5E5E5] data-[state=active]:bg-white data-[state=active]:text-[#333333] data-[state=active]:shadow-sm data-[state=active]:font-semibold"
            >
              Timeline
            </TabsTrigger>
          </TabsList>
          <TabsContent value="summary">
            <Card>
              <CardContent className="space-y-4 pt-6 text-sm">
                {chronologicalRecords.length === 0 ? (
                  <p className="text-muted-foreground">
                    该日期还没有记录。选择一个活动并点击 Start 开始计时。
                  </p>
                ) : (
                  chronologicalRecords.map((record) => {
                    const activity = activities.find((a) => a.id === record.activityId)
                    const tintedBackground = getAlphaColor(activity?.color, 0.1) ?? '#F8F8F8'
                    return (
                      <div
                        key={record.id}
                        className="rounded-[12px] border border-[#E8E8E8] px-5 py-4"
                        style={{
                          backgroundColor: tintedBackground,
                          boxShadow: '0 1px 1px rgba(0,0,0,0.03)',
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-2 text-base font-semibold text-[#333333]">
                            {activity?.icon && <span className="text-lg" aria-hidden>{activity.icon}</span>}
                            <span>{activity ? activity.name : '已删除活动'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#555555]">
                              {formatClock(record.start)}–{formatClock(record.end)} ({formatDuration(record.duration)})
                            </span>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setOpenRecordMenuId((prev) => (prev === record.id ? null : record.id))}
                                aria-label="更多操作"
                                className="rounded-full p-1 text-lg text-[#888888] transition hover:bg-[#F0F0F0]"
                              >
                                ⋯
                              </button>
                              {openRecordMenuId === record.id && (
                                <div className="absolute right-0 top-full z-20 mt-1 w-32 overflow-hidden rounded-md border bg-white shadow-lg">
                                  <button
                                    type="button"
                                    className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                    onClick={() => {
                                      setOpenRecordMenuId(null)
                                      handleOpenEditEntry(record)
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                    onClick={() => handleDeleteEntry(record)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {record.remark && (
                          <p className="mt-2 text-xs text-[#888888]">备注：{record.remark}</p>
                        )}
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="timeline">
            <Card>
              <CardContent className="space-y-5 pt-6 text-sm">
                <p className="font-medium text-foreground">
                  {isSameDay(selectedDate, new Date()) ? "Today’s timeline" : 'Timeline'}
                </p>
                <div className="my-4">
                  <TimeBarView entries={recordsForSelectedDate} activities={activities} />
                </div>
                {recordsForSelectedDate.length === 0 ? (
                  <p className="text-muted-foreground">No records for this date yet. Start an activity to begin tracking time.</p>
                ) : (
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    {recordsForSelectedDate.map((r) => {
                      const activity = activities.find((a) => a.id === r.activityId)
                      return (
                        <li key={r.id} className="flex flex-col gap-1 border-b border-dashed border-border pb-2 last:border-b-0">
                          <div className="flex items-start justify-between gap-3">
                            <span>
                              {formatClock(r.start)}–{formatClock(r.end)} {activity ? activity.name : '已删除活动'}
                              {r.remark ? ` · 备注：${r.remark}` : ''}
                            </span>
                            <div className="flex items-center gap-2">
                              <span>{formatDuration(r.duration)}</span>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setOpenRecordMenuId((prev) => (prev === r.id ? null : r.id))}
                                  aria-label="更多操作"
                                  className="rounded-full p-1 text-lg text-[#888888] transition hover:bg-[#F0F0F0]"
                                >
                                  ⋯
                                </button>
                                {openRecordMenuId === r.id && (
                                  <div className="absolute right-0 top-full z-20 mt-1 w-32 overflow-hidden rounded-md border bg-white shadow-lg">
                                    <button
                                      type="button"
                                      className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                      onClick={() => {
                                        setOpenRecordMenuId(null)
                                        handleOpenEditEntry(r)
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                      onClick={() => handleDeleteEntry(r)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <ManualEntryModal
        open={isManualEntryOpen}
        activities={activities}
        initialDate={selectedDate}
        onClose={() => setIsManualEntryOpen(false)}
        onSave={handleSaveManualEntry}
      />
      <EditEntryModal
        open={isEditEntryOpen}
        entry={editingEntry}
        activities={activities}
        onClose={() => {
          setIsEditEntryOpen(false)
          setEditingEntry(null)
        }}
        onSave={handleUpdateEntry}
      />
    </div>
  )
}

export default App
