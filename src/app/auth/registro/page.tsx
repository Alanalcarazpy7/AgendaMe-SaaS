import { AuthForm } from "@/components/auth/auth-form";

export default function RegistroPage() {
  return (
    <main className="relative isolate flex min-h-[100dvh] items-center justify-center overflow-x-hidden p-3 sm:p-5 lg:p-6">
      <div className="ag-private-bg pointer-events-none absolute inset-0 -z-10" />
      <AuthForm mode="registro" />
    </main>
  );
}
