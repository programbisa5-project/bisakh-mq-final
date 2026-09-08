"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ajukanUpdateQueue } from "@/lib/actions/update-queue";
import { Button } from "@/components/ui/Button";
import type { JenisPerubahanQueue } from "@/lib/supabase/database.types";

const JENIS_OPTIONS: { value: JenisPerubahanQueue; label: string }[] = [
  { value: "UBAH_STATUS", label: "Ubah status TB" },
  { value: "GANTI_NAMA", label: "Ganti nama" },
  { value: "GANTI_NOMOR", label: "Ganti nomor HP" },
  { value: "GANTI_ID", label: "Ganti ID / nomor urut" },
];

const HP_FIELD_OPTIONS = ["hp1", "hp2", "hp3", "hp4"] as const;

export function UpdateQueueForm({
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nilaiBaru || !alasan) {
      toast.error("Nilai baru dan alasan wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      // Kontrak JSON per jenis_perubahan (lihat AUDIT.md #7):
      // - GANTI_NOMOR sekarang wajib menyertakan field target (hp1-hp4)
      //   yang dipilih eksplisit oleh MQ, bukan diasumsikan hp1.
      // - GANTI_ID dikirim sebagai integer (Number), bukan string —
      //   kolom aslinya integer. Penerapan otomatisnya masih menunggu
      //   keputusan (lihat DATABASE DECISION REQUIRED di laporan)
      //   karena skema tidak punya kolom "ID Peserta" terpisah dari
      //   nomor_urut.
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

      await ajukanUpdateQueue({
        peserta_kelas_id: pesertaKelasId,
        jenis_perubahan: jenis,
        data_sebelum: dataSebelum,
        data_sesudah: dataSesudah,
        alasan,
      });
      toast.success("Pengajuan dikirim, menunggu persetujuan Superadmin.");
      setNilaiBaru("");
      setAlasan("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim pengajuan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 grid gap-3 md:grid-cols-4">
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
        className={`rounded-md border border-ink/15 px-3 py-2 text-sm ${ jenis === "GANTI_NOMOR" ? "" : "md:col-span-2" }`}
      />
      <input
        value={alasan}
        onChange={(e) => setAlasan(e.target.value)}
        placeholder="Alasan / sumber laporan"
        className="rounded-md border border-ink/15 px-3 py-2 text-sm"
      />
      <Button type="submit" disabled={loading} className="md:col-span-4 md:w-fit">
        {loading ? "Mengirim..." : "Ajukan perubahan"}
      </Button>
    </form>
  );
}
