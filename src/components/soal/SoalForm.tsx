"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { simpanSoal } from "@/lib/actions/soal";
import { Button } from "@/components/ui/Button";
import type { Soal } from "@/lib/supabase/database.types";


export function SoalForm({ existing }: { existing?: Soal }) {
const [open, setOpen] = useState(false);
const [form, setForm] = useState({
nomor_soal: existing?.nomor_soal ?? "",
pertanyaan: existing?.pertanyaan ?? "",
jawaban: existing?.jawaban ?? "",
kategori: existing?.kategori ?? "",
tingkat_kesulitan: existing?.tingkat_kesulitan ?? "Sedang",
status_aktif: existing?.status_aktif ?? true,
});
const [loading, setLoading] = useState(false);
async function submit() {
setLoading(true);
try {
await simpanSoal({
id: existing?.id,
nomor_soal: form.nomor_soal ? Number(form.nomor_soal) : null,
pertanyaan: form.pertanyaan,
jawaban: form.jawaban || null,
kategori: form.kategori || null,
tingkat_kesulitan: form.tingkat_kesulitan,
status_aktif: form.status_aktif,
});
toast.success("Soal disimpan.");
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
{existing ? "Edit" : "Tambah soal"}
</Button>
{open ? (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
<div className="w-full max-w-lg rounded-lg bg-white p-5">
<h3 className="font-display text-lg text-ink">{existing ? "Edit soal" :
"Tambah soal"}</h3>
<div className="mt-4 space-y-3">
<input type="number" className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Nomor soal" value=
{form.nomor_soal} onChange={(e) => setForm({ ...form, nomor_soal:
e.target.value })} />
<textarea className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Pertanyaan" value={form.pertanyaan}
onChange={(e) => setForm({ ...form, pertanyaan: e.target.value })} />
<textarea className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Jawaban" value={form.jawaban}
onChange={(e) => setForm({ ...form, jawaban: e.target.value })} />
<input className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Kategori" value={form.kategori}
onChange={(e) => setForm({ ...form, kategori: e.target.value })} />
<select className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" value={form.tingkat_kesulitan} onChange={(e) =>
setForm({ ...form, tingkat_kesulitan: e.target.value })}>
{["Mudah", "Sedang", "Sulit"].map((s) => <option key={s} value={s}>{s}
</option>)}
</select>
<label className="flex items-center gap-2 text-sm">
<input type="checkbox" checked={form.status_aktif} onChange={(e) => setForm({ ...form, status_aktif: e.target.checked })} />
Aktif
</label>


</div>
<div className="mt-4 flex justify-end gap-2">
<Button variant="ghost" onClick={() =>
setOpen(false)}>Batal</Button>
<Button disabled={loading || !form.pertanyaan} onClick={submit}>
{loading ? "Menyimpan..." : "Simpan"}</Button>
</div>
</div>
</div>
) : null}
</>
);
}
