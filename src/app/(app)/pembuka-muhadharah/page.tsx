import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { PembukaForm } from
"@/components/pembuka/PembukaForm";
export default async function PembukaMuhadharahPage() {
const supabase = createClient();
const { data: rows } = await


supabase.from("pembuka_muhadharah").select("*").eq("status_aktif",
true).order("kategori");
return (
<div>
<div className="flex items-center justify-between">
<h1 className="text-2xl text-ink">Pembuka muhadharah</h1>
<PembukaForm />
</div>
<div className="mt-4 space-y-2">
{!rows || rows.length === 0 ? (
<EmptyState title="Belum ada pembuka muhadharah" />
):(
rows.map((m) => (
<div key={m.id} className="rounded-lg border border-ink/10 bg-white p-4">
<div className="flex items-start justify-between gap-3">
<div>
<p className="text-xs text-ink/40">{m.kategori ?? "Tanpa kategori"}
</p>
<p className="font-medium text-ink">{m.judul}</p>
</div>
<PembukaForm existing={m} />
</div>
{m.isi ? <p className="mt-2 whitespace-pre-wrap text-sm text-ink/70">{m.isi}</p> : null}
</div>
))
)}
</div>
</div>
);
}
