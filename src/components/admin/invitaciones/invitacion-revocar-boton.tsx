"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { revocarInvitacionAction } from "@/lib/admin/actions/invitaciones";

export function InvitacionRevocarBoton({ invitacionId }: { invitacionId: string }) {
  const [pending, startTransition] = useTransition();

  function revocar() {
    if (!window.confirm("¿Revocar esta invitación? Ya no se podrá aceptar.")) return;

    startTransition(async () => {
      const result = await revocarInvitacionAction({ invitacionId });
      if (result.ok) {
        toast.success("Invitación revocada.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={revocar} disabled={pending}>
      <Ban className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
      {pending ? "Revocando..." : "Revocar"}
    </Button>
  );
}
