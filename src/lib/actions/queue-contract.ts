import type { JenisPerubahanQueue } from "@/lib/supabase/database.types";

/**
 * Kontrak data untuk `update_queue.data_sebelum` / `data_sesudah`.
 *
 * Sebelumnya bentuk JSON ini "ditebak" ulang di beberapa file (form pengajuan,
 * proses approve, tampilan riwayat). Sekarang semua bagian aplikasi WAJIB
 * memakai tipe & helper di file ini supaya bentuknya tidak pernah menyimpang.
 *
 * Field HP yang valid: hp1 | hp2 | hp3 | hp4 (lihat kolom `bisakh_peserta`).
 * GANTI_ID memetakan ke `peserta_kelas.nomor_urut` (lihat REPORT.md — DB CHANGE
 * NEEDED #1: skema tidak punya kolom "ID Peserta" bergaya teks tersendiri).
 */

export const HP_FIELDS = ["hp1", "hp2", "hp3", "hp4"] as const;
export type HpField = (typeof HP_FIELDS)[number];

export interface UbahStatusPayload {
  status_tb: string;
}

export interface GantiNamaPayload {
  nama: string;
}

export interface GantiNomorPayload {
  field: HpField;
  nilai: string;
}

export interface GantiIdPayload {
  nomor_urut: number;
}

export type QueuePayloadFor<T extends JenisPerubahanQueue> = T extends "UBAH_STATUS"
  ? UbahStatusPayload
  : T extends "GANTI_NAMA"
  ? GantiNamaPayload
  : T extends "GANTI_NOMOR"
  ? GantiNomorPayload
  : T extends "GANTI_ID"
  ? GantiIdPayload
  : never;

export function buildDataSesudah(
  jenis: JenisPerubahanQueue,
  input: { statusBaru?: string; namaBaru?: string; hpField?: HpField; hpBaru?: string; nomorUrutBaru?: number }
): Record<string, unknown> {
  switch (jenis) {
    case "UBAH_STATUS":
      return { status_tb: input.statusBaru ?? "" } satisfies UbahStatusPayload;
    case "GANTI_NAMA":
      return { nama: input.namaBaru ?? "" } satisfies GantiNamaPayload;
    case "GANTI_NOMOR":
      return { field: input.hpField ?? "hp1", nilai: input.hpBaru ?? "" } satisfies GantiNomorPayload;
    case "GANTI_ID":
      return { nomor_urut: Number(input.nomorUrutBaru ?? 0) } satisfies GantiIdPayload;
  }
}

/** Validasi minimal sebelum data dikirim ke server (dobel-cek juga dilakukan di server action). */
export function validateDataSesudah(jenis: JenisPerubahanQueue, data: Record<string, unknown>): string | null {
  switch (jenis) {
    case "UBAH_STATUS":
      if (!data.status_tb || typeof data.status_tb !== "string") return "Status TB baru wajib diisi.";
      return null;
    case "GANTI_NAMA":
      if (!data.nama || typeof data.nama !== "string") return "Nama baru wajib diisi.";
      return null;
    case "GANTI_NOMOR":
      if (!data.field || !HP_FIELDS.includes(data.field as HpField)) return "Nomor HP yang diganti wajib dipilih (HP1-HP4).";
      if (!data.nilai || typeof data.nilai !== "string") return "Nomor HP baru wajib diisi.";
      return null;
    case "GANTI_ID":
      if (typeof data.nomor_urut !== "number" || Number.isNaN(data.nomor_urut)) return "Nomor urut baru wajib berupa angka.";
      return null;
    default:
      return "Jenis perubahan tidak dikenali.";
  }
}
