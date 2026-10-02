import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Company, Task } from "@/lib/types";
export async function getBoard() {
  const db = await createClient();
  const [companies, tasks] = await Promise.all([
    db.from("companies").select("*").order("name"),
    db.from("tasks").select("*").order("created_at", { ascending: false }),
  ]);
  if (companies.error || tasks.error) throw new Error("Unable to load finance data. Please retry.");
  return { companies: companies.data as Company[], tasks: tasks.data as Task[] };
}
