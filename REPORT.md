# Laporan Implementasi — BISAkh MQ

## 1. Struktur aplikasi
Next.js 14 App Router + TypeScript, Supabase (`@supabase/ssr` + `@supabase/supabase-js`), Tailwind CSS.
```
src/
  app/                 halaman (route per modul, grup (app) = area setelah login)
  components/          UI reusable + komponen per modul
  lib/
    supabase/          client browser & server, tipe database
    auth/role.ts        pengambilan role SELALU dari database (get_my_mq_role + mq_user)
    actions/           Server Actions (mutasi) per modul
```

## 2. Fitur yang sudah selesai
- Login (Supabase Auth email/password) + middleware penjaga sesi & redirect
- Sidebar dinamis sesuai role (Pengaturan hanya untuk superadmin)
- Dashboard: agregat real dari Supabase (peserta, status TB, lulus, kegiatan, queue, soal)
- Peserta: daftar (search nama, filter angkatan/status TB/lulus, pagination), detail (master + kelas + sertifikat + riwayat)
- Update Queue: MQ mengajukan (UBAH_STATUS, GANTI_NAMA jalur otomatis; GANTI_ID/GANTI_NOMOR jalur manual — lihat §4), Superadmin approve/reject via RPC `proses_update_queue`
- Angkatan, Pekan (per angkatan), Kegiatan (per pekan): CRUD Superadmin, lihat semua role
- Pemenang: pencatatan dibatasi ke peserta pada angkatan kegiatan tsb, deteksi "pernah dapat hadiah" otomatis
- Soal: CRUD + pengecekan ketersediaan & pencatatan pemakaian **wajib lewat RPC** `soal_tersedia`/`catat_penggunaan_soal` (tidak ada INSERT langsung ke `soal_usage`)
- Template (dengan tombol copy verbatim), Materi, Pembuka Muhadharah: CRUD
- SOP: aturan (sop_rule) + dokumen (sop_document, via link, bukan upload biner)
- Audit/Riwayat: read-only dari `riwayat_peserta`, tanpa kontrol edit/hapus
- Pengaturan: ubah role/status_aktif user yang sudah ada; daftarkan baris `mq_user` untuk akun yang UID-nya sudah dibuat manual di Supabase Auth

## 3. Fitur yang belum selesai / sengaja tidak dibuat
- **Pembuatan akun Auth baru dari UI** — butuh Supabase Admin API (service_role). Sesuai prinsip keamanan (`jangan expose service_role`), ini sengaja tidak dibuat sebagai self-service di frontend; alurnya manual (Dashboard → lalu daftarkan di Pengaturan).
- **Upload file biner untuk `sop_document`** — schema tidak menyediakan bucket Storage; saat ini hanya menerima URL eksternal.
- **Penerapan otomatis GANTI_ID / GANTI_NOMOR** setelah approve — lihat DB CHANGE NEEDED §4.
- Generate tipe TypeScript dari schema asli via Supabase CLI — belum dijalankan (lingkungan build ini tidak punya akses jaringan/CLI login); tipe di `database.types.ts` ditulis manual mengikuti spesifikasi yang diberikan, **harus diverifikasi** dengan `npm run gen:types` sebelum produksi.

## 4. DB CHANGE NEEDED
1. **`peserta_kelas` tidak punya kolom "ID Peserta"** bergaya `BSR61.10A-27` — hanya ada `nomor_urut integer`. Jenis update `GANTI_ID` di `update_queue` tidak punya target kolom yang jelas. Rekomendasi: tambah kolom `id_peserta text` (unik per angkatan) **atau** konfirmasi bahwa `GANTI_ID` memang dimaksudkan mengubah `nomor_urut`.
2. **`bisakh_peserta` punya 4 kolom HP (`hp1`–`hp4`)** tanpa penanda "nomor utama". Jenis update `GANTI_NOMOR` di aplikasi saat ini **diasumsikan menyasar `hp1`** — ini asumsi yang perlu dikonfirmasi atau digantikan dengan field pemilih target (`hp1`/`hp2`/`hp3`/`hp4`) di form pengajuan.
3. Signature persis RPC `tulis_riwayat_peserta(...)` tidak diberikan secara eksplisit di spesifikasi — parameter yang dipakai kode ini (`p_peserta_kelas_id, p_jenis_perubahan, p_data_sebelum, p_data_sesudah, p_alasan`) adalah **asumsi berdasarkan konteks kolom tabel `riwayat_peserta`**, harus dicocokkan dengan signature RPC yang sesungguhnya sebelum deploy.
4. RLS untuk `sertifikat_link`, `template`, `materi`, `pembuka_muhadharah`, `sop_document`, `sop_rule`, `soal`, `kegiatan`, `pekan`, `angkatan`, `pemenang` tidak dirinci di spesifikasi (hanya `bisakh_peserta` dan `update_queue` yang dirinci eksplisit). Kode ini **mengasumsikan** pola "Superadmin full CRUD, MQ read-only" (kecuali `pemenang` yang MQ juga boleh INSERT, sesuai fitur "MQ mencatat pemenang" di blueprint) — **wajib dicocokkan** dengan RLS yang benar-benar sudah dibuat, karena kalau RLS di database berbeda, tombol yang tampil di UI ini bisa menyesatkan (walau tetap aman, karena keputusan akhir ada di RLS, bukan UI).

## 5. File yang dibuat
70 file `.ts`/`.tsx` (lihat struktur folder). Tidak ada file `bisakh_peserta`/skema database yang diubah — seluruhnya kode aplikasi baru.

## 6. Environment variable
Lihat README.md §Environment variable.

## 7. Cara menjalankan
Lihat README.md §Menjalankan. **Catatan penting**: proyek ini ditulis dan disusun di lingkungan tanpa akses jaringan (tidak bisa `npm install`, tidak bisa `next build`, tidak bisa konek ke Supabase sungguhan dari sini). Kode belum pernah benar-benar dieksekusi/di-build — langkah pertama di sisi Anda adalah `npm install` lalu `npm run build` untuk menangkap kesalahan tipe/sintaks yang mungkin lolos dari tinjauan manual.

## 8. Hasil "testing"
Karena keterbatasan jaringan di lingkungan pembuatan kode ini, 16 skenario yang diminta **tidak dijalankan sebagai eksekusi nyata** — berikut tinjauan logis per skenario:

| # | Skenario | Status tinjauan |
|---|---|---|
| 1–3 | Login Superadmin/MQ, permission beda | Kode mendukung (role dari RPC `get_my_mq_role`, sidebar & guard ikut role) — **perlu uji nyata** |
| 4 | Peserta terbaca sesuai RLS | Query tidak bypass RLS (pakai anon key + sesi user) — hasil bergantung RLS aktual di database |
| 5–6 | MQ tidak bisa delete peserta / Superadmin bisa | **UI ini belum punya tombol delete peserta sama sekali** (blueprint tidak eksplisit minta ini) — jika dibutuhkan, tandai sebagai fitur tambahan, bukan asumsi bug |
| 7–9 | MQ ajukan queue, tidak bisa proses, Superadmin approve via RPC | Kode mengikuti pola ini persis; `prosesUpdateQueue` memanggil RPC, tidak ada UPDATE langsung oleh MQ ke `update_queue.status` di kode manapun |
| 10 | Audit tidak bisa diedit sembarangan | Halaman Audit murni SELECT, tidak ada UI edit/hapus; enforcement sesungguhnya tetap di RLS `riwayat_peserta` |
| 11–12 | Soal availability & no-duplicate usage via RPC | Kode hanya memanggil `soal_tersedia`/`catat_penggunaan_soal`, tidak pernah INSERT langsung ke `soal_usage` |
| 13–14 | FK cegah orphan, angkatan salah tidak bisa masuk `peserta_kelas` | Ditegakkan oleh trigger & FK di database (di luar kendali kode aplikasi) — aplikasi tidak mencoba menulis `peserta_kelas` langsung dari form manapun (tidak ada form "tambah peserta ke kelas" di v1 ini — lihat §3) |
| 15–16 | Mobile & desktop UI | Layout responsif (`md:` breakpoints, sidebar collapse ke header di mobile) — **perlu screenshot/uji visual nyata**, belum divalidasi di browser sungguhan |

## 9. Security findings (self-review)
- Tidak ada `service_role` key di kode frontend manapun — hanya `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Role selalu diambil dari `get_my_mq_role()`/`mq_user` di server (Server Component/Action), tidak pernah dari localStorage atau props client.
- `pengirim_id` pada `update_queue` diisi dari `auth.uid()` sisi server (lewat `requireUser()`), tidak pernah menerima nilai dari form/client.
- Approve/reject queue hanya lewat RPC `proses_update_queue` + guard `requireSuperadmin()` di server action — tapi **penegakan sesungguhnya tetap di RLS**, guard di kode ini adalah lapisan kedua, bukan pengganti.
- Beberapa halaman (Angkatan, Pekan, Kegiatan, Soal, dst.) menyembunyikan tombol CRUD untuk role `mq` — ini **UX saja**; kalau RLS di database ternyata mengizinkan MQ menulis ke tabel-tabel itu (bertentangan dengan asumsi di §4.4), maka UI yang harus disesuaikan, bukan sebaliknya.
- Belum ada rate limiting / brute-force protection eksplisit di halaman login — mengandalkan proteksi bawaan Supabase Auth.

## 10. Bug/risiko yang masih tersisa
- Kode belum pernah di-build (`next build`) — kemungkinan ada error TypeScript kecil yang baru ketahuan saat build sungguhan.
- 4 poin DB CHANGE NEEDED di atas harus diputuskan sebelum GANTI_ID/GANTI_NOMOR benar-benar aman diterapkan otomatis.
- Tidak ada fitur "tambah peserta baru ke kelas" (assign `bisakh_peserta` ke `peserta_kelas`) di v1 ini — blueprint & spesifikasi tidak eksplisit menjelaskan alur ini (siapa yang membuat baris `peserta_kelas` pertama kali untuk peserta baru), jadi belum diasumsikan dan belum dibangun.
- Pencarian besar (>1000 baris) belum diuji performanya — `select` dengan `count: 'exact'` bisa lambat pada tabel besar; pertimbangkan index tambahan bila diperlukan.
