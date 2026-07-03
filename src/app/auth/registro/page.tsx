import { AuthForm } from "@/components/auth/auth-form";

export default function RegistroPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <AuthForm mode="registro" />
    </main>
  );
}
