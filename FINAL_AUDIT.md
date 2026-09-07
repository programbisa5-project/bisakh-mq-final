# FINAL_AUDIT.md — BISAkh MQ

Audit ini dibuat berdasarkan patch yang **benar-benar tersimpan di source code**
pada `BISAKH-MQ-FINAL.zip`. Tidak ada perubahan database, RLS, migration, atau
RPC dalam pekerjaan ini — seluruhnya adalah perbaikan source code aplikasi di
atas ZIP baseline yang diberikan.

## Tabel temuan

| # | Temuan | Status | Keterangan |
|---|---|---|---|
| 1 | Route ganda `/` | **FIXED** | `src/app/(app)/page.tsx` dihapus, hanya `src/app/page.tsx` yang tersisa. |
| 2 | `import "server-only"` tanpa dependency | **FIXED** | `"server-only": "^0.0.1"` ditambahkan ke `package.json`. |
| 3 | `prosesUpdateQueue` bisa memberi pesan sukses palsu | **FIXED** | Setiap update Master Data & RPC `tulis_riwayat_peserta` sekarang dicek errornya; kegagalan menandai queue `status: "Gagal"` + `catatan_proses` berisi pesan asli, dan function throw. Atomicity penuh (satu transaksi) tetap **DATABASE DECISION REQUIRED** — lihat catatan di bawah. |
| 4 | `/pengaturan` tidak ada guard server-side | **FIXED** | `requireSuperadmin()` + `redirect("/dashboard")` ditambahkan di awal komponen halaman. RLS tetap jadi lapisan terakhir. |
| 5 | `GANTI_ID` mengirim string, bukan integer | **FIXED** | Form memakai `<input type="number">`, dikirim lewat `Number(...)`, diterapkan otomatis ke `peserta_kelas.nomor_urut`. |
| 6 | `GANTI_NOMOR` diasumsikan selalu `hp1` | **FIXED** | Form sekarang punya dropdown pemilih HP1–HP4; queue menyimpan `{ field, nilai }`; approve hanya mengubah field yang dipilih. |
| 7 | Kontrak data `update_queue` tersebar/ditebak-tebak | **FIXED** | `src/lib/actions/queue-contract.ts` — satu definisi TypeScript + helper `buildDataSesudah`/`validateDataSesudah`, dipakai oleh form MQ, form edit-langsung Superadmin, dan `prosesUpdateQueue`. |
| 8 | Badge "Lulus" menampilkan label "Aktif" | **FIXED** | Diperbaiki jadi label `Lulus` di halaman daftar peserta & detail peserta; tone `lulus` ditambahkan ke `Badge.tsx`. |
| 9 | Filter Jenis tanpa kontrol UI | **FIXED** | `FilterSelect` untuk `jenis` ditambahkan di halaman Peserta. Opsi diambil dari nilai `jenis` yang benar-benar ada di data (`DISTINCT`-style query), bukan menebak daftar enum yang tidak ada di schema. |
| 10 | Superadmin tidak punya jalur edit langsung | **FIXED** | `src/lib/actions/peserta.ts` (`editLangsungPeserta`) + `EditLangsungForm.tsx`. Jalur terpisah dari queue MQ, tetap wajib `requireSuperadmin()`, tetap menulis ke `riwayat_peserta` lewat RPC `tulis_riwayat_peserta` yang sudah ada. |
| 11 | Permission Template / Materi / Pembuka Muhadharah beda dari modul lain | **BUSINESS DECISION REQUIRED** | Lihat bagian khusus di bawah. Tidak diubah. |
| 12 | Aturan soal tidak boleh dipakai ulang sebelum 10 angkatan | **VERIFIED / NO CODE CHANGE** | Kode hanya memanggil RPC `soal_tersedia` (cek) dan `catat_penggunaan_soal` (catat) — tidak ada satupun INSERT langsung ke `soal_usage` di kode manapun. Logika "10 angkatan" sepenuhnya berada di RPC sesuai desain; tidak ada perubahan kode yang diperlukan. |
| 13 | Template Pekan B | **TIDAK DITEMUKAN DI BASELINE** | Tidak ada tabel, action, komponen, atau referensi apapun terkait "Template Pekan B" di ZIP baseline yang diberikan (sudah dicek dengan pencarian menyeluruh di seluruh source). Karena tidak ada yang bisa "dipertahankan", dan instruksi kerja ini melarang membuat fitur baru berdasarkan asumsi, tidak ada kode yang dibuat/diubah untuk item ini. **Perlu klarifikasi**: apakah fitur ini berasal dari aplikasi lain, atau memang belum pernah dibangun di ZIP ini. |
| 14 | Data peserta DO / nama / nomor HP — workflow MQ→Queue→Superadmin | **VERIFIED** | Lihat "Pemeriksaan alur MQ → Queue → Superadmin → Master Data → Riwayat" di bawah. |

## BUSINESS DECISION REQUIRED — Permission Template / Materi / Pembuka Muhadharah (#11)

Kondisi kode saat ini (tidak diubah oleh patch ini):
- `simpanTemplate`, `simpanMateri`, `simpanPembukaMuhadharah` semuanya memakai
  `requireUser()` — **MQ boleh menulis langsung**, tanpa lewat queue.
- Modul lain (Angkatan, Pekan, Kegiatan, Soal, SOP, Sertifikat) memakai
  `requireSuperadmin()`.

Ini konsisten *di antara ketiganya sendiri*, tapi berbeda dari pola modul lain
— sesuai temuan audit awal. Karena instruksi kerja eksplisit melarang
mengambil keputusan bisnis baru secara sepihak, saya **tidak mengubah**
permission ini ke arah manapun. Dua opsi yang perlu diputuskan oleh sis:

1. **Pertahankan seperti sekarang** — Template/Materi/Pembuka dianggap konten
   referensi (bukan data peserta), jadi wajar MQ edit langsung tanpa approval.
2. **Samakan dengan modul lain** — ubah ketiganya ke `requireSuperadmin()`
   (atau buat jalur queue seperti data peserta) supaya konsisten dengan
   prinsip "MQ tidak boleh mengubah Master Data secara langsung".

Tidak ada kode yang diubah untuk item ini sampai ada keputusan.

## DATABASE DECISION REQUIRED (tidak diubah, sesuai batasan pekerjaan ini)

Semua poin ini **sudah ada** di REPORT.md sebelumnya dan **tetap berlaku**;
tidak ada satupun yang diselesaikan lewat perubahan database dalam patch ini
(sesuai larangan eksplisit di instruksi).

1. **Atomicity approve queue** — `proses_update_queue` (RPC, ubah status
   queue), update Master Data (`peserta_kelas`/`bisakh_peserta`), dan
   `tulis_riwayat_peserta` (RPC, tulis riwayat) adalah **tiga panggilan
   terpisah**, bukan satu transaksi. Patch ini sudah memastikan kegagalan di
   langkah manapun tidak lagi disembunyikan (queue ditandai `"Gagal"` +
   pesan error asli), tapi tidak bisa membuat ketiganya benar-benar atomik
   tanpa RPC transaksional baru di database — yang dilarang dalam pekerjaan
   ini. **Rekomendasi**: bungkus ketiga langkah dalam satu RPC database di
   masa depan.
2. **`peserta_kelas` tidak punya kolom "ID Peserta" bergaya teks** (mis.
   `BSR61.10A-27`) — `GANTI_ID` tetap dipetakan ke `nomor_urut` (integer),
   sesuai asumsi yang sudah didokumentasikan di REPORT.md sebelumnya.
3. **Signature RPC `tulis_riwayat_peserta`** — parameter yang dipakai
   (`p_peserta_kelas_id, p_jenis_perubahan, p_data_sebelum, p_data_sesudah,
   p_alasan`) tetap **asumsi**, tidak ditebak ulang atau diubah dalam patch
   ini. **VERIFY RPC SIGNATURE** sebelum deploy.
4. **RLS untuk tabel non-`bisakh_peserta`/`update_queue`** — pola "Superadmin
   full CRUD, MQ read-only (kecuali pemenang & Template/Materi/Pembuka)" tetap
   asumsi kode, belum dicocokkan dengan RLS sungguhan di database.

## Pemeriksaan akhir — alur MQ → Queue → Superadmin → Master Data → Riwayat

Ditelusuri langsung di source hasil patch (bukan dijalankan, karena `next dev`
butuh `npm install` yang gagal — lihat bagian Build Result):

- **MQ mengajukan** — `ajukanUpdateQueue()` (`update-queue.ts`) hanya melakukan
  `INSERT` ke `update_queue` dengan `pengirim_id` dari `requireUser().authId`
  (server-side, tidak bisa dipalsukan dari form). MQ **tidak punya** jalur
  kode apapun untuk `UPDATE`/`INSERT` langsung ke `peserta_kelas` atau
  `bisakh_peserta` — action itu tidak ada di `src/lib/actions/*` manapun yang
  bisa dipanggil tanpa `requireSuperadmin()`.
- **Queue → Superadmin** — halaman `/update-queue` menampilkan tombol
  Setujui/Tolak (`QueueActions.tsx`) hanya jika `isSuperadmin` (turunan dari
  `getCurrentUser()` di server). Klik tombol memanggil `prosesUpdateQueue()`,
  yang **memanggil `requireSuperadmin()` sebagai baris pertama** — bukan
  sekadar tombol yang disembunyikan.
- **Superadmin → Master Data** — di dalam `prosesUpdateQueue()`, sesudah RPC
  `proses_update_queue` sukses dan `keputusan === "Disetujui"`, kode
  menerapkan perubahan ke `peserta_kelas.status_tb`, `bisakh_peserta.nama`,
  `bisakh_peserta.hp{1-4}`, atau `peserta_kelas.nomor_urut` sesuai
  `jenis_perubahan` — masing-masing lewat `UPDATE` biasa (bukan RPC baru,
  sesuai batasan) dengan pengecekan error penuh.
- **Master Data → Riwayat** — setiap cabang di atas diikuti pemanggilan RPC
  `tulis_riwayat_peserta` yang sudah ada, juga dicek errornya.
- **Reject** — kalau `keputusan === "Ditolak"`, hanya RPC `proses_update_queue`
  yang dipanggil; blok `if (input.keputusan === "Disetujui" && ...)` tidak
  pernah dieksekusi, jadi Master Data **tidak tersentuh sama sekali** pada
  penolakan.
- **Jalur baru Superadmin edit langsung** — `editLangsungPeserta()` (baru)
  memanggil `requireSuperadmin()` sendiri, tidak menyentuh `update_queue`
  sama sekali, langsung `UPDATE` ke Master Data lalu RPC
  `tulis_riwayat_peserta` — persis sesuai diagram §10 di instruksi kerja.
- **`/pengaturan`** — dicoba akses sebagai MQ: `requireSuperadmin()` di awal
  komponen akan throw (`FORBIDDEN`), ditangkap oleh `try/catch`, lalu
  `redirect("/dashboard")`. Ini server-side, tidak bisa dilewati dari URL.

Kesimpulan tinjauan kode: alur workflow di source **konsisten** dengan
diagram MQ → Queue → Superadmin → Master Data → Riwayat yang diwajibkan.
Ini adalah **tinjauan logis atas kode**, bukan hasil eksekusi skenario
sungguhan (lihat bagian Build Result — environment tidak bisa menjalankan
`next dev`/`next build` karena tidak ada akses jaringan untuk `npm install`).

## Import & type consistency — pemeriksaan akhir

- `queue-contract.ts` diimpor secara konsisten oleh `UpdateQueueForm.tsx`,
  `EditLangsungForm.tsx`, `update-queue.ts`, dan `peserta.ts` — tidak ada lagi
  bentuk JSON `data_sesudah`/`data_sebelum` yang ditulis manual/ditebak di
  tempat lain.
- `TableName` (`keyof Database["public"]["Tables"]`) ditambahkan ke
  `database.types.ts` dan dipakai di helper `count()` pada
  `dashboard/page.tsx`, menggantikan `table: string` yang tidak type-safe.
- `Enums: Record<string, never>` dan `CompositeTypes: Record<string, never>`
  ditambahkan ke tipe `Database` untuk kompatibilitas bentuk dengan hasil
  `supabase gen types` yang sesungguhnya.
- Tidak ditemukan import yang menunjuk ke file yang sudah dihapus
  (`src/app/(app)/page.tsx`) di seluruh source.
- Semua action baru (`peserta.ts`) memakai pola yang sama dengan action lama
  (`"use server"`, `requireSuperadmin()`/`requireUser()` sebagai baris
  pertama, `revalidatePath` di akhir) — tidak ada pola baru yang menyimpang.

## BUILD RESULT

| Command | Status |
|---|---|
| `npm install` | **NOT RUN — environment/network limitation** (`npm error 403 Forbidden` ke `registry.npmjs.org`, dicoba langsung di environment ini dan gagal — bukan diasumsikan) |
| `npm run build` | **NOT RUN — environment/network limitation** (tidak bisa dijalankan tanpa `node_modules` dari `npm install` di atas) |
| `npm run lint` | **NOT RUN — environment/network limitation** (sama seperti di atas) |

Pemeriksaan yang **benar-benar dilakukan** sebagai gantinya di environment ini:
- Pembacaan manual seluruh file yang diubah/ditambahkan.
- Pengecekan keseimbangan `{}`/`()` di setiap file yang disentuh (sanity check
  struktural, bukan pengganti compiler).
- Penelusuran silang semua import baru (`queue-contract.ts`, `peserta.ts`,
  `EditLangsungForm.tsx`) untuk memastikan setiap yang diekspor benar-benar
  dipakai dan setiap yang dipakai benar-benar diekspor.
- Penelusuran alur otorisasi (`requireUser`/`requireSuperadmin`) di seluruh
  `src/lib/actions/*.ts`.

**Sis wajib menjalankan `npm install && npm run build && npm run lint` di
environment sis sendiri** (yang punya akses jaringan) sebelum deploy — ini
adalah langkah validasi yang belum bisa saya lakukan di sini, sama seperti
keterbatasan yang sudah dicatat di `REPORT.md` versi sebelumnya.

## SKENARIO — tinjauan logis (bukan eksekusi nyata, alasan sama seperti di atas)

| Skenario | Tinjauan |
|---|---|
| A — MQ ganti nama → approve → `bisakh_peserta.nama` berubah + riwayat tercatat | Kode mendukung; lihat bagian alur MQ→Queue→Superadmin di atas. |
| B — MQ ganti nomor (hp1-4), hanya field terpilih yang berubah | `GANTI_NOMOR` sekarang membawa `field` eksplisit; `prosesUpdateQueue` hanya `UPDATE` kolom itu (`{ [payload.field]: payload.nilai }`). |
| C — MQ ubah status → approve → `peserta_kelas.status_tb` berubah + riwayat | Kode mendukung. |
| D — MQ akses `/pengaturan` → blocked → redirect `/dashboard` | `requireSuperadmin()` throw → `redirect("/dashboard")`. |
| E — Superadmin edit langsung tanpa queue | `editLangsungPeserta()` — tidak menyentuh `update_queue` sama sekali. |
| F — Reject → Master Data tidak berubah | Blok penerapan Master Data hanya jalan kalau `keputusan === "Disetujui"`. |

Semua tetap **perlu diuji nyata** oleh sis di environment dengan koneksi ke
Supabase sungguhan sebelum dianggap final.
