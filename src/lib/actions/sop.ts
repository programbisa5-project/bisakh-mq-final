"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/auth/role";

export async function simpanSopRule(input: {
  id?: number;
  kode_rule: string;
  judul: string;
  isi_rule: string;
  kategori: string | null;
  prioritas: number | null;
  status_aktif: boolean;
}) {
  const user = await requireSuperadmin();
  const supabase = createClient();
  const { id, ...payload } = input;
  const { error } = id
    ? await supabase.from("sop_rule").update({ ...payload, updated_by: user.authId }).eq("id", id)
    : await supabase.from("sop_rule").insert({ ...payload, created_by: user.authId, updated_by: user.authId });
  if (error) throw new Error(error.message);
  revalidatePath("/sop");
}

export async function simpanSopDocument(input: {
  id?: number;
  judul: string;
  deskripsi: string | null;
  file_url: string;
  nama_file: string | null;
  status_aktif: boolean;
}) {
  const user = await requireSuperadmin();
  const supabase = createClient();
  const { id, ...payload } = input;
  const { error } = id
    ? await supabase.from("sop_document").update(payload).eq("id", id)
    : await supabase.from("sop_document").insert({ ...payload, uploaded_by: user.authId, tanggal_upload: new Date().toISOString().slice(0, 10) });
  if (error) throw new Error(error.message);
  revalidatePath("/sop");
}
