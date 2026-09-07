"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError("Email atau kata sandi salah.");
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-ink/10 bg-white p-6">
        <h1 className="text-xl text-ink">Masuk ke BISAkh MQ</h1>
        <p className="mt-1 text-sm text-ink/60">Gunakan akun yang sudah didaftarkan Superadmin.</p>

        <label className="mt-5 block text-sm font-medium text-ink">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-moss-500 focus:ring-1 focus:ring-moss-500"
        />

        <label className="mt-4 block text-sm font-medium text-ink">Kata sandi</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-moss-500 focus:ring-1 focus:ring-moss-500"
        />

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        <Button type="submit" disabled={loading} className="mt-5 w-full">
          {loading ? "Memproses..." : "Masuk"}
        </Button>
      </form>
    </div>
  );
}
