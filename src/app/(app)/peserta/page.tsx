import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterSelect } from "@/components/ui/FilterSelect";

const PAGE_SIZE = 20;

export default async function PesertaPage({
  searchParams,
}: {
  searchParams: { q?: string; angkatan?: string; jenis?: string; status_tb?: string; lulus?: string; page?: string };
}) {
  const supabase = createClient();
  const page = Number(searchParams.page ?? "1") || 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("peserta_kelas")
    .select(
      "id, status_tb, nomor_urut, angkatan_id, angkatan(nama_angkatan), peserta_id, bisakh_peserta!inner(id, nama, jenis, angkatan, lulus)",
      { count: "exact" }
    )
    .order("id", { ascending: false })
    .range(from, to);

  if (searchParams.q) {
    query = query.ilike("bisakh_peserta.nama", `%${searchParams.q}%`);
  }
  if (searchParams.angkatan) {
    query = query.eq("angkatan_id", Number(searchParams.angkatan));
  }
  if (searchParams.jenis) {
    query = query.eq("bisakh_peserta.jenis", searchParams.jenis);
  }
  if (searchParams.status_tb) {
    query = query.eq("status_tb", searchParams.status_tb);
  }
  if (searchParams.lulus) {
    query = query.eq("bisakh_peserta.lulus", searchParams.lulus === "true");
  }

  const { data: rows, count, error } = await query;
  const { data: angkatanOptions } = await supabase
    .from("angkatan")
    .select("id, nama_angkatan")
    .order("id", { ascending: false });

  // "Jenis" adalah kolom teks bebas di bisakh_peserta tanpa daftar nilai tetap
  // di schema (lihat database.types.ts: jenis: string). Daripada menebak nilai
  // enum-nya, opsi filter diambil dari nilai yang benar-benar dipakai di data.
  const { data: jenisRows } = await supabase
    .from("bisakh_peserta")
    .select("jenis")
    .not("jenis", "is", null);
  const jenisOptions = Array.from(new Set((jenisRows ?? []).map((r) => r.jenis).filter(Boolean))).sort();

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl text-ink">Peserta</h1>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <SearchInput placeholder="Cari nama peserta..." />
        <FilterSelect name="angkatan" label="Semua angkatan" options={(angkatanOptions ?? []).map((a) => ({ value: String(a.id), label: a.nama_angkatan }))} />
        <FilterSelect name="jenis" label="Semua jenis" options={jenisOptions.map((v) => ({ value: v, label: v }))} />
        <FilterSelect name="status_tb" label="Semua status TB" options={["Aktif", "DO", "Selesai", "Tidak Aktif"].map((v) => ({ value: v, label: v }))} />
        <FilterSelect name="lulus" label="Lulus?" options={[{ value: "true", label: "Lulus" }, { value: "false", label: "Belum lulus" }]} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-ink/10 bg-white">
        {error ? (
          <p className="p-4 text-sm text-rose-600">Gagal memuat data: {error.message}</p>
        ) : !rows || rows.length === 0 ? (
          <EmptyState title="Belum ada peserta yang cocok" description="Coba ubah kata kunci atau filter." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-ink/5 text-left text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Angkatan</th>
                <th className="px-4 py-2">Jenis</th>
                <th className="px-4 py-2">No. urut</th>
                <th className="px-4 py-2">Status TB</th>
                <th className="px-4 py-2">Lulus</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-t border-ink/5">
                  <td className="px-4 py-2 font-medium text-ink">{r.bisakh_peserta?.nama}</td>
                  <td className="px-4 py-2">{r.angkatan?.nama_angkatan ?? r.bisakh_peserta?.angkatan}</td>
                  <td className="px-4 py-2">{r.bisakh_peserta?.jenis}</td>
                  <td className="px-4 py-2">{r.nomor_urut ?? "-"}</td>
                  <td className="px-4 py-2"><Badge>{r.status_tb}</Badge></td>
                  <td className="px-4 py-2">{r.bisakh_peserta?.lulus ? <Badge>Lulus</Badge> : "-"}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/peserta/${r.id}`} className="text-moss-600 hover:underline">
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} basePath="/peserta" searchParams={searchParams} />
    </div>
  );
}

