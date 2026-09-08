"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { cekKetersediaanSoal, catatPenggunaanSoal } from
"@/lib/actions/soal";
import { Button } from "@/components/ui/Button";
export function PenggunaanSoal({
soalId,
angkatanList,
}: {
soalId: number;
angkatanList: { id: number; nama_angkatan: string }[];
}) {
const [angkatanId, setAngkatanId] = useState(angkatanList[0]?.id
?? 0);
const [status, setStatus] = useState<"idle" | "checking" | "tersedia" |
"embargo">("idle");
const [catatan, setCatatan] = useState("");
const [loading, setLoading] = useState(false);
async function cek() {
setStatus("checking");
const tersedia = await cekKetersediaanSoal(soalId, angkatanId);


setStatus(tersedia ? "tersedia" : "embargo");
}
async function catat() {
setLoading(true);
try {
await catatPenggunaanSoal(soalId, angkatanId, catatan);
toast.success("Penggunaan soal dicatat.");
setStatus("idle");
setCatatan("");
} catch (err) {
toast.error(err instanceof Error ? err.message : "Gagal mencatat penggunaan.");
} finally {
setLoading(false);
}
}
return (
<div className="flex flex-wrap items-center gap-2 text-sm">
<select
className="rounded-md border border-ink/15 px-2 py-1 text-xs"
value={angkatanId}
onChange={(e) => { setAngkatanId(Number(e.target.value));
setStatus("idle"); }}
>
{angkatanList.map((a) => (
<option key={a.id} value={a.id}>{a.nama_angkatan}</option>
))}
</select>
<Button variant="secondary" className="px-2 py-1 text-xs"
onClick={cek} disabled={!angkatanId}>
Cek ketersediaan
</Button>
{status === "checking" ? <span className="text-xs text-ink/50">Mengecek...</span> : null}


{status === "embargo" ? (
<span className="text-xs text-rose-600">Belum boleh dipakai —
belum lewat 10 angkatan sejak terakhir dipakai.</span>
) : null}
{status === "tersedia" ? (
<>
<span className="text-xs text-moss-600">Tersedia untuk dipakai.
</span>
<input
className="w-40 rounded-md border border-ink/15 px-2 py-1 text-xs"
placeholder="Catatan pemakaian"
value={catatan}
onChange={(e) => setCatatan(e.target.value)}
/>
<Button className="px-2 py-1 text-xs" disabled={loading} onClick=
{catat}>
{loading ? "Mencatat..." : "Catat penggunaan"}
</Button>
</>
) : null}
</div>
);
}
