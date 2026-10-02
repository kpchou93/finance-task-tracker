"use server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
export async function authenticate(form: FormData, signup: boolean) {
 const email = String(form.get("email") || "").trim();
 const password = String(form.get("password") || "");
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 128) return { error: "Enter a valid email and a password of 8–128 characters." };
 const db = await createClient();
 if (!signup) {
  const { error } = await db.auth.signInWithPassword({ email, password });
  return error ? { error: "Unable to sign in. Check your email and password, and confirm your email if you just signed up." } : { success: true };
 }
 const requestHeaders = await headers();
 const origin = process.env.NEXT_PUBLIC_APP_URL?.trim() || requestHeaders.get("origin");
 if (!origin || (!origin.startsWith("https://") && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) return { error: "Sign-up is unavailable. Please try again later." };
 const { data, error } = await db.auth.signUp({ email, password, options: { emailRedirectTo: origin + "/auth/callback" } });
 if (error) return { error: "Unable to create your account. Please retry later or sign in if you already have one." };
 return data.session ? { success: true } : { message: "Check your email to confirm your account, then sign in. If this address already has an account, use Sign in." };
}
export async function signOut() {
 const db = await createClient();
 await db.auth.signOut();
 redirect("/login");
}
