"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { addCompany, deleteTask, saveTask, setTaskStatus } from "@/lib/data/mutations";
import { categorize } from "@/lib/logic/categorize";
import { buckets, categories, type Bucket, type Company, type Task } from "@/lib/types";

type Result = { success?: boolean; error?: string };
const money = (amount: number) => new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(amount);
const statusLabel = (status: string) => status.replaceAll("_", " ");
const dateLabel = (date: string | null) => date ? new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(date + "T00:00:00Z")) : "No due date";
function Modal({ title, children, close }: { title: string; children: React.ReactNode; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} onCancel={close} className="modal"><div className="modal-heading"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={close}>✕</button></div>{children}</dialog>;
}
export default function Board({ tasks, companies, today, view }: { tasks: Task[]; companies: Company[]; today: string; view: "dashboard" | "tasks" | "companies" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editor, setEditor] = useState<Task | "new" | null>(null);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [bucket, setBucket] = useState<Bucket | "">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(false);
  const run = (operation: () => Promise<Result>, success: string, close = false) => {
    setError(""); setMessage("");
    startTransition(async () => {
      try {
        const result = await operation();
        if (result.error) { setError(result.error); return; }
        setMessage(success);
        if (close) { setEditor(null); setCompanyOpen(false); }
        router.refresh();
      } catch { setError("Could not reach the server. Your changes were not confirmed. Please retry."); }
    });
  };
  const visibleTasks = tasks.filter(t => !bucket || categorize(t, today) === bucket);
  const selected = editor && editor !== "new" ? editor : null;
  return <div className="workspace">
    <aside className={menu ? "sidebar open" : "sidebar"}>
      <Link href="/" className="brand"><span className="brand-icon">F</span><span>Finance<span className="brand-sub">TASK TRACKER</span></span></Link>
      <p className="nav-caption">WORKSPACE</p>
      <nav>{[["/", "dashboard", "◫", "Dashboard"], ["/tasks", "tasks", "☷", "All Tasks"], ["/companies", "companies", "▦", "Companies"]].map(([href, key, icon, label]) => <Link key={key} href={href} aria-current={view === key ? "page" : undefined} className={view === key ? "nav-item active" : "nav-item"}><span>{icon}</span>{label}</Link>)}</nav>
      <div className="sidebar-foot"><span className="avatar">FT</span><div>Finance workspace<small>All your deadlines, together</small></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMenu(!menu)}>☰</button><span>Workspace / <strong>{view === "dashboard" ? "Dashboard" : view === "tasks" ? "All Tasks" : "Companies"}</strong></span><span className="today">{dateLabel(today)} · MYT</span></header>
      <div className="content">
        <div className="page-heading"><div><p className="eyebrow">FINANCE OPERATIONS</p><h1>{view === "dashboard" ? "Your work, in focus." : view === "tasks" ? "All tasks" : "Companies"}</h1><p className="muted">{view === "companies" ? "Organize your work across every company." : "Keep deadlines visible and move the work forward."}</p></div><button className="primary" disabled={pending} onClick={() => view === "companies" ? setCompanyOpen(true) : companies.length ? setEditor("new") : setCompanyOpen(true)}>＋ {view === "companies" || !companies.length ? "Add company" : "Add task"}</button></div>
        {message && <p role="status" className="notice success">{message}</p>}{error && !editor && !companyOpen && <p role="alert" className="notice error">{error}</p>}
        {view === "dashboard" && <section className="summary-grid" aria-label="Task summary">{buckets.map((name, i) => {
          const matching = tasks.filter(t => categorize(t, today) === name);
          return <article key={name} className={"summary-card bucket-" + i + (bucket === name ? " selected" : "")}><button className="card-heading" onClick={() => setBucket(bucket === name ? "" : name)} aria-pressed={bucket === name}><span>{name}</span><span className="card-symbol">{["!", "◷", "↗", "✓"][i]}</span><strong>{matching.length}</strong></button><div className="card-tasks">{matching.slice(0, 2).map(t => <button key={t.id} onClick={() => setEditor(t)}>{t.description}</button>)}{!matching.length && <span>No tasks here</span>}{matching.length > 2 && <button onClick={() => setBucket(name)}>View all {matching.length} tasks →</button>}</div></article>;
        })}</section>}
        {view === "companies" ? <section className="company-grid">{companies.map(c => <article className="company-card" key={c.id}><span className="company-initial">{c.name.slice(0, 2).toUpperCase()}</span><h2>{c.name}</h2><p>{tasks.filter(t => t.company_id === c.id).length} tasks · {tasks.filter(t => t.company_id === c.id && t.status !== "completed").length} open</p><Link href="/tasks">View tasks →</Link></article>)}{!companies.length && <div className="empty"><h2>No companies yet</h2><p>Add a company to create your first finance task.</p><button onClick={() => setCompanyOpen(true)}>Add company</button></div>}</section> : <section className="task-panel">
          <div className="panel-heading"><div><h2>{bucket || "Task overview"} <span className="count">{visibleTasks.length}</span></h2><p className="muted">Every task has a place. Click a description to edit.</p></div>{bucket && <button onClick={() => setBucket("")}>Show all tasks</button>}</div>
          <div className="table-scroll"><table><thead><tr><th>Task / Company</th><th>Due date</th><th>Person in charge</th><th>Priority</th><th>Status</th><th>Amount</th><th>Actions</th></tr></thead><tbody>{visibleTasks.map(task => <tr key={task.id} className={"row-" + categorize(task, today).toLowerCase().replaceAll(" ", "-")}><td><button className="task-title" onClick={() => setEditor(task)}>{task.description}</button><small>{task.company_name} <span>·</span> {task.category}</small><span className="bucket-label">{categorize(task, today)}</span></td><td className={categorize(task, today) === "Overdue" ? "overdue-date" : ""}>{dateLabel(task.due_date)}</td><td>{task.person_in_charge || "Unassigned"}</td><td><span className={"badge priority-" + task.priority}>{task.priority}</span></td><td><span className={"badge status-" + task.status}>{statusLabel(task.status)}</span></td><td className="amount">{money(task.amount)}</td><td><div className="row-actions">{task.status === "pending" && <button disabled={pending} onClick={() => run(() => setTaskStatus(task.id, "in_progress"), "Task started.")}>Start</button>}{task.status !== "completed" && <button className="complete-button" disabled={pending} onClick={() => run(() => setTaskStatus(task.id, "completed"), "Task completed. Summary counts updated.")}>Complete</button>}<button disabled={pending} aria-label={"Edit " + task.description} onClick={() => setEditor(task)}>Edit</button></div></td></tr>)}</tbody></table></div>
          {!visibleTasks.length && <div className="empty"><h2>{bucket ? "No tasks in this group" : "Ready for your first task"}</h2><p>{bucket ? "Choose another summary card or show all tasks." : "Add a task to start tracking deadlines and progress."}</p><button onClick={() => bucket ? setBucket("") : companies.length ? setEditor("new") : setCompanyOpen(true)}>{bucket ? "Show all tasks" : companies.length ? "Add task" : "Add company"}</button></div>}
        </section>}
        <footer className="content-footer"><span>{companies.length} companies · {tasks.length} tasks</span><span>Dates follow Malaysia time · Amounts in MYR</span></footer>
      </div>
    </main>
    {companyOpen && <Modal title="Add company" close={() => { if (!pending) { setCompanyOpen(false); setError(""); } }}><form onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); run(() => addCompany(form), "Company added.", true); }}><label>Company name<input name="name" required maxLength={200} autoFocus placeholder="e.g. Acme Corp" /></label>{error && <p role="alert" className="notice error">{error}</p>}<div className="form-actions"><button type="button" disabled={pending} onClick={() => setCompanyOpen(false)}>Cancel</button><button className="primary" disabled={pending}>{pending ? "Saving…" : "Add company"}</button></div></form></Modal>}
    {editor && <Modal title={selected ? "Task details" : "Add a task"} close={() => { if (!pending) { setEditor(null); setError(""); } }}><form key={selected?.id || "new"} onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); run(() => saveTask(form), selected ? "Task updated." : "Task added.", true); }}>
      <input type="hidden" name="id" value={selected?.id || ""} />
      <div className="form-grid"><label>Company<select name="company_id" required defaultValue={selected?.company_id || companies[0]?.id}>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Category<input name="category" list="categories" required maxLength={100} defaultValue={selected?.category || "Payment"} /><datalist id="categories">{categories.map(c => <option key={c} value={c} />)}</datalist></label>
      <label className="full">Description<textarea name="description" required maxLength={2000} rows={2} autoFocus defaultValue={selected?.description || ""} placeholder="What needs to be done?" /></label>
      <label>Due date<input name="due_date" type="date" defaultValue={selected?.due_date || ""} /></label><label>Person in charge<input name="person_in_charge" maxLength={200} defaultValue={selected?.person_in_charge || ""} placeholder="Responsible staff member" /></label>
      <label>Priority<select name="priority" defaultValue={selected?.priority || "medium"}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label><label>Status<select name="status" defaultValue={selected?.status || "pending"}><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></label>
      <label className="full">Amount (MYR)<input name="amount" type="number" step="0.01" min="0" max="999999999999.99" defaultValue={selected?.amount || 0} /></label><label className="full">Remarks<textarea name="remarks" maxLength={5000} rows={3} defaultValue={selected?.remarks || ""} /></label></div>
      {error && <p role="alert" className="notice error">{error}</p>}
      {selected && selected.status !== "completed" && <button type="button" className="complete-button" disabled={pending} onClick={() => run(() => setTaskStatus(selected.id, "completed"), "Task completed. Summary counts updated.", true)}>✓ Mark completed</button>}
      <div className="form-actions">{selected && <button type="button" className="danger" disabled={pending} onClick={() => { if (window.confirm("Delete this task permanently?")) run(() => deleteTask(selected.id), "Task deleted.", true); }}>Delete task</button>}<button type="button" disabled={pending} onClick={() => { setEditor(null); setError(""); }}>Cancel</button><button className="primary" disabled={pending}>{pending ? "Saving…" : "Save task"}</button></div>
    </form></Modal>}
  </div>;
}
