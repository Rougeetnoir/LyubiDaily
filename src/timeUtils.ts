export const getTodayRange = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const end = start + 24 * 60 * 60 * 1000
  return { start, end }
}

export const formatClock = (timestamp: number) => {
  const date = new Date(timestamp)
  const hh = `${date.getHours()}`.padStart(2, '0')
  const mm = `${date.getMinutes()}`.padStart(2, '0')
  return `${hh}:${mm}`
}

export const formatDuration = (seconds: number) => {
  if (seconds <= 0) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h && m) return `${h}h${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

export const formatDurationHMS = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const hh = `${h}`.padStart(2, '0')
  const mm = `${m}`.padStart(2, '0')
  const ss = `${s}`.padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}
