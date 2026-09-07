"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/auth/role";

export async function simpanAngkatan(input: {
  id?: number;
  nama_angkatan: string;
  status: string;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  keterangan: string | null;
}) {
  await requireSuperadmin();
  const supabase = createClient();

  const { id, ...payload } = input;
  const { error } = id
    ? await supabase.from("angkatan").update(payload).eq("id", id)
    : await supabase.from("angkatan").insert(payload);

  if (error) throw new Error(error.message);
  revalidatePath("/angkatan");
}
