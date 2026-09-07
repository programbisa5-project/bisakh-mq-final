import { cn } from "@/lib/utils/cn";

const TONE_MAP: Record<string, string> = {
  aktif: "bg-moss-100 text-moss-700",
  lulus: "bg-moss-100 text-moss-700",
  berlangsung: "bg-moss-100 text-moss-700",
  disetujui: "bg-moss-100 text-moss-700",
  selesai: "bg-moss-100 text-moss-700",
  terjadwal: "bg-amber-100 text-amber-600",
  menunggu: "bg-amber-100 text-amber-600",
  "belum mulai": "bg-amber-100 text-amber-600",
  do: "bg-rose-100 text-rose-600",
  ditolak: "bg-rose-100 text-rose-600",
  gagal: "bg-rose-100 text-rose-600",
  dibatalkan: "bg-rose-100 text-rose-600",
  "tidak aktif": "bg-rose-100 text-rose-600",
};

export function Badge({ children }: { children: string }) {
  const tone = TONE_MAP[children.toLowerCase()] ?? "bg-ink/5 text-ink/70";
  return (
    <span className={cn("inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium", tone)}>
      {children}
    </span>
  );
}
