"use server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authOrigin, passwordError, validEmail } from "@/lib/logic/auth-validation";
export async function authenticate(form: FormData, signup: boolean) {
 const email = String(form.get("email") || "").trim();
 const password = String(form.get("password") || "");
 if (!validEmail(email) || password.length < 8 || password.length > 128) return { error: "Enter a valid email and a password of 8–128 characters." };
 const db = await createClient();
 if (!signup) {
  const { error } = await db.auth.signInWithPassword({ email, password });
  return error ? { error: "Unable to sign in. Check your email and password, and confirm your email if you just signed up." } : { success: true };
 }
 const requestHeaders = await headers();
 const origin = authOrigin(process.env.NEXT_PUBLIC_APP_URL, requestHeaders.get("origin"));
 if (!origin) return { error: "Sign-up is unavailable. Please try again later." };
 const { data, error } = await db.auth.signUp({ email, password, options: { emailRedirectTo: origin + "/auth/callback" } });
 if (error) return { error: "Unable to create your account. Please retry later or sign in if you already have one." };
 return data.session ? { success: true } : { message: "Check your email to confirm your account, then sign in. If this address already has an account, use Sign in." };
}
export async function requestPasswordReset(form: FormData) {
 const email = String(form.get("email") || "").trim();
 if (!validEmail(email)) return { error: "Enter a valid email address." };
 const requestHeaders = await headers();
 const origin = authOrigin(process.env.NEXT_PUBLIC_APP_URL, requestHeaders.get("origin"));
 if (!origin) return { error: "Password recovery is unavailable. Please try again later." };
 const db = await createClient();
 const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: origin + "/auth/recovery" });
 if (error) return { error: "We could not send a recovery email. Please wait a few minutes and try again." };
 return { message: "If an account exists for this email, you’ll receive a password-reset link. Open it in this browser. Check your spam folder too." };
}

export async function updatePassword(form: FormData) {
 const password = String(form.get("password") || "");
 const validation = passwordError(password, String(form.get("confirmation") || ""));
 if (validation) return { error: validation };
 const db = await createClient();
 const { data, error: authError } = await db.auth.getUser();
 if (authError || !data.user) return { error: "Your recovery session has expired. Request a new password-reset link." };
 const { error } = await db.auth.updateUser({ password });
 if (error) return { error: "Unable to update your password. Use a different password or request a new recovery link." };
 await db.auth.signOut({ scope: "local" });
 return { message: "Your password has been updated. Sign in with your new password." };
}
export async function signOut() {
 const db = await createClient();
 await db.auth.signOut();
 redirect("/login");
}
