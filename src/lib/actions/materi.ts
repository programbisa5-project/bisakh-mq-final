"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/role";

export async function simpanMateri(input: { id?: number; judul: string; isi_materi: string; kategori: string | null; status_aktif: boolean }) {
  const user = await requireUser();
  const supabase = createClient();
  const { id, ...payload } = input;
  const { error } = id
    ? await supabase.from("materi").update({ ...payload, updated_by: user.authId }).eq("id", id)
    : await supabase.from("materi").insert({ ...payload, created_by: user.authId, updated_by: user.authId });
  if (error) throw new Error(error.message);
  revalidatePath("/materi");
}

export async function simpanPembukaMuhadharah(input: { id?: number; judul: string; isi: string; kategori: string | null; status_aktif: boolean }) {
  const user = await requireUser();
  const supabase = createClient();
  const { id, ...payload } = input;
  const { error } = id
    ? await supabase.from("pembuka_muhadharah").update({ ...payload, updated_by: user.authId }).eq("id", id)
    : await supabase.from("pembuka_muhadharah").insert({ ...payload, created_by: user.authId, updated_by: user.authId });
  if (error) throw new Error(error.message);
  revalidatePath("/pembuka-muhadharah");
}
