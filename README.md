# Agency Workspace

Workspace internal: 1 admin + 4 anggota (1 Marketing, 3 Developer).

## Jalankan lokal
```
npm install
npm run db:local     # Postgres embedded (port 54329), biarkan terbuka
npm run db:push      # buat tabel
npm run db:seed      # data demo
npm run dev          # http://localhost:3000
```
Dengan Docker: `docker compose up -d`, lalu ubah port di `DATABASE_URL` ke 5432.

## Akun demo (password: nilai `SEED_PASSWORD`, default `agency123`)
`admin@agency.local`, `veby@agency.local` (marketing), `dilo@`, `natah@`, `abe@agency.local` (developer)

## Peran
- **Admin**: buat proyek, beri jobdesk, atur KPI, keuangan & payout, link status klien.
- **Anggota**: lihat semua, ubah status tugas milik sendiri; marketing mengelola prospek.

## KPI
Target diatur admin per bulan; nilai aktual dihitung otomatis (pendapatan, proyek selesai, tepat waktu,
effort point selesai per developer, prospek baru & deal per marketing).
