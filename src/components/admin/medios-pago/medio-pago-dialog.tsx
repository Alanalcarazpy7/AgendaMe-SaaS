"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Loader2, Pencil, Plus, QrCode, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { guardarMedioPagoAction } from "@/lib/admin/actions/medios-pago";
import type { MedioPagoPlataforma } from "@/lib/admin/queries/medios-pago";

type Props = {
  medio?: MedioPagoPlataforma;
  siguienteOrden: number;
};

const TIPOS = [
  { value: "transferencia", label: "Transferencia bancaria" },
  { value: "billetera", label: "Billetera (Tigo Money, Personal Pay, Zimple...)" },
  { value: "qr", label: "QR" },
  { value: "otro", label: "Otro" },
] as const;

const ALIAS_TIPOS = ["Alias bancario", "Teléfono", "Cédula/RUC", "Usuario", "Otro"] as const;

const ALIAS_TIPO_POR_DEFECTO: Record<(typeof TIPOS)[number]["value"], (typeof ALIAS_TIPOS)[number]> = {
  transferencia: "Alias bancario",
  billetera: "Teléfono",
  qr: "Otro",
  otro: "Otro",
};

type CampoImagen = "logo" | "qr";

type ImagenStaged = {
  file: File | null;
  previewUrl: string | null;
  eliminar: boolean;
};

function imagenVacia(): ImagenStaged {
  return { file: null, previewUrl: null, eliminar: false };
}

function ImagenPicker({
  label,
  icono,
  valor,
  urlExistente,
  onChange,
  disabled,
}: {
  label: string;
  icono: React.ReactNode;
  valor: ImagenStaged;
  urlExistente: string | null;
  onChange: (valor: ImagenStaged) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const urlVisible = valor.file ? valor.previewUrl : valor.eliminar ? null : urlExistente;

  function elegirArchivo(file: File) {
    if (valor.previewUrl) URL.revokeObjectURL(valor.previewUrl);
    onChange({ file, previewUrl: URL.createObjectURL(file), eliminar: false });
  }

  function quitar() {
    if (valor.previewUrl) URL.revokeObjectURL(valor.previewUrl);
    onChange({ file: null, previewUrl: null, eliminar: Boolean(urlExistente) });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
      {urlVisible ? (
        <Image
          src={urlVisible}
          alt={label}
          width={64}
          height={64}
          unoptimized
          className="h-16 w-16 rounded-md border bg-white object-contain p-1"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-md border bg-muted text-muted-foreground">
          {icono}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) elegirArchivo(file);
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
          {urlVisible ? `Reemplazar ${label.toLowerCase()}` : `Elegir ${label.toLowerCase()}`}
        </Button>
        {urlVisible && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={disabled}
            onClick={quitar}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Quitar
          </Button>
        )}
      </div>
    </div>
  );
}

async function subirImagen(medioId: string, campo: CampoImagen, file: File) {
  const formData = new FormData();
  formData.append("campo", campo);
  formData.append("file", file);

  const response = await fetch(`/api/admin/medios-pago/${medioId}/imagen`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `No se pudo subir el ${campo === "logo" ? "logo" : "QR"}.`);
  }
}

async function eliminarImagen(medioId: string, campo: CampoImagen) {
  const response = await fetch(`/api/admin/medios-pago/${medioId}/imagen`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ campo }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `No se pudo quitar el ${campo === "logo" ? "logo" : "QR"}.`);
  }
}

export function MedioPagoDialog({ medio, siguienteOrden }: Props) {
  const router = useRouter();
  const esEditar = Boolean(medio);
  const [open, setOpen] = useState(false);

  const [tipo, setTipo] = useState<(typeof TIPOS)[number]["value"]>("transferencia");
  const [nombre, setNombre] = useState("");
  const [titular, setTitular] = useState("");
  const [banco, setBanco] = useState("");
  const [alias, setAlias] = useState("");
  const [aliasTipo, setAliasTipo] = useState<string>(ALIAS_TIPOS[0]);
  const [referencia, setReferencia] = useState("");
  const [notas, setNotas] = useState("");
  const [activo, setActivo] = useState(true);
  const [logo, setLogo] = useState<ImagenStaged>(imagenVacia);
  const [qr, setQr] = useState<ImagenStaged>(imagenVacia);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;

    // Reinicia el formulario con los datos del medio seleccionado (o en
    // blanco si es "crear") cada vez que se abre, para no arrastrar lo
    // que se haya tipeado la última vez que se usó este diálogo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTipo((medio?.tipo as (typeof TIPOS)[number]["value"]) ?? "transferencia");
    setNombre(medio?.nombre ?? "");
    setTitular(medio?.titular ?? "");
    setBanco(medio?.banco ?? "");
    setAlias(medio?.identificador_principal ?? "");
    setAliasTipo(
      medio?.alias_tipo ??
        ALIAS_TIPO_POR_DEFECTO[(medio?.tipo as (typeof TIPOS)[number]["value"]) ?? "transferencia"]
    );
    setReferencia(medio?.identificador_secundario ?? "");
    setNotas(medio?.notas ?? "");
    setActivo(medio?.activo ?? true);
    setLogo(imagenVacia());
    setQr(imagenVacia());
  }, [open, medio]);

  async function guardar() {
    setPending(true);

    try {
      const result = await guardarMedioPagoAction({
        id: medio?.id,
        tipo,
        nombre,
        titular,
        banco,
        identificadorPrincipal: alias,
        aliasTipo,
        identificadorSecundario: referencia,
        notas,
        activo,
        orden: medio?.orden ?? siguienteOrden,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      const errores: string[] = [];

      if (logo.file) {
        await subirImagen(result.id, "logo", logo.file).catch((e) => errores.push(e.message));
      } else if (logo.eliminar) {
        await eliminarImagen(result.id, "logo").catch((e) => errores.push(e.message));
      }

      if (qr.file) {
        await subirImagen(result.id, "qr", qr.file).catch((e) => errores.push(e.message));
      } else if (qr.eliminar) {
        await eliminarImagen(result.id, "qr").catch((e) => errores.push(e.message));
      }

      if (errores.length > 0) {
        toast.warning("Se guardó, pero hubo un problema con las imágenes", {
          description: errores.join(" "),
        });
      } else {
        toast.success(esEditar ? "Medio de pago actualizado." : "Medio de pago creado.");
      }

      setOpen(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {esEditar ? (
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Editar
        </Button>
      ) : (
        <Button type="button" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Agregar medio de pago
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{esEditar ? `Editar — ${medio?.nombre}` : "Nuevo medio de pago"}</DialogTitle>
            <DialogDescription>
              Esto es lo que ve cada negocio antes de pagar o renovar su plan en /dashboard/planes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="medio-tipo">Tipo</Label>
              <select
                id="medio-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as (typeof TIPOS)[number]["value"])}
                className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {TIPOS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="medio-nombre">Nombre visible</Label>
              <Input
                id="medio-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Banco Ueno, Banco Itaú, Tigo Money"
              />
            </div>

            {tipo === "transferencia" && (
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="medio-banco">Banco</Label>
                <Input
                  id="medio-banco"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  placeholder="Ej: Ueno Bank, Itaú, Banco Familiar"
                />
              </div>
            )}

            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="medio-logo">Logo del medio de pago</Label>
              <ImagenPicker
                label="Logo"
                icono={<Building2 className="h-6 w-6" />}
                valor={logo}
                urlExistente={medio?.logo_url ?? null}
                onChange={setLogo}
                disabled={pending}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="medio-titular">Titular</Label>
              <Input
                id="medio-titular"
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
                placeholder="Nombre y apellido"
              />
            </div>

            <div className="grid grid-cols-[9rem_minmax(0,1fr)] gap-1.5 sm:col-span-2">
              <div className="grid gap-1.5">
                <Label htmlFor="medio-alias-tipo">¿Qué es?</Label>
                <select
                  id="medio-alias-tipo"
                  value={aliasTipo}
                  onChange={(e) => setAliasTipo(e.target.value)}
                  className="flex h-10 w-full rounded-md border bg-background px-2 text-sm"
                >
                  {ALIAS_TIPOS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="medio-alias">Alias</Label>
                <Input
                  id="medio-alias"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="Lo que ve el negocio para transferir"
                />
              </div>
            </div>

            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="medio-referencia">Referencia adicional (opcional)</Label>
              <Input
                id="medio-referencia"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ej: número de teléfono, otra referencia"
              />
              <p className="text-xs text-muted-foreground">
                El número de cuenta no hace falta cargarlo: con el alias y el titular alcanza para transferir.
              </p>
            </div>

            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="medio-notas">Notas para el negocio (opcional)</Label>
              <Textarea
                id="medio-notas"
                rows={2}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej: enviar el comprobante con el nombre del negocio en el concepto"
              />
            </div>

            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
              Visible para los negocios
            </label>

            <div className="grid gap-1.5 sm:col-span-2">
              <Label>Código QR (opcional)</Label>
              <ImagenPicker
                label="QR"
                icono={<QrCode className="h-6 w-6" />}
                valor={qr}
                urlExistente={medio?.qr_url ?? null}
                onChange={setQr}
                disabled={pending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" onClick={guardar} disabled={pending || !nombre.trim()}>
              {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {pending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
