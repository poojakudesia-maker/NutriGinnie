import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const userId = await getCurrentUserId();
  if (userId) redirect("/dashboard");

  return (
    <div className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-emerald-700">NutriPing</h1>
        <p className="text-sm text-slate-500">Log in to your account</p>
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
