"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, requireSuperadmin } from "@/lib/auth/role";
import type { JenisPerubahanQueue } from "@/lib/supabase/database.types";

/**
 * MQ mengajukan perubahan. INSERT ini tunduk pada RLS update_queue di
 * database (kebijakan sudah dibuat di sisi Supabase: MQ hanya boleh
 * insert baris miliknya).
 *
 * Kita TIDAK mengirim pengirim_id dari client/form — diisi dari
 * auth.uid() milik user yang sedang login (lewat requireUser()), supaya
 * tidak ada yang bisa "mengaku" sebagai MQ lain.
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
 * Superadmin menyetujui/menolak. Ini HANYA memanggil RPC
 * public.proses_update_queue yang sudah tersedia di database (mengubah
 * status queue) — sesuai catatan schema, RPC ini TIDAK otomatis
 * mengubah data peserta.
 *
 * Untuk jenis_perubahan yang pemetaan kolomnya sudah jelas
 * (UBAH_STATUS, GANTI_NAMA), function ini SETELAH approve juga
 * menerapkan perubahan itu secara eksplisit (Superadmin memang punya
 * hak UPDATE langsung sesuai RLS), lalu mencatat ke riwayat_peserta
 * lewat RPC tulis_riwayat_peserta.
 *
 * PENTING (perbaikan AUDIT.md #3): setiap operasi database di bawah ini
 * WAJIB dicek error-nya dan dilempar sebagai exception. Sebelumnya kode
 * ini tidak membaca error dari update peserta_kelas/bisakh_peserta atau
 * dari RPC tulis_riwayat_peserta — akibatnya Superadmin bisa melihat
 * toast "berhasil" padahal Master Data sebenarnya gagal berubah dan
 * tidak ada jejak riwayat. Sekarang: begitu satu langkah gagal,
 * function ini throw dan UI menampilkan kegagalan yang sebenarnya.
 *
 * GANTI_NOMOR dan GANTI_ID SEKARANG diterapkan otomatis juga (sejak
 * verifikasi schema 7 Sep 2026): GANTI_NOMOR memakai field HP (hp1-hp4)
 * yang dipilih eksplisit oleh MQ di form, GANTI_ID memakai
 * peserta_kelas.nomor_urut (dikonfirmasi tidak ada kolom "ID Peserta"
 * terpisah di schema). Pengajuan lama yang datanya tidak lengkap/tidak
 * valid tetap jatuh ke jalur catatan_proses manual sebagai fallback aman.
 *
 * CATATAN ARSITEKTUR (tidak diperbaiki di sini, karena instruksi saat
 * ini melarang perubahan database): idealnya approve queue + terapkan
 * perubahan + tulis riwayat berjalan atomik dalam satu transaksi
 * database (mis. satu RPC baru), bukan beberapa panggilan terpisah dari
 * client seperti sekarang. Kalau salah satu langkah gagal setelah RPC
 * proses_update_queue sudah sukses mengubah status queue menjadi
 * "Disetujui", queue akan tampak selesai padahal Master Data belum
 * berubah — perbaikan sesungguhnya butuh RPC gabungan di database, di
 * luar cakupan kode aplikasi ini. Dicatat sebagai
 * DATABASE DECISION REQUIRED, bukan diperbaiki sekarang.
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

  if (fetchError || !queueRow) {
    throw new Error(fetchError?.message ?? "Queue tidak ditemukan");
  }

  const { error: rpcError } = await supabase.rpc("proses_update_queue", {
    p_queue_id: input.queue_id,
    p_keputusan: input.keputusan,
    p_catatan: input.catatan,
  });
  if (rpcError) throw new Error(rpcError.message);

  if (input.keputusan === "Disetujui" && queueRow.peserta_kelas_id) {
    if (queueRow.jenis_perubahan === "UBAH_STATUS") {
      const statusBaru = (queueRow.data_sesudah as Record<string, unknown>)
        ?.status_tb as string | undefined;

      if (statusBaru) {
        const { error: updateError } = await supabase
          .from("peserta_kelas")
          .update({ status_tb: statusBaru })
          .eq("id", queueRow.peserta_kelas_id);
        if (updateError) {
          throw new Error(`Gagal menerapkan UBAH_STATUS ke Master Data: ${updateError.message}`);
        }

        const { error: riwayatError } = await supabase.rpc("tulis_riwayat_peserta", {
          p_peserta_kelas_id: queueRow.peserta_kelas_id,
          p_jenis_perubahan: "UBAH_STATUS",
          p_data_sebelum: queueRow.data_sebelum,
          p_data_sesudah: queueRow.data_sesudah,
          p_alasan: queueRow.alasan,
        });
        if (riwayatError) {
          throw new Error(`Status berhasil diubah, tapi gagal mencatat riwayat: ${riwayatError.message}`);
        }
      }
    }

    if (queueRow.jenis_perubahan === "GANTI_NAMA") {
      const namaBaru = (queueRow.data_sesudah as Record<string, unknown>)
        ?.nama as string | undefined;

      const { data: pk, error: pkError } = await supabase
        .from("peserta_kelas")
        .select("peserta_id")
        .eq("id", queueRow.peserta_kelas_id)
        .single();
      if (pkError) {
        throw new Error(`Gagal membaca data peserta untuk GANTI_NAMA: ${pkError.message}`);
      }

      if (namaBaru && pk?.peserta_id) {
        const { error: updateError } = await supabase
          .from("bisakh_peserta")
          .update({ nama: namaBaru })
          .eq("id", pk.peserta_id);
        if (updateError) {
          throw new Error(`Gagal menerapkan GANTI_NAMA ke Master Data: ${updateError.message}`);
        }

        const { error: riwayatError } = await supabase.rpc("tulis_riwayat_peserta", {
          p_peserta_kelas_id: queueRow.peserta_kelas_id,
          p_jenis_perubahan: "GANTI_NAMA",
          p_data_sebelum: queueRow.data_sebelum,
          p_data_sesudah: queueRow.data_sesudah,
          p_alasan: queueRow.alasan,
        });
        if (riwayatError) {
          throw new Error(`Nama berhasil diubah, tapi gagal mencatat riwayat: ${riwayatError.message}`);
        }
      }
    }

    if (queueRow.jenis_perubahan === "GANTI_NOMOR") {
      // Sejak perbaikan AUDIT.md #7: field target (hp1-hp4) sudah dipilih
      // eksplisit oleh MQ di form pengajuan, tidak lagi diasumsikan hp1.
      const target = queueRow.data_sesudah as Record<string, unknown> | null;
      const field = target?.field as string | undefined;
      const nilai = target?.nilai as string | undefined;
      const validFields = ["hp1", "hp2", "hp3", "hp4"];

      if (field && validFields.includes(field) && nilai) {
        const { data: pk, error: pkError } = await supabase
          .from("peserta_kelas")
          .select("peserta_id")
          .eq("id", queueRow.peserta_kelas_id)
          .single();
        if (pkError) {
          throw new Error(`Gagal membaca data peserta untuk GANTI_NOMOR: ${pkError.message}`);
        }

        if (pk?.peserta_id) {
          const { error: updateError } = await supabase
            .from("bisakh_peserta")
            .update({ [field]: nilai })
            .eq("id", pk.peserta_id);
          if (updateError) {
            throw new Error(`Gagal menerapkan GANTI_NOMOR ke Master Data: ${updateError.message}`);
          }

          const { error: riwayatError } = await supabase.rpc("tulis_riwayat_peserta", {
            p_peserta_kelas_id: queueRow.peserta_kelas_id,
            p_jenis_perubahan: "GANTI_NOMOR",
            p_data_sebelum: queueRow.data_sebelum,
            p_data_sesudah: queueRow.data_sesudah,
            p_alasan: queueRow.alasan,
          });
          if (riwayatError) {
            throw new Error(`Nomor HP berhasil diubah, tapi gagal mencatat riwayat: ${riwayatError.message}`);
          }
        }
      } else {
        // Pengajuan lama (dibuat sebelum perbaikan ini) mungkin belum
        // punya field target eksplisit — tandai untuk tindak lanjut manual
        // alih-alih menerapkan ke kolom yang salah.
        const { error: catatanError } = await supabase
          .from("update_queue")
          .update({
            catatan_proses:
              (input.catatan ? input.catatan + " — " : "") +
              "PERLU TINDAKAN MANUAL: pengajuan ini tidak menyertakan field HP target yang jelas. Terapkan manual di halaman Peserta, lalu catat di riwayat.",
          })
          .eq("id", input.queue_id);
        if (catatanError) {
          throw new Error(`Gagal menyimpan catatan tindak lanjut manual: ${catatanError.message}`);
        }
      }
    }

    // GANTI_ID: sudah diverifikasi langsung ke schema aktual (7 Sep 2026) —
    // peserta_kelas TIDAK punya kolom "ID Peserta" terpisah, hanya
    // nomor_urut integer. Karena itu satu-satunya target yang valid,
    // GANTI_ID sekarang diterapkan otomatis ke peserta_kelas.nomor_urut,
    // sama seperti UBAH_STATUS/GANTI_NAMA/GANTI_NOMOR di atas.
    if (queueRow.jenis_perubahan === "GANTI_ID") {
      const nomorBaru = (queueRow.data_sesudah as Record<string, unknown>)
        ?.nomor_urut as number | undefined;

      if (nomorBaru != null) {
        const { error: updateError } = await supabase
          .from("peserta_kelas")
          .update({ nomor_urut: Number(nomorBaru) })
          .eq("id", queueRow.peserta_kelas_id);
        if (updateError) {
          throw new Error(`Gagal menerapkan GANTI_ID ke Master Data: ${updateError.message}`);
        }

        const { error: riwayatError } = await supabase.rpc("tulis_riwayat_peserta", {
          p_peserta_kelas_id: queueRow.peserta_kelas_id,
          p_jenis_perubahan: "GANTI_ID",
          p_data_sebelum: queueRow.data_sebelum,
          p_data_sesudah: queueRow.data_sesudah,
          p_alasan: queueRow.alasan,
        });
        if (riwayatError) {
          throw new Error(`Nomor urut berhasil diubah, tapi gagal mencatat riwayat: ${riwayatError.message}`);
        }
      } else {
        // Pengajuan lama tanpa nomor_urut numerik yang valid — tandai manual
        // alih-alih menerapkan nilai yang tidak jelas.
        const { error: catatanError } = await supabase
          .from("update_queue")
          .update({
            catatan_proses:
              (input.catatan ? input.catatan + " — " : "") +
              "PERLU TINDAKAN MANUAL: nilai nomor_urut pada pengajuan ini tidak valid. Terapkan manual di halaman Peserta, lalu catat di riwayat.",
          })
          .eq("id", input.queue_id);
        if (catatanError) {
          throw new Error(`Gagal menyimpan catatan tindak lanjut manual: ${catatanError.message}`);
        }
      }
    }
  }

  revalidatePath("/update-queue");
  revalidatePath(`/peserta/${queueRow.peserta_kelas_id}`);
}

/**
 * Perbaikan AUDIT.md #13: sebelumnya satu-satunya jalur mengubah
 * status_tb/nama/HP/nomor_urut adalah UpdateQueueForm, yang SELALU
 * membuat baris update_queue — termasuk saat dipakai Superadmin, yang
 * jadi harus "mengajukan lalu menyetujui punya sendiri". Ini
 * bertentangan dengan spesifikasi "Superadmin dapat melakukan
 * perubahan langsung sesuai permission".
 *
 * Function ini HANYA untuk Superadmin (requireSuperadmin()), TIDAK
 * pernah menyentuh update_queue sama sekali — langsung update Master
 * Data + tulis_riwayat_peserta dalam satu langkah, dengan pengecekan
 * error di setiap operasi (konsisten dengan perbaikan #3).
 */
export async function ubahMasterDataLangsung(input: {
  peserta_kelas_id: number;
  jenis_perubahan: JenisPerubahanQueue;
  data_sebelum: Record<string, unknown>;
  data_sesudah: Record<string, unknown>;
  alasan: string;
}) {
  await requireSuperadmin();
  const supabase = createClient();

  if (input.jenis_perubahan === "UBAH_STATUS") {
    const statusBaru = input.data_sesudah.status_tb as string | undefined;
    if (!statusBaru) throw new Error("Status baru wajib diisi.");

    const { error: updateError } = await supabase
      .from("peserta_kelas")
      .update({ status_tb: statusBaru })
      .eq("id", input.peserta_kelas_id);
    if (updateError) throw new Error(`Gagal mengubah status: ${updateError.message}`);
  } else if (input.jenis_perubahan === "GANTI_NAMA") {
    const namaBaru = input.data_sesudah.nama as string | undefined;
    if (!namaBaru) throw new Error("Nama baru wajib diisi.");

    const { data: pk, error: pkError } = await supabase
      .from("peserta_kelas")
      .select("peserta_id")
      .eq("id", input.peserta_kelas_id)
      .single();
    if (pkError || !pk?.peserta_id) throw new Error(pkError?.message ?? "Peserta tidak ditemukan.");

    const { error: updateError } = await supabase
      .from("bisakh_peserta")
      .update({ nama: namaBaru })
      .eq("id", pk.peserta_id);
    if (updateError) throw new Error(`Gagal mengubah nama: ${updateError.message}`);
  } else if (input.jenis_perubahan === "GANTI_NOMOR") {
    const field = input.data_sesudah.field as string | undefined;
    const nilai = input.data_sesudah.nilai as string | undefined;
    const validFields = ["hp1", "hp2", "hp3", "hp4"];
    if (!field || !validFields.includes(field) || !nilai) {
      throw new Error("Pilih field HP target dan isi nilai baru.");
    }

    const { data: pk, error: pkError } = await supabase
      .from("peserta_kelas")
      .select("peserta_id")
      .eq("id", input.peserta_kelas_id)
      .single();
    if (pkError || !pk?.peserta_id) throw new Error(pkError?.message ?? "Peserta tidak ditemukan.");

    const { error: updateError } = await supabase
      .from("bisakh_peserta")
      .update({ [field]: nilai })
      .eq("id", pk.peserta_id);
    if (updateError) throw new Error(`Gagal mengubah nomor HP: ${updateError.message}`);
  } else if (input.jenis_perubahan === "GANTI_ID") {
    const nomorBaru = input.data_sesudah.nomor_urut as number | undefined;
    if (nomorBaru == null) throw new Error("Nomor urut baru wajib diisi.");

    const { error: updateError } = await supabase
      .from("peserta_kelas")
      .update({ nomor_urut: Number(nomorBaru) })
      .eq("id", input.peserta_kelas_id);
    if (updateError) throw new Error(`Gagal mengubah nomor urut: ${updateError.message}`);
  }

  const { error: riwayatError } = await supabase.rpc("tulis_riwayat_peserta", {
    p_peserta_kelas_id: input.peserta_kelas_id,
    p_jenis_perubahan: input.jenis_perubahan,
    p_data_sebelum: input.data_sebelum,
    p_data_sesudah: input.data_sesudah,
    p_alasan: input.alasan,
  });
  if (riwayatError) {
    throw new Error(`Perubahan berhasil diterapkan, tapi gagal mencatat riwayat: ${riwayatError.message}`);
  }

  revalidatePath(`/peserta/${input.peserta_kelas_id}`);
  revalidatePath("/audit");
}
