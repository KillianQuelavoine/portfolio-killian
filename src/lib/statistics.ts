import type { HistoryEntry } from '../types'

function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getWeekStart(now = new Date()): Date {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const day = start.getDay() || 7
  start.setDate(start.getDate() - day + 1)
  return start
}

export function weeklyWorkSeconds(history: HistoryEntry[], now = new Date()): number {
  const start = getWeekStart(now).getTime()
  const end = new Date(now).setHours(23, 59, 59, 999)
  return history
    .filter((entry) => {
      const time = new Date(entry.finishedAt).getTime()
      return time >= start && time <= end
    })
    .reduce((sum, entry) => sum + entry.workDuration, 0)
}

export function currentStreak(history: HistoryEntry[], now = new Date()): number {
  const days = new Set(history.map((entry) => entry.date))
  const cursor = new Date(now)
  cursor.setHours(0, 0, 0, 0)
  if (!days.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1)

  let streak = 0
  while (days.has(localDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export { localDateKey }
