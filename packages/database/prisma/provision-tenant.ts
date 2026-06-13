/**
 * Provisioning white-glove di un tenant (T4.17).
 *
 * Crea, in un colpo solo, un tenant completo e pronto all'uso:
 *   • Tenant  (slug, nome, piano, moduli abilitati)
 *   • User    owner (emailVerified, niente flusso di verifica email)
 *   • Account credential (password con hash Better-Auth)
 *   • Membership owner
 *   • TenantSettings di default (timezone/locale/currency/dateFormat)
 *   • PipelineStage di default (Nuovo → Perso)
 *
 * Sostituisce il signup self-serve (deferred): il tenant è creato a mano
 * dall'operatore e le credenziali vengono consegnate al cliente.
 *
 * Uso:
 *   pnpm -F @coordinate/database db:provision \
 *     --slug acme --name "Acme S.r.l." \
 *     --email mario.rossi@acme.it --owner "Mario Rossi" \
 *     [--password segreta123] [--plan pro] \
 *     [--modules dashboard,crm-contacts,crm-pipeline]
 *
 * Se --password è omessa, ne viene generata una sicura e stampata a video.
 * Se --modules è omesso, il tenant usa i 6 moduli core di default.
 */

import { randomBytes } from "node:crypto";
import {
  PrismaClient,
  TenantPlan,
  TenantStatus,
  MemberRole,
} from "@prisma/client";
import { hashPassword } from "@better-auth/utils/password";

const prisma = new PrismaClient();

// Catalogo moduli — tenere allineato a MODULE_CATALOG in
// packages/api/src/routers/tenant.ts e al default di Tenant.enabledModules.
const MODULE_IDS = [
  "dashboard",
  "crm-contacts",
  "crm-pipeline",
  "activities",
  "warehouse",
  "calendar",
] as const;

const DEFAULT_SETTINGS = [
  { key: "timezone", value: "Europe/Rome" },
  { key: "locale", value: "it" },
  { key: "currency", value: "EUR" },
  { key: "dateFormat", value: "DD/MM/YYYY" },
];

const DEFAULT_STAGES = ["Nuovo", "Contattato", "Qualificato", "Proposta", "Vinto", "Perso"];

// ── Parsing flag (--key value | --key=value) ───────────────────────────────────
function parseFlags(argv: string[]): Record<string, string | boolean> {
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    if (key.includes("=")) {
      const [k, ...rest] = key.split("=");
      flags[k] = rest.join("=");
    } else if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
      flags[key] = argv[++i];
    } else {
      flags[key] = true; // flag booleana (es. --help)
    }
  }
  return flags;
}

function die(msg: string): never {
  console.error(`❌  ${msg}`);
  process.exit(1);
}

const USAGE = `
Provisioning tenant white-glove

  pnpm -F @coordinate/database db:provision --slug <slug> --name "<Nome>" \\
    --email <owner@email> --owner "<Nome Owner>" [opzioni]

Obbligatori:
  --slug      slug URL del tenant (a-z, 0-9, trattini)   es. acme
  --name      ragione sociale                            es. "Acme S.r.l."
  --email     email dell'owner                           es. mario@acme.it
  --owner     nome dell'owner                            es. "Mario Rossi"

Opzioni:
  --password  password owner (default: generata e stampata)
  --plan      starter | pro | business                   (default: starter)
  --modules   csv di moduli abilitati                    (default: tutti i 6 core)
              ${MODULE_IDS.join(", ")}
  --help      mostra questo messaggio
`;

// ── Generatore password sicura (leggibile, da cambiare al primo accesso) ───────
function generatePassword(): string {
  // base64url → 16 char senza simboli ambigui per la trascrizione manuale
  return randomBytes(16).toString("base64url").slice(0, 16);
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));

  if (flags.help) {
    console.log(USAGE);
    process.exit(0);
  }

  // ── Validazione input ──────────────────────────────────────────────────────
  const slug = String(flags.slug ?? "").trim().toLowerCase();
  const name = String(flags.name ?? "").trim();
  const email = String(flags.email ?? "").trim().toLowerCase();
  const ownerName = String(flags.owner ?? "").trim();

  if (!slug || !name || !email || !ownerName) {
    console.error(USAGE);
    die("Mancano parametri obbligatori (--slug, --name, --email, --owner).");
  }
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    die(`Slug non valido: "${slug}". Usa solo a-z, 0-9 e trattini (non iniziali/finali).`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    die(`Email non valida: "${email}".`);
  }

  const plan = String(flags.plan ?? TenantPlan.starter) as TenantPlan;
  if (!Object.values(TenantPlan).includes(plan)) {
    die(`Piano non valido: "${plan}". Valori: ${Object.values(TenantPlan).join(", ")}.`);
  }

  let enabledModules: string[] | undefined;
  if (typeof flags.modules === "string") {
    const requested = flags.modules.split(",").map((m) => m.trim()).filter(Boolean);
    const unknown = requested.filter((m) => !MODULE_IDS.includes(m as (typeof MODULE_IDS)[number]));
    if (unknown.length) {
      die(`Moduli sconosciuti: ${unknown.join(", ")}. Validi: ${MODULE_IDS.join(", ")}.`);
    }
    enabledModules = [...new Set(requested)];
  }

  const passwordProvided = typeof flags.password === "string" && flags.password.length > 0;
  const password = passwordProvided ? String(flags.password) : generatePassword();

  // ── Pre-check: slug univoco ────────────────────────────────────────────────
  const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
  if (existingTenant) {
    die(`Esiste già un tenant con slug "${slug}". Scegli uno slug diverso.`);
  }

  console.log(`🏗️   Provisioning tenant "${name}" (/t/${slug})\n`);

  // ── Tenant ─────────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.create({
    data: {
      slug,
      name,
      plan,
      status: TenantStatus.active,
      ...(enabledModules ? { enabledModules } : {}), // altrimenti default schema (6 core)
    },
  });
  console.log(`✓ Tenant creato → ${tenant.id}`);

  // ── User owner (riusa se l'email esiste già: stessa persona, nuovo tenant) ──
  const existingUser = await prisma.user.findUnique({ where: { email } });
  const owner = existingUser
    ? existingUser
    : await prisma.user.create({
        data: { email, name: ownerName, emailVerified: true },
      });
  console.log(existingUser ? `✓ User esistente riusato: ${owner.email}` : `✓ User owner creato: ${owner.email}`);

  // ── Credential (password) ──────────────────────────────────────────────────
  // Per un utente esistente sovrascrivo la password SOLO se passata esplicitamente.
  let passwordSet = true;
  if (existingUser && !passwordProvided) {
    passwordSet = false;
    console.log("ℹ️  User già esistente: password lasciata invariata (passa --password per resettarla).");
  } else {
    const hashed = await hashPassword(password);
    await prisma.account.upsert({
      where: { providerId_accountId: { providerId: "credential", accountId: owner.id } },
      update: { password: hashed },
      create: { providerId: "credential", accountId: owner.id, userId: owner.id, password: hashed },
    });
    console.log("✓ Credenziali impostate");
  }

  // ── Membership + settings + pipeline (dentro tx con app.tenant_id per RLS) ──
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenant.id}, true)`;

    await tx.membership.create({
      data: { userId: owner.id, tenantId: tenant.id, role: MemberRole.owner },
    });
    console.log("✓ Membership: owner");

    for (const s of DEFAULT_SETTINGS) {
      await tx.tenantSetting.create({
        data: { tenantId: tenant.id, key: s.key, value: s.value },
      });
    }
    console.log("✓ TenantSettings di default");

    await tx.pipelineStage.createMany({
      data: DEFAULT_STAGES.map((stageName, i) => ({
        tenantId: tenant.id,
        name: stageName,
        order: i + 1,
      })),
    });
    console.log(`✓ PipelineStages: ${DEFAULT_STAGES.join(", ")}`);
  });

  // ── Output credenziali da consegnare ───────────────────────────────────────
  const modulesLine = (enabledModules ?? [...MODULE_IDS]).join(", ");
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Tenant pronto all'uso

  Azienda:   ${name}
  URL:       /t/${slug}   (es. http://localhost:3000/t/${slug})
  Piano:     ${plan}
  Moduli:    ${modulesLine}

  ── Credenziali owner da consegnare al cliente ──
  Email:     ${owner.email}
  Password:  ${passwordSet ? password : "(invariata — utente preesistente)"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${passwordSet ? "  ⚠️  Consegna la password su un canale sicuro e invita il cliente a cambiarla." : ""}
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
