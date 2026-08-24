export function formatINR(amount: number): string {
  const sign = amount < 0 ? "-" : ""
  const value = Math.abs(amount)
  if (value >= 1_00_00_000) return `${sign}₹${(value / 1_00_00_000).toFixed(2)}Cr`
  if (value >= 1_00_000) return `${sign}₹${(value / 1_00_000).toFixed(2)}L`
  return `${sign}₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

export function formatDateLabel(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  const formatted = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })

  if (isSameDay(date, today)) return `Today, ${formatted}`
  if (isSameDay(date, yesterday)) return `Yesterday, ${formatted}`
  return formatted
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}
