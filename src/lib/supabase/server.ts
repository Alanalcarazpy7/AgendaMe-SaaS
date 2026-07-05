import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
    const cookieStore = await cookies();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
        throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL en .env.local");
    }

    if (!supabaseAnonKey) {
        throw new Error("Falta NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local");
    }

    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                } catch {
                    // Puede ejecutarse desde Server Components donde no se pueden setear cookies.
                    // El proxy se encarga de refrescar la sesión.
                }
            },
        },
    });
}