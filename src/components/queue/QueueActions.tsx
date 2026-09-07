"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { prosesUpdateQueue } from "@/lib/actions/update-queue";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function QueueActions({ queueId }: { queueId: number }) {
  const [catatan, setCatatan] = useState("");

  async function proses(keputusan: "Disetujui" | "Ditolak") {
    try {
      await prosesUpdateQueue({ queue_id: queueId, keputusan, catatan });
      toast.success(keputusan === "Disetujui" ? "Pengajuan disetujui." : "Pengajuan ditolak.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses.");
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
        placeholder="Catatan (opsional)"
        className="w-40 rounded-md border border-ink/15 px-2 py-1 text-xs"
      />
      <div className="flex gap-1.5">
        <ConfirmDialog
          trigger={<Button variant="primary" className="px-2 py-1 text-xs">Setujui</Button>}
          title="Setujui pengajuan ini?"
          description="Perubahan akan diterapkan sesuai jenis pengajuannya."
          confirmLabel="Ya, setujui"
          onConfirm={() => proses("Disetujui")}
        />
        <ConfirmDialog
          trigger={<Button variant="danger" className="px-2 py-1 text-xs">Tolak</Button>}
          title="Tolak pengajuan ini?"
          confirmLabel="Ya, tolak"
          variant="danger"
          onConfirm={() => proses("Ditolak")}
        />
      </div>
    </div>
  );
}
