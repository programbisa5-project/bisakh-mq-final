"use client";

import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";

// Copy = copy persis: isi diambil apa adanya dari database, tidak ada
// pemrosesan placeholder atau perubahan format apa pun di sini.
export function TemplateCopyButton({ isi }: { isi: string }) {
  return (
    <Button
      variant="secondary"
      className="px-2 py-1 text-xs"
      onClick={async () => {
        await navigator.clipboard.writeText(isi);
        toast.success("Template disalin.");
      }}
    >
      Copy
    </Button>
  );
}
