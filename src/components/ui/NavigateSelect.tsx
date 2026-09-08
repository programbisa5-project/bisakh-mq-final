"use client";
export function NavigateSelect({
options,
value,
paramName,
basePath,
}: {
options: { value: string | number; label: string }[];
value?: string | number;
paramName: string;
basePath: string;
}) {


return (
<select
defaultValue={value ?? ""}
className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm"
onChange={(e) => {
window.location.href = `${basePath}?${paramName}=${e.target.value}`;

}}
>
{options.map((o) => (
<option key={o.value} value={o.value}>
{o.label}
</option>
))}
</select>
);
}
