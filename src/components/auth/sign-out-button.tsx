"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type SignOutButtonProps = {
  variant?: "default" | "outline" | "ghost";
  className?: string;
};

export function SignOutButton({
  variant = "outline",
  className,
}: SignOutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={handleSignOut}
      disabled={loading}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {loading ? "Cerrando..." : "Cerrar sesión"}
    </Button>
  );
}