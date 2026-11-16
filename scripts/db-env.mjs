// Writes the local Supabase URL + anon key into each app's .env.local (other lines are kept).
// Usage: pnpm db:env            → reads `supabase status -o env` (local Docker stack must be running)
//        pnpm db:env -- --from-env  → copies NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY from the current environment
//                                     (use this for the hosted project; never pass the service-role key)
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APPS = ["console", "rider", "customer", "platform"];
const root = join(import.meta.dirname, "..");

function readLocalStatus() {
  const out = execSync("pnpm exec supabase status -o env", {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  const vars = Object.fromEntries(
    out
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2]]),
  );
  if (!vars.API_URL || !vars.ANON_KEY)
    throw new Error("`supabase status` did not return API_URL / ANON_KEY");
  return { url: vars.API_URL, anonKey: vars.ANON_KEY };
}

const fromEnv = process.argv.includes("--from-env");
const { url, anonKey } = fromEnv
  ? {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
  : readLocalStatus();
if (!url || !anonKey)
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required");

const managed = { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey };
for (const app of APPS) {
  const file = join(root, "apps", app, ".env.local");
  const kept = existsSync(file)
    ? readFileSync(file, "utf8")
        .split(/\r?\n/)
        .filter((line) => line && !Object.keys(managed).some((k) => line.startsWith(`${k}=`)))
    : [];
  const lines = [...kept, ...Object.entries(managed).map(([k, v]) => `${k}=${v}`)];
  writeFileSync(file, `${lines.join("\n")}\n`);
  console.log(`wrote apps/${app}/.env.local → ${url}`);
}
