import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PasswordRecoveryForm from "@/components/PasswordRecoveryForm";
export const dynamic = "force-dynamic";
export default async function ResetPasswordPage() {
 const db = await createClient();
 const { data, error } = await db.auth.getUser();
 if (error || !data.user) redirect("/forgot-password?expired=1");
 return <PasswordRecoveryForm reset />;
}
