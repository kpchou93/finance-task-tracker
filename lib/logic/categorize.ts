import type { Bucket, Task } from "@/lib/types";
export function todayInMalaysia(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function categorize(task: Pick<Task, "status" | "due_date">, today: string): Bucket {
  if (task.status === "completed") return "Completed";
  if (task.due_date && task.due_date < today) return "Overdue";
  if (task.due_date && task.due_date <= addDays(today, 7)) return "Due This Week";
  if (task.status === "in_progress") return "In Progress";
  return "Upcoming";
}
