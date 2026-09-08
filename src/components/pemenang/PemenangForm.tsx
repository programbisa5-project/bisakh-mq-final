"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { cariPesertaUntukPemenang, simpanPemenang } from
"@/lib/actions/pemenang";
import { Button } from "@/components/ui/Button";
export function PemenangForm({ kegiatanId, angkatanId }: {
kegiatanId: number; angkatanId: number }) {
const [open, setOpen] = useState(false);
const [q, setQ] = useState("");
const [hasil, setHasil] = useState<{ id: number; nama: string }[]>([]);
const [dipilih, setDipilih] = useState<{ id: number; nama: string } |
null>(null);
const [peringkat, setPeringkat] = useState("");
const [keputusan, setKeputusan] = useState("Belum Diputuskan");
const [catatan, setCatatan] = useState("");
const [loading, setLoading] = useState(false);
async function search(value: string) {
setQ(value);
setDipilih(null);
if (value.length < 2) {
setHasil([]);
return;
}
// Pencarian dibatasi ke angkatan kegiatan ini saja — mencegah peserta dari
// angkatan lain masuk sebagai pemenang, sesuai aturan blueprint.
const rows = await cariPesertaUntukPemenang(angkatanId, value);
setHasil(rows);
}


async function submit() {
if (!dipilih) {
toast.error("Pilih peserta dari hasil pencarian dulu.");
return;
}
setLoading(true);
try {
await simpanPemenang({
kegiatan_id: kegiatanId,
peserta_kelas_id: dipilih.id,
peringkat: peringkat ? Number(peringkat) : null,
keputusan_hadiah: keputusan,
catatan: catatan || null,
});
toast.success("Pemenang dicatat.");
setOpen(false);
setQ("");
setDipilih(null);
} catch (err) {
toast.error(err instanceof Error ? err.message : "Gagal menyimpan. Peserta ini mungkin sudah tercatat untuk kegiatan ini.");
} finally {
setLoading(false);
}
}
return (
<>
<Button onClick={() => setOpen(true)}>Catat pemenang</Button>
{open ? (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
<div className="w-full max-w-md rounded-lg bg-white p-5">
<h3 className="font-display text-lg text-ink">Catat
pemenang</h3>
<div className="mt-4 space-y-3">


<div>
<input
className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
placeholder="Cari nama peserta (angkatan ini saja)"
value={dipilih ? dipilih.nama : q}
onChange={(e) => search(e.target.value)}
/>
{hasil.length > 0 && !dipilih ? (
<div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-ink/10">
{hasil.map((h) => (
<button
key={h.id}
type="button"
className="block w-full px-3 py-2 text-left text-sm hover:bg-ink/5"
onClick={() => { setDipilih(h); setHasil([]); }}
>
{h.nama}
</button>
))}
</div>
) : null}
</div>
<input type="number" className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Peringkat (opsional)"
value={peringkat} onChange={(e) => setPeringkat(e.target.value)} />
<select className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" value={keputusan} onChange={(e) =>
setKeputusan(e.target.value)}>
{["Belum Diputuskan", "Diberikan", "Tidak Diberikan"].map((s) =>
<option key={s} value={s}>{s}</option>)}
</select>
<textarea className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Catatan" value={catatan} onChange=


{(e) => setCatatan(e.target.value)} />
</div>
<div className="mt-4 flex justify-end gap-2">
<Button variant="ghost" onClick={() =>
setOpen(false)}>Batal</Button>
<Button disabled={loading || !dipilih} onClick={submit}>{loading ?
"Menyimpan..." : "Simpan"}</Button>
</div>
</div>
</div>
) : null}
</>
);
}
