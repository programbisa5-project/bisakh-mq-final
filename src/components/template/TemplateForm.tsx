"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { simpanTemplate } from "@/lib/actions/template";
import { Button } from "@/components/ui/Button";
import type { TemplateRow } from "@/lib/supabase/database.types";
export function TemplateForm({ existing }: { existing?: TemplateRow
}) {
const [open, setOpen] = useState(false);
const [form, setForm] = useState({
nama_template: existing?.nama_template ?? "",
kategori: existing?.kategori ?? "",
isi_template: existing?.isi_template ?? "",
status_aktif: existing?.status_aktif ?? true,
});
const [loading, setLoading] = useState(false);
async function submit() {
setLoading(true);
try {
await simpanTemplate({ id: existing?.id, ...form });
toast.success("Template disimpan.");
setOpen(false);
} catch (err) {
toast.error(err instanceof Error ? err.message : "Gagal menyimpan.");
} finally {


setLoading(false);
}
}
return (
<>
<Button variant={existing ? "secondary" : "primary"} className={existing ? "px-2 py-1 text-xs" : ""} onClick={() => setOpen(true)}>
{existing ? "Edit" : "Tambah template"}
</Button>
{open ? (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
<div className="w-full max-w-lg rounded-lg bg-white p-5">
<h3 className="font-display text-lg text-ink">{existing ? "Edit template" : "Tambah template"}</h3>
<div className="mt-4 space-y-3">
<input className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Nama template" value=
{form.nama_template} onChange={(e) => setForm({ ...form, nama_template: e.target.value })} />
<input className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Kategori" value={form.kategori}
onChange={(e) => setForm({ ...form, kategori: e.target.value })} />
<textarea rows={6} className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Isi template (disimpan persis apa adanya)" value={form.isi_template} onChange={(e) => setForm({
...form, isi_template: e.target.value })} />
<label className="flex items-center gap-2 text-sm">
<input type="checkbox" checked={form.status_aktif} onChange={(e) => setForm({ ...form, status_aktif: e.target.checked })} />
Aktif
</label>
</div>
<div className="mt-4 flex justify-end gap-2">
<Button variant="ghost" onClick={() =>


setOpen(false)}>Batal</Button>
<Button disabled={loading || !form.nama_template ||
!form.isi_template} onClick={submit}>{loading ? "Menyimpan..." :
"Simpan"}</Button>
</div>
</div>
</div>
) : null}
</>
);
}
