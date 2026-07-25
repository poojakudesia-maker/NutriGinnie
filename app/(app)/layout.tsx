import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import BottomNav from "@/components/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-4 pt-6">{children}</main>
      <BottomNav />
    </div>
  );
}
