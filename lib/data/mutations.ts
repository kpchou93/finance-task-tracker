"use server";
import { revalidatePath } from "next/cache";
import { dataContext } from "@/lib/data/context";
import { priorityMetadata } from "@/lib/ai/priority";
import { todayInMalaysia } from "@/lib/logic/categorize";
import type { Status, Workspace } from "@/lib/types";
function refresh() { for (const path of ["/", "/tasks", "/companies", "/demo", "/demo/tasks", "/demo/companies"]) revalidatePath(path); }
function workspaceCheck(form: FormData, workspace: Workspace | null) {
 if (workspace && form.get("workspace_id") !== workspace.id) throw new Error("Your active workspace changed. Close this form and reopen it before saving.");
}
function required(form: FormData, key: string, max = 2000) {
  const value = String(form.get(key) ?? "").trim();
  if (!value || value.length > max) throw new Error(`Please enter a valid ${key.replaceAll("_", " ")}.`);
  return value;
}
export async function saveTask(form: FormData) {
  try {
    const { db, owner, workspace } = await dataContext(form.get("demo") === "true");
    workspaceCheck(form, workspace);
    const company_id = required(form, "company_id", 36);
    const company = await db.from("companies").select("name").eq("id", company_id).match(workspace ? { workspace_id: workspace.id } : {}).single();
    if (company.error) throw new Error("Select an available company.");
    const status = required(form, "status");
    const priority = required(form, "priority");
    if (!["pending", "in_progress", "completed"].includes(status) || !["high", "medium", "low"].includes(priority)) throw new Error("Invalid status or priority.");
    const due_date = String(form.get("due_date") ?? "") || null;
    if (due_date && (!/^\d{4}-\d{2}-\d{2}$/.test(due_date) || new Date(due_date).toISOString().slice(0, 10) !== due_date)) throw new Error("Enter a valid due date.");
    const amountText = String(form.get("amount") ?? "0");
    const amount = Number(amountText);
    if (!/^\d+(\.\d{1,2})?$/.test(amountText) || !Number.isFinite(amount) || amount < 0 || amount > 999999999999.99) throw new Error("Enter a valid amount with up to two decimal places.");
    const row = { company_id, company_name: company.data.name, category: required(form, "category", 100),
      description: required(form, "description"), due_date,
      person_in_charge: String(form.get("person_in_charge") ?? "").trim().slice(0, 200),
      status, priority, amount, remarks: String(form.get("remarks") ?? "").trim().slice(0, 5000) };
    const enriched = { ...row, ...priorityMetadata(row, todayInMalaysia()) };
    const id = String(form.get("id") ?? "");
    const result = id ? await db.from("tasks").update(enriched).eq("id", id).match(workspace ? { workspace_id: workspace.id } : {}).select("id").single() : await db.from("tasks").insert({ ...enriched, user_id: owner, workspace_id: workspace?.id || null }).select("id").single();
    if (result.error) throw new Error("Task could not be saved. Please retry.");
    refresh(); return { success: true };
  } catch (e) { return { error: e instanceof Error ? e.message : "Task could not be saved." }; }
}
export async function setTaskStatus(id: string, status: Status, demo = false) {
  if (!["pending", "in_progress", "completed"].includes(status)) return { error: "Invalid status." };
  const { db, workspace } = await dataContext(demo);
  const result = await db.from("tasks").update({ status }).eq("id", id).match(workspace ? { workspace_id: workspace.id } : {}).select("id").single();
  if (result.error) return { error: "Status could not be updated. Please retry." };
  refresh(); return { success: true };
}
export async function deleteTask(id: string, demo = false) {
  const { db, workspace } = await dataContext(demo);
  const result = await db.from("tasks").delete().eq("id", id).match(workspace ? { workspace_id: workspace.id } : {}).select("id").single();
  if (result.error) return { error: "Task could not be deleted. Please retry." };
  refresh(); return { success: true };
}
export async function addCompany(form: FormData) {
  try {
    const name = required(form, "name", 200);
    const { db, owner, workspace } = await dataContext(form.get("demo") === "true");
    workspaceCheck(form, workspace);
    const result = await db.from("companies").insert({ name, user_id: owner, workspace_id: workspace?.id || null }).select("id").single();
    if (result.error) throw new Error(result.error.code === "23505" ? "This company already exists." : "Company could not be saved.");
    refresh(); return { success: true };
  } catch (e) { return { error: e instanceof Error ? e.message : "Company could not be saved." }; }
}

export async function renameCompany(form: FormData) {
  try {
    const { db, workspace } = await dataContext(form.get("demo") === "true");
    workspaceCheck(form, workspace);
    const name = required(form, "name", 200);
    const id = required(form, "id", 36);
    const result = await db.from("companies").update({ name }).eq("id", id).match(workspace ? { workspace_id: workspace.id } : {}).select("id").single();
    if (result.error) throw new Error(result.error.code === "23505" ? "This company already exists." : "Company could not be renamed.");
    refresh(); return { success: true };
  } catch (e) { return { error: e instanceof Error ? e.message : "Company could not be renamed." }; }
}
export async function deleteCompany(id: string, demo = false) {
  const { db, workspace } = await dataContext(demo);
  const result = await db.from("companies").delete().eq("id", id).match(workspace ? { workspace_id: workspace.id } : {}).select("id").single();
  if (result.error) return { error: "Delete or reassign this company's tasks first, then try again." };
  refresh(); return { success: true };
}


export async function reviewSuggestion(id: string, accepted: boolean, demo = false) {
  const { db, workspace } = await dataContext(demo);
  const existing = await db.from("tasks").select("*").eq("id", id).match(workspace ? { workspace_id: workspace.id } : {}).single();
  if (existing.error || existing.data.status === "completed") return { error: "This task has no available suggestion." };
  const metadata = existing.data.ai_suggested_priority ? {
    ai_suggested_priority: existing.data.ai_suggested_priority,
    ai_priority_source: existing.data.ai_priority_source,
    ai_priority_confidence: existing.data.ai_priority_confidence
  } : priorityMetadata(existing.data, todayInMalaysia());
  const result = await db.from("tasks").update({
    ...metadata, ai_priority_review_status: accepted ? "accepted" : "rejected",
    ...(accepted ? { priority: metadata.ai_suggested_priority } : {})
  }).eq("id", id).match(workspace ? { workspace_id: workspace.id } : {}).select("id").single();
  if (result.error) return { error: "Suggestion review could not be saved." };
  refresh(); return { success: true };
}
