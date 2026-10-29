# BikinSaaS Workspace

Landing page publik + workspace internal tim (1 admin + 4 anggota: 1 Marketing, 3 Developer) + halaman status klien.

| Alamat | Fungsi |
|---|---|
| `/` | Landing page agensi (publik) |
| `/login` → `/app` | Workspace tim (admin & anggota) |
| `/status/<token>` | Halaman status proyek untuk klien (link rahasia, kedaluwarsa 90 hari, bisa dicabut) |

## Jalankan lokal
```
npm install
npm run db:local     # Postgres embedded (port 54329), biarkan terminal terbuka
npm run db:push      # buat tabel
npm run db:seed      # data demo + akun
npm run dev          # http://localhost:3000
```
Akun demo (password `SEED_PASSWORD`, default `agency123`): `admin@`, `veby@` (marketing), `dilo@`, `natah@`, `abe@agency.local`.

## Go-live (publik)
Cara termudah: satu VPS (Ubuntu + Docker) dan satu domain.
1. Arahkan A record domain ke IP server.
2. `cp .env.production.example .env`, isi `DOMAIN`, `DB_PASSWORD`, `SESSION_SECRET` (acak, 64 karakter; contoh `openssl rand -hex 32`).
3. `docker compose -f docker-compose.prod.yml up -d --build` (HTTPS otomatis lewat Caddy, migrasi jalan otomatis).
4. Buat akun tim (password minimal 12 karakter):
   ```
   docker compose -f docker-compose.prod.yml exec app npx tsx scripts/add-user.ts admin@domain.com "Admin" ADMIN "password-panjang-1"
   ```
   Ulangi untuk 1 MARKETING dan 3 DEVELOPER. Produksi tidak membuat data/akun demo.
5. Ubah kontak publik di `src/lib/site.ts`.

Alternatif: Vercel + Neon/Supabase. Set `DATABASE_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_APP_URL`, lalu jalankan `npm run db:deploy` sekali.

## Peran
- **Admin**: proyek, jobdesk, KPI, keuangan & payout, link klien, hapus/ubah data.
- **Anggota**: lihat semua, ubah status tugas sendiri, kirim kabar ke klien; marketing mengelola prospek.

## Pengaman agar klien tenang
- Halaman status klien: persentase, milestone, indikator jadwal (sesuai jadwal / perlu perhatian / terlambat), dan kabar dari tim.
- Proyek tidak bisa ditandai selesai bila masih ada tugas terbuka.
- Total pembayaran tidak bisa melebihi nilai kontrak; keuangan terkunci setelah payout.
- Dashboard admin menyorot proyek berisiko/terlambat dan tugas tanpa penanggung jawab.
- Link klien bisa dicabut kapan saja.
