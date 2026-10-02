import { redirect } from "next/navigation";
import { dataContext, AuthenticationRequired } from "@/lib/data/context";
import TeamWorkspace from "@/components/TeamWorkspace";
import type { WorkspaceMember } from "@/lib/types";
import "./team.css";
export const dynamic = "force-dynamic";
export default async function TeamPage() {
 let context;
 try { context = await dataContext(); }
 catch (error) { if (error instanceof AuthenticationRequired) redirect("/login"); throw error; }
 const members = await context.db.rpc("get_workspace_members", { p_workspace_id: context.workspace!.id });
 if (members.error) throw new Error("Unable to load team members. Please retry.");
 return <TeamWorkspace workspace={context.workspace!} workspaces={context.workspaces} members={members.data as WorkspaceMember[]} userId={context.owner!} />;
}
