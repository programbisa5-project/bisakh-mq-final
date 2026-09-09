"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/auth/role";
import type { Kegiatan } from "@/lib/supabase/database.types";
export async function simpanKegiatan(input: {
id?: number;
pekan_id: number;
nama_kegiatan: string;
deskripsi: string | null;
tanggal_kegiatan: string | null;
status: Kegiatan["status"];
keterangan: string | null;
}) {
await requireSuperadmin();
const supabase = createClient();
const { id, ...payload } = input;
const { error } = id
? await supabase.from("kegiatan").update(payload).eq("id", id)
: await supabase.from("kegiatan").insert(payload);
if (error) throw new Error(error.message);
revalidatePath("/kegiatan");
}
