import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/role";
import { Badge } from "@/components/ui/Badge";
import { formatWaktu, formatTanggal } from "@/lib/utils/format";
import { UpdateQueueForm } from "@/components/peserta/UpdateQueueForm";
import { EditLangsungForm } from "@/components/peserta/EditLangsungForm";
import { SertifikatForm } from "@/components/peserta/SertifikatForm";

export default async function PesertaDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const user = await getCurrentUser();
  const pesertaKelasId = Number(params.id);
  if (Number.isNaN(pesertaKelasId)) notFound();

  const { data: pk } = await supabase
    .from("peserta_kelas")
    .select("*, bisakh_peserta(*), angkatan(*)")
    .eq("id", pesertaKelasId)
    .maybeSingle();

  if (!pk) notFound();

  const [{ data: riwayat }, { data: sertifikat }] = await Promise.all([
    supabase
      .from("riwayat_peserta")
      .select("*")
      .eq("peserta_kelas_id", pesertaKelasId)
      .order("created_at", { ascending: false }),
    supabase.from("sertifikat_link").select("*").eq("peserta_kelas_id", pesertaKelasId).maybeSingle(),
  ]);

  const master = (pk as any).bisakh_peserta;
  const isSuperadmin = user?.role === "superadmin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-ink">{master?.nama}</h1>
        <p className="mt-1 text-sm text-ink/60">
          {(pk as any).angkatan?.nama_angkatan} · Jenis: {master?.jenis} · No. urut: {pk.nomor_urut ?? "-"}
        </p>
        <div className="mt-2 flex gap-2">
          <Badge>{pk.status_tb}</Badge>
          {master?.lulus ? <Badge>Lulus</Badge> : null}
        </div>
      </div>

      <section className="rounded-lg border border-ink/10 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Data master</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
          <Field label="ID master" value={String(master?.id)} />
          <Field label="Nama" value={master?.nama} />
          <Field label="Jenis" value={master?.jenis} />
          <Field label="HP 1" value={master?.hp1} />
          <Field label="HP 2" value={master?.hp2} />
          <Field label="HP 3" value={master?.hp3} />
          <Field label="HP 4" value={master?.hp4} />
          <Field label="Email 1" value={master?.email1} />
          <Field label="Email 2" value={master?.email2} />
          <Field label="Keterangan" value={master?.keterangan} />
          <Field label="Lulus" value={master?.lulus ? "Ya" : "Belum"} />
        </dl>
        <p className="mt-3 text-xs text-ink/40">
          Kolom master hanya diubah langsung oleh Superadmin, atau lewat pengajuan update_queue milik MQ.
        </p>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Data kelas</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
          <Field label="Angkatan" value={(pk as any).angkatan?.nama_angkatan} />
          <Field label="Status TB" value={pk.status_tb} />
          <Field label="No. urut" value={pk.nomor_urut != null ? String(pk.nomor_urut) : "-"} />
          <Field label="Catatan" value={pk.catatan} />
        </dl>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Sertifikat</h2>
        <SertifikatForm
          pesertaKelasId={pesertaKelasId}
          existing={sertifikat ?? null}
          canEdit={isSuperadmin}
        />
      </section>

      {isSuperadmin ? (
        <section className="rounded-lg border border-ink/10 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Edit langsung (Superadmin)</h2>
          <p className="mt-1 text-xs text-ink/50">
            Superadmin dapat mengubah Master Data langsung tanpa membuat pengajuan queue. Perubahan tetap
            tercatat otomatis di Riwayat di bawah.
          </p>
          <EditLangsungForm
            pesertaKelasId={pesertaKelasId}
            currentHp={{ hp1: master?.hp1, hp2: master?.hp2, hp3: master?.hp3, hp4: master?.hp4 }}
          />
        </section>
      ) : null}

      <section className="rounded-lg border border-ink/10 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Ajukan perubahan</h2>
        <p className="mt-1 text-xs text-ink/50">
          Semua jenis perubahan (status, nama, ID/nomor urut, nomor HP) diajukan ke sini dan diterapkan
          otomatis ke Master Data setelah disetujui Superadmin.
        </p>
        <UpdateQueueForm
          pesertaKelasId={pesertaKelasId}
          currentStatus={pk.status_tb}
          currentNama={master?.nama}
          currentNomorUrut={pk.nomor_urut}
          currentHp={{ hp1: master?.hp1, hp2: master?.hp2, hp3: master?.hp3, hp4: master?.hp4 }}
        />
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Riwayat perubahan</h2>
        {!riwayat || riwayat.length === 0 ? (
          <p className="mt-3 text-sm text-ink/50">Belum ada riwayat perubahan untuk peserta ini.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink/5 text-sm">
            {riwayat.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{r.jenis_perubahan}</span>
                  <span className="text-xs text-ink/40">{formatWaktu(r.created_at)}</span>
                </div>
                <p className="mt-1 text-xs text-ink/60">
                  {r.data_sebelum ? `Sebelum: ${JSON.stringify(r.data_sebelum)}` : null}
                  {r.data_sesudah ? ` · Sesudah: ${JSON.stringify(r.data_sesudah)}` : null}
                </p>
                {r.alasan ? <p className="mt-1 text-xs text-ink/60">Alasan: {r.alasan}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-ink/40">{label}</dt>
      <dd className="text-ink">{value || "-"}</dd>
    </div>
  );
}
