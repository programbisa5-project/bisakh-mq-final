"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { simpanKegiatan } from "@/lib/actions/kegiatan";
import { Button } from "@/components/ui/Button";
import type { Kegiatan } from "@/lib/supabase/database.types";
export function KegiatanForm({
pekanOptions,
existing,
}: {
pekanOptions: { id: number; nomor_pekan: number | null;
nama_pekan: string | null }[];


existing?: Kegiatan;
}) {
const [open, setOpen] = useState(false);
const [form, setForm] = useState({
pekan_id: existing?.pekan_id ?? pekanOptions[0]?.id,
nama_kegiatan: existing?.nama_kegiatan ?? "",
deskripsi: existing?.deskripsi ?? "",
tanggal_kegiatan: existing?.tanggal_kegiatan ?? "",
status: existing?.status ?? "Terjadwal",
keterangan: existing?.keterangan ?? "",
});
const [loading, setLoading] = useState(false);
async function submit() {
setLoading(true);
try {
await simpanKegiatan({
id: existing?.id,
pekan_id: Number(form.pekan_id),
nama_kegiatan: form.nama_kegiatan,
deskripsi: form.deskripsi || null,
tanggal_kegiatan: form.tanggal_kegiatan || null,
status: form.status,
keterangan: form.keterangan || null,
});
toast.success("Kegiatan disimpan.");
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
{existing ? "Edit" : "Tambah kegiatan"}
</Button>
{open ? (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
<div className="w-full max-w-md rounded-lg bg-white p-5">
<h3 className="font-display text-lg text-ink">{existing ? "Edit kegiatan" : "Tambah kegiatan"}</h3>
<div className="mt-4 space-y-3">
<select className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" value={form.pekan_id} onChange={(e) => setForm({
...form, pekan_id: Number(e.target.value) })}>
{pekanOptions.map((p) => (
<option key={p.id} value={p.id}>Pekan {p.nomor_pekan}
{p.nama_pekan ? ` — ${p.nama_pekan}` : ""}</option>
))}
</select>
<input className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Nama kegiatan" value=
{form.nama_kegiatan} onChange={(e) => setForm({ ...form,
nama_kegiatan: e.target.value })} />
<textarea className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Deskripsi" value={form.deskripsi}
onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
<input type="date" className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" value={form.tanggal_kegiatan}
onChange={(e) => setForm({ ...form, tanggal_kegiatan: e.target.value
})} />
<select className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({
...form, status: e.target.value as Kegiatan["status"] })}>


{["Terjadwal", "Berlangsung", "Selesai", "Dibatalkan"].map((s) =>
<option key={s} value={s}>{s}</option>)}
</select>
<textarea className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Keterangan" value={form.keterangan}
onChange={(e) => setForm({ ...form, keterangan: e.target.value })} />
</div>
<div className="mt-4 flex justify-end gap-2">
<Button variant="ghost" onClick={() =>
setOpen(false)}>Batal</Button>
<Button disabled={loading || !form.nama_kegiatan} onClick=
{submit}>{loading ? "Menyimpan..." : "Simpan"}</Button>
</div>
</div>
</div>
) : null}
</>
);
}
