"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { daftarkanMqUser } from "@/lib/actions/pengaturan";
import { Button } from "@/components/ui/Button";

export function DaftarkanUserForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id: "", nama: "", email: "", role: "mq" as "mq" | "superadmin" });
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await daftarkanMqUser(form);
      toast.success("User terdaftar.");
      setOpen(false);
      setForm({ id: "", nama: "", email: "", role: "mq" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mendaftarkan — pastikan UID benar dan belum terdaftar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Daftarkan user</Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5">
            <h3 className="font-display text-lg text-ink">Daftarkan user MQ</h3>
            <p className="mt-1 text-xs text-ink/50">
              Buat akunnya lebih dulu di Supabase Dashboard → Authentication → Add user, lalu salin UID ke sini.
            </p>
            <div className="mt-4 space-y-3">
              <input className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="UID (dari Supabase Auth)" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
              <input className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
              <input className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <select className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "mq" | "superadmin" })}>
                <option value="mq">mq</option>
                <option value="superadmin">superadmin</option>
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
              <Button disabled={loading || !form.id || !form.email} onClick={submit}>{loading ? "Menyimpan..." : "Daftarkan"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
