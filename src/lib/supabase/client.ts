"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

// Client-side Supabase client. Hanya memakai ANON key — semua otorisasi
// tetap ditegakkan oleh RLS di database, bukan oleh kode di sini.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
