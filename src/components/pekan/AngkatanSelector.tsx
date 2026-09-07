"use client";

export function AngkatanSelector({
  angkatanList,
  value,
  basePath,
}: {
  angkatanList: { id: number; nama_angkatan: string }[];
  value?: number;
  basePath: string;
}) {
  return (
    <select
      defaultValue={value ?? ""}
      className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm"
      onChange={(e) => {
        window.location.href = `${basePath}?angkatan=${e.target.value}`;
      }}
    >
      {angkatanList.map((a) => (
        <option key={a.id} value={a.id}>
          {a.nama_angkatan}
        </option>
      ))}
    </select>
  );
}
