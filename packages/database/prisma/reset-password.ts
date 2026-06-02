/**
 * Resetta la password di un utente direttamente nel DB.
 * Uso: tsx prisma/reset-password.ts <email> <nuova-password>
 */

import { PrismaClient } from "../src/generated/prisma";
import { hashPassword } from "@better-auth/utils/password";

const prisma = new PrismaClient();

async function main() {
  const [, , email, password] = process.argv;

  if (!email || !password) {
    console.error("Uso: tsx prisma/reset-password.ts <email> <nuova-password>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`❌  Utente non trovato: ${email}`);
    process.exit(1);
  }

  const hashed = await hashPassword(password);

  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: user.id,
      },
    },
    update: { password: hashed },
    create: {
      providerId: "credential",
      accountId: user.id,
      userId: user.id,
      password: hashed,
    },
  });

  console.log(`✓ Password aggiornata per ${email}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
