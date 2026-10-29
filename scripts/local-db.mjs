// Postgres lokal tanpa Docker: npm run db:local (biarkan terminal tetap terbuka)
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";

const dir = "./.pgdata";
const pg = new EmbeddedPostgres({ databaseDir: dir, user: "agency", password: "agency", port: 54329, persistent: true, initdbFlags: ["--encoding=UTF8", "--locale=C"] });
if (!existsSync(`${dir}/PG_VERSION`)) await pg.initialise();
await pg.start();
try { await pg.createDatabase("agency"); } catch { /* sudah ada */ }
console.log("Postgres siap di postgresql://agency:agency@localhost:54329/agency");
const stop = async () => { await pg.stop(); process.exit(0); };
process.on("SIGINT", stop); process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
