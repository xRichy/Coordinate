/**
 * Seed demo — dati mock realistici per demo commerciale.
 *
 * Prerequisito: il tenant "demo" deve esistere (pnpm db:seed lo crea).
 * Uso: pnpm -F @coordinate/database db:seed:demo
 *
 * Idempotente: se il tenant ha già >5 contatti, lo script non ricrea nulla.
 */

import {
  PrismaClient,
  TenantPlan,
  TenantStatus,
  MemberRole,
  ContactType,
  ContactStatus,
  LeadStatus,
  DealStatus,
  ActivityType,
  ActivityPriority,
  ActivityStatus,
  StockMovementType,
} from "@prisma/client";

const prisma = new PrismaClient();

const OWNER_EMAIL = "mich@coordinate.com";
const TENANT_SLUG = "mich";

// Utility: giorni fa / tra N giorni
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000);

async function main() {
  console.log("🌱  Seed demo — dati mock Coordinate\n");

  // ── Tenant ────────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: TENANT_SLUG },
    update: {},
    create: {
      slug: TENANT_SLUG,
      name: "Mich",
      plan: TenantPlan.pro,
      status: TenantStatus.active,
    },
  });
  console.log(`✓ Tenant: ${tenant.slug} → ${tenant.id}`);

  // ── Owner (mich@coordinate.com) ────────────────────────────────────────────
  const owner = await prisma.user.upsert({
    where: { email: OWNER_EMAIL },
    update: {},
    create: {
      email: OWNER_EMAIL,
      name: "Michele",
      emailVerified: true,
    },
  });
  console.log(`✓ User: ${owner.email}`);

  // ── Tutto dentro una transazione con app.tenant_id impostato ─────────────
  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenant.id}, true)`;

      // ── Idempotency check (dentro la transazione, dopo set_config) ────────
      // La RLS filtra per tenant_id — senza set_config il conteggio sarebbe
      // sempre 0, causando duplicati. Qui la policy è già attiva.
      const existingCount = await tx.contact.count();
      if (existingCount > 5) {
        console.log(`\nℹ️  Il tenant ha già ${existingCount} contatti — seed demo skippato.`);
        console.log("   Svuota i dati dal DB (o cambia TENANT_SLUG) per rigenerare.\n");
        return;
      }

      // ── Membership ───────────────────────────────────────────────────────
      await tx.membership.upsert({
        where: { userId_tenantId: { userId: owner.id, tenantId: tenant.id } },
        update: { role: MemberRole.owner },
        create: { userId: owner.id, tenantId: tenant.id, role: MemberRole.owner },
      });
      console.log("✓ Membership: owner");

      // ── Settings ─────────────────────────────────────────────────────────
      const settings = [
        { key: "timezone", value: "Europe/Rome" },
        { key: "locale", value: "it" },
        { key: "currency", value: "EUR" },
        { key: "dateFormat", value: "DD/MM/YYYY" },
      ];
      for (const s of settings) {
        await tx.tenantSetting.upsert({
          where: { tenantId_key: { tenantId: tenant.id, key: s.key } },
          update: {},
          create: { tenantId: tenant.id, key: s.key, value: s.value },
        });
      }
      console.log("✓ TenantSettings");

      // ── Tags ─────────────────────────────────────────────────────────────
      const tagNames = ["cliente-strategico", "VIP", "prospect", "fornitore", "referral", "cold"];
      const tags: Record<string, string> = {};
      for (const name of tagNames) {
        const tag = await tx.tag.upsert({
          where: { tenantId_name: { tenantId: tenant.id, name } },
          update: {},
          create: { tenantId: tenant.id, name },
        });
        tags[name] = tag.id;
      }
      console.log(`✓ Tags: ${tagNames.join(", ")}`);

      // ── Contatti — Aziende ───────────────────────────────────────────────
      const ufficiModerni = await tx.contact.create({
        data: {
          tenantId: tenant.id,
          type: ContactType.company,
          name: "Uffici Moderni S.r.l.",
          email: "info@ufficimoderni.it",
          phone: "+39 02 8745 1200",
          company: "Uffici Moderni S.r.l.",
          status: ContactStatus.customer,
          ownerId: owner.id,
          createdAt: daysAgo(90),
          tags: { create: [{ tagId: tags["cliente-strategico"]! }, { tagId: tags["VIP"]! }] },
        },
      });

      const techSpace = await tx.contact.create({
        data: {
          tenantId: tenant.id,
          type: ContactType.company,
          name: "TechSpace Italia S.p.A.",
          email: "acquisti@techspace.it",
          phone: "+39 06 9321 5500",
          company: "TechSpace Italia S.p.A.",
          status: ContactStatus.customer,
          ownerId: owner.id,
          createdAt: daysAgo(75),
          tags: { create: [{ tagId: tags["cliente-strategico"]! }, { tagId: tags["VIP"]! }] },
        },
      });

      const edilpro = await tx.contact.create({
        data: {
          tenantId: tenant.id,
          type: ContactType.company,
          name: "Edilpro Group S.r.l.",
          email: "direzione@edilpro.it",
          phone: "+39 011 5642 980",
          company: "Edilpro Group S.r.l.",
          status: ContactStatus.active,
          ownerId: owner.id,
          createdAt: daysAgo(45),
          tags: { create: [{ tagId: tags["prospect"]! }] },
        },
      });

      const studioFerretti = await tx.contact.create({
        data: {
          tenantId: tenant.id,
          type: ContactType.company,
          name: "Studio Ferretti & Associati",
          email: "studio@ferretti-assoc.it",
          phone: "+39 055 2341 760",
          company: "Studio Ferretti & Associati",
          status: ContactStatus.active,
          ownerId: owner.id,
          createdAt: daysAgo(30),
          tags: { create: [{ tagId: tags["prospect"]! }, { tagId: tags["referral"]! }] },
        },
      });

      const logistica = await tx.contact.create({
        data: {
          tenantId: tenant.id,
          type: ContactType.company,
          name: "Logistica Express S.r.l.",
          email: "ops@logexpress.it",
          phone: "+39 051 7832 400",
          company: "Logistica Express S.r.l.",
          status: ContactStatus.active,
          ownerId: owner.id,
          createdAt: daysAgo(60),
          tags: { create: [{ tagId: tags["cold"]! }] },
        },
      });

      console.log("✓ Aziende: 5");

      // ── Contatti — Persone ───────────────────────────────────────────────
      await tx.contact.createMany({
        data: [
          {
            tenantId: tenant.id,
            type: ContactType.person,
            name: "Marco Bianchi",
            email: "m.bianchi@ufficimoderni.it",
            phone: "+39 347 1234 567",
            company: "Uffici Moderni S.r.l.",
            status: ContactStatus.customer,
            parentId: ufficiModerni.id,
            ownerId: owner.id,
            createdAt: daysAgo(88),
          },
          {
            tenantId: tenant.id,
            type: ContactType.person,
            name: "Giulia Conti",
            email: "g.conti@techspace.it",
            phone: "+39 348 9876 543",
            company: "TechSpace Italia S.p.A.",
            status: ContactStatus.customer,
            parentId: techSpace.id,
            ownerId: owner.id,
            createdAt: daysAgo(73),
          },
          {
            tenantId: tenant.id,
            type: ContactType.person,
            name: "Antonio Russo",
            email: "a.russo@edilpro.it",
            phone: "+39 333 4567 890",
            company: "Edilpro Group S.r.l.",
            status: ContactStatus.active,
            parentId: edilpro.id,
            ownerId: owner.id,
            createdAt: daysAgo(44),
          },
          {
            tenantId: tenant.id,
            type: ContactType.person,
            name: "Laura Ferretti",
            email: "l.ferretti@ferretti-assoc.it",
            phone: "+39 339 8765 432",
            company: "Studio Ferretti & Associati",
            status: ContactStatus.active,
            parentId: studioFerretti.id,
            ownerId: owner.id,
            createdAt: daysAgo(29),
          },
          {
            tenantId: tenant.id,
            type: ContactType.person,
            name: "Davide Martini",
            email: "d.martini@logexpress.it",
            phone: "+39 340 1122 334",
            company: "Logistica Express S.r.l.",
            status: ContactStatus.active,
            parentId: logistica.id,
            ownerId: owner.id,
            createdAt: daysAgo(58),
          },
          {
            tenantId: tenant.id,
            type: ContactType.person,
            name: "Sara Romano",
            email: "sara.romano@gmail.com",
            phone: "+39 345 6677 889",
            status: ContactStatus.active,
            ownerId: owner.id,
            createdAt: daysAgo(20),
          },
          {
            tenantId: tenant.id,
            type: ContactType.person,
            name: "Fabio De Luca",
            email: "fabio.deluca@deluca-design.it",
            phone: "+39 366 2233 445",
            company: "De Luca Design Studio",
            status: ContactStatus.active,
            ownerId: owner.id,
            createdAt: daysAgo(15),
          },
        ],
      });
      console.log("✓ Persone: 7");

      // ── Pipeline stages ───────────────────────────────────────────────────
      const stageNames = ["Nuovo", "Contattato", "Qualificato", "Proposta", "Vinto", "Perso"];
      const existingStages = await tx.pipelineStage.findMany({ orderBy: { order: "asc" } });
      let stages = existingStages;
      if (existingStages.length === 0) {
        await tx.pipelineStage.createMany({
          data: stageNames.map((name, i) => ({ tenantId: tenant.id, name, order: i + 1 })),
        });
        stages = await tx.pipelineStage.findMany({ orderBy: { order: "asc" } });
      }
      const stageByName: Record<string, string> = {};
      for (const s of stages) stageByName[s.name] = s.id;
      console.log(`✓ PipelineStages: ${stages.map((s) => s.name).join(", ")}`);

      // ── Leads ─────────────────────────────────────────────────────────────
      const leadsData = [
        {
          title: "Fornitura scrivanie executive",
          value: 12500,
          contactName: "Marco Bianchi",
          stageId: stageByName["Qualificato"],
          createdAt: daysAgo(20),
        },
        {
          title: "Rinnovo contratto servizi 2026",
          value: 28000,
          contactName: "Giulia Conti",
          stageId: stageByName["Proposta"],
          createdAt: daysAgo(12),
        },
        {
          title: "Arredamento open space nuova sede",
          value: 8500,
          contactName: "Antonio Russo",
          stageId: stageByName["Contattato"],
          createdAt: daysAgo(10),
        },
        {
          title: "Setup sala conferenze 10 posti",
          value: 4200,
          contactName: "Laura Ferretti",
          stageId: stageByName["Nuovo"],
          createdAt: daysAgo(5),
        },
        {
          title: "Kit postazioni home office x10",
          value: 3800,
          contactName: "Sara Romano",
          stageId: stageByName["Qualificato"],
          createdAt: daysAgo(8),
        },
        {
          title: "Scaffalatura magazzino centrale",
          value: 15000,
          contactName: "Davide Martini",
          stageId: stageByName["Perso"],
          status: LeadStatus.lost,
          createdAt: daysAgo(45),
        },
        {
          title: "Monitor e periferiche ufficio",
          value: 6400,
          contactName: "Fabio De Luca",
          stageId: stageByName["Contattato"],
          createdAt: daysAgo(7),
        },
        {
          title: "Forniture annuali 2026-2027",
          value: 45000,
          contactName: "Uffici Moderni S.r.l.",
          stageId: stageByName["Proposta"],
          createdAt: daysAgo(3),
        },
      ];

      await tx.lead.createMany({
        data: leadsData.map((l) => ({
          tenantId: tenant.id,
          title: l.title,
          value: l.value,
          contactName: l.contactName,
          stageId: l.stageId ?? null,
          status: l.status ?? LeadStatus.new,
          createdAt: l.createdAt,
        })),
      });
      console.log(`✓ Leads: ${leadsData.length}`);

      // ── Deals ─────────────────────────────────────────────────────────────
      await tx.deal.createMany({
        data: [
          {
            tenantId: tenant.id,
            title: "Allestimento open space Q1 2026",
            value: 24000,
            status: DealStatus.won,
            contactId: ufficiModerni.id,
            closedAt: daysAgo(40),
            createdAt: daysAgo(65),
          },
          {
            tenantId: tenant.id,
            title: "Fornitura sedie ergonomiche 50 pz",
            value: 18500,
            status: DealStatus.won,
            contactId: techSpace.id,
            closedAt: daysAgo(20),
            createdAt: daysAgo(50),
          },
          {
            tenantId: tenant.id,
            title: "Scrivania direzionale su misura",
            value: 6800,
            status: DealStatus.open,
            contactId: studioFerretti.id,
            createdAt: daysAgo(10),
          },
          {
            tenantId: tenant.id,
            title: "Kit magazzino scaffalatura compatta",
            value: 9200,
            status: DealStatus.lost,
            contactId: logistica.id,
            closedAt: daysAgo(15),
            createdAt: daysAgo(40),
          },
          {
            tenantId: tenant.id,
            title: "Pacchetto startup workstation x8",
            value: 12000,
            status: DealStatus.open,
            contactId: edilpro.id,
            createdAt: daysAgo(6),
          },
        ],
      });
      console.log("✓ Deals: 5");

      // ── Prodotti ──────────────────────────────────────────────────────────
      const productsData = [
        { sku: "SCR-EXE-01", name: "Scrivania Direzionale Executive", category: "Arredamento", price: 890, stockQuantity: 12 },
        { sku: "SED-ERG-02", name: "Sedia Ergonomica Pro X2", category: "Arredamento", price: 320, stockQuantity: 35 },
        { sku: "ARM-ACH-01", name: "Armadio Archivio 2 Ante", category: "Arredamento", price: 480, stockQuantity: 8 },
        { sku: "MON-27K-01", name: "Monitor 27\" 4K UltraSharp", category: "Informatica", price: 540, stockQuantity: 22 },
        { sku: "LAM-LED-01", name: "Lampada LED da Tavolo Regolabile", category: "Accessori", price: 45, stockQuantity: 60 },
        { sku: "KIT-SAL-01", name: "Kit Sala Riunioni (tavolo + 8 sedie)", category: "Arredamento", price: 2200, stockQuantity: 4 },
        { sku: "SCA-IND-01", name: "Scaffalatura Industriale 5 Ripiani", category: "Magazzino", price: 280, stockQuantity: 3 },
        { sku: "PC-DSK-I7", name: "PC Desktop i7 / 16GB / 512 SSD", category: "Informatica", price: 1200, stockQuantity: 7 },
      ];

      const products: Record<string, string> = {};
      for (const p of productsData) {
        const product = await tx.product.upsert({
          where: { tenantId_sku: { tenantId: tenant.id, sku: p.sku } },
          update: {},
          create: { tenantId: tenant.id, ...p },
        });
        products[p.sku] = product.id;
      }
      console.log(`✓ Prodotti: ${productsData.length}`);

      // ── Movimenti magazzino ───────────────────────────────────────────────
      await tx.stockMovement.createMany({
        data: [
          // Carichi iniziali (settimane fa)
          { tenantId: tenant.id, productId: products["SCR-EXE-01"]!, type: StockMovementType.in,  quantity: 15, note: "Carico iniziale magazzino", createdAt: daysAgo(60) },
          { tenantId: tenant.id, productId: products["SED-ERG-02"]!, type: StockMovementType.in,  quantity: 50, note: "Carico iniziale magazzino", createdAt: daysAgo(60) },
          { tenantId: tenant.id, productId: products["ARM-ACH-01"]!, type: StockMovementType.in,  quantity: 10, note: "Carico iniziale magazzino", createdAt: daysAgo(60) },
          { tenantId: tenant.id, productId: products["MON-27K-01"]!, type: StockMovementType.in,  quantity: 30, note: "Carico iniziale magazzino", createdAt: daysAgo(60) },
          { tenantId: tenant.id, productId: products["LAM-LED-01"]!, type: StockMovementType.in,  quantity: 80, note: "Carico iniziale magazzino", createdAt: daysAgo(60) },
          { tenantId: tenant.id, productId: products["KIT-SAL-01"]!, type: StockMovementType.in,  quantity: 6,  note: "Carico iniziale magazzino", createdAt: daysAgo(60) },
          { tenantId: tenant.id, productId: products["SCA-IND-01"]!, type: StockMovementType.in,  quantity: 8,  note: "Carico iniziale magazzino", createdAt: daysAgo(60) },
          { tenantId: tenant.id, productId: products["PC-DSK-I7"]!,  type: StockMovementType.in,  quantity: 10, note: "Carico iniziale magazzino", createdAt: daysAgo(60) },
          // Uscite per consegne
          { tenantId: tenant.id, productId: products["SED-ERG-02"]!, type: StockMovementType.out, quantity: 12, note: "Consegna TechSpace — fornitura sedie ergonomiche", createdAt: daysAgo(20) },
          { tenantId: tenant.id, productId: products["KIT-SAL-01"]!, type: StockMovementType.out, quantity: 2,  note: "Consegna Uffici Moderni — open space Q1", createdAt: daysAgo(40) },
          { tenantId: tenant.id, productId: products["SCR-EXE-01"]!, type: StockMovementType.out, quantity: 3,  note: "Consegna Uffici Moderni — open space Q1", createdAt: daysAgo(40) },
          { tenantId: tenant.id, productId: products["MON-27K-01"]!, type: StockMovementType.out, quantity: 8,  note: "Consegna TechSpace — postazioni IT", createdAt: daysAgo(18) },
          { tenantId: tenant.id, productId: products["LAM-LED-01"]!, type: StockMovementType.out, quantity: 20, note: "Consegna Uffici Moderni — accessori", createdAt: daysAgo(38) },
          { tenantId: tenant.id, productId: products["PC-DSK-I7"]!,  type: StockMovementType.out, quantity: 3,  note: "Consegna TechSpace — workstation sviluppo", createdAt: daysAgo(16) },
          // Ricarico recente
          { tenantId: tenant.id, productId: products["SED-ERG-02"]!, type: StockMovementType.in,  quantity: 20, note: "Ordine fornitore — reintegro stock primavera", createdAt: daysAgo(5) },
          { tenantId: tenant.id, productId: products["SCA-IND-01"]!, type: StockMovementType.out, quantity: 5,  note: "Reso a fornitore — merce difettosa", createdAt: daysAgo(10) },
        ],
      });
      console.log("✓ Movimenti magazzino: 16");

      // ── Activities ────────────────────────────────────────────────────────
      await tx.activity.createMany({
        data: [
          {
            tenantId: tenant.id,
            type: ActivityType.task,
            title: "Inviare preventivo Edilpro Group — arredamento open space",
            priority: ActivityPriority.high,
            status: ActivityStatus.todo,
            dueDate: daysFromNow(2),
            notes: "Antonio Russo attende entro venerdì. Includere sconto volume 5%.",
            createdAt: daysAgo(1),
          },
          {
            tenantId: tenant.id,
            type: ActivityType.call,
            title: "Follow-up Marco Bianchi — scrivanie executive",
            priority: ActivityPriority.medium,
            status: ActivityStatus.todo,
            dueDate: daysFromNow(1),
            notes: "Verificare quantità definitiva e tempi di consegna.",
            createdAt: daysAgo(2),
          },
          {
            tenantId: tenant.id,
            type: ActivityType.meeting,
            title: "Presentazione offerta TechSpace — rinnovo contratto 2026",
            priority: ActivityPriority.high,
            status: ActivityStatus.in_progress,
            dueDate: daysFromNow(4),
            notes: "Preparare deck con ROI su forniture precedenti. Giulia Conti + CFO.",
            createdAt: daysAgo(3),
          },
          {
            tenantId: tenant.id,
            type: ActivityType.task,
            title: "Preparare proposta forniture annuali — Uffici Moderni",
            priority: ActivityPriority.high,
            status: ActivityStatus.in_progress,
            dueDate: daysFromNow(6),
            notes: "Contratto 2026-2027 da 45k. Includere condizioni pagamento 60gg.",
            createdAt: daysAgo(3),
          },
          {
            tenantId: tenant.id,
            type: ActivityType.call,
            title: "Primo contatto Fabio De Luca — De Luca Design Studio",
            priority: ActivityPriority.medium,
            status: ActivityStatus.in_progress,
            dueDate: daysFromNow(1),
            notes: "Studio di design da Milano. Potenziale cliente per monitor e workstation premium.",
            createdAt: daysAgo(2),
          },
          {
            tenantId: tenant.id,
            type: ActivityType.meeting,
            title: "Firma contratto TechSpace — Q1 2026",
            priority: ActivityPriority.high,
            status: ActivityStatus.done,
            notes: "Contratto firmato. 50 sedie ergonomiche + 8 monitor. Consegna completata.",
            createdAt: daysAgo(22),
          },
          {
            tenantId: tenant.id,
            type: ActivityType.note,
            title: "Visita showroom — Laura Ferretti",
            priority: ActivityPriority.low,
            status: ActivityStatus.done,
            notes: "Molto interessata al tavolo conferenze ovale. Vuole campionario tessuti settimana prossima.",
            createdAt: daysAgo(12),
          },
          {
            tenantId: tenant.id,
            type: ActivityType.call,
            title: "Chiamata Davide Martini — scaffalatura magazzino",
            priority: ActivityPriority.medium,
            status: ActivityStatus.done,
            notes: "Ha scelto un competitor per questioni di prezzo. Mantenere contatto per opportunità future.",
            createdAt: daysAgo(18),
          },
          {
            tenantId: tenant.id,
            type: ActivityType.task,
            title: "Aggiornare catalogo prodotti Q3 2026",
            priority: ActivityPriority.low,
            status: ActivityStatus.todo,
            dueDate: daysFromNow(21),
            notes: "Aggiungere nuova linea ergonomica e aggiornare prezzi post-svalutazione.",
            createdAt: daysAgo(1),
          },
          {
            tenantId: tenant.id,
            type: ActivityType.note,
            title: "Note su Sara Romano — home office",
            priority: ActivityPriority.low,
            status: ActivityStatus.done,
            notes: "Interessata a kit completo home office (scrivania + sedia + monitor). Ricontattare a settembre post-ferie.",
            createdAt: daysAgo(5),
          },
        ],
      });
      console.log("✓ Activities: 10");

      console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Seed demo completato!

  Tenant:   http://localhost:3000/t/${tenant.slug}
  Account:  ${OWNER_EMAIL}

  Dati creati:
    • 5 aziende + 7 persone (12 contatti)
    • 6 tag  |  6 stadi pipeline
    • 8 lead in pipeline  |  5 deal (2 vinti, 2 aperti, 1 perso)
    • 8 prodotti  |  16 movimenti magazzino
    • 10 attività (task, call, meeting, note)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    },
    { timeout: 30_000 }
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
