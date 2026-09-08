export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-ink/15 py-16 text-center">
      <p className="font-medium text-ink">{title}</p>
      {description ? <p className="max-w-sm text-sm text-ink/60">{description}</p> : null}
    </div>
  );
}
