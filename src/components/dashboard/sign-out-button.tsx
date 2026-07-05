"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
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
      className="w-full justify-start"
      onClick={handleSignOut}
      disabled={loading}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {loading ? "Saliendo..." : "Cerrar sesión"}
    </Button>
  );
}
