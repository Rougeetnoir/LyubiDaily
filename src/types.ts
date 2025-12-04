export type Activity = {
  id: string
  name: string
  icon?: string
  color?: string
  createdAt: number
  updatedAt: number
}

export type RecordItem = {
  id: string
  activityId: string
  start: number
  end: number
  duration: number
  remark?: string
  createdAt: number
}

export type RunningRecord = {
  id: string
  activityId: string
  start: number
  realStart?: number
  dateKey: string
  remark?: string
  createdAt: number
}
