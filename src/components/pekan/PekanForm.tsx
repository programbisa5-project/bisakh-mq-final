"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { simpanPekan } from "@/lib/actions/pekan";
import { Button } from "@/components/ui/Button";
import type { Pekan } from "@/lib/supabase/database.types";
export function PekanForm({ angkatanId, existing }: { angkatanId:
number; existing?: Pekan }) {
const [open, setOpen] = useState(false);
const [form, setForm] = useState({
nomor_pekan: existing?.nomor_pekan ?? 1,
nama_pekan: existing?.nama_pekan ?? "",
tanggal_mulai: existing?.tanggal_mulai ?? "",
tanggal_selesai: existing?.tanggal_selesai ?? "",
status: existing?.status ?? "Belum Mulai",
keterangan: existing?.keterangan ?? "",
});
const [loading, setLoading] = useState(false);
async function submit() {
setLoading(true);
try {
await simpanPekan({
id: existing?.id,
angkatan_id: angkatanId,
nomor_pekan: Number(form.nomor_pekan),
nama_pekan: form.nama_pekan || null,
tanggal_mulai: form.tanggal_mulai || null,
tanggal_selesai: form.tanggal_selesai || null,


status: form.status,
keterangan: form.keterangan || null,
});
toast.success("Pekan disimpan.");
setOpen(false);
} catch (err) {
toast.error(err instanceof Error ? err.message : "Gagal menyimpan.");
} finally {
setLoading(false);
}
}
return (
<>
<Button variant={existing ? "secondary" : "primary"} className=
{existing ? "px-2 py-1 text-xs" : ""} onClick={() => setOpen(true)}>
{existing ? "Edit" : "Tambah pekan"}
</Button>
{open ? (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
<div className="w-full max-w-md rounded-lg bg-white p-5">
<h3 className="font-display text-lg text-ink">{existing ? "Edit pekan" : "Tambah pekan"}</h3>
<div className="mt-4 space-y-3">
<input type="number" className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Nomor pekan"
value={form.nomor_pekan} onChange={(e) => setForm({ ...form,
nomor_pekan: Number(e.target.value) })} />
<input className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Nama pekan (opsional)" value=
{form.nama_pekan} onChange={(e) => setForm({ ...form,
nama_pekan: e.target.value })} />
<div className="flex gap-2">
<input type="date" className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" value={form.tanggal_mulai} onChange=
{(e) => setForm({ ...form, tanggal_mulai: e.target.value })} />
<input type="date" className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" value={form.tanggal_selesai} onChange=
{(e) => setForm({ ...form, tanggal_selesai: e.target.value })} />
</div>
<select className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({
...form, status: e.target.value as Pekan["status"] })}>
{["Belum Mulai", "Berlangsung", "Selesai"].map((s) => <option key={s}
value={s}>{s}</option>)}
</select>
<textarea className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Keterangan" value={form.keterangan}
onChange={(e) => setForm({ ...form, keterangan: e.target.value })} />
</div>
<div className="mt-4 flex justify-end gap-2">
<Button variant="ghost" onClick={() =>
setOpen(false)}>Batal</Button>
<Button disabled={loading} onClick={submit}>{loading ?
"Menyimpan..." : "Simpan"}</Button>
</div>
</div>
</div>
) : null}
</>
);
}
