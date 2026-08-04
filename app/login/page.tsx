import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import LoginForm from "@/components/auth/LoginForm";
import GoogleButton from "@/components/auth/GoogleButton";
import { Card } from "@/components/ui/Card";

const ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: "Google Sign-In isn't set up on this deployment yet.",
  google_failed: "Google Sign-In failed. Please try again.",
  google_email_unverified: "Your Google account's email isn't verified.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const userId = await getCurrentUserId();
  if (userId) redirect("/dashboard");

  const { error } = await searchParams;

  return (
    <div className="gradient-hero flex min-h-screen flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center text-white">
          <h1 className="text-3xl font-bold">NutriPing</h1>
          <p className="mt-1 text-sm text-white/85">Log in to your account</p>
        </div>
        <Card className="!rounded-3xl">
          {error && ERROR_MESSAGES[error] && (
            <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{ERROR_MESSAGES[error]}</p>
          )}
          <GoogleButton />
          <div className="my-4 flex items-center gap-3 text-xs text-charcoal-muted">
            <div className="h-px flex-1 bg-warm-border" />
            or
            <div className="h-px flex-1 bg-warm-border" />
          </div>
          <LoginForm />
          <p className="mt-4 text-center text-sm text-charcoal-muted">
            New here?{" "}
            <Link href="/onboarding" className="font-medium text-orange-dark">
              Create a profile
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
