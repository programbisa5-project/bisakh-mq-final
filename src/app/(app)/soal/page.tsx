import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/role";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { SoalForm } from "@/components/soal/SoalForm";
import { PenggunaanSoal } from
"@/components/soal/PenggunaanSoal";
export default async function SoalPage({ searchParams }: {
searchParams: { q?: string; kategori?: string } }) {
const supabase = createClient();
const user = await getCurrentUser();
const isSuperadmin = user?.role === "superadmin";
let query = supabase.from("soal").select("*").order("nomor_soal", {
ascending: true }).limit(200);
if (searchParams.q) query = query.ilike("pertanyaan", `%${searchParams.q}%`);

if (searchParams.kategori) query = query.eq("kategori",
searchParams.kategori);
const { data: rows } = await query;
const { data: angkatanList } = await
supabase.from("angkatan").select("id, nama_angkatan").order("id", {
ascending: false });


return (
<div>
<div className="flex flex-wrap items-center justify-between gap-3">
<h1 className="text-2xl text-ink">Bank soal</h1>
{isSuperadmin ? <SoalForm /> : null}
</div>
<div className="mt-4">
<SearchInput placeholder="Cari pertanyaan..." />
</div>
<div className="mt-4 space-y-2">
{!rows || rows.length === 0 ? (
<EmptyState title="Belum ada soal" />
) : (
rows.map((s) => (
<div key={s.id} className="rounded-lg border border-ink/10 bg-white p-4">
<div className="flex items-start justify-between gap-3">
<div>
<p className="text-xs text-ink/40">No.
{s.nomor_soal ?? "-"} · {s.kategori ?? "Tanpa kategori"}</p>
<p className="mt-1 font-medium text-ink">
{s.pertanyaan}</p>
{s.jawaban ? <p className="mt-1 text-sm text-ink/60">Jawaban: {s.jawaban}</p> : null}
</div>
<div className="flex shrink-0 items-center gap-2">
<Badge>{s.tingkat_kesulitan ?? "-"}
</Badge>
{s.status_aktif ? <Badge>Aktif</Badge> :
<Badge>Tidak Aktif</Badge>}
{isSuperadmin ? <SoalForm existing={s} />
: null}
</div>
</div>


<div className="mt-3 border-t border-ink/5 pt-3">
<PenggunaanSoal soalId={s.id} angkatanList=
{angkatanList ?? []} />
</div>
</div>
))
)}
</div>
</div>

);
}
