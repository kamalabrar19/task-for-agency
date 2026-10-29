"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";

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
      window.location.href = "/";
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal login"); setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#0b0d13] px-5 text-white">
    <div className="w-full max-w-sm"><div className="mb-12 flex items-center gap-3 text-sm font-bold tracking-[.25em]"><span className="flex size-10 items-center justify-center rounded-xl bg-violet-600 text-xl">✳</span> AGENCY / WORKSPACE</div>
      <div className="rounded-2xl border border-[#272936] bg-[#12141d] p-8"><LockKeyhole className="mb-6 text-violet-400" size={24} /><h1 className="text-2xl font-semibold">Selamat datang kembali.</h1><p className="mt-2 text-sm text-slate-400">Masuk ke ruang kerja tim Anda.</p>
        <form onSubmit={login} className="mt-8 space-y-4"><label className="block text-xs font-semibold text-slate-400">EMAIL<input autoFocus type="email" required value={email} onChange={e => setEmail(e.target.value)} className="field mt-2" placeholder="nama@agency.local" /></label><label className="block text-xs font-semibold text-slate-400">PASSWORD<input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="field mt-2" placeholder="Masukkan password" /></label>{error && <p role="alert" className="text-sm text-red-400">{error}</p>}<button disabled={busy} className="btn w-full">{busy ? "Memeriksa..." : "Masuk ke workspace"}<ArrowRight size={16} /></button></form>
      </div><p className="mt-6 text-center text-xs text-slate-500">Akses hanya untuk anggota tim internal.</p></div>
  </main>;
}
