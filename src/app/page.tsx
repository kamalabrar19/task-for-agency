import Link from "next/link";
import { ArrowRight, Check, Gauge, LayoutTemplate, Plug, Workflow } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import { SITE } from "@/lib/site";

const SERVICES = [
  { icon: Gauge, title: "Landing page & web promosi", body: "Responsif, cepat dimuat, dan disusun untuk mengubah pengunjung menjadi pembeli atau pendaftar." },
  { icon: LayoutTemplate, title: "Company profile & web korporat", body: "Citra merek yang rapi dengan UI/UX modern, supaya calon klien Anda langsung percaya." },
  { icon: Workflow, title: "Sistem web custom & dashboard", body: "CRM, manajemen tugas, inventaris, atau analitik yang mengikuti alur kerja unik bisnis Anda." },
  { icon: Plug, title: "Integrasi & pemeliharaan", body: "Hubungkan website dengan API pihak ketiga, payment gateway, dan otomasi bisnis." },
];

const PROMISES = [
  ["Tanpa perantara", "Proyek ditangani langsung oleh 3 developer dan 1 marketing strategist. Kebutuhan Anda sampai ke kode tanpa terdistorsi."],
  ["Progres yang bisa Anda lihat", "Setiap proyek punya halaman status pribadi: persentase, milestone, dan catatan dari tim, tanpa perlu menagih kabar."],
  ["Pembayaran bertahap", "DP di awal, pelunasan setelah hasil Anda setujui. Nilai kontrak dan termin tertulis sejak sebelum mulai."],
  ["Kode yang bisa dikembangkan", "Struktur rapi dan repo diserahkan, sehingga Anda tidak terkunci pada kami."],
];

export default function Home() {
  return <div className="min-h-screen">
    <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
      <span className="flex items-center gap-2 font-bold tracking-tight"><span className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white">B</span>{SITE.name}</span>
      <nav className="flex items-center gap-2 text-sm"><a href="#layanan" className="muted hidden px-3 py-2 hover:text-emerald-600 sm:block">Layanan</a><a href="#cara-kerja" className="muted hidden px-3 py-2 hover:text-emerald-600 sm:block">Cara kerja</a><ThemeToggle /><Link href="/login" className="btn-ghost">Masuk tim</Link></nav>
    </header>

    <main>
      <section className="mx-auto grid max-w-5xl items-center gap-10 px-5 pb-20 pt-12 md:grid-cols-[1.15fr_1fr] md:pt-20">
        <div>
          <p className="mb-4 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Agensi digital · 3 developer + 1 marketer</p>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">Website dan sistem web yang <span className="text-emerald-600 dark:text-emerald-400">selesai tepat waktu</span>, dan bisa Anda pantau.</h1>
          <p className="muted mt-5 max-w-lg text-lg">{SITE.tagline} Tim kecil kami memangkas birokrasi, jadi Anda berbicara langsung dengan orang yang menulis kodenya.</p>
          <div className="mt-8 flex flex-wrap gap-3"><a href={`mailto:${SITE.email}?subject=Konsultasi proyek`} className="btn">Konsultasi gratis <ArrowRight size={16} /></a><a href="#cara-kerja" className="btn-ghost">Lihat cara kerja</a></div>
        </div>

        {/* Contoh halaman status yang diterima klien */}
        <div className="panel p-6" aria-label="Contoh halaman status proyek">
          <div className="flex items-center justify-between text-xs"><span className="muted font-semibold uppercase tracking-wider">Contoh status proyek</span><span className="rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Sesuai jadwal</span></div>
          <h2 className="mt-3 text-lg font-semibold">Landing Page Peluncuran Produk</h2>
          <div className="mt-4 h-2 rounded-full bg-slate-200 dark:bg-[#1d2c24]"><div className="h-full w-[68%] rounded-full bg-emerald-500" /></div>
          <p className="muted mt-2 text-xs">17 dari 25 tugas selesai · tenggat 14 Nov</p>
          <ul className="mt-5 space-y-2.5 text-sm">
            {[["Desain disetujui", true], ["Halaman utama selesai", true], ["Formulir lead terhubung", true], ["Uji performa & QA", false]].map(([t, ok]) => <li key={t as string} className="flex items-center gap-3"><span className={`flex size-5 shrink-0 items-center justify-center rounded-full ${ok ? "bg-emerald-600 text-white" : "border border-slate-300 dark:border-[#27382e]"}`}>{ok && <Check size={12} />}</span><span className={ok ? "" : "muted"}>{t}</span></li>)}
          </ul>
          <p className="muted mt-5 border-t border-slate-200 pt-4 text-xs dark:border-[#1d2c24]">“Formulir sudah live di staging, silakan dicoba.” <span className="whitespace-nowrap">— tim developer</span></p>
        </div>
      </section>

      <section id="layanan" className="border-y border-slate-200 bg-white py-16 dark:border-[#1d2c24] dark:bg-[#0a120e]">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-2xl font-bold tracking-tight">Layanan</h2><p className="muted mt-2 max-w-xl">Mulai dari solusi siap pakai yang efisien hingga arsitektur aplikasi custom skala penuh.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">{SERVICES.map(({ icon: Icon, title, body }) => <div key={title} className="panel p-6"><span className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><Icon size={20} /></span><h3 className="mt-4 font-semibold">{title}</h3><p className="muted mt-2 text-sm">{body}</p></div>)}</div>
        </div>
      </section>

      <section id="cara-kerja" className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-2xl font-bold tracking-tight">Kenapa Anda tidak perlu khawatir</h2><p className="muted mt-2 max-w-xl">Risiko terbesar memakai agensi adalah tidak tahu apa yang terjadi. Kami menutupnya sejak awal.</p>
        <div className="mt-8 grid gap-x-10 gap-y-7 md:grid-cols-2">{PROMISES.map(([t, b]) => <div key={t} className="flex gap-4"><span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"><Check size={14} /></span><div><h3 className="font-semibold">{t}</h3><p className="muted mt-1 text-sm">{b}</p></div></div>)}</div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-24">
        <div className="rounded-3xl bg-emerald-600 p-8 text-white md:p-12"><h2 className="text-2xl font-bold tracking-tight md:text-3xl">Ceritakan kebutuhan Anda. Kami balas dengan estimasi.</h2><p className="mt-3 max-w-xl text-emerald-50">Konsultasi pertama gratis. Anda mendapat ruang lingkup, estimasi waktu, dan biaya tertulis sebelum memutuskan apa pun.</p><a href={`mailto:${SITE.email}?subject=Konsultasi proyek`} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">Kirim email ke {SITE.email} <ArrowRight size={16} /></a></div>
      </section>
    </main>

    <footer className="border-t border-slate-200 py-8 text-center text-xs muted dark:border-[#1d2c24]">© {new Date().getFullYear()} {SITE.name}. Semua hak dilindungi.</footer>
  </div>;
}
