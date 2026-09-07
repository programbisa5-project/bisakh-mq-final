import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/role";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { SopRuleForm } from "@/components/sop/SopRuleForm";
import { SopDocumentForm } from "@/components/sop/SopDocumentForm";

export default async function SopPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  const isSuperadmin = user?.role === "superadmin";

  const [{ data: rules }, { data: docs }] = await Promise.all([
    supabase.from("sop_rule").select("*").eq("status_aktif", true).order("prioritas", { ascending: true, nullsFirst: false }),
    supabase.from("sop_document").select("*").eq("status_aktif", true).order("tanggal_upload", { ascending: false }),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl text-ink">Aturan SOP</h1>
          {isSuperadmin ? <SopRuleForm /> : null}
        </div>
        <div className="mt-4 space-y-2">
          {!rules || rules.length === 0 ? (
            <EmptyState title="Belum ada aturan SOP" />
          ) : (
            rules.map((r) => (
              <div key={r.id} className="rounded-lg border border-ink/10 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-ink/40">{r.kode_rule} · {r.kategori ?? "Tanpa kategori"}</p>
                    <p className="font-medium text-ink">{r.judul}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.prioritas != null ? <Badge>{`Prioritas ${r.prioritas}`}</Badge> : null}
                    {isSuperadmin ? <SopRuleForm existing={r} /> : null}
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-ink/70">{r.isi_rule}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl text-ink">Dokumen SOP</h2>
          {isSuperadmin ? <SopDocumentForm /> : null}
        </div>
        <div className="mt-4 space-y-2">
          {!docs || docs.length === 0 ? (
            <EmptyState title="Belum ada dokumen SOP" />
          ) : (
            docs.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-ink/10 bg-white p-4">
                <div>
                  <p className="font-medium text-ink">{d.judul}</p>
                  {d.deskripsi ? <p className="text-sm text-ink/60">{d.deskripsi}</p> : null}
                </div>
                <a href={d.file_url ?? "#"} target="_blank" rel="noreferrer" className="text-sm text-moss-600 hover:underline">
                  Buka dokumen
                </a>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
