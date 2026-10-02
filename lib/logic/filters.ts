import type { Bucket, Task } from "../types.ts";
export type Filters = { company?: string; category?: string; priority?: string; status?: string; search?: string; bucket?: Bucket | "" };
export type Sort = "due" | "priority" | "amount" | "created";
export function filterTasks(tasks: Task[], filters: Filters, today: string) {
 const search = filters.search?.trim().toLowerCase() || "";
 return tasks.filter(t => (!filters.company || t.company_id === filters.company)
   && (!filters.category || t.category === filters.category)
   && (!filters.priority || t.priority === filters.priority)
   && (!filters.status || t.status === filters.status)
   && (!search || [t.description, t.remarks || "", t.person_in_charge || ""].some(v => v.toLowerCase().includes(search))));
}
export function sortTasks(tasks: Task[], sort: Sort) {
 const rank = { high: 0, medium: 1, low: 2 };
 return [...tasks].sort((a, b) => {
  const byDue = (a.due_date || "9999").localeCompare(b.due_date || "9999");
  if (sort === "due") return byDue || rank[a.priority] - rank[b.priority] || a.id.localeCompare(b.id);
  if (sort === "priority") return rank[a.priority] - rank[b.priority] || byDue || a.id.localeCompare(b.id);
  if (sort === "amount") return Number(b.amount) - Number(a.amount) || byDue || a.id.localeCompare(b.id);
  return b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id);
 });
}
