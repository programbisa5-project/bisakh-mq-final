"use client";

import { useState, type ReactNode } from "react";
import { Button } from "./Button";

/**
 * Dialog konfirmasi untuk aksi berbahaya (approve/reject queue, hapus data, dst).
 * Aksi sesungguhnya tetap dijalankan lewat Server Action / RPC yang memverifikasi
 * role di database — dialog ini murni UX, bukan lapisan keamanan.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Konfirmasi",
  variant = "primary",
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "primary" | "danger";
  onConfirm: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg">
            <h3 className="font-display text-lg text-ink">{title}</h3>
            {description ? <p className="mt-1 text-sm text-ink/60">{description}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                Batal
              </Button>
              <Button
                variant={variant}
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    await onConfirm();
                    setOpen(false);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? "Memproses..." : confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
