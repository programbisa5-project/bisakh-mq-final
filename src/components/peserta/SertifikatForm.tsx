"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { simpanSertifikat } from "@/lib/actions/sertifikat";
import { Button } from "@/components/ui/Button";
import type { SertifikatLink } from "@/lib/supabase/database.types";

export function SertifikatForm({
  pesertaKelasId,
  existing,
  canEdit,
}: {
  pesertaKelasId: number;
  existing: SertifikatLink | null;
  canEdit: boolean;
}) {
  const [link, setLink] = useState(existing?.link_sertifikat ?? "");
  const [keterangan, setKeterangan] = useState(existing?.keterangan ?? "");
  const [loading, setLoading] = useState(false);

  if (!canEdit) {
    return existing ? (
      <a href={existing.link_sertifikat} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-moss-600 hover:underline">
        Buka sertifikat
      </a>
    ) : (
      <p className="mt-2 text-sm text-ink/50">Link sertifikat belum tersedia.</p>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      {existing ? (
        <a href={existing.link_sertifikat} target="_blank" rel="noreferrer" className="inline-block text-sm text-moss-600 hover:underline">
          Buka link saat ini
        </a>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://drive.google.com/..."
          className="min-w-[240px] flex-1 rounded-md border border-ink/15 px-3 py-2 text-sm"
        />
        <input
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          placeholder="Keterangan (opsional)"
          className="rounded-md border border-ink/15 px-3 py-2 text-sm"
        />
        <Button
          disabled={loading || !link}
          onClick={async () => {
            setLoading(true);
            try {
              await simpanSertifikat({ peserta_kelas_id: pesertaKelasId, link_sertifikat: link, keterangan });
              toast.success("Link sertifikat disimpan.");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Gagal menyimpan.");
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </div>
  );
}
