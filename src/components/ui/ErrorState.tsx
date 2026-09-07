export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-rose-600/30 bg-rose-100 px-4 py-3 text-sm text-rose-600">
      {message}
    </div>
  );
}
