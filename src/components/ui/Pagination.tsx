import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => !!v) as [string, string][]
    );
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-between pt-3 text-sm text-ink/60">
      <span>
        Halaman {page} dari {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className="rounded-md border border-ink/15 px-3 py-1 hover:bg-ink/5">
            Sebelumnya
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link href={hrefFor(page + 1)} className="rounded-md border border-ink/15 px-3 py-1 hover:bg-ink/5">
            Berikutnya
          </Link>
        ) : null}
      </div>
    </div>
  );
}
