const WHATSAPP_NUMBER_DEFAULT = "595994295092";

function soloDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function getWhatsappNumber() {
  const numero =
    process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_NUMBER ||
    process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ||
    WHATSAPP_NUMBER_DEFAULT;

  return soloDigitos(numero);
}

export function buildWhatsappUrl(mensaje: string, numero?: string) {
  const numeroFinal = soloDigitos(numero || getWhatsappNumber());

  return `https://wa.me/${numeroFinal}?text=${encodeURIComponent(mensaje)}`;
}
