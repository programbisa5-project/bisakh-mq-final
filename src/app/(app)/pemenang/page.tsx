import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PemenangForm } from "@/components/pemenang/PemenangForm";
import { NavigateSelect } from "@/components/ui/NavigateSelect";

export default async function PemenangPage({ searchParams }: { searchParams: { kegiatan?: string } }) {
  const supabase = createClient();

  const { data: kegiatanList } = await supabase
    .from("kegiatan")
    .select("id, nama_kegiatan, pekan_id, pekan(angkatan_id, nomor_pekan)")
    .order("id", { ascending: false })
    .limit(50);

  const kegiatanId = searchParams.kegiatan ? Number(searchParams.kegiatan) : kegiatanList?.[0]?.id;
  const kegiatan = (kegiatanList ?? []).find((k: any) => k.id === kegiatanId);
  const angkatanId = (kegiatan as any)?.pekan?.angkatan_id;

  const { data: rows } = kegiatanId
    ? await supabase
        .from("pemenang")
        .select("*, peserta_kelas(id, bisakh_peserta(nama))")
        .eq("kegiatan_id", kegiatanId)
        .order("peringkat", { ascending: true })
    : { data: [] as any[] };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl text-ink">Pemenang</h1>
        {kegiatanId && angkatanId ? <PemenangForm kegiatanId={kegiatanId} angkatanId={angkatanId} /> : null}
      </div>

      <div className="mt-3">
        <NavigateSelect
          options={(kegiatanList ?? []).map((k) => ({ value: k.id, label: k.nama_kegiatan }))}
          value={kegiatanId}
          paramName="kegiatan"
          basePath="/pemenang"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-ink/10 bg-white">
        {!rows || rows.length === 0 ? (
          <EmptyState title="Belum ada pemenang untuk kegiatan ini" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-ink/5 text-left text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-2">Peringkat</th>
                <th className="px-4 py-2">Peserta</th>
                <th className="px-4 py-2">Pernah dapat hadiah</th>
                <th className="px-4 py-2">Keputusan hadiah</th>
                <th className="px-4 py-2">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p: any) => (
                <tr key={p.id} className="border-t border-ink/5">
                  <td className="px-4 py-2">{p.peringkat ?? "-"}</td>
                  <td className="px-4 py-2 font-medium text-ink">{p.peserta_kelas?.bisakh_peserta?.nama}</td>
                  <td className="px-4 py-2">{p.pernah_dapat_hadiah ? <Badge>Selesai</Badge> : "-"}</td>
                  <td className="px-4 py-2"><Badge>{p.keputusan_hadiah}</Badge></td>
                  <td className="px-4 py-2 text-ink/60">{p.catatan ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
