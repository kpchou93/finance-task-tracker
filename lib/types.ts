export type Status = "pending" | "in_progress" | "completed";
export type Priority = "high" | "medium" | "low";
export type Bucket = "Overdue" | "Due This Week" | "In Progress" | "Completed" | "Upcoming";
export type Company = { id: string; name: string; user_id: string | null; created_at: string };
export type Task = {
  id: string; company_id: string; company_name: string; category: string;
  description: string; due_date: string | null; person_in_charge: string | null;
  priority: Priority; status: Status; amount: number; remarks: string | null;
  ai_suggested_priority: Priority | null; ai_priority_source: string | null;
  ai_priority_confidence: number | null; ai_priority_review_status: string;
  user_id: string | null; created_at: string;
};
export const categories = ["Invoicing", "Reconciliation", "Reporting", "Audit", "Payment"];
export const buckets: Bucket[] = ["Overdue", "Due This Week", "In Progress", "Completed"];
