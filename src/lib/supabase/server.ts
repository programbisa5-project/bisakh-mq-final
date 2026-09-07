import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

// Server-side Supabase client untuk Server Components / Server Actions.
// Tetap memakai ANON key + cookie sesi user yang sedang login — BUKAN service_role key.
// Setiap query lewat client ini otomatis membawa identitas user (auth.uid()),
// sehingga RLS di database yang menentukan apa yang boleh dibaca/ditulis.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Dipanggil dari Server Component tanpa akses tulis cookie — aman diabaikan,
            // middleware yang menangani refresh sesi.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // sama seperti di atas
          }
        },
      },
    }
  );
}
