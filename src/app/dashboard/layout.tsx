import Link from "next/link";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { Separator } from "@/components/ui/separator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-muted/40">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r bg-background lg:flex lg:flex-col">
          <div className="p-6">
            <Link href="/dashboard" className="block">
              <p className="text-2xl font-bold tracking-tight">AgendaMe</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Panel del negocio
              </p>
            </Link>
          </div>

          <Separator />

          <DashboardSidebar />

          <div className="border-t p-4">
            <SignOutButton />
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-8">
            <div>
              <p className="text-sm text-muted-foreground">AgendaMe</p>
              <p className="font-semibold">Dashboard</p>
            </div>

            <div className="lg:hidden">
              <SignOutButton />
            </div>
          </header>

          <div className="flex-1 p-4 lg:p-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
