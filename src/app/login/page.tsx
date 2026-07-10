import { AuthForm } from "@/components/auth/auth-form";

type LoginPageProps = {
  searchParams?: Promise<{
    estado?: string;
    mensaje?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const authErrorMessage =
    params.estado === "confirmacion_error"
      ? params.mensaje ??
        "No pudimos confirmar el enlace. Inicia sesion o solicita uno nuevo."
      : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_16%,transparent),transparent_34%),linear-gradient(180deg,var(--background),var(--muted))] px-4 py-10">
      <AuthForm mode="login" authErrorMessage={authErrorMessage} />
    </main>
  );
}
