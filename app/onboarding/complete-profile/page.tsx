import { redirect } from "next/navigation";
import { getCurrentUser, isProfileComplete } from "@/lib/session";
import CompleteProfileForm from "@/components/onboarding/CompleteProfileForm";

export default async function CompleteProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (isProfileComplete(user)) redirect("/dashboard");

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-orange-dark">Welcome, {user.name}!</h1>
        <p className="text-sm text-charcoal-muted">A few more details to build your personalized diet plan.</p>
      </div>
      <CompleteProfileForm userId={user.id} />
    </div>
  );
}
