"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/auth/role";

/**
 * Sengaja HANYA mengubah role & status_aktif dari akun yang SUDAH ADA
 * (baris mq_user yang sudah dibuat lebih dulu). Pembuatan akun auth baru
 * butuh Supabase Auth Admin API (service_role key) — untuk keamanan,
 * fitur itu TIDAK dibuat di sini. Superadmin membuat user baru langsung
 * dari Supabase Dashboard (Authentication → Add user), lalu baris mq_user
 * untuk user tsb dibuat/di-set lewat form ini setelah UID-nya diketahui.
 */
export async function ubahRoleStatus(input: { id: string; role: "mq" | "superadmin"; status_aktif: boolean }) {
  await requireSuperadmin();
  const supabase = createClient();
  const { error } = await supabase
    .from("mq_user")
    .update({ role: input.role, status_aktif: input.status_aktif })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  revalidatePath("/pengaturan");
}

export async function daftarkanMqUser(input: { id: string; nama: string; email: string; role: "mq" | "superadmin" }) {
  await requireSuperadmin();
  const supabase = createClient();
  const { error } = await supabase.from("mq_user").insert({
    id: input.id,
    nama: input.nama,
    email: input.email,
    role: input.role,
    status_aktif: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/pengaturan");
}
