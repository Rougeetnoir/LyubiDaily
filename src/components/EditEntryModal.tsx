import { useEffect, useMemo, useState } from 'react'
import type { Activity, RecordItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface EditEntryModalProps {
  open: boolean
  entry: RecordItem | null
  activities: Activity[]
  onClose: () => void
  onSave: (payload: { id: string; activityId: string; start: number; end: number; remark?: string }) => void
}

const formatDateInput = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const formatTimeInput = (date: Date) => date.toTimeString().slice(0, 5)

type EditFormState = {
  activityId: string
  date: string
  startTime: string
  endTime: string
  remark: string
  error: string | null
}

const buildInitialFormState = (source: RecordItem | null): EditFormState => {
  const fallbackDate = new Date()
  if (!source) {
    return {
      activityId: '',
      date: formatDateInput(fallbackDate),
      startTime: '',
      endTime: '',
      remark: '',
      error: null,
    }
  }
  const startDate = new Date(source.start)
  const endDate = new Date(source.end ?? source.start + (source.duration ?? 0) * 1000)
  return {
    activityId: source.activityId,
    date: formatDateInput(startDate),
    startTime: formatTimeInput(startDate),
    endTime: formatTimeInput(endDate),
    remark: source.remark ?? '',
    error: null,
  }
}

export function EditEntryModal({ open, entry, activities, onClose, onSave }: EditEntryModalProps) {
  const [form, setForm] = useState<EditFormState>(() => buildInitialFormState(entry))

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      setForm(buildInitialFormState(entry))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [open, entry])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    if (open) {
      window.addEventListener('keydown', handleKey)
    }
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const activityOptions = useMemo(
    () => activities.map((a) => ({ id: a.id, label: `${a.icon ? `${a.icon} ` : ''}${a.name}` })),
    [activities],
  )

  if (!open || !entry) return null

  const handleSubmit = () => {
    if (!form.activityId) {
      setForm((prev) => ({ ...prev, error: '请选择一个活动' }))
      return
    }
    if (!form.startTime || !form.endTime || !form.date) {
      setForm((prev) => ({ ...prev, error: '请完善日期和时间' }))
      return
    }
    const start = new Date(`${form.date}T${form.startTime}:00`).getTime()
    const end = new Date(`${form.date}T${form.endTime}:00`).getTime()
    if (Number.isNaN(start) || Number.isNaN(end)) {
      setForm((prev) => ({ ...prev, error: '时间格式不正确' }))
      return
    }
    if (end <= start) {
      setForm((prev) => ({ ...prev, error: '结束时间必须晚于开始时间' }))
      return
    }
    setForm((prev) => ({ ...prev, error: null }))
    onSave({
      id: entry.id,
      activityId: form.activityId,
      start,
      end,
      remark: form.remark.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#1F1F1F]">Edit entry</h2>
            <p className="text-sm text-[#888888]">Update this record&apos;s details.</p>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-sm text-[#666666]">
            Close
          </Button>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#333333]">Activity</label>
            <Select value={form.activityId || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, activityId: value }))}>
              <SelectTrigger className="h-10 rounded-lg border border-[#E0E0E0]">
                <SelectValue placeholder="Select activity" />
              </SelectTrigger>
              <SelectContent>
                {activityOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm_FONT-medium text-[#333333]">Date</label>
              <Input
                type="date"
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                className="rounded-lg border-[#E0E0E0]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#333333]">Start time</label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
                className="rounded-lg border-[#E0E0E0]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#333333]">End time</label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
                className="rounded-lg border-[#E0E0E0]"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-[#333333]">Remark</label>
              <Textarea
                value={form.remark}
                onChange={(event) => setForm((prev) => ({ ...prev, remark: event.target.value }))}
                className="rounded-lg border-[#E0E0E0]"
                placeholder="Optional notes"
              />
            </div>
          </div>
          {form.error && <p className="text-sm text-red-500">{form.error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="px-4 py-2 text-sm text-[#555555]">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="px-4 py-2 text-sm">
            Save changes
          </Button>
        </div>
      </div>
    </div>
  )
}
