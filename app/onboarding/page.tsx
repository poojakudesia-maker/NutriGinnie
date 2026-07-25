import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import OnboardingForm from "@/components/onboarding/OnboardingForm";

export default async function OnboardingPage() {
  const userId = await getCurrentUserId();
  if (userId) redirect("/dashboard");

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-emerald-700">NutriPing</h1>
        <p className="text-sm text-slate-500">Tell us about yourself to get your personalized diet plan.</p>
      </div>
      <OnboardingForm />
    </div>
  );
}
