// Tipe database ditulis MANUAL mengikuti schema aktual yang diberikan (bukan asumsi lama).
// Ganti dengan hasil npm run gen:types begitu Supabase CLI bisa dijalankan di environment
// dengan akses ke project Supabase (butuh SUPABASE_PROJECT_ID + login CLI).
export type StatusTb = "Aktif" | "DO" | "Selesai" | "Tidak Aktif";
export type StatusUpdateQueue = "Menunggu" | "Disetujui" |
"Ditolak" | "Selesai" | "Gagal";
export type JenisPerubahanQueue = "GANTI_ID" | "GANTI_NAMA" |
"GANTI_NOMOR" | "UBAH_STATUS";
export type JenisPerubahanRiwayat =
| "GANTI_ID"
| "GANTI_NAMA"


| "GANTI_NOMOR"
| "UBAH_STATUS"
| "KONFIRMASI_OCR"
| "FINALISASI_LULUS";
export type MqRole = "superadmin" | "mq";
export interface BisakhPeserta {
id: number;
angkatan: number;
jenis: string;
nama: string;
hp1: string | null;
hp2: string | null;
hp3: string | null;
hp4: string | null;
email1: string | null;
email2: string | null;
keterangan: string | null;
lulus: boolean;
created_at: string;
updated_at: string;
}
export interface Angkatan {
id: number;
nama_angkatan: string;
status: "Aktif" | "Selesai" | "Belum Mulai";
tanggal_mulai: string | null;
tanggal_selesai: string | null;
keterangan: string | null;
created_at: string;
updated_at: string;
}
export interface PesertaKelas {
id: number;
peserta_id: number;


angkatan_id: number;
status_tb: StatusTb;
nomor_urut: number | null;
catatan: string | null;
created_at: string;
updated_at: string;
}
export interface MqUser {
id: string; // uuid, = auth.users.id
nama: string | null;
email: string | null;
role: MqRole;
status_aktif: boolean;
created_at: string;
updated_at: string;
}
export interface Pekan {
id: number;
angkatan_id: number | null;
nomor_pekan: number | null;
nama_pekan: string | null;
tanggal_mulai: string | null;
tanggal_selesai: string | null;
status: "Belum Mulai" | "Berlangsung" | "Selesai";
keterangan: string | null;
created_at: string;
updated_at: string;
}
export interface Kegiatan {
id: number;
pekan_id: number | null;
nama_kegiatan: string;
deskripsi: string | null;
tanggal_kegiatan: string | null;


status: "Terjadwal" | "Berlangsung" | "Selesai" | "Dibatalkan";
keterangan: string | null;
created_at: string;
updated_at: string;
}
export type KeputusanHadiah = "Belum Diputuskan" | "Diberikan" |
"Tidak Diberikan";
export interface Pemenang {
id: number;
kegiatan_id: number | null;
peserta_kelas_id: number | null;
peringkat: number | null;
pernah_dapat_hadiah: boolean;
keputusan_hadiah: KeputusanHadiah;
catatan: string | null;
created_at: string;
updated_at: string;
}
export interface RiwayatPeserta {
id: number;
peserta_kelas_id: number | null;
jenis_perubahan: JenisPerubahanRiwayat;
data_sebelum: Record<string, unknown> | null;
data_sesudah: Record<string, unknown> | null;
alasan: string | null;
dilakukan_oleh: string | null;
created_at: string;
}
export interface UpdateQueue {
id: number;
peserta_kelas_id: number | null;
pengirim_id: string | null;
jenis_perubahan: JenisPerubahanQueue;


data_sebelum: Record<string, unknown> | null;
data_sesudah: Record<string, unknown> | null;
alasan: string | null;
status: StatusUpdateQueue;
diproses_oleh: string | null;
diproses_at: string | null;
catatan_proses: string | null;
created_at: string;
updated_at: string;
}
export type TingkatKesulitan = "Mudah" | "Sedang" | "Sulit";
export interface Soal {
id: number;
nomor_soal: number | null;
pertanyaan: string;
jawaban: string | null;
kategori: string | null;
tingkat_kesulitan: TingkatKesulitan | null;
status_aktif: boolean;
created_at: string;
updated_at: string;
}
export interface SoalUsage {
id: number;
soal_id: number | null;
angkatan_id: number | null;
digunakan_at: string;
digunakan_oleh: string | null;
catatan: string | null;
}
export interface SertifikatLink {
id: number;
peserta_kelas_id: number;


link_sertifikat: string;
keterangan: string | null;
updated_by: string | null;
created_at: string;
updated_at: string;
}
export interface TemplateRow {
id: number;
nama_template: string;
isi_template: string;
kategori: string | null;
status_aktif: boolean;
created_by: string | null;
updated_by: string | null;
created_at: string;
updated_at: string;
}
export interface Materi {
id: number;
judul: string;
isi_materi: string | null;
kategori: string | null;
status_aktif: boolean;
created_by: string | null;
updated_by: string | null;
created_at: string;
updated_at: string;
}
export interface PembukaMuhadharah {
id: number;
judul: string;
isi: string | null;
kategori: string | null;
status_aktif: boolean;


created_by: string | null;
updated_by: string | null;
created_at: string;
updated_at: string;
}
export interface SopDocument {
id: number;
judul: string;
deskripsi: string | null;
file_url: string | null;
nama_file: string | null;
tanggal_upload: string | null;
uploaded_by: string | null;
status_aktif: boolean;
created_at: string;
updated_at: string;
}
export interface SopRule {
id: number;
kode_rule: string;
judul: string;
isi_rule: string;
kategori: string | null;
prioritas: number | null;
status_aktif: boolean;
created_by: string | null;
updated_by: string | null;
created_at: string;
updated_at: string;
}
// Bentuk generik minimal Database type supaya createClient<Database>() bisa dipakai
// tanpa harus menunggu hasil supabase gen types yang sesungguhnya.


export interface Database {
public: {
Tables: {
bisakh_peserta: { Row: BisakhPeserta; Insert:
Partial<BisakhPeserta>; Update: Partial<BisakhPeserta> };
angkatan: { Row: Angkatan; Insert: Partial<Angkatan>; Update:
Partial<Angkatan> };
peserta_kelas: { Row: PesertaKelas; Insert: Partial<PesertaKelas>;
Update: Partial<PesertaKelas> };
mq_user: { Row: MqUser; Insert: Partial<MqUser>; Update:
Partial<MqUser> };
pekan: { Row: Pekan; Insert: Partial<Pekan>; Update: Partial<Pekan>
};
kegiatan: { Row: Kegiatan; Insert: Partial<Kegiatan>; Update:
Partial<Kegiatan> };
pemenang: { Row: Pemenang; Insert: Partial<Pemenang>; Update:
Partial<Pemenang> };
riwayat_peserta: { Row: RiwayatPeserta; Insert:
Partial<RiwayatPeserta>; Update: Partial<RiwayatPeserta> };
update_queue: { Row: UpdateQueue; Insert:
Partial<UpdateQueue>; Update: Partial<UpdateQueue> };
soal: { Row: Soal; Insert: Partial<Soal>; Update: Partial<Soal> };
soal_usage: { Row: SoalUsage; Insert: Partial<SoalUsage>; Update:
Partial<SoalUsage> };
sertifikat_link: { Row: SertifikatLink; Insert: Partial<SertifikatLink>;
Update: Partial<SertifikatLink> };
template: { Row: TemplateRow; Insert: Partial<TemplateRow>;
Update: Partial<TemplateRow> };
materi: { Row: Materi; Insert: Partial<Materi>; Update:
Partial<Materi> };
pembuka_muhadharah: { Row: PembukaMuhadharah; Insert:
Partial<PembukaMuhadharah>; Update:
Partial<PembukaMuhadharah> };
sop_document: { Row: SopDocument; Insert:
Partial<SopDocument>; Update: Partial<SopDocument> };


sop_rule: { Row: SopRule; Insert: Partial<SopRule>; Update:
Partial<SopRule> };
};
Views: Record<string, never>;
Functions: {
get_my_mq_role: { Args: Record<string, never>; Returns: MqRole };
soal_tersedia: { Args: { p_soal_id: number; p_angkatan_id: number
}; Returns: boolean };
catat_penggunaan_soal: {
Args: { p_soal_id: number; p_angkatan_id: number; p_catatan:
string | null };
Returns: unknown;
};
proses_update_queue: {
Args: { p_queue_id: number; p_keputusan: string; p_catatan: string |
null };
Returns: unknown;
};
tulis_riwayat_peserta: {
Args: {
p_peserta_kelas_id: number;
p_jenis_perubahan: JenisPerubahanRiwayat;
p_data_sebelum: Record<string, unknown> | null;
p_data_sesudah: Record<string, unknown> | null;
p_alasan: string | null;
};
Returns: unknown;
};
};
Enums: Record<string, never>;
CompositeTypes: Record<string, never>;
};
}

export type TableName = keyof Database["public"]["Tables"];
