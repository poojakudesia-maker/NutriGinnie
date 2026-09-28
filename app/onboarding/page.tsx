import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import OnboardingForm from "@/components/onboarding/OnboardingForm";
import GoogleButton from "@/components/auth/GoogleButton";

export default async function OnboardingPage() {
  const userId = await getCurrentUserId();
  if (userId) redirect("/dashboard");

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-orange-dark">NutriPing</h1>
        <p className="text-sm text-charcoal-muted">Tell us about yourself to get your personalized diet plan.</p>
      </div>
      <div className="mb-5">
        <GoogleButton />
        <div className="my-4 flex items-center gap-3 text-xs text-charcoal-muted">
          <div className="h-px flex-1 bg-warm-border" />
          or sign up with email
          <div className="h-px flex-1 bg-warm-border" />
        </div>
      </div>
      <OnboardingForm />
      <p className="mt-4 text-center text-sm text-charcoal-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-orange-dark">
          Log in
        </Link>
      </p>
    </div>
  );
}
