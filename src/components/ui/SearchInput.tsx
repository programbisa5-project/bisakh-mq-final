"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

/**
 * Search box yang men-debounce input dan menaruh nilainya di query string (?q=...),
 * supaya hasil pencarian selalu datang dari query Supabase di server, bukan filter
 * daftar yang sudah diambil sebelumnya di client.
 */
export function SearchInput({ placeholder = "Cari..." }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("q", value);
      else params.delete("q");
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="w-full max-w-xs rounded-md border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-moss-500 focus:ring-1 focus:ring-moss-500"
    />
  );
}
