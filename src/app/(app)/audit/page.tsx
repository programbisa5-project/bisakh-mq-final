import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { formatWaktu } from "@/lib/utils/format";

// Halaman ini murni SELECT dari riwayat_peserta (append-only). Tidak ada
// tombol edit/hapus sama sekali di UI — sesuai aturan "audit tidak boleh
// diedit/dihapus sembarangan", dan RLS di database juga sudah mencegah
// UPDATE/DELETE pada tabel ini.
export default async function AuditPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createClient();

  let query = supabase
    .from("riwayat_peserta")
    .select("*, peserta_kelas(id, bisakh_peserta(nama))")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: rows } = await query;

  const filtered = searchParams.q
    ? (rows ?? []).filter((r: any) =>
        (r.peserta_kelas?.bisakh_peserta?.nama ?? "").toLowerCase().includes(searchParams.q!.toLowerCase())
      )
    : rows ?? [];

  return (
    <div>
      <h1 className="text-2xl text-ink">Audit / riwayat</h1>
      <p className="mt-1 text-sm text-ink/60">Catatan perubahan bersifat permanen — tidak dapat diedit atau dihapus dari sini.</p>

      <div className="mt-4"><SearchInput placeholder="Cari nama peserta..." /></div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-ink/10 bg-white">
        {filtered.length === 0 ? (
          <EmptyState title="Belum ada riwayat" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-ink/5 text-left text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-2">Waktu</th>
                <th className="px-4 py-2">Peserta</th>
                <th className="px-4 py-2">Jenis</th>
                <th className="px-4 py-2">Sebelum → Sesudah</th>
                <th className="px-4 py-2">Alasan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: any) => (
                <tr key={r.id} className="border-t border-ink/5 align-top">
                  <td className="px-4 py-2 text-xs text-ink/50">{formatWaktu(r.created_at)}</td>
                  <td className="px-4 py-2 font-medium text-ink">{r.peserta_kelas?.bisakh_peserta?.nama ?? "-"}</td>
                  <td className="px-4 py-2">{r.jenis_perubahan}</td>
                  <td className="px-4 py-2 text-xs text-ink/60">
                    {r.data_sebelum ? JSON.stringify(r.data_sebelum) : "-"} → {r.data_sesudah ? JSON.stringify(r.data_sesudah) : "-"}
                  </td>
                  <td className="px-4 py-2 text-xs text-ink/60">{r.alasan ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
