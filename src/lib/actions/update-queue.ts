"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, requireSuperadmin } from "@/lib/auth/role";
import type { JenisPerubahanQueue } from "@/lib/supabase/database.types";
import {
  HP_FIELDS,
  type GantiIdPayload,
  type GantiNamaPayload,
  type GantiNomorPayload,
  type UbahStatusPayload,
} from "@/lib/actions/queue-contract";

/**
 * MQ mengajukan perubahan. INSERT ini tunduk pada RLS update_queue di database
 * (kebijakan sudah dibuat di sisi Supabase: MQ hanya boleh insert baris miliknya).
 * Kita TIDAK mengirim pengirim_id dari client/form — diisi dari auth.uid() milik
 * user yang sedang login (lewat requireUser()), supaya tidak ada yang bisa
 * "mengaku" sebagai MQ lain.
 *
 * MQ TIDAK punya jalur lain untuk menyentuh peserta_kelas / bisakh_peserta secara
 * langsung di action ini — satu-satunya efek dari function ini adalah INSERT baris
 * update_queue berstatus "Menunggu". Perubahan Master Data hanya terjadi lewat
 * prosesUpdateQueue() di bawah, yang mewajibkan requireSuperadmin().
 */
export async function ajukanUpdateQueue(input: {
  peserta_kelas_id: number;
  jenis_perubahan: JenisPerubahanQueue;
  data_sebelum: Record<string, unknown>;
  data_sesudah: Record<string, unknown>;
  alasan: string;
}) {
  const user = await requireUser();
  const supabase = createClient();

  const { error } = await supabase.from("update_queue").insert({
    peserta_kelas_id: input.peserta_kelas_id,
    pengirim_id: user.authId,
    jenis_perubahan: input.jenis_perubahan,
    data_sebelum: input.data_sebelum,
    data_sesudah: input.data_sesudah,
    alasan: input.alasan,
    status: "Menunggu",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/update-queue");
  revalidatePath(`/peserta/${input.peserta_kelas_id}`);
}

/**
 * Superadmin menyetujui/menolak. Alurnya:
 *   1. Panggil RPC public.proses_update_queue (mengubah status queue —
 *      RPC ini TIDAK otomatis mengubah data peserta, sesuai catatan schema).
 *   2. Kalau disetujui, terapkan perubahan ke Master Data (peserta_kelas /
 *      bisakh_peserta) sesuai jenis_perubahan, lalu catat ke riwayat_peserta
 *      lewat RPC tulis_riwayat_peserta.
 *
 * PENTING (audit #3): setiap langkah di atas WAJIB dicek errornya. Kalau langkah
 * 1 sukses tapi langkah 2 gagal, function ini TIDAK boleh membiarkan UI bilang
 * "berhasil" — queue ditandai status "Gagal" (nilai enum yang sudah ada di
 * StatusUpdateQueue, bukan kolom baru) dengan catatan_proses berisi pesan error
 * sesungguhnya, dan function ini throw supaya toast di client menampilkan gagal.
 *
 * Langkah 1 (RPC) dan langkah 2 (update tabel + RPC riwayat) BUKAN satu transaksi
 * atomik — Supabase JS tidak mendukung multi-statement transaction dari client
 * tanpa RPC baru. Karena instruksi pekerjaan ini melarang membuat RPC baru,
 * kemungkinan race/partial-failure antara langkah 1 dan 2 dicatat sebagai:
 *
 *   DATABASE DECISION REQUIRED — pertimbangkan membungkus proses_update_queue +
 *   update Master Data + tulis_riwayat_peserta dalam satu RPC transaksional di
 *   sisi database agar benar-benar atomik. Lihat FINAL_AUDIT.md.
 */
export async function prosesUpdateQueue(input: {
  queue_id: number;
  keputusan: "Disetujui" | "Ditolak";
  catatan: string;
}) {
  await requireSuperadmin();
  const supabase = createClient();

  const { data: queueRow, error: fetchError } = await supabase
    .from("update_queue")
    .select("*")
    .eq("id", input.queue_id)
    .single();
  if (fetchError || !queueRow) throw new Error(fetchError?.message ?? "Queue tidak ditemukan");

  const { error: rpcError } = await supabase.rpc("proses_update_queue", {
    p_queue_id: input.queue_id,
    p_keputusan: input.keputusan,
    p_catatan: input.catatan,
  });
  if (rpcError) throw new Error(rpcError.message);

  async function gagalkanQueue(pesan: string): Promise<never> {
    const { error: markError } = await supabase
      .from("update_queue")
      .update({
        status: "Gagal",
        catatan_proses: (input.catatan ? input.catatan + " — " : "") + `GAGAL: ${pesan}`,
      })
      .eq("id", input.queue_id);

    revalidatePath("/update-queue");

    if (markError) {
      // Master Data mungkin sudah gagal berubah (pesan asli di atas), DAN penandaan
      // status "Gagal" pada queue itu sendiri juga gagal ditulis — beri tahu keduanya
      // apa adanya, jangan sampai salah satunya ditelan diam-diam.
      throw new Error(`${pesan} (queue juga gagal ditandai "Gagal": ${markError.message})`);
    }

    throw new Error(pesan);
  }

  if (input.keputusan === "Disetujui" && queueRow.peserta_kelas_id) {
    const dataSesudah = (queueRow.data_sesudah ?? {}) as Record<string, unknown>;

    if (queueRow.jenis_perubahan === "UBAH_STATUS") {
      const statusBaru = (dataSesudah as UbahStatusPayload).status_tb;
      if (!statusBaru) return await gagalkanQueue("data_sesudah.status_tb kosong pada queue ini.");

      const { error: updateError } = await supabase
        .from("peserta_kelas")
        .update({ status_tb: statusBaru })
        .eq("id", queueRow.peserta_kelas_id);
      if (updateError) return await gagalkanQueue(`Update status_tb gagal: ${updateError.message}`);

      const { error: riwayatError } = await supabase.rpc("tulis_riwayat_peserta", {
        p_peserta_kelas_id: queueRow.peserta_kelas_id,
        p_jenis_perubahan: "UBAH_STATUS",
        p_data_sebelum: queueRow.data_sebelum,
        p_data_sesudah: queueRow.data_sesudah,
        p_alasan: queueRow.alasan,
      });
      if (riwayatError) return await gagalkanQueue(`status_tb sudah berubah tapi riwayat gagal dicatat: ${riwayatError.message}`);
    }

    if (queueRow.jenis_perubahan === "GANTI_NAMA") {
      const namaBaru = (dataSesudah as GantiNamaPayload).nama;
      if (!namaBaru) return await gagalkanQueue("data_sesudah.nama kosong pada queue ini.");

      const { data: pk, error: pkError } = await supabase
        .from("peserta_kelas")
        .select("peserta_id")
        .eq("id", queueRow.peserta_kelas_id)
        .single();
      if (pkError || !pk?.peserta_id) return await gagalkanQueue(pkError?.message ?? "peserta_kelas/peserta_id tidak ditemukan.");

      const { error: updateError } = await supabase.from("bisakh_peserta").update({ nama: namaBaru }).eq("id", pk.peserta_id);
      if (updateError) return await gagalkanQueue(`Update nama gagal: ${updateError.message}`);

      const { error: riwayatError } = await supabase.rpc("tulis_riwayat_peserta", {
        p_peserta_kelas_id: queueRow.peserta_kelas_id,
        p_jenis_perubahan: "GANTI_NAMA",
        p_data_sebelum: queueRow.data_sebelum,
        p_data_sesudah: queueRow.data_sesudah,
        p_alasan: queueRow.alasan,
      });
      if (riwayatError) return await gagalkanQueue(`nama sudah berubah tapi riwayat gagal dicatat: ${riwayatError.message}`);
    }

    if (queueRow.jenis_perubahan === "GANTI_NOMOR") {
      const payload = dataSesudah as GantiNomorPayload;
      if (!payload.field || !HP_FIELDS.includes(payload.field)) {
        return await gagalkanQueue("data_sesudah.field pada GANTI_NOMOR tidak valid (harus hp1-hp4).");
      }
      if (!payload.nilai) return await gagalkanQueue("data_sesudah.nilai (nomor HP baru) kosong.");

      const { data: pk, error: pkError } = await supabase
        .from("peserta_kelas")
        .select("peserta_id")
        .eq("id", queueRow.peserta_kelas_id)
        .single();
      if (pkError || !pk?.peserta_id) return await gagalkanQueue(pkError?.message ?? "peserta_kelas/peserta_id tidak ditemukan.");

      const { error: updateError } = await supabase
        .from("bisakh_peserta")
        .update({ [payload.field]: payload.nilai })
        .eq("id", pk.peserta_id);
      if (updateError) return await gagalkanQueue(`Update ${payload.field} gagal: ${updateError.message}`);

      const { error: riwayatError } = await supabase.rpc("tulis_riwayat_peserta", {
        p_peserta_kelas_id: queueRow.peserta_kelas_id,
        p_jenis_perubahan: "GANTI_NOMOR",
        p_data_sebelum: queueRow.data_sebelum,
        p_data_sesudah: queueRow.data_sesudah,
        p_alasan: queueRow.alasan,
      });
      if (riwayatError) return await gagalkanQueue(`${payload.field} sudah berubah tapi riwayat gagal dicatat: ${riwayatError.message}`);
    }

    if (queueRow.jenis_perubahan === "GANTI_ID") {
      const nomorUrutBaru = Number((dataSesudah as GantiIdPayload).nomor_urut);
      if (Number.isNaN(nomorUrutBaru)) return await gagalkanQueue("data_sesudah.nomor_urut bukan angka yang valid.");

      const { error: updateError } = await supabase
        .from("peserta_kelas")
        .update({ nomor_urut: nomorUrutBaru })
        .eq("id", queueRow.peserta_kelas_id);
      if (updateError) return await gagalkanQueue(`Update nomor_urut gagal: ${updateError.message}`);

      const { error: riwayatError } = await supabase.rpc("tulis_riwayat_peserta", {
        p_peserta_kelas_id: queueRow.peserta_kelas_id,
        p_jenis_perubahan: "GANTI_ID",
        p_data_sebelum: queueRow.data_sebelum,
        p_data_sesudah: queueRow.data_sesudah,
        p_alasan: queueRow.alasan,
      });
      if (riwayatError) return await gagalkanQueue(`nomor_urut sudah berubah tapi riwayat gagal dicatat: ${riwayatError.message}`);
    }
  }

  revalidatePath("/update-queue");
  revalidatePath(`/peserta/${queueRow.peserta_kelas_id}`);
}
