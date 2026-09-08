import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MqUser, MqRole } from
"@/lib/supabase/database.types";
export interface CurrentUser {
authId: string;
email: string | null;
mqUser: MqUser | null;
role: MqRole | null;
}
/**
Mengambil identitas & role user yang sedang login, SELALU dari
database
(RPC get_my_mq_role() + tabel mq_user), tidak pernah dari
localStorage,
cookie custom, atau klaim yang dikirim client. Ini dipanggil di
Server
Component / Server Action, jadi hasilnya tidak bisa dipalsukan
dari browser.
*/
export async function getCurrentUser(): Promise<CurrentUser |
null> {
const supabase = createClient();
const {
data: { user },
} = await supabase.auth.getUser();


if (!user) return null;
const { data: role } = await supabase.rpc("get_my_mq_role");
const { data: mqUser } = await supabase
.from("mq_user")
.select("*")
.eq("id", user.id)
.maybeSingle();
return {
authId: user.id,
email: user.email ?? null,
mqUser: mqUser ?? null,
role: (role as MqRole | null) ?? mqUser?.role ?? null,
};
}
export async function requireUser(): Promise<CurrentUser> {
const user = await getCurrentUser();
if (!user || !user.role) {
throw new Error("UNAUTHENTICATED");
}
if (user.mqUser && user.mqUser.status_aktif === false) {
throw new Error("AKUN_NONAKTIF");
}
return user;
}
export async function requireSuperadmin(): Promise<CurrentUser>
{
const user = await requireUser();
if (user.role !== "superadmin") {
throw new Error("FORBIDDEN");
}
return user;
}
