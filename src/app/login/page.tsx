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
        "No pudimos confirmar el enlace. Iniciá sesión o solicitá uno nuevo."
      : null;

  return (
    <main className="relative isolate flex min-h-[100dvh] items-center justify-center overflow-x-hidden p-3 sm:p-5 lg:p-6">
      <div className="ag-private-bg pointer-events-none absolute inset-0 -z-10" />
      <AuthForm mode="login" authErrorMessage={authErrorMessage} />
    </main>
  );
}
