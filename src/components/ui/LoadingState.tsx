export function LoadingState({ label = "Memuat data" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-ink/50">
      <span className="h-3 w-3 animate-pulse rounded-full bg-moss-500" />
      {label}...
    </div>
  );
}
