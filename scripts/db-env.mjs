// Writes the Supabase URL + anon key (and, for landing, console and customer, the server-only service-role key) into each
// app's .env.local. Other lines in those files are kept.
// Usage: pnpm db:env               → reads `supabase status -o env` (local Docker stack must be running)
//        pnpm db:env -- --from-env → copies NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY / SUPABASE_SERVICE_ROLE_KEY from
//                                    the current environment (use this for the hosted project)
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APPS = ["landing", "console", "rider", "customer", "platform"];
// Only apps whose server actions use the Auth admin API (signup, invites, rider passwords). Never NEXT_PUBLIC_.
const SERVICE_APPS = ["landing", "console", "customer"];
const MANAGED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];
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
  return { url: vars.API_URL, anonKey: vars.ANON_KEY, serviceKey: vars.SERVICE_ROLE_KEY };
}

const fromEnv = process.argv.includes("--from-env");
const { url, anonKey, serviceKey } = fromEnv
  ? {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
  : readLocalStatus();
if (!url || !anonKey)
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required");

for (const app of APPS) {
  const values = { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey };
  if (serviceKey && SERVICE_APPS.includes(app)) values.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
  const file = join(root, "apps", app, ".env.local");
  const kept = existsSync(file)
    ? readFileSync(file, "utf8")
        .split(/\r?\n/)
        .filter((line) => line && !MANAGED.some((k) => line.startsWith(`${k}=`)))
    : [];
  const lines = [...kept, ...Object.entries(values).map(([k, v]) => `${k}=${v}`)];
  writeFileSync(file, `${lines.join("\n")}\n`);
  console.log(
    `wrote apps/${app}/.env.local → ${url}${values.SUPABASE_SERVICE_ROLE_KEY ? " (+ service key)" : ""}`,
  );
}
