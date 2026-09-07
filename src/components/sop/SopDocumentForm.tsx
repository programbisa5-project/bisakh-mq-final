"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { simpanSopDocument } from "@/lib/actions/sop";
import { Button } from "@/components/ui/Button";

// Catatan: tidak ada upload file biner di sini (belum ada Supabase Storage
// bucket yang didefinisikan di schema yang diberikan) — Superadmin menempelkan
// URL dokumen yang sudah diunggah manual (mis. Google Drive). Lihat DB CHANGE
// NEEDED soal ini di laporan akhir.
export function SopDocumentForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ judul: "", deskripsi: "", file_url: "", nama_file: "" });
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await simpanSopDocument({
        judul: form.judul,
        deskripsi: form.deskripsi || null,
        file_url: form.file_url,
        nama_file: form.nama_file || null,
        status_aktif: true,
      });
      toast.success("Dokumen SOP disimpan.");
      setOpen(false);
      setForm({ judul: "", deskripsi: "", file_url: "", nama_file: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Tambah dokumen</Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-5">
            <h3 className="font-display text-lg text-ink">Tambah dokumen SOP</h3>
            <p className="mt-1 text-xs text-ink/50">Tempelkan link dokumen yang sudah diunggah (mis. Google Drive).</p>
            <div className="mt-4 space-y-3">
              <input className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Judul" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} />
              <input className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Deskripsi" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
              <input className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="URL dokumen" value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} />
              <input className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm" placeholder="Nama file (opsional)" value={form.nama_file} onChange={(e) => setForm({ ...form, nama_file: e.target.value })} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
              <Button disabled={loading || !form.judul || !form.file_url} onClick={submit}>{loading ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
