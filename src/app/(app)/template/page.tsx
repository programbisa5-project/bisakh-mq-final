import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";


import { SearchInput } from "@/components/ui/SearchInput";
import { TemplateForm } from
"@/components/template/TemplateForm";
import { TemplateCopyButton } from
"@/components/template/TemplateCopyButton";
export default async function TemplatePage({ searchParams }: {
searchParams: { q?: string } }) {
const supabase = createClient();
let query = supabase.from("template").select("*").eq("status_aktif",
true).order("kategori").order("nama_template");
if (searchParams.q) query = query.ilike("nama_template", `%${searchParams.q}%`);

const { data: rows } = await query;
return (
<div>
<div className="flex flex-wrap items-center justify-between gap-3">
<h1 className="text-2xl text-ink">Arsip template</h1>
<TemplateForm />
</div>
<div className="mt-4"><SearchInput placeholder="Cari nama template..." /></div>
<div className="mt-4 space-y-2">
{!rows || rows.length === 0 ? (
<EmptyState title="Belum ada template" />
):(
rows.map((t) => (
<div key={t.id} className="rounded-lg border border-ink/10 bg-white p-4">
<div className="flex items-start justify-between gap-3">
<div>
<p className="text-xs text-ink/40">{t.kategori ?? "Tanpa kategori"}
</p>
<p className="font-medium text-ink">{t.nama_template}</p>


</div>
<div className="flex shrink-0 gap-2">
<TemplateCopyButton isi={t.isi_template} />
<TemplateForm existing={t} />
</div>
</div>
<pre className="mt-2 whitespace-pre-wrap rounded-md bg-ink/5 p-3 text-sm text-ink/80">{t.isi_template}</pre>
</div>
))
)}
</div>
</div>
);
}
