import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/role";
import { Badge } from "@/components/ui/Badge";
import { formatTanggal } from "@/lib/utils/format";
import { PekanForm } from "@/components/pekan/PekanForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { AngkatanSelector } from "@/components/pekan/AngkatanSelector";

export default async function PekanPage({ searchParams }: { searchParams: { angkatan?: string } }) {
  const supabase = createClient();
  const user = await getCurrentUser();
  const isSuperadmin = user?.role === "superadmin";

  const { data: angkatanList } = await supabase.from("angkatan").select("id, nama_angkatan").order("id", { ascending: false });
  const angkatanId = searchParams.angkatan ? Number(searchParams.angkatan) : angkatanList?.[0]?.id;

  const { data: rows } = angkatanId
    ? await supabase.from("pekan").select("*").eq("angkatan_id", angkatanId).order("nomor_pekan", { ascending: true })
    : { data: [] as any[] };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl text-ink">Pekan</h1>
        {isSuperadmin && angkatanId ? <PekanForm angkatanId={angkatanId} /> : null}
      </div>

      <div className="mt-3">
        <AngkatanSelector angkatanList={angkatanList ?? []} value={angkatanId} basePath="/pekan" />
      </div>

      <div className="mt-4 space-y-2">
        {!rows || rows.length === 0 ? (
          <EmptyState title="Belum ada pekan untuk angkatan ini" />
        ) : (
          rows.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-ink/10 bg-white p-4">
              <div>
                <p className="font-medium text-ink">Pekan {p.nomor_pekan}{p.nama_pekan ? ` — ${p.nama_pekan}` : ""}</p>
                <p className="text-xs text-ink/50">{formatTanggal(p.tanggal_mulai)} – {formatTanggal(p.tanggal_selesai)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{p.status}</Badge>
                {isSuperadmin ? <PekanForm angkatanId={angkatanId!} existing={p} /> : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
