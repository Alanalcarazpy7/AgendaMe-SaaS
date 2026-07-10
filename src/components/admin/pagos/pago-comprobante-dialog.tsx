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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

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
        {comprobanteUrl ? "Ver/subir" : "Subir"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-[1.6rem]">
          <DialogHeader>
            <DialogTitle>Comprobante del pago</DialogTitle>
            <DialogDescription>
              Adjunta una captura o PDF de la transferencia. Formatos: JPG, PNG, WEBP o PDF hasta 5 MB.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            {comprobanteUrl ? (
              <a
                href={comprobanteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 px-4 text-sm font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                Abrir comprobante actual
              </a>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 bg-muted/35 p-4 text-sm text-muted-foreground">
                Este pago todavia no tiene comprobante asociado.
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
