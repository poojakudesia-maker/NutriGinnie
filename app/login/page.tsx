import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import LoginForm from "@/components/auth/LoginForm";
import GoogleButton from "@/components/auth/GoogleButton";

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
    <div className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-emerald-700">NutriPing</h1>
        <p className="text-sm text-slate-500">Log in to your account</p>
      </div>
      {error && ERROR_MESSAGES[error] && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{ERROR_MESSAGES[error]}</p>
      )}
      <GoogleButton />
      <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        or
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <LoginForm />
      <p className="mt-4 text-center text-sm text-slate-500">
        New here?{" "}
        <Link href="/onboarding" className="font-medium text-emerald-700">
          Create a profile
        </Link>
      </p>
    </div>
  );
}
