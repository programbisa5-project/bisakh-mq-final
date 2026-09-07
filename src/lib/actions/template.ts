"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/role";

export async function simpanTemplate(input: {
  id?: number;
  nama_template: string;
  isi_template: string;
  kategori: string | null;
  status_aktif: boolean;
}) {
  const user = await requireUser();
  const supabase = createClient();
  const { id, ...payload } = input;
  const { error } = id
    ? await supabase.from("template").update({ ...payload, updated_by: user.authId }).eq("id", id)
    : await supabase.from("template").insert({ ...payload, created_by: user.authId, updated_by: user.authId });
  if (error) throw new Error(error.message);
  revalidatePath("/template");
}
