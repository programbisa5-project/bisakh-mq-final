"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { simpanAngkatan } from "@/lib/actions/angkatan";
import { Button } from "@/components/ui/Button";
import type { Angkatan } from "@/lib/supabase/database.types";

export function AngkatanForm({ existing }: { existing?: Angkatan }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nama_angkatan: existing?.nama_angkatan ?? "",
    status: existing?.status ?? "Belum Mulai",
    tanggal_mulai: existing?.tanggal_mulai ?? "",
    tanggal_selesai: existing?.tanggal_selesai ?? "",
    keterangan: existing?.keterangan ?? "",
  });
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await simpanAngkatan({
        id: existing?.id,
        nama_angkatan: form.nama_angkatan,
        status: form.status,
        tanggal_mulai: form.tanggal_mulai || null,
        tanggal_selesai: form.tanggal_selesai || null,
        keterangan: form.keterangan || null,
      });
      toast.success("Angkatan disimpan.");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant={existing ? "secondary" : "primary"} className={existing ? "px-2 py-1 text-xs" : ""} onClick={() => setOpen(true)}>
        {existing ? "Edit" : "Tambah angkatan"}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5">
            <h3 className="font-display text-lg text-ink">{existing ? "Edit angkatan" : "Tambah angkatan"}</h3>
            <div className="mt-4 space-y-3">
              <input className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Nama angkatan" value={form.nama_angkatan} onChange={(e) => setForm({ ...form, nama_angkatan: e.target.value })} />
              <select className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {["Belum Mulai", "Aktif", "Selesai"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="date" className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" value={form.tanggal_mulai} onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })} />
                <input type="date" className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" value={form.tanggal_selesai} onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })} />
              </div>
              <textarea className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Keterangan" value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
              <Button disabled={loading || !form.nama_angkatan} onClick={submit}>{loading ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
