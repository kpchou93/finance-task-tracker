import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authOrigin } from "@/lib/logic/auth-validation";

export async function handleAuthCallback(request: Request, recovery = false) {
 const url = new URL(request.url);
 const origin = authOrigin(process.env.NEXT_PUBLIC_APP_URL, process.env.NODE_ENV === "production" ? null : url.origin);
 if (!origin) return new NextResponse("Authentication is temporarily unavailable. Please try again later.", { status: 503, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
 const code = url.searchParams.get("code");
 const tokenHash = url.searchParams.get("token_hash");
 const type = url.searchParams.get("type");
 let verified = false;
 try {
  const db = await createClient();
  if (code) verified = !(await db.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && type === (recovery ? "recovery" : "signup")) {
   verified = !(await db.auth.verifyOtp({ token_hash: tokenHash, type: recovery ? "recovery" : "signup" })).error;
  }
 } catch { /* Invalid and unavailable recovery sessions share the retry flow. */ }
 const destination = verified ? (recovery ? "/reset-password" : "/") : (recovery ? "/forgot-password?expired=1" : "/login?confirmation=retry");
 const response = NextResponse.redirect(new URL(destination, origin));
 response.headers.set("Cache-Control", "no-store");
 response.headers.set("Referrer-Policy", "no-referrer");
 return response;
}
