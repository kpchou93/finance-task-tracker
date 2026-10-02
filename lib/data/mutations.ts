"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Status } from "@/lib/types";
function refresh() { for (const path of ["/", "/tasks", "/companies", "/demo"]) revalidatePath(path); }
function required(form: FormData, key: string, max = 2000) {
  const value = String(form.get(key) ?? "").trim();
  if (!value || value.length > max) throw new Error(`Please enter a valid ${key.replaceAll("_", " ")}.`);
  return value;
}
export async function saveTask(form: FormData) {
  try {
    const db = await createClient();
    const company_id = required(form, "company_id", 36);
    const company = await db.from("companies").select("name").eq("id", company_id).single();
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
    const id = String(form.get("id") ?? "");
    const result = id ? await db.from("tasks").update(row).eq("id", id).select("id").single() : await db.from("tasks").insert(row).select("id").single();
    if (result.error) throw new Error("Task could not be saved. Please retry.");
    refresh(); return { success: true };
  } catch (e) { return { error: e instanceof Error ? e.message : "Task could not be saved." }; }
}
export async function setTaskStatus(id: string, status: Status) {
  if (!["pending", "in_progress", "completed"].includes(status)) return { error: "Invalid status." };
  const db = await createClient();
  const result = await db.from("tasks").update({ status }).eq("id", id).select("id").single();
  if (result.error) return { error: "Status could not be updated. Please retry." };
  refresh(); return { success: true };
}
export async function deleteTask(id: string) {
  const db = await createClient();
  const result = await db.from("tasks").delete().eq("id", id).select("id").single();
  if (result.error) return { error: "Task could not be deleted. Please retry." };
  refresh(); return { success: true };
}
export async function addCompany(form: FormData) {
  try {
    const name = required(form, "name", 200);
    const db = await createClient();
    const result = await db.from("companies").insert({ name }).select("id").single();
    if (result.error) throw new Error(result.error.code === "23505" ? "This company already exists." : "Company could not be saved.");
    refresh(); return { success: true };
  } catch (e) { return { error: e instanceof Error ? e.message : "Company could not be saved." }; }
}
