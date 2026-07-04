import Link from "next/link";
import { Crown, Lock, Sparkles } from "lucide-react";

type PremiumFeaturePageProps = {
  titulo: string;
  descripcion: string;
  desde: string;
  activo: boolean;
  estadoActivoTitulo: string;
  estadoActivoDescripcion: string;
};

export function PremiumFeaturePage({
  titulo,
  descripcion,
  desde,
  activo,
  estadoActivoTitulo,
  estadoActivoDescripcion,
}: PremiumFeaturePageProps) {
  if (!activo) {
    return (
      <section className="rounded-3xl border bg-background p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-yellow-100 text-yellow-700">
          <Lock className="h-8 w-8" />
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">{titulo}</h1>

        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          {descripcion}
        </p>

        <div className="mx-auto mt-6 inline-flex items-center rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700">
          <Crown className="mr-2 h-4 w-4" />
          Disponible desde {desde}
        </div>

        <div className="mt-7">
          <Link
            href="/dashboard/planes"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90"
          >
            Mejorar plan
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border bg-background p-8 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-green-100 text-green-700">
        <Sparkles className="h-8 w-8" />
      </div>

      <h1 className="mt-6 text-3xl font-bold tracking-tight">
        {estadoActivoTitulo}
      </h1>

      <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
        {estadoActivoDescripcion}
      </p>

      <div className="mx-auto mt-6 inline-flex items-center rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
        Función habilitada en tu plan
      </div>
    </section>
  );
}