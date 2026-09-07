# BISAkh MQ — Aplikasi Kerja Muraqibah

Next.js 14 (App Router) + TypeScript + Supabase (Postgres, Auth, RLS).
Dibangun mengikuti **schema database yang sudah ada** — tidak ada migration baru yang dibuat oleh aplikasi ini.

## Menjalankan

```bash
npm install
cp .env.local.example .env.local   # isi dengan URL & anon key project Supabase Anda
npm run dev
```

Buka http://localhost:3000 — akan redirect ke `/login`.

## Environment variable

| Variabel | Wajib | Keterangan |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ya | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ya | Anon/public key — **bukan** service_role |
| `SUPABASE_PROJECT_ID` | tidak (dev only) | dipakai `npm run gen:types` untuk generate tipe dari schema asli |

Tidak ada `service_role` key yang dipakai di aplikasi ini sama sekali.

## Login pertama kali

Gunakan akun Superadmin yang sudah ada di `mq_user`:
- email: `programbisa5@gmail.com`

Untuk menambah MQ baru: buat user di Supabase Dashboard → Authentication → Add user,
lalu daftarkan baris `mq_user`-nya lewat halaman **Pengaturan** di aplikasi (perlu login sebagai Superadmin).

## Generate tipe database asli (opsional, disarankan sebelum produksi)

```bash
npx supabase login
npm run gen:types
```

Lalu ganti import dari `database.types.ts` (tulisan tangan, mengikuti spesifikasi yang diberikan)
ke hasil generate tersebut, dan bandingkan apakah ada perbedaan nama kolom.
