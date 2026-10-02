"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { authenticate } from "@/lib/data/auth";
export default function AuthForm({ signup = false }: { signup?: boolean }) {
 const router = useRouter();
 const [pending,startTransition] = useTransition();
 const [error,setError] = useState("");
 const [message,setMessage] = useState("");
 return <main className="auth-page"><section className="auth-card"><Link className="auth-brand" href="/demo">F <span>Finance Task Tracker</span></Link><p className="eyebrow">YOUR FINANCE WORKSPACE</p><h1>{signup ? "Create your account" : "Welcome back"}</h1><p className="muted">{signup ? "Track your companies and tasks in a private workspace." : "Sign in to keep your finance work moving."}</p><form onSubmit={e => {
  e.preventDefault(); const form = new FormData(e.currentTarget); setError(""); setMessage("");
  startTransition(async () => { try {
   const result = await authenticate(form, signup);
   if (result.error) setError(result.error);
   else if (result.message) setMessage(result.message);
   else { router.push("/"); router.refresh(); }
  } catch { setError("Could not reach the server. Please retry."); } });
 }}><label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label><label>Password<input name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} required minLength={8} maxLength={128} /></label>{signup && <small className="muted">Use at least 8 characters.</small>}{error && <p role="alert" className="notice error">{error}</p>}{message && <p role="status" className="notice success">{message}</p>}<button className="primary" disabled={pending}>{pending ? "Please wait…" : signup ? "Create account" : "Sign in"}</button></form><p>{signup ? "Already have an account?" : "New here?"} <Link href={signup ? "/login" : "/signup"}>{signup ? "Sign in" : "Create an account"}</Link></p><Link href="/demo">Explore the public demo →</Link><p className="auth-note">Demo data is shared publicly. Your signed-in workspace is private.</p></section></main>;
}
