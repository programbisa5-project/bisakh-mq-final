"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperadmin, requireUser } from "@/lib/auth/role";
export async function simpanSoal(input: {
id?: number;
nomor_soal: number | null;
pertanyaan: string;
jawaban: string | null;
kategori: string | null;
tingkat_kesulitan: string | null;
status_aktif: boolean;
}) {
await requireSuperadmin();
const supabase = createClient();
const { id, ...payload } = input;
const { error } = id
? await supabase.from("soal").update(payload).eq("id", id)
: await supabase.from("soal").insert(payload);
if (error) throw new Error(error.message);
revalidatePath("/soal");
}


/** WAJIB pakai RPC ini — jangan pernah INSERT langsung ke
soal_usage dari frontend. */
export async function cekKetersediaanSoal(soalId: number,
angkatanId: number) {
await requireUser();
const supabase = createClient();
const { data, error } = await supabase.rpc("soal_tersedia", {
p_soal_id: soalId, p_angkatan_id: angkatanId });
if (error) throw new Error(error.message);
return Boolean(data);
}
/** WAJIB pakai RPC ini — jangan pernah INSERT langsung ke
soal_usage dari frontend. */
export async function catatPenggunaanSoal(soalId: number,
angkatanId: number, catatan: string) {
await requireUser();
const supabase = createClient();
const { error } = await supabase.rpc("catat_penggunaan_soal", {
p_soal_id: soalId,
p_angkatan_id: angkatanId,
p_catatan: catatan || null,
});
if (error) throw new Error(error.message);
revalidatePath("/soal");
}
