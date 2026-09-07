import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/role";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { NavLink } from "@/components/layout/NavLink";

const NAV = [
  { href: "/dashboard", label: "Dashboard", roles: ["mq", "superadmin"] },
  { href: "/peserta", label: "Peserta", roles: ["mq", "superadmin"] },
  { href: "/angkatan", label: "Angkatan", roles: ["mq", "superadmin"] },
  { href: "/pekan", label: "Pekan", roles: ["mq", "superadmin"] },
  { href: "/kegiatan", label: "Kegiatan", roles: ["mq", "superadmin"] },
  { href: "/pemenang", label: "Pemenang", roles: ["mq", "superadmin"] },
  { href: "/soal", label: "Soal", roles: ["mq", "superadmin"] },
  { href: "/template", label: "Template", roles: ["mq", "superadmin"] },
  { href: "/materi", label: "Materi", roles: ["mq", "superadmin"] },
  { href: "/pembuka-muhadharah", label: "Pembuka Muhadharah", roles: ["mq", "superadmin"] },
  { href: "/sop", label: "SOP", roles: ["mq", "superadmin"] },
  { href: "/update-queue", label: "Update queue", roles: ["mq", "superadmin"] },
  { href: "/audit", label: "Audit / riwayat", roles: ["mq", "superadmin"] },
  { href: "/pengaturan", label: "Pengaturan", roles: ["superadmin"] },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || !user.role) {
    redirect("/login");
  }
  if (user.mqUser && user.mqUser.status_aktif === false) {
    redirect("/login?nonaktif=1");
  }

  const items = NAV.filter((item) => item.roles.includes(user.role!));

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-ink/10 bg-white md:flex md:flex-col">
        <div className="border-b border-ink/10 px-5 py-4">
          <p className="font-display text-lg leading-tight text-ink">BISAkh MQ</p>
          <p className="text-xs text-ink/50">{user.role === "superadmin" ? "Superadmin" : "Muraqibah"}</p>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {items.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-ink/10 px-4 py-3">
          <p className="truncate text-xs text-ink/60">{user.mqUser?.nama ?? user.email}</p>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-ink/10 bg-white px-4 py-3 md:hidden">
          <p className="font-display text-lg text-ink">BISAkh MQ</p>
          <SignOutButton />
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
