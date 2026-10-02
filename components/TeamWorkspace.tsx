"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addWorkspaceMember, createWorkspace, removeWorkspaceMember, renameWorkspace, selectWorkspace } from "@/lib/data/workspaces";
import type { Workspace, WorkspaceMember } from "@/lib/types";
import BrandMark from "./BrandMark";
type Result = { success?: boolean; error?: string };
export default function TeamWorkspace({ workspace, workspaces, members, userId }: { workspace: Workspace; workspaces: Workspace[]; members: WorkspaceMember[]; userId: string }) {
 const router = useRouter();
 const [pending, startTransition] = useTransition();
 const [error, setError] = useState("");
 const [message, setMessage] = useState("");
 function run(operation: () => Promise<Result>, success: string, form?: HTMLFormElement) {
  setError(""); setMessage("");
  startTransition(async () => {
   try { const result = await operation(); if (result.error) { setError(result.error); return; } setMessage(success); form?.reset(); router.refresh(); }
   catch { setError("Your change was not confirmed. Please retry."); }
  });
 }
 const owner = workspace.role === "owner";
 return <main className="team-page">
  <header className="team-header"><Link className="team-brand" href="/"><BrandMark /> Finance <span>Task Tracker</span></Link><Link href="/">← Back to dashboard</Link></header>
  <div className="team-heading"><div><p className="eyebrow">Better together</p><h1>{workspace.name}</h1><p className="muted">A shared space for your team’s next small win.</p></div><span className="team-role">{workspace.role}</span></div>
  {error && <p role="alert" className="notice error">{error}</p>}{message && <p role="status" className="notice success">{message}</p>}
  <div className="team-layout"><section className="team-card"><div className="team-card-heading"><div><h2>Team members <span className="count">{members.length}</span></h2><p className="muted">Members can view and manage this workspace’s companies and tasks.</p></div></div>
   <ul className="team-members">{members.map(member => <li key={member.user_id} className="team-member"><span className="team-member-avatar" aria-hidden="true">{member.email.slice(0, 1).toUpperCase()}</span><div className="team-member-info"><strong>{member.email}</strong><span>{member.user_id === userId ? "You · " : ""}{member.role}</span></div>{owner && member.role !== "owner" && <button className="team-remove" disabled={pending} onClick={() => { if (window.confirm("Remove this member’s access to this workspace? Their task history will be retained.")) { const values = new FormData(); values.set("workspace_id", workspace.id); values.set("user_id", member.user_id); run(() => removeWorkspaceMember(values), "Member removed. Workspace access has been revoked."); } }}>Remove</button>}</li>)}</ul>
   {owner ? <form className="team-add-member" onSubmit={event => { event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); run(() => addWorkspaceMember(values), "Member added. They can now switch to this team from their workspace menu.", form); }}><input type="hidden" name="workspace_id" value={workspace.id} /><label>Member email<input name="email" type="email" required maxLength={254} placeholder="colleague@company.com" autoComplete="email" /></label><p className="muted">Ask your colleague to sign up and confirm their email first. Then add their account here; no invitation email is sent.</p><button className="primary" disabled={pending}>{pending ? "Please wait…" : "Add team member"}</button></form> : <p className="team-note">Contact your workspace owner to add or remove members.</p>}
  </section><aside className="team-settings"><section className="team-card"><h2>Your workspaces</h2><p className="muted">Each workspace has its own companies, tasks and member list.</p><form action={selectWorkspace} className="team-settings-form"><label>Active workspace<select name="workspace_id" defaultValue={workspace.id} key={workspace.id}>{workspaces.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label><button disabled={pending}>Switch workspace</button></form></section>
   {owner && <section className="team-card"><h2>Workspace settings</h2><form key={workspace.id + workspace.name} className="team-settings-form" onSubmit={event => { event.preventDefault(); const values = new FormData(event.currentTarget); run(() => renameWorkspace(values), "Workspace renamed."); }}><input type="hidden" name="workspace_id" value={workspace.id} /><label>Workspace name<input name="name" required maxLength={100} defaultValue={workspace.name} /></label><button disabled={pending}>Save name</button></form></section>}
   <section className="team-card"><h2>Create another workspace</h2><p className="muted">Start a separate team. You’ll be its owner.</p><form className="team-settings-form" onSubmit={event => { event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); run(() => createWorkspace(values), "Workspace created and selected. Add your team members below.", form); }}><label>New workspace name<input name="name" required maxLength={100} placeholder="e.g. Group Finance" /></label><button className="primary" disabled={pending}>{pending ? "Please wait…" : "Create workspace"}</button></form></section>
  </aside></div>
 </main>;
}
