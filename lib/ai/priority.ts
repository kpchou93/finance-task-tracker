import type { Priority } from "../types.ts";
type Input = { due_date: string | null; amount: number; category: string; status?: string };
export function suggestPriority(task: Input, today: string) {
 let score = 0;
 const reasons: string[] = [];
 if (task.status !== "completed") {
  if (task.due_date) {
   const days = (Date.parse(task.due_date) - Date.parse(today)) / 86400000;
   if (days < 0) { score += 0.4; reasons.push("Overdue"); }
   else if (days <= 3) { score += 0.25; reasons.push("Due within 3 days"); }
  }
  if (Number(task.amount) > 50000) { score += 0.2; reasons.push("Amount above MYR 50,000"); }
  if (["payment", "audit"].includes(task.category.trim().toLowerCase())) { score += 0.15; reasons.push("Payment or audit"); }
 }
 score = Math.round(score * 100) / 100;
 const priority: Priority = score >= 0.5 ? "high" : score >= 0.3 ? "medium" : "low";
 return { priority, score, confidence: Math.round(Math.min(0.95, 0.58 + score * 0.4) * 100) / 100, reasoning: reasons.join(" · ") || "No urgency signals" };
}
export function priorityMetadata(task: Input, today: string) {
 const suggestion = suggestPriority(task, today);
 return { ai_suggested_priority: suggestion.priority, ai_priority_source: "rule-based-v1", ai_priority_confidence: suggestion.confidence, ai_priority_review_status: "unreviewed" };
}
