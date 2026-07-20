import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const PAYMENT_PROOFS_BUCKET = "payment-proofs";
export const PAYMENT_PROOF_SIGNED_URL_TTL_SECONDS = 5 * 60;

function normalizarPath(path: string) {
  const limpio = path.trim().replace(/^\/+/, "");

  if (!limpio || limpio.includes("..") || limpio.includes("\\")) {
    return null;
  }

  return limpio;
}

export function extraerPaymentProofPath(valor: string | null | undefined) {
  const raw = valor?.trim();
  if (!raw) return null;

  const marker = `/storage/v1/object/public/${PAYMENT_PROOFS_BUCKET}/`;
  const signedMarker = `/storage/v1/object/sign/${PAYMENT_PROOFS_BUCKET}/`;

  try {
    const url = new URL(raw);
    const markerUsado = url.pathname.includes(marker)
      ? marker
      : url.pathname.includes(signedMarker)
        ? signedMarker
        : null;

    if (!markerUsado) return null;

    const [, pathCodificado] = url.pathname.split(markerUsado);
    return normalizarPath(decodeURIComponent(pathCodificado ?? ""));
  } catch {
    return normalizarPath(raw);
  }
}

export function esUrlHttpSegura(valor: string | null | undefined) {
  if (!valor) return false;

  try {
    const url = new URL(valor);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function crearPaymentProofSignedUrl(path: string) {
  const pathSeguro = extraerPaymentProofPath(path);

  if (!pathSeguro) {
    throw new Error("Comprobante inválido.");
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(PAYMENT_PROOFS_BUCKET)
    .createSignedUrl(pathSeguro, PAYMENT_PROOF_SIGNED_URL_TTL_SECONDS);

  if (error) throw new Error(error.message);

  return data.signedUrl;
}

export async function obtenerUrlSeguraComprobantePago(valor: string | null | undefined) {
  const path = extraerPaymentProofPath(valor);

  if (path) {
    return crearPaymentProofSignedUrl(path);
  }

  // Fallback para datos historicos que no sean parseables como objeto de
  // payment-proofs. Sigue protegido por el Route Handler que llama este helper.
  if (esUrlHttpSegura(valor)) {
    return valor as string;
  }

  return null;
}
