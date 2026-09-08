import { createClient } from "@/lib/supabase/server";

import type {
  Angkatan,
  TableName,
} from "@/lib/supabase/database.types";

async function count(
  supabase: ReturnType<typeof createClient>,
  table: TableName,
  filters?: Record<string, unknown>
) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value as never);
    }
  }
  const { count } = await query;
  return count ?? 0;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: angkatanAktif } = await supabase
  .from("angkatan")
  .select("id, nama_angkatan")
  .eq("status", "Aktif");

const typedAngkatanAktif: Pick<
  Angkatan,
  "id" | "nama_angkatan"
>[] = angkatanAktif ?? [];
  
  const [
    totalPeserta,
    pesertaAktif,
    pesertaDo,
    pesertaSelesai,
    pesertaLulus,
    kegiatanBerlangsung,
    pemenangBelumDiputuskan,
    queueMenunggu,
    soalAktif,
  ] = await Promise.all([
    count(supabase, "peserta_kelas"),
    count(supabase, "peserta_kelas", { status_tb: "Aktif" }),
    count(supabase, "peserta_kelas", { status_tb: "DO" }),
    count(supabase, "peserta_kelas", { status_tb: "Selesai" }),
    count(supabase, "bisakh_peserta", { lulus: true }),
    count(supabase, "kegiatan", { status: "Berlangsung" }),
    count(supabase, "pemenang", { keputusan_hadiah: "Belum Diputuskan" }),
    count(supabase, "update_queue", { status: "Menunggu" }),
    count(supabase, "soal", { status_aktif: true }),
  ]);

  const cards = [
    { label: "Peserta terdaftar (semua kelas)", value: totalPeserta },
    { label: "Peserta aktif", value: pesertaAktif },
    { label: "Peserta DO", value: pesertaDo },
    { label: "Peserta selesai", value: pesertaSelesai },
    { label: "Peserta lulus (master)", value: pesertaLulus },
    { label: "Kegiatan berlangsung", value: kegiatanBerlangsung },
    { label: "Pemenang belum diputuskan hadiahnya", value: pemenangBelumDiputuskan },
    { label: "Update queue menunggu", value: queueMenunggu },
    { label: "Soal aktif", value: soalAktif },
  ];

  return (
    <div>
      <h1 className="text-2xl text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-ink/60">
        Angkatan aktif:{" "}
        {typedAngkatanAktif.length > 0
  ? typedAngkatanAktif.map((a) => a.nama_angkatan).join(", ")
  : "Tidak ada angkatan berstatus Aktif"}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-ink/10 bg-white p-4">
            <p className="text-2xl font-semibold text-ink">{card.value}</p>
            <p className="mt-1 text-xs text-ink/60">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
