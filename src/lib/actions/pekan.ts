"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/auth/role";
export async function simpanPekan(input: {
id?: number;


angkatan_id: number;
nomor_pekan: number;
nama_pekan: string | null;
tanggal_mulai: string | null;
tanggal_selesai: string | null;
status: string;
keterangan: string | null;
}) {
await requireSuperadmin();
const supabase = createClient();
const { id, ...payload } = input;
const { error } = id
? await supabase.from("pekan").update(payload).eq("id", id)
: await supabase.from("pekan").insert(payload);
if (error) throw new Error(error.message);
revalidatePath("/pekan");
}
