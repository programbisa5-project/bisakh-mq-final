"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-md px-3 py-2 text-sm transition-colors",
        active ? "bg-moss-100 font-medium text-moss-700" : "text-ink/70 hover:bg-ink/5"
      )}
    >
      {children}
    </Link>
  );
}
