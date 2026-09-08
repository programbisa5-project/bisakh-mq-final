import { createClient } from "@/lib/supabase/server";
import type { Angkatan } from "@/lib/supabase/database.types";
import { getCurrentUser } from "@/lib/auth/role";
import { Badge } from "@/components/ui/Badge";
import { formatTanggal } from "@/lib/utils/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { AngkatanSelector } from
"@/components/pekan/AngkatanSelector";


import { KegiatanForm } from
"@/components/kegiatan/KegiatanForm";
import Link from "next/link";
export default async function KegiatanPage({ searchParams }: {
searchParams: { angkatan?: string } }) {
const supabase = createClient();
const user = await getCurrentUser();
const isSuperadmin = user?.role === "superadmin";
const { data: angkatanList } = await
supabase.from("angkatan").select("id, nama_angkatan").order("id", {
ascending: false });
const typedAngkatanList: Pick<
  Angkatan,
  "id" | "nama_angkatan"
>[] = angkatanList ?? [];
const angkatanId = searchParams.angkatan
  ? Number(searchParams.angkatan)
  : typedAngkatanList[0]?.id;
const { data: pekanList } = angkatanId
? await supabase.from("pekan").select("id, nomor_pekan, nama_pekan").eq("angkatan_id",
angkatanId).order("nomor_pekan")
: { data: [] as any[] };
const pekanIds = (pekanList ?? []).map((p) => p.id);
const { data: kegiatanRows } = pekanIds.length
? await supabase.from("kegiatan").select("*").in("pekan_id",
pekanIds).order("tanggal_kegiatan", { ascending: true })
: { data: [] as any[] };
const pekanMap = new Map((pekanList ?? []).map((p) => [p.id, p]));
return (
<div>
<div className="flex flex-wrap items-center justify-between gap-3">
<h1 className="text-2xl text-ink">Kegiatan</h1>
<AngkatanSelector
  angkatanList={typedAngkatanList}
  value={angkatanId}
  basePath="/kegiatan"
/>
</div>


{isSuperadmin && pekanList?.length > 0
  ? <KegiatanForm pekanOptions={pekanList} />
  : null}
</div>
<div className="mt-4 space-y-2">
{!kegiatanRows || kegiatanRows.length === 0 ? (
<EmptyState title="Belum ada kegiatan untuk angkatan ini" />
) : (
kegiatanRows.map((k) => (
<div key={k.id} className="flex items-center justify-between rounded-lg border border-ink/10 bg-white p-4">
<div>
<p className="font-medium text-ink">
{k.nama_kegiatan}</p>
<p className="text-xs text-ink/50">
{pekanMap.get(k.pekan_id) ? `Pekan ${pekanMap.get(k.pekan_id)!.nomor_pekan}` : ""} ·
{formatTanggal(k.tanggal_kegiatan)}
</p>
{k.deskripsi ? <p className="mt-1 text-sm text-ink/70">{k.deskripsi}</p> : null}
</div>
<div className="flex items-center gap-2">
<Badge>{k.status}</Badge>
<Link href={`/pemenang?kegiatan=${k.id}`}
className="text-xs text-moss-600 hover:underline">Pemenang</Link>
{isSuperadmin ? <KegiatanForm pekanOptions=
{pekanList ?? []} existing={k} /> : null}
</div>
</div>
))
)}
</div>
</div>


);
}
