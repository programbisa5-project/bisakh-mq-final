import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/role";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatWaktu } from "@/lib/utils/format";
import { QueueActions } from
"@/components/queue/QueueActions";
export default async function UpdateQueuePage() {
const supabase = createClient();
const user = await getCurrentUser();
const isSuperadmin = user?.role === "superadmin";
// RLS di database yang menentukan baris mana yang terlihat:
// MQ hanya melihat queue miliknya, Superadmin melihat semua. Query di sini sama
// untuk kedua role — hasilnya berbeda karena RLS, bukan karena filter di kode ini.
const { data: rows, error } = await supabase
.from("update_queue")
.select("*, peserta_kelas(id, bisakh_peserta(nama))")
.order("created_at", { ascending: false })
.limit(100);
return (
<div>
<h1 className="text-2xl text-ink">Update queue</h1>
<p className="mt-1 text-sm text-ink/60">
{isSuperadmin
? "Semua pengajuan perubahan dari MQ. Setujui atau tolak di sini."
: "Pengajuan perubahan yang pernah Anda kirim."}
</p>
<div className="mt-4 overflow-x-auto rounded-lg border border-ink/10 bg-white">
{error ? (
<p className="p-4 text-sm text-rose-600">
{error.message}</p>
) : !rows || rows.length === 0 ? (
<EmptyState title="Belum ada pengajuan" />
) : (
<table className="w-full text-sm">
<thead className="bg-ink/5 text-left text-xs uppercase tracking-wide text-ink/50">
<tr>
<th className="px-4 py-2">Peserta</th>
<th className="px-4 py-2">Jenis</th>
<th className="px-4 py-2">Diajukan</th>
<th className="px-4 py-2">Alasan</th>
<th className="px-4 py-2">Status</th>
{isSuperadmin ? <th className="px-4 py-2"
/> : null}
</tr>
</thead>
<tbody>
{rows.map((q: any) => (


<tr key={q.id} className="border-t border-ink/5 align-top">
<td className="px-4 py-2 font-medium text-ink">{q.peserta_kelas?.bisakh_peserta?.nama ?? ""}</td>
<td className="px-4 py-2">
{q.jenis_perubahan}</td>
<td className="px-4 py-2 text-xs text-ink/50">{formatWaktu(q.created_at)}</td>
<td className="px-4 py-2 text-xs text-ink/60">
{q.alasan}
<div className="mt-1 text-ink/40">
{q.data_sebelum ? `Sebelum: ${JSON.stringify(q.data_sebelum)}` : null}
{q.data_sesudah ? ` · Sesudah: ${JSON.stringify(q.data_sesudah)}` : null}
</div>
{q.catatan_proses ? <div className="mt-1 text-amber-600">{q.catatan_proses}</div> : null}
</td>
<td className="px-4 py-2"><Badge>
{q.status}</Badge></td>
{isSuperadmin ? (
<td className="px-4 py-2">
{q.status === "Menunggu" ?
<QueueActions queueId={q.id} /> : null}
</td>
) : null}
</tr>
))}
</tbody>
</table>
)}
</div>
</div>

);
}
