"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LimiteRecursoContent } from "@/components/planes/limite-recurso-card";
import type { LimiteRecursoInfo } from "@/lib/planes/limite-recurso";

type LimiteRecursoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  info: LimiteRecursoInfo;
};

export function LimiteRecursoDialog({
  open,
  onOpenChange,
  info,
}: LimiteRecursoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <LimiteRecursoContent info={info} onCerrar={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
