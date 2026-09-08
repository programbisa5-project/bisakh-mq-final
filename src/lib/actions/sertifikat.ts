"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/auth/role";
export async function simpanSertifikat(input: {
peserta_kelas_id: number;
link_sertifikat: string;
keterangan: string;
}) {
const user = await requireSuperadmin();
const supabase = createClient();
const { error } = await supabase.from("sertifikat_link").upsert(
{
peserta_kelas_id: input.peserta_kelas_id,
link_sertifikat: input.link_sertifikat,
keterangan: input.keterangan || null,


updated_by: user.authId,
},
{ onConflict: "peserta_kelas_id" }
);
if (error) throw new Error(error.message);
revalidatePath(`/peserta/${input.peserta_kelas_id}`);
}
