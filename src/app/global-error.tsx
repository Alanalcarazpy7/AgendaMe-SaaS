"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw } from "lucide-react";
import "./globals.css";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="grid min-h-screen place-items-center bg-background px-5 text-foreground"
      >
        <main className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-xl sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-6 text-sm font-semibold text-primary">AgendaMe</p>
          <h1 className="mt-2 text-2xl font-bold">No pudimos cargar esta pantalla</h1>
          <p className="mt-3 leading-7 text-muted-foreground">
            El problema fue registrado para poder revisarlo. Tus datos no se
            modificaron; podés intentar nuevamente.
          </p>
          <button
            type="button"
            onClick={unstable_retry}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </button>
          {error.digest ? (
            <p className="mt-5 font-mono text-xs text-muted-foreground">
              Referencia: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
