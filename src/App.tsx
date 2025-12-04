import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
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
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Activity, RecordItem, RunningRecord } from './types'
import {
  loadActivities,
  loadRecords,
  loadRunningRecord,
  saveActivities,
  saveRecords,
  saveRunningRecord,
} from './storage'
import { formatClock, formatDuration, getTodayRange } from './timeUtils'

type TabKey = 'summary' | 'timeline'

function App() {
  const [activities, setActivities] = useState<Activity[]>(() => loadActivities())
  const [records, setRecords] = useState<RecordItem[]>(() => loadRecords())
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
  const runningDurationSeconds = useMemo(() => {
    if (!runningRecord) return 0
    return Math.max(0, Math.floor((tick - runningRecord.start) / 1000))
  }, [runningRecord, tick])

  useEffect(() => {
    if (!runningRecord) return
    const id = window.setInterval(() => {
      setTick(Date.now())
    }, 1000)
    return () => window.clearInterval(id)
  }, [runningRecord])

  const todayRange = useMemo(() => getTodayRange(), [])

  const todayRecords = useMemo(
    () =>
      records.filter((r) => r.start >= todayRange.start && r.start < todayRange.end),
    [records, todayRange.start, todayRange.end],
  )

  const todayTotalSeconds = useMemo(
    () => todayRecords.reduce((sum, r) => sum + r.duration, 0),
    [todayRecords],
  )

  const todayLabel = useMemo(() => {
    const now = new Date()
    return now.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }, [])

  const handleStart = () => {
    if (!selectedActivityId) {
      window.alert('请选择一个活动再开始计时。')
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
      }
      const nextRecords = [...records, finished]
      setRecords(nextRecords)
      saveRecords(nextRecords)
    }

    const id = crypto.randomUUID()
    const newRunning: RunningRecord = {
      id,
      activityId: activity.id,
      start: now,
      remark: remark.trim() || undefined,
      createdAt: now,
    }
    setRunningRecord(newRunning)
    saveRunningRecord(newRunning)
    setRemark('')
  }

  const handleStop = () => {
    if (!runningRecord) return

    const now = Date.now()
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
    }
    const nextRecords = [...records, finished]
    setRecords(nextRecords)
    saveRecords(nextRecords)
    setRunningRecord(null)
    saveRunningRecord(null)
  }

  const groupedSummary = useMemo(() => {
    const map = new Map<string, { activityId: string; totalDuration: number; records: RecordItem[] }>()
    for (const r of todayRecords) {
      const entry = map.get(r.activityId) ?? {
        activityId: r.activityId,
        totalDuration: 0,
        records: [],
      }
      entry.totalDuration += r.duration
      entry.records.push(r)
      map.set(r.activityId, entry)
    }
    return Array.from(map.values()).sort((a, b) => b.totalDuration - a.totalDuration)
  }, [todayRecords])

  const effectiveTodayTotal = todayTotalSeconds + runningDurationSeconds

  const handleCreateActivity = () => {
    const name = newActivityName.trim()
    if (!name) {
      window.alert('活动名称不能为空。')
      return
    }

    const now = Date.now()
    const next: Activity[] = [
      ...activities,
      {
        id: crypto.randomUUID(),
        name,
        icon: newActivityIcon.trim() || undefined,
        color: newActivityColor.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      },
    ]
    setActivities(next)
    saveActivities(next)
    setNewActivityName('')
    setNewActivityIcon('')
    setNewActivityColor('')
    setIsAddingActivity(false)
    setIsEmojiPickerOpen(false)
  }

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-2 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2 text-left">
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Lyubi Daily</p>
            <h1 className="text-3xl font-semibold tracking-tight">Daily time ledger</h1>
            <p className="text-sm text-muted-foreground">
              A lightweight companion to keep Lyubischev-inspired records.
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div className="font-medium text-foreground">Today · {todayLabel}</div>
            <div className="text-xs">Total {formatDuration(effectiveTodayTotal)}</div>
          </div>
        </header>

        <Card>
          <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <Button variant="outline" onClick={() => setIsAddingActivity(true)} className="whitespace-nowrap">
                + Add Activity
              </Button>
              <Separator orientation="vertical" className="hidden h-10 sm:block" />
              <Select
                value={selectedActivityId || undefined}
                onValueChange={(value: string) => setSelectedActivityId(value)}
                disabled={activities.length === 0}
              >
                <SelectTrigger className="min-w-[200px]">
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
                className="min-w-0 flex-1"
              />
            </div>
            <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center">
              <Button onClick={handleStart} disabled={!selectedActivityId}>
                ▶ Start
              </Button>
              {runningRecord && (
                <Button variant="secondary" onClick={handleStop}>
                  Stop
                </Button>
              )}
              {runningRecord && (
                <p className="text-xs text-muted-foreground">
                  计时中：
                  {activities.find((a) => a.id === runningRecord.activityId)?.name ?? '未知活动'} ·{' '}
                  {formatDuration(runningDurationSeconds)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

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
                onClick={() => {
                  setIsAddingActivity(false)
                  setNewActivityName('')
                  setNewActivityIcon('')
                  setNewActivityColor('')
                  setIsEmojiPickerOpen(false)
                }}
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
                        {['💼', '📚', '🧠', '🏃‍♂️', '🏠', '🎮', '✍️', '🧩', '🧘‍♀️', '🧑‍💻'].map((emoji) => (
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
                  onClick={() => {
                    setIsAddingActivity(false)
                    setNewActivityName('')
                    setNewActivityIcon('')
                    setNewActivityColor('')
                    setIsEmojiPickerOpen(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabKey)}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
          <TabsContent value="summary">
            <Card>
              <CardContent className="space-y-4 pt-6 text-sm">
                {groupedSummary.length === 0 ? (
                  <p className="text-muted-foreground">
                    今天还没有记录。选择一个活动并点击 Start 开始计时。
                  </p>
                ) : (
                  groupedSummary.map((group) => {
                    const activity = activities.find((a) => a.id === group.activityId)
                    return (
                      <div
                        key={group.activityId}
                        className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-medium">
                            {activity?.icon && <span>{activity.icon}</span>}
                            <span>{activity ? activity.name : '已删除活动'}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(group.totalDuration)}
                          </span>
                        </div>
                        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                          {group.records.map((r) => (
                            <li key={r.id} className="flex justify-between">
                              <span>
                                {formatClock(r.start)}–{formatClock(r.end)} ({formatDuration(r.duration)})
                                {r.remark ? ` · 备注：${r.remark}` : ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="timeline">
            <Card>
              <CardContent className="space-y-3 pt-6 text-sm">
                <p className="font-medium text-foreground">Today&apos;s timeline</p>
                {todayRecords.length === 0 ? (
                  <p className="text-muted-foreground">No records yet. Start an activity to begin tracking time.</p>
                ) : (
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    {todayRecords.map((r) => {
                      const activity = activities.find((a) => a.id === r.activityId)
                      return (
                        <li key={r.id} className="flex justify-between">
                          <span>
                            {formatClock(r.start)}–{formatClock(r.end)}{' '}
                            {activity ? activity.name : '已删除活动'}
                            {r.remark ? ` · 备注：${r.remark}` : ''}
                          </span>
                          <span>{formatDuration(r.duration)}</span>
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
    </div>
  )
}

export default App
