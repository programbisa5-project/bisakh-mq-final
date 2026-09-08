import { createClient } from "@/lib/supabase/server";
import type { Angkatan } from "@/lib/supabase/database.types";
import { getCurrentUser } from "@/lib/auth/role";
import { Badge } from "@/components/ui/Badge";
import { formatTanggal } from "@/lib/utils/format";
import { AngkatanForm } from
"@/components/angkatan/AngkatanForm";
export default async function AngkatanPage() {
const supabase = createClient();
const user = await getCurrentUser();
const isSuperadmin = user?.role === "superadmin";
const { data: rows } = await
supabase.from("angkatan").select("*").order("id", { ascending: false });

const typedRows: Angkatan[] = rows ?? [];

const withCounts = await Promise.all(
  typedRows.map(async (a) => {
const { count } = await supabase
.from("peserta_kelas")
.select("*", { count: "exact", head: true })
.eq("angkatan_id", a.id);
return { ...a, jumlah_peserta: count ?? 0 };
})
);
return (
<div>
<div className="flex items-center justify-between">
<h1 className="text-2xl text-ink">Angkatan</h1>
{isSuperadmin ? <AngkatanForm /> : null}
</div>
<div className="mt-4 overflow-x-auto rounded-lg border border-ink/10 bg-white">


<table className="w-full text-sm">
<thead className="bg-ink/5 text-left text-xs uppercase tracking-wide text-ink/50">
<tr>
<th className="px-4 py-2">Angkatan</th>
<th className="px-4 py-2">Status</th>
<th className="px-4 py-2">Mulai</th>
<th className="px-4 py-2">Selesai</th>
<th className="px-4 py-2">Jumlah peserta</th>
{isSuperadmin ? <th className="px-4 py-2" />
: null}
</tr>
</thead>
<tbody>
{withCounts.map((a) => (
<tr key={a.id} className="border-t border-ink/5">
<td className="px-4 py-2 font-medium text-ink">{a.nama_angkatan}</td>
<td className="px-4 py-2"><Badge>{a.status}
</Badge></td>
<td className="px-4 py-2">
{formatTanggal(a.tanggal_mulai)}</td>
<td className="px-4 py-2">
{formatTanggal(a.tanggal_selesai)}</td>
<td className="px-4 py-2">
{a.jumlah_peserta}</td>
{isSuperadmin ? (
<td className="px-4 py-2 text-right">
<AngkatanForm existing={a} />
</td>
) : null}
</tr>
))}
</tbody>
</table>
</div>
</div>

);
}
