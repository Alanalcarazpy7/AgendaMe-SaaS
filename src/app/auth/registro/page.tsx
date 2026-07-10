import { AuthForm } from "@/components/auth/auth-form";

export default function RegistroPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_16%,transparent),transparent_34%),linear-gradient(180deg,var(--background),var(--muted))] px-4 py-10">
      <AuthForm mode="registro" />
    </main>
  );
}
