"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type SignOutButtonProps = {
  compact?: boolean;
  className?: string;
};

export function SignOutButton({ compact = false, className }: SignOutButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);

    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "icon" : "default"}
      className={className ?? (compact ? "w-full" : "w-full justify-start")}
      onClick={handleSignOut}
      disabled={loading}
      title="Cerrar sesión"
      aria-label="Cerrar sesión"
    >
      <LogOut className={compact ? "h-4 w-4" : "mr-2 h-4 w-4"} />
      {!compact && (loading ? "Saliendo..." : "Cerrar sesión")}
    </Button>
  );
}
