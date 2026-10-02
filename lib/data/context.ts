import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
export class AuthenticationRequired extends Error {}
export async function dataContext(demo = false) {
 if (demo) return {
  db: createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(), { auth: { persistSession: false, autoRefreshToken: false } }),
  owner: null, email: null
 };
 const db = await createClient();
 const { data: { user }, error } = await db.auth.getUser();
 if (error || !user) throw new AuthenticationRequired("Please log in again to save your changes.");
 return { db, owner: user.id, email: user.email || null };
}
