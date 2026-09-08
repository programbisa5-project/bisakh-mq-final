"use client";
export function FilterSelect({
name,
label,
options,
}: {
name: string;
label: string;
options: { value: string; label: string }[];
}) {
return (
<select
name={name}
defaultValue=""
className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink/80"
onChange={(e) => {
const url = new URL(window.location.href);
if (e.target.value) url.searchParams.set(name, e.target.value);
else url.searchParams.delete(name);
url.searchParams.delete("page");
window.location.href = url.toString();
}}
>
<option value="">{label}</option>
{options.map((o) => (
<option key={o.value} value={o.value}>
{o.label}
</option>


))}
</select>
);
}
