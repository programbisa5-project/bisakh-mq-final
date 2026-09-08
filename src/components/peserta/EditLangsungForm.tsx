"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ubahMasterDataLangsung } from "@/lib/actions/update-queue";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { JenisPerubahanQueue } from "@/lib/supabase/database.types";

const JENIS_OPTIONS: { value: JenisPerubahanQueue; label: string }[] = [
  { value: "UBAH_STATUS", label: "Ubah status TB" },
  { value: "GANTI_NAMA", label: "Ganti nama" },
  { value: "GANTI_NOMOR", label: "Ganti nomor HP" },
  { value: "GANTI_ID", label: "Ganti ID / nomor urut" },
];

const HP_FIELD_OPTIONS = ["hp1", "hp2", "hp3", "hp4"] as const;

/**
 * Perbaikan AUDIT.md #13 — khusus Superadmin: perubahan langsung ke
 * Master Data TANPA lewat update_queue, sesuai spesifikasi "Superadmin
 * dapat melakukan perubahan langsung sesuai permission". Dirender
 * terpisah dari UpdateQueueForm (yang tetap dipakai MQ) supaya alur
 * approval MQ tidak pernah tersentuh oleh jalur ini.
 */
export function EditLangsungForm({
  pesertaKelasId,
  currentStatus,
  currentNama,
}: {
  pesertaKelasId: number;
  currentStatus: string;
  currentNama?: string;
}) {
  const [jenis, setJenis] = useState<JenisPerubahanQueue>("UBAH_STATUS");
  const [hpField, setHpField] = useState<(typeof HP_FIELD_OPTIONS)[number]>("hp1");
  const [nilaiBaru, setNilaiBaru] = useState("");
  const [alasan, setAlasan] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!nilaiBaru || !alasan) {
      toast.error("Nilai baru dan alasan wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      const dataSesudah =
        jenis === "UBAH_STATUS"
          ? { status_tb: nilaiBaru }
          : jenis === "GANTI_NAMA"
          ? { nama: nilaiBaru }
          : jenis === "GANTI_NOMOR"
          ? { field: hpField, nilai: nilaiBaru }
          : { nomor_urut: Number(nilaiBaru) };

      const dataSebelum =
        jenis === "UBAH_STATUS"
          ? { status_tb: currentStatus }
          : jenis === "GANTI_NAMA"
          ? { nama: currentNama }
          : {};

      await ubahMasterDataLangsung({
        peserta_kelas_id: pesertaKelasId,
        jenis_perubahan: jenis,
        data_sebelum: dataSebelum,
        data_sesudah: dataSesudah,
        alasan,
      });
      toast.success("Master Data diperbarui langsung.");
      setNilaiBaru("");
      setAlasan("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menerapkan perubahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
      <p className="text-xs font-medium text-amber-700">
        Jalur khusus Superadmin — perubahan langsung diterapkan ke Master Data tanpa antrian persetujuan.
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <select
          value={jenis}
          onChange={(e) => setJenis(e.target.value as JenisPerubahanQueue)}
          className="rounded-md border border-ink/15 px-3 py-2 text-sm"
        >
          {JENIS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {jenis === "GANTI_NOMOR" ? (
          <select
            value={hpField}
            onChange={(e) => setHpField(e.target.value as (typeof HP_FIELD_OPTIONS)[number])}
            className="rounded-md border border-ink/15 px-3 py-2 text-sm"
          >
            {HP_FIELD_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f.toUpperCase()}
              </option>
            ))}
          </select>
        ) : null}

        <input
          value={nilaiBaru}
          onChange={(e) => setNilaiBaru(e.target.value)}
          placeholder={jenis === "UBAH_STATUS" ? "Aktif / DO / Selesai / Tidak Aktif" : "Nilai baru"}
          className={`rounded-md border border-ink/15 px-3 py-2 text-sm ${jenis === "GANTI_NOMOR" ? "" : "md:col-span-2"}`}
        />
        <input
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
          placeholder="Alasan"
          className="rounded-md border border-ink/15 px-3 py-2 text-sm"
        />

        <ConfirmDialog
          trigger={
            <Button variant="secondary" disabled={loading} className="md:col-span-4 md:w-fit">
              {loading ? "Menerapkan..." : "Terapkan langsung"}
            </Button>
          }
          title="Terapkan perubahan ini langsung ke Master Data?"
          description="Perubahan berlaku seketika tanpa antrian persetujuan, dan tetap tercatat di riwayat."
          confirmLabel="Ya, terapkan"
          onConfirm={submit}
        />
      </div>
    </div>
  );
}
