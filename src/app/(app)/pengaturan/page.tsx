import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/auth/role";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PengaturanUserRow } from "@/components/pengaturan/PengaturanUserRow";
import { DaftarkanUserForm } from "@/components/pengaturan/DaftarkanUserForm";

// Halaman ini di-guard tiga kali: (1) tidak muncul di sidebar untuk role "mq"
// (lihat AppLayout — ini murni UX), (2) guard server-side eksplisit di bawah ini
// lewat requireSuperadmin() (bukan tombol yang disembunyikan — ini benar-benar
// menolak render halaman & redirect kalau bukan superadmin), dan (3) RLS di
// tabel mq_user tetap menolak write dari role "mq" sebagai lapisan terakhir.
export default async function PengaturanPage() {
  try {
    await requireSuperadmin();
  } catch {
    redirect("/dashboard");
  }

  const supabase = createClient();
  const { data: users } = await supabase.from("mq_user").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-ink">Pengaturan — user MQ</h1>
        <DaftarkanUserForm />
      </div>
      <p className="mt-1 text-sm text-ink/60">
        Untuk mendaftarkan MQ baru: buat akun di Supabase Dashboard → Authentication terlebih dahulu, salin UID-nya, lalu daftarkan di sini.
      </p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-ink/10 bg-white">
        {!users || users.length === 0 ? (
          <EmptyState title="Belum ada user" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-ink/5 text-left text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <PengaturanUserRow key={u.id} user={u} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
