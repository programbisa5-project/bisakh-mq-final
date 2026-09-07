# PATCH_CHANGELOG.md — BISAkh MQ

Patch ini bersifat **incremental** di atas ZIP baseline yang diberikan. Tidak ada
fitur yang dihapus, tidak ada tabel/kolom/RLS/RPC database yang diubah, dan
tidak ada migration yang dibuat. Semua perubahan adalah source code aplikasi.

## File dihapus
- `src/app/(app)/page.tsx` — route duplikat untuk `/`. Sekarang hanya `src/app/page.tsx`
  (redirect ke `/dashboard`) yang aktif. **Audit #1**

## File ditambahkan
- `src/lib/actions/queue-contract.ts` — satu definisi TypeScript untuk bentuk
  `data_sebelum` / `data_sesudah` per `jenis_perubahan` (UBAH_STATUS, GANTI_NAMA,
  GANTI_NOMOR, GANTI_ID), plus helper `buildDataSesudah` & `validateDataSesudah`.
  **Audit #7**
- `src/lib/actions/peserta.ts` — server action `editLangsungPeserta()` untuk
  jalur "Superadmin edit langsung" (tanpa membuat queue), tetap mewajibkan
  `requireSuperadmin()` dan tetap menulis ke `riwayat_peserta`. **Audit #10**
- `src/components/peserta/EditLangsungForm.tsx` — form UI untuk jalur di atas,
  hanya dirender pada halaman detail peserta untuk role superadmin.

## File diubah
- `package.json` — tambah dependency `"server-only": "^0.0.1"` supaya
  `import "server-only"` di `src/lib/auth/role.ts` tidak gagal resolve saat
  build. **Audit #2**
- `src/lib/actions/update-queue.ts` — ditulis ulang:
  - Setiap langkah setelah RPC `proses_update_queue` (update Master Data, lalu
    RPC `tulis_riwayat_peserta`) sekarang **mengecek `error` masing-masing**.
    Kalau ada yang gagal, queue ditandai `status: "Gagal"` (nilai enum yang
    sudah ada, bukan kolom baru) dengan `catatan_proses` berisi pesan error
    sesungguhnya, dan function throw — sehingga UI tidak lagi bisa menampilkan
    "Pengajuan disetujui" padahal Master Data gagal berubah. **Audit #3**
  - Perbaikan lanjutan: kalau `UPDATE update_queue.status = "Gagal"` di dalam
    `gagalkanQueue()` itu sendiri ikut gagal (mis. masalah koneksi), error itu
    sekarang **ikut dicek dan digabung ke pesan yang dilempar** ke client —
    sebelumnya `error` dari update ini diabaikan diam-diam.
  - `GANTI_ID` sekarang diterapkan otomatis ke `peserta_kelas.nomor_urut`
    memakai `Number(...)` (bukan string). **Audit #5**
  - `GANTI_NOMOR` sekarang diterapkan otomatis ke kolom `hp1`–`hp4` sesuai
    `data_sesudah.field` yang dipilih pemohon (tidak lagi diasumsikan selalu
    `hp1`). **Audit #6**
  - Memakai tipe & shape dari `queue-contract.ts`, bukan bentuk JSON yang
    ditebak ulang di tempat. **Audit #7**
- `src/components/peserta/UpdateQueueForm.tsx` — ditulis ulang:
  - Jenis `GANTI_NOMOR` sekarang menampilkan dropdown pemilih target
    (HP1/HP2/HP3/HP4) beserta nilai saat ini, dan mengirim
    `{ field, nilai }` sesuai kontrak. **Audit #6**
  - Jenis `GANTI_ID` memakai `<input type="number">` dan dikirim sebagai
    `Number`. **Audit #5**
  - Validasi payload lewat `validateDataSesudah()` sebelum mengirim ke server.
- `src/app/(app)/peserta/[id]/page.tsx`:
  - `UpdateQueueForm` sekarang menerima `currentNomorUrut` & `currentHp`
    (hp1–hp4) supaya form GANTI_ID/GANTI_NOMOR punya nilai "sebelum" yang benar.
  - Badge kelulusan diperbaiki dari label `Aktif` menjadi `Lulus`. **Audit #8**
  - Menambahkan section "Edit langsung (Superadmin)" — hanya dirender kalau
    `user.role === "superadmin"`; server action di baliknya tetap memanggil
    `requireSuperadmin()` sendiri (bukan sekadar tombol disembunyikan). **Audit #10**
- `src/app/(app)/peserta/page.tsx`:
  - Menambahkan filter **Jenis** yang sebelumnya sudah punya logic
    (`searchParams.jenis`) tapi tidak punya kontrol UI. Opsi filter diambil
    dari nilai `jenis` yang benar-benar ada di data (bukan menebak daftar
    enum), lewat query `SELECT DISTINCT`-style di server component. **Audit #9**
  - Badge kelulusan di tabel daftar diperbaiki dari `Aktif` menjadi `Lulus`. **Audit #8**
- `src/components/ui/Badge.tsx` — tambah tone `lulus` (memakai warna hijau
  yang sama seperti `aktif`) supaya badge "Lulus" punya styling yang wajar. **Audit #8**
- `src/app/(app)/pengaturan/page.tsx` — menambahkan guard server-side eksplisit
  `await requireSuperadmin()` di awal komponen, dengan `redirect("/dashboard")`
  kalau gagal. Sebelumnya halaman ini **tidak punya guard sama sekali** di
  kode — hanya mengandalkan halaman tidak muncul di sidebar + RLS di database.
  RLS tetap dipertahankan sebagai lapisan terakhir; guard ini adalah lapisan
  kedua yang sungguhan (bukan UI hiding). **Audit #4**
- `src/app/(app)/dashboard/page.tsx` — helper `count()` sebelumnya menerima
  `table: string` (tidak type-safe untuk nama tabel Supabase). Diganti dengan
  `table: TableName` (`keyof Database["public"]["Tables"]`). Bukan item bernomor
  di tabel temuan #1–#14 FINAL_AUDIT.md — termasuk perbaikan type-safety umum,
  lihat bagian "Import & type consistency" di FINAL_AUDIT.md.
- `src/lib/supabase/database.types.ts`:
  - Menambahkan `Enums: Record<string, never>` dan
    `CompositeTypes: Record<string, never>` supaya bentuk `Database` lebih
    dekat dengan hasil `supabase gen types` yang sesungguhnya dan kompatibel
    dengan versi `@supabase/supabase-js` yang dipakai.
  - Menambahkan `export type TableName = keyof Database["public"]["Tables"]`
    untuk dipakai di tempat yang butuh nama tabel dinamis.
  - (Kedua poin di atas: perbaikan type-safety umum, sama seperti helper
    `count()` di dashboard — lihat "Import & type consistency" di FINAL_AUDIT.md.)

## Temuan audit yang TIDAK diubah kodenya (lihat FINAL_AUDIT.md untuk alasan)
- **Soal 10-angkatan (§12)** — sudah sepenuhnya diserahkan ke RPC
  `soal_tersedia` / `catat_penggunaan_soal`, tidak ada INSERT langsung ke
  `soal_usage` di kode manapun. Tidak ada perubahan kode diperlukan; logika
  "10 angkatan" ada di database, sesuai desain.
- **Permission Template / Materi / Pembuka Muhadharah (§11)** — ketiganya
  konsisten satu sama lain (`requireUser()`, MQ boleh tulis langsung tanpa
  queue), berbeda dari modul lain (`requireSuperadmin()`). Ini didokumentasikan
  sebagai asumsi yang sudah ada di kode sebelum patch ini (bukan bug baru),
  bukan diputuskan ulang oleh patch ini. Lihat **BUSINESS DECISION REQUIRED**
  di FINAL_AUDIT.md kalau keputusan ini perlu dikonfirmasi/diubah.
- **Template Pekan B (§13)** — konsep ini **tidak ditemukan** di ZIP baseline
  manapun (tidak ada tabel, action, atau komponen terkait). Tidak ada yang bisa
  "dipertahankan" karena tidak ada di source code yang diberikan. Lihat
  FINAL_AUDIT.md.
- **Signature RPC `tulis_riwayat_peserta` (§15)** — tetap memakai signature
  yang sama seperti REPORT.md sebelumnya (asumsi berdasarkan kolom tabel),
  tidak ditebak ulang atau diubah. Tetap **DATABASE DECISION REQUIRED —
  VERIFY RPC SIGNATURE**.
- **Atomicity approve queue (§3 lanjutan)** — update Master Data +
  `tulis_riwayat_peserta` sekarang sudah dicek errornya satu-satu dan tidak
  lagi memberi pesan sukses palsu, tapi ketiganya (RPC status + update tabel +
  RPC riwayat) tetap bukan satu transaksi atomik dari sisi client karena tidak
  boleh membuat RPC baru. Ditandai **DATABASE DECISION REQUIRED** di
  FINAL_AUDIT.md.
