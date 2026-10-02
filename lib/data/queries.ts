import "server-only";
import { redirect } from "next/navigation";
import { dataContext, AuthenticationRequired } from "@/lib/data/context";
import { priorityMetadata } from "@/lib/ai/priority";
import { todayInMalaysia } from "@/lib/logic/categorize";
import type { Company, Task } from "@/lib/types";
export async function getBoard(demo = false) {
 let context;
 try { context = await dataContext(demo); }
 catch (e) { if (e instanceof AuthenticationRequired) redirect("/login"); throw e; }
 const { db, email } = context;
 async function readAll(table: "companies" | "tasks") {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
   const result = await db.from(table).select("*").order("id").range(offset, offset + 499);
   if (result.error) throw new Error("Unable to load finance data. Please retry.");
   rows.push(...result.data);
   if (result.data.length < 500) return rows;
  }
 }
 const [companyRows, taskRows] = await Promise.all([readAll("companies"), readAll("tasks")]);
 return {
  email, companies: (companyRows as Company[]).sort((a,b) => a.name.localeCompare(b.name)),
  tasks: (taskRows as Task[]).map(task => task.ai_suggested_priority ? task : { ...task, ...priorityMetadata(task, todayInMalaysia()) })
 };
}
