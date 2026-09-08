"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export function SignOutButton() {
const router = useRouter();
const supabase = createClient();
return (
<button
onClick={async () => {
await supabase.auth.signOut();
router.replace("/login");
router.refresh();
}}
className="mt-1 text-xs font-medium text-clay-500 hover:underline"
>
Keluar
</button>
);
}
