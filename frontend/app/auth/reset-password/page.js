import ResetPasswordForm from "./reset-password-form";

export default async function ResetPasswordPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;

  return <ResetPasswordForm initialEmail={resolvedSearchParams?.email || ""} />;
}
