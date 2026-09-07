"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ubahRoleStatus } from "@/lib/actions/pengaturan";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { MqUser } from "@/lib/supabase/database.types";

export function PengaturanUserRow({ user }: { user: MqUser }) {
  const [role, setRole] = useState(user.role);
  const [statusAktif, setStatusAktif] = useState(user.status_aktif);
  const [loading, setLoading] = useState(false);

  async function simpan() {
    setLoading(true);
    try {
      await ubahRoleStatus({ id: user.id, role, status_aktif: statusAktif });
      toast.success("Diperbarui.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <tr className="border-t border-ink/5">
      <td className="px-4 py-2 font-medium text-ink">{user.nama ?? "-"}</td>
      <td className="px-4 py-2 text-ink/70">{user.email}</td>
      <td className="px-4 py-2">
        <select value={role} onChange={(e) => setRole(e.target.value as "mq" | "superadmin")} className="rounded-md border border-ink/15 px-2 py-1 text-xs">
          <option value="mq">mq</option>
          <option value="superadmin">superadmin</option>
        </select>
      </td>
      <td className="px-4 py-2">
        <label className="flex items-center gap-1.5 text-xs">
          <input type="checkbox" checked={statusAktif} onChange={(e) => setStatusAktif(e.target.checked)} />
          {statusAktif ? <Badge>Aktif</Badge> : <Badge>Tidak Aktif</Badge>}
        </label>
      </td>
      <td className="px-4 py-2 text-right">
        <Button variant="secondary" className="px-2 py-1 text-xs" disabled={loading} onClick={simpan}>
          {loading ? "Menyimpan..." : "Simpan"}
        </Button>
      </td>
    </tr>
  );
}
