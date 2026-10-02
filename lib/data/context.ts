import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { Workspace } from "@/lib/types";
export class AuthenticationRequired extends Error {}
export async function dataContext(demo = false) {
 if (demo) return {
  db: createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(), { auth: { persistSession: false, autoRefreshToken: false } }),
  owner: null, email: null, workspace: null, workspaces: [] as Workspace[]
 };
 const db = await createClient();
 const { data: { user }, error } = await db.auth.getUser();
 if (error || !user) throw new AuthenticationRequired("Please sign in again to save your changes.");
 async function memberships() {
  const result = await db.from("workspace_members").select("workspace_id,role,workspaces(id,name)").eq("user_id", user!.id).order("joined_at");
  if (result.error) throw new Error("Unable to load your team workspaces. Please retry.");
  return result.data.flatMap(row => {
   const team = (Array.isArray(row.workspaces) ? row.workspaces[0] : row.workspaces) as { id: string; name: string } | null;
   return team ? [{ ...team, role: row.role as Workspace["role"] }] : [];
  });
 }
 let workspaces = await memberships();
 if (!workspaces.length) {
  const created = await db.rpc("ensure_personal_workspace");
  if (created.error) throw new Error("Unable to create your first workspace. Please retry.");
  workspaces = await memberships();
 }
 const selected = (await cookies()).get("finance_workspace")?.value;
 const workspace = workspaces.find(team => team.id === selected) || workspaces[0];
 if (!workspace) throw new Error("No workspace is available. Please sign in again.");
 return { db, owner: user.id, email: user.email || null, workspace, workspaces };
}
