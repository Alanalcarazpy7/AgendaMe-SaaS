import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardMobileMenu } from "@/components/dashboard/dashboard-mobile-menu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block lg:w-72">
        <DashboardSidebar userEmail={user.email ?? ""} />
      </div>

      <div className="min-w-0 flex-1 lg:pl-72">
        <DashboardMobileMenu userEmail={user.email ?? ""} />

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}