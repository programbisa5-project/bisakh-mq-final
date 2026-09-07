"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ajukanUpdateQueue } from "@/lib/actions/update-queue";
import { Button } from "@/components/ui/Button";
import type { JenisPerubahanQueue } from "@/lib/supabase/database.types";
import { HP_FIELDS, buildDataSesudah, validateDataSesudah, type HpField } from "@/lib/actions/queue-contract";

const JENIS_OPTIONS: { value: JenisPerubahanQueue; label: string }[] = [
  { value: "UBAH_STATUS", label: "Ubah status TB" },
  { value: "GANTI_NAMA", label: "Ganti nama" },
  { value: "GANTI_NOMOR", label: "Ganti nomor HP" },
  { value: "GANTI_ID", label: "Ganti ID / nomor urut" },
];

const HP_LABELS: Record<HpField, string> = { hp1: "HP 1", hp2: "HP 2", hp3: "HP 3", hp4: "HP 4" };

export function UpdateQueueForm({
  pesertaKelasId,
  currentStatus,
  currentNama,
  currentNomorUrut,
  currentHp,
}: {
  pesertaKelasId: number;
  currentStatus: string;
  currentNama?: string;
  currentNomorUrut?: number | null;
  currentHp?: Partial<Record<HpField, string | null>>;
}) {
  const [jenis, setJenis] = useState<JenisPerubahanQueue>("UBAH_STATUS");
  const [nilaiBaru, setNilaiBaru] = useState("");
  const [hpField, setHpField] = useState<HpField>("hp1");
  const [alasan, setAlasan] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nilaiBaru || !alasan) {
      toast.error("Nilai baru dan alasan wajib diisi.");
      return;
    }

    const dataSesudah = buildDataSesudah(jenis, {
      statusBaru: nilaiBaru,
      namaBaru: nilaiBaru,
      hpField,
      hpBaru: nilaiBaru,
      nomorUrutBaru: Number(nilaiBaru),
    });

    const validationError = validateDataSesudah(jenis, dataSesudah);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const dataSebelum: Record<string, unknown> =
      jenis === "UBAH_STATUS"
        ? { status_tb: currentStatus }
        : jenis === "GANTI_NAMA"
        ? { nama: currentNama }
        : jenis === "GANTI_NOMOR"
        ? { field: hpField, nilai: currentHp?.[hpField] ?? null }
        : { nomor_urut: currentNomorUrut ?? null };

    setLoading(true);
    try {
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
        onChange={(e) => {
          setJenis(e.target.value as JenisPerubahanQueue);
          setNilaiBaru("");
        }}
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
          onChange={(e) => setHpField(e.target.value as HpField)}
          className="rounded-md border border-ink/15 px-3 py-2 text-sm"
        >
          {HP_FIELDS.map((f) => (
            <option key={f} value={f}>
              {HP_LABELS[f]} (saat ini: {currentHp?.[f] || "-"})
            </option>
          ))}
        </select>
      ) : null}

      <input
        value={nilaiBaru}
        onChange={(e) => setNilaiBaru(e.target.value)}
        type={jenis === "GANTI_ID" ? "number" : "text"}
        placeholder={
          jenis === "UBAH_STATUS"
            ? "Aktif / DO / Selesai / Tidak Aktif"
            : jenis === "GANTI_NOMOR"
            ? "Nomor HP baru"
            : jenis === "GANTI_ID"
            ? "Nomor urut baru"
            : "Nilai baru"
        }
        className={jenis === "GANTI_NOMOR" ? "rounded-md border border-ink/15 px-3 py-2 text-sm" : "rounded-md border border-ink/15 px-3 py-2 text-sm md:col-span-2"}
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
