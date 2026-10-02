"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { requestPasswordReset, updatePassword } from "@/lib/data/auth";
import BrandMark from "./BrandMark";

export default function PasswordRecoveryForm({ reset = false, expired = false }: { reset?: boolean; expired?: boolean }) {
 const [pending, startTransition] = useTransition();
 const [error, setError] = useState(expired ? "This link is invalid or has expired. Request a fresh link and open it in the same browser." : "");
 const [message, setMessage] = useState("");
 return <main className="auth-page"><section className="auth-card"><Link className="auth-brand" href="/demo"><BrandMark /><span>Finance Task Tracker</span></Link><p className="eyebrow">Let’s get you back on track</p><h1>{reset ? "Set a new password" : "Forgot your password?"}</h1><p className="muted">{reset ? "Choose a new password for your account." : "Enter your account email and we’ll send a recovery link."}</p>
  {!(reset && message) && <form onSubmit={event => {
   event.preventDefault(); const values = new FormData(event.currentTarget); setError(""); setMessage("");
   startTransition(async () => { try {
    const result = await (reset ? updatePassword(values) : requestPasswordReset(values));
    if (result.error) setError(result.error);
    else if (result.message) setMessage(result.message);
   } catch { setError("Could not reach the server. Please try again."); } });
  }}>{reset ? <><label>New password<input type="password" name="password" autoComplete="new-password" required minLength={8} maxLength={128} /></label><label>Confirm new password<input type="password" name="confirmation" autoComplete="new-password" required minLength={8} maxLength={128} /></label><small className="muted">Use 8–128 characters.</small></> : <label>Email<input type="email" name="email" autoComplete="email" required maxLength={254} /></label>}
   <button className="primary" disabled={pending}>{pending ? "Please wait…" : reset ? "Update password" : "Send reset link"}</button>
  </form>}
  {error && <p role="alert" className="notice error">{error}</p>}{message && <p role="status" className="notice success">{message}</p>}
  <p><Link href="/login">{reset && message ? "Sign in with your new password →" : "← Back to sign in"}</Link></p>{reset && !message && <Link href="/forgot-password">Request a new recovery link</Link>}
 </section></main>;
}
