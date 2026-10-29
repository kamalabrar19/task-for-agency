"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      window.location.href = "/app";
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal login"); setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center px-5">
    <div className="w-full max-w-sm">
      <div className="mb-10 flex items-center justify-between"><a href="/" className="flex items-center gap-2 font-bold tracking-tight"><span className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white">B</span>BikinSaaS</a><ThemeToggle /></div>
      <div className="panel p-8"><LockKeyhole className="mb-5 text-emerald-600" size={24} /><h1 className="text-2xl font-semibold">Masuk ke workspace</h1><p className="muted mt-2 text-sm">Khusus anggota tim BikinSaaS.</p>
        <form onSubmit={login} className="mt-7 space-y-4">
          <label className="muted block text-xs font-semibold">EMAIL<input autoFocus type="email" required value={email} onChange={e => setEmail(e.target.value)} className="field mt-2" placeholder="nama@agency.local" autoComplete="username" /></label>
          <label className="muted block text-xs font-semibold">PASSWORD<input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="field mt-2" autoComplete="current-password" /></label>
          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
          <button disabled={busy} className="btn w-full">{busy ? "Memeriksa…" : "Masuk"}<ArrowRight size={16} /></button>
        </form>
      </div>
    </div>
  </main>;
}
