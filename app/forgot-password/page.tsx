import PasswordRecoveryForm from "@/components/PasswordRecoveryForm";
export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
 const params = await searchParams;
 return <PasswordRecoveryForm expired={params.expired === "1"} />;
}
