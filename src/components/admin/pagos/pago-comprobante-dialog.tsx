"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, FileUp, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  pagoId: string;
  comprobanteUrl: string | null;
};

export function PagoComprobanteDialog({ pagoId, comprobanteUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [pending, startTransition] = useTransition();
  const [previewError, setPreviewError] = useState(false);
  // Reinicia el estado de error de previsualización cuando cambia el
  // comprobante (ej. después de reemplazarlo), siguiendo el patrón de React
  // para "ajustar estado cuando cambia una prop" sin usar un efecto (ver
  // https://react.dev/learn/you-might-not-need-an-effect).
  const [comprobanteUrlPrevio, setComprobanteUrlPrevio] = useState(comprobanteUrl);
  if (comprobanteUrl !== comprobanteUrlPrevio) {
    setComprobanteUrlPrevio(comprobanteUrl);
    setPreviewError(false);
  }
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const comprobanteHref = `/api/admin/pagos/${pagoId}/comprobante`;
  // Cache-busting: el path interno cambia cuando se reemplaza el archivo,
  // asi el navegador no sigue mostrando la imagen vieja desde cache tras
  // subir una nueva (la URL del Route Handler es siempre la misma).
  const previewSrc = comprobanteUrl ? `${comprobanteHref}?v=${encodeURIComponent(comprobanteUrl)}` : null;

  function subir() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      toast.error("Selecciona un comprobante");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch(`/api/admin/pagos/${pagoId}/comprobante`, {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        toast.error("No se pudo subir el comprobante", {
          description: data.error ?? "Revisa el archivo e intenta nuevamente.",
        });
        return;
      }

      toast.success("Comprobante actualizado", {
        description: "El pago ya tiene el archivo asociado.",
      });
      setOpen(false);
      setFileName("");
      router.refresh();
    });
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" className="h-8 rounded-xl" onClick={() => setOpen(true)}>
        <ReceiptText className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        {comprobanteUrl ? "Ver/adjuntar" : "Adjuntar"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-[1.6rem]">
          <DialogHeader>
            <DialogTitle>Comprobante del pago</DialogTitle>
            <DialogDescription>
              Adjunta o reemplaza el archivo si recibiste el comprobante por fuera del dashboard, por ejemplo por WhatsApp, email o banco.
              Formatos: JPG, PNG, WEBP o PDF hasta 5 MB.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            {previewSrc ? (
              <div className="grid gap-2">
                {!previewError ? (
                  <div className="overflow-hidden rounded-2xl border border-border/80 bg-muted/20">
                    {/* eslint-disable-next-line @next/next/no-img-element -- viene de un Route Handler protegido, no de next/image */}
                    <img
                      src={previewSrc}
                      alt="Comprobante de pago"
                      className="max-h-72 w-full object-contain"
                      onError={() => setPreviewError(true)}
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/80 bg-muted/35 p-4 text-sm text-muted-foreground">
                    No se pudo previsualizar el archivo (puede ser un PDF). Abrilo en tamaño completo para verlo.
                  </div>
                )}
                <a
                  href={comprobanteHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 px-4 text-sm font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
                >
                  <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                  Ver en tamaño completo
                </a>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 bg-muted/35 p-4 text-sm text-muted-foreground">
                Este pago todavia no tiene comprobante asociado. Podes adjuntarlo manualmente si lo recibiste por otro canal.
              </div>
            )}

            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.3rem] border border-dashed border-border/80 bg-background/70 p-5 text-center transition hover:bg-muted">
              <FileUp className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="text-sm font-black">{fileName || "Seleccionar archivo"}</span>
              <span className="text-xs text-muted-foreground">Se reemplaza el comprobante anterior si ya existe.</span>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="sr-only"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
              />
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" onClick={subir} disabled={pending}>
              {pending ? "Subiendo..." : "Guardar comprobante"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
