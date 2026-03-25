import VerifyEmailForm from "./verify-email-form";

export default async function VerifyEmailPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;

  return <VerifyEmailForm initialEmail={resolvedSearchParams?.email || ""} />;
}
