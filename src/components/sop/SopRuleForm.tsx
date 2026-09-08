"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { simpanSopRule } from "@/lib/actions/sop";
import { Button } from "@/components/ui/Button";
import type { SopRule } from "@/lib/supabase/database.types";


export function SopRuleForm({ existing }: { existing?: SopRule }) {
const [open, setOpen] = useState(false);
const [form, setForm] = useState({
kode_rule: existing?.kode_rule ?? "",
judul: existing?.judul ?? "",
isi_rule: existing?.isi_rule ?? "",
kategori: existing?.kategori ?? "",
prioritas: existing?.prioritas ?? "",
status_aktif: existing?.status_aktif ?? true,
});
const [loading, setLoading] = useState(false);
async function submit() {
setLoading(true);
try {
await simpanSopRule({
id: existing?.id,
kode_rule: form.kode_rule,
judul: form.judul,
isi_rule: form.isi_rule,
kategori: form.kategori || null,
prioritas: form.prioritas ? Number(form.prioritas) : null,
status_aktif: form.status_aktif,
});
toast.success("Aturan SOP disimpan.");
setOpen(false);
} catch (err) {
toast.error(err instanceof Error ? err.message : "Gagal menyimpan — kode_rule mungkin sudah dipakai.");
} finally {
setLoading(false);
}
}
return (
<>


<Button variant={existing ? "secondary" : "primary"} className={existing ? "px-2 py-1 text-xs" : ""} onClick={() => setOpen(true)}>
{existing ? "Edit" : "Tambah aturan"}
</Button>
{open ? (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
<div className="w-full max-w-lg rounded-lg bg-white p-5">
<h3 className="font-display text-lg text-ink">{existing ? "Edit aturan SOP" : "Tambah aturan SOP"}</h3>
<div className="mt-4 space-y-3">
<input className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Kode rule (unik)" value=
{form.kode_rule} onChange={(e) => setForm({ ...form, kode_rule:
e.target.value })} disabled={!!existing} />
<input className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Judul" value={form.judul} onChange=
{(e) => setForm({ ...form, judul: e.target.value })} />
<input className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Kategori" value={form.kategori}
onChange={(e) => setForm({ ...form, kategori: e.target.value })} />
<input type="number" className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Prioritas (angka, opsional)" value={form.prioritas} onChange={(e) => setForm({ ...form,
prioritas: e.target.value })} />
<textarea rows={5} className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Isi aturan" value=
{form.isi_rule} onChange={(e) => setForm({ ...form, isi_rule:
e.target.value })} />
<label className="flex items-center gap-2 text-sm">
<input type="checkbox" checked={form.status_aktif} onChange={(e)
=> setForm({ ...form, status_aktif: e.target.checked })} />
Aktif
</label>
</div>


<div className="mt-4 flex justify-end gap-2">
<Button variant="ghost" onClick={() =>
setOpen(false)}>Batal</Button>
<Button disabled={loading || !form.kode_rule || !form.judul ||
!form.isi_rule} onClick={submit}>{loading ? "Menyimpan..." :
"Simpan"}</Button>
</div>
</div>
</div>
) : null}
</>
);
}
