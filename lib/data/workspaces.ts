"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dataContext } from "@/lib/data/context";
function refresh() { for (const path of ["/", "/tasks", "/companies", "/team"]) revalidatePath(path); }
function name(form: FormData) {
 const value = String(form.get("name") || "").trim();
 if (!value || value.length > 100) throw new Error("Enter a workspace name of 1–100 characters.");
 return value;
}
async function activeTeam(form: FormData) {
 const context = await dataContext();
 if (!context.workspace || form.get("workspace_id") !== context.workspace.id) throw new Error("Your active workspace changed. Refresh this page before continuing.");
 return context;
}
async function setActive(id: string) {
 (await cookies()).set("finance_workspace", id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
}
export async function selectWorkspace(form: FormData) {
 const context = await dataContext();
 const id = String(form.get("workspace_id") || "");
 if (!context.workspaces.some(team => team.id === id)) throw new Error("This workspace is unavailable.");
 await setActive(id); refresh(); redirect("/");
}
export async function createWorkspace(form: FormData) {
 try {
  const { db } = await dataContext();
  const result = await db.rpc("create_workspace", { p_name: name(form) });
  if (result.error || !result.data) throw new Error("Unable to create the workspace. Please retry.");
  await setActive(result.data as string); refresh();
  return { success: true };
 } catch (error) { return { error: error instanceof Error ? error.message : "Unable to create workspace." }; }
}
export async function renameWorkspace(form: FormData) {
 try {
  const { db, workspace } = await activeTeam(form);
  if (workspace!.role !== "owner") throw new Error("Only the workspace owner can change its name.");
  const result = await db.rpc("rename_workspace", { p_workspace_id: workspace!.id, p_name: name(form) });
  if (result.error) throw new Error("Unable to rename the workspace.");
  refresh(); return { success: true };
 } catch (error) { return { error: error instanceof Error ? error.message : "Unable to rename workspace." }; }
}
export async function addWorkspaceMember(form: FormData) {
 try {
  const { db, workspace } = await activeTeam(form);
  if (workspace!.role !== "owner") throw new Error("Only the workspace owner can add members.");
  const email = String(form.get("email") || "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid member email address.");
  const result = await db.rpc("add_workspace_member", { p_workspace_id: workspace!.id, p_email: email });
  if (result.error) throw new Error("Unable to add this member. Ask them to sign up and confirm their email first; they may already be in this team.");
  refresh(); return { success: true };
 } catch (error) { return { error: error instanceof Error ? error.message : "Unable to add member." }; }
}
export async function removeWorkspaceMember(form: FormData) {
 try {
  const { db, workspace, owner } = await activeTeam(form);
  if (workspace!.role !== "owner") throw new Error("Only the workspace owner can remove members.");
  const id = String(form.get("user_id") || "");
  if (id === owner) throw new Error("You cannot remove yourself as workspace owner.");
  const result = await db.rpc("remove_workspace_member", { p_workspace_id: workspace!.id, p_user_id: id });
  if (result.error) throw new Error("Unable to remove this member. Refresh and try again.");
  refresh(); return { success: true };
 } catch (error) { return { error: error instanceof Error ? error.message : "Unable to remove member." }; }
}
