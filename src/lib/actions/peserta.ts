"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/auth/role";
import type { JenisPerubahanQueue } from "@/lib/supabase/database.types";
import { HP_FIELDS, type HpField } from "@/lib/actions/queue-contract";

/**
 * Jalur khusus Superadmin (audit #10): "Superadmin boleh melakukan perubahan
 * langsung tanpa membuat queue untuk dirinya sendiri."
 *
 *   SUPERADMIN → Edit langsung → Master Data → Riwayat
 *
 * Ini TIDAK menyentuh tabel update_queue sama sekali (bukan "auto-approve" —
 * benar-benar jalur terpisah). Authorization ditegakkan lewat requireSuperadmin()
 * di server (bukan tombol yang disembunyikan), dan RLS bisakh_peserta/peserta_kelas
 * di database tetap jadi lapisan terakhir. Setiap pemanggilan tetap dicatat ke
 * riwayat_peserta lewat RPC tulis_riwayat_peserta yang sudah ada (tidak ada RPC
 * baru dibuat), supaya perubahan langsung Superadmin tetap punya jejak audit.
 */
export async function editLangsungPeserta(input: {
  peserta_kelas_id: number;
  jenis_perubahan: JenisPerubahanQueue;
  status_tb_baru?: string;
  nama_baru?: string;
  hp_field?: HpField;
  hp_baru?: string;
  nomor_urut_baru?: number;
  alasan: string;
}) {
  await requireSuperadmin();
  const supabase = createClient();

  if (!input.alasan) throw new Error("Alasan wajib diisi untuk jejak riwayat.");

  const { data: pk, error: pkError } = await supabase
    .from("peserta_kelas")
    .select("peserta_id, status_tb, nomor_urut, bisakh_peserta(nama, hp1, hp2, hp3, hp4)")
    .eq("id", input.peserta_kelas_id)
    .single();
  if (pkError || !pk) throw new Error(pkError?.message ?? "Data peserta tidak ditemukan.");

  const master = (pk as any).bisakh_peserta;

  let dataSebelum: Record<string, unknown> = {};
  let dataSesudah: Record<string, unknown> = {};

  if (input.jenis_perubahan === "UBAH_STATUS") {
    if (!input.status_tb_baru) throw new Error("Status TB baru wajib diisi.");
    dataSebelum = { status_tb: pk.status_tb };
    dataSesudah = { status_tb: input.status_tb_baru };

    const { error } = await supabase
      .from("peserta_kelas")
      .update({ status_tb: input.status_tb_baru })
      .eq("id", input.peserta_kelas_id);
    if (error) throw new Error(`Update status_tb gagal: ${error.message}`);
  } else if (input.jenis_perubahan === "GANTI_NAMA") {
    if (!input.nama_baru) throw new Error("Nama baru wajib diisi.");
    dataSebelum = { nama: master?.nama };
    dataSesudah = { nama: input.nama_baru };

    const { error } = await supabase.from("bisakh_peserta").update({ nama: input.nama_baru }).eq("id", pk.peserta_id);
    if (error) throw new Error(`Update nama gagal: ${error.message}`);
  } else if (input.jenis_perubahan === "GANTI_NOMOR") {
    if (!input.hp_field || !HP_FIELDS.includes(input.hp_field)) throw new Error("Field HP (hp1-hp4) wajib dipilih.");
    if (!input.hp_baru) throw new Error("Nomor HP baru wajib diisi.");
    dataSebelum = { field: input.hp_field, nilai: master?.[input.hp_field] ?? null };
    dataSesudah = { field: input.hp_field, nilai: input.hp_baru };

    const { error } = await supabase
      .from("bisakh_peserta")
      .update({ [input.hp_field]: input.hp_baru })
      .eq("id", pk.peserta_id);
    if (error) throw new Error(`Update ${input.hp_field} gagal: ${error.message}`);
  } else if (input.jenis_perubahan === "GANTI_ID") {
    if (input.nomor_urut_baru == null || Number.isNaN(Number(input.nomor_urut_baru))) {
      throw new Error("Nomor urut baru wajib berupa angka.");
    }
    dataSebelum = { nomor_urut: pk.nomor_urut };
    dataSesudah = { nomor_urut: Number(input.nomor_urut_baru) };

    const { error } = await supabase
      .from("peserta_kelas")
      .update({ nomor_urut: Number(input.nomor_urut_baru) })
      .eq("id", input.peserta_kelas_id);
    if (error) throw new Error(`Update nomor_urut gagal: ${error.message}`);
  } else {
    throw new Error("Jenis perubahan tidak dikenali.");
  }

  // Mekanisme riwayat yang tersedia mendukung pencatatan ini (RPC sudah ada) —
  // sesuai instruksi §10, perubahan langsung Superadmin tetap tercatat.
  const { error: riwayatError } = await supabase.rpc("tulis_riwayat_peserta", {
    p_peserta_kelas_id: input.peserta_kelas_id,
    p_jenis_perubahan: input.jenis_perubahan,
    p_data_sebelum: dataSebelum,
    p_data_sesudah: dataSesudah,
    p_alasan: input.alasan,
  });
  if (riwayatError) {
    // Data master SUDAH berubah pada titik ini — beri tahu apa adanya, jangan
    // pura-pura gagal total (lihat juga catatan atomicity di update-queue.ts).
    throw new Error(`Data berhasil diubah, tapi riwayat GAGAL dicatat: ${riwayatError.message}`);
  }

  revalidatePath(`/peserta/${input.peserta_kelas_id}`);
  revalidatePath("/peserta");
}
