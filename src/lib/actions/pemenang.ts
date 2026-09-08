"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/role";
export async function cariPesertaUntukPemenang(angkatanId:
number, q: string) {
await requireUser();
const supabase = createClient();
const { data } = await supabase
.from("peserta_kelas")
.select("id, bisakh_peserta!inner(nama)")
.eq("angkatan_id", angkatanId)
.ilike("bisakh_peserta.nama", `%${q}%`)
.limit(10);


return (data ?? []).map((r: any) => ({ id: r.id, nama:
r.bisakh_peserta?.nama as string }));
}
export async function simpanPemenang(input: {
id?: number;
kegiatan_id: number;
peserta_kelas_id: number;
peringkat: number | null;
keputusan_hadiah: string;
catatan: string | null;
}) {
await requireUser();
const supabase = createClient();
// cek riwayat hadiah sebelumnya untuk peserta ini (agar peringatan "pernah dapat hadiah" akurat)
const { data: pemenangSebelumnya } = await supabase
.from("pemenang")
.select("id")
.eq("peserta_kelas_id", input.peserta_kelas_id)
.eq("keputusan_hadiah", "Diberikan");
const pernahDapatHadiah = (pemenangSebelumnya?.length ?? 0) >
0;
const { id, ...payload } = input;
const { error } = id
? await supabase.from("pemenang").update({ ...payload,
pernah_dapat_hadiah: pernahDapatHadiah }).eq("id", id)
: await supabase.from("pemenang").insert({ ...payload,
pernah_dapat_hadiah: pernahDapatHadiah });
if (error) throw new Error(error.message);
revalidatePath("/pemenang");
}
