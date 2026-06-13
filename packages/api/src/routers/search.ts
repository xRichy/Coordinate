import { z } from "zod";
import { router, tenantProcedure } from "../trpc";

export type SearchResultType = "contact" | "deal" | "product";

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string | null;
}

interface Row {
  id: string;
  title: string;
  subtitle: string | null;
}

const PER_TYPE_LIMIT = 5;

export const searchRouter = router({
  // Cross-module full-text search over Contact / Deal / Product. Tenant isolation
  // is enforced by RLS on ctx.db (the query runs inside the tenant transaction).
  global: tenantProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }): Promise<SearchResult[]> => {
      const q = input.query.trim();
      if (q.length < 2) return [];

      const [contacts, deals, products] = await Promise.all([
        ctx.db.$queryRaw<Row[]>`
          SELECT id, name AS title, COALESCE(company, email) AS subtitle
          FROM contacts
          WHERE "deletedAt" IS NULL
            AND searchable @@ websearch_to_tsquery('simple', ${q})
          ORDER BY ts_rank(searchable, websearch_to_tsquery('simple', ${q})) DESC
          LIMIT ${PER_TYPE_LIMIT}`,
        ctx.db.$queryRaw<Row[]>`
          SELECT id, title, status::text AS subtitle
          FROM deals
          WHERE searchable @@ websearch_to_tsquery('simple', ${q})
          ORDER BY ts_rank(searchable, websearch_to_tsquery('simple', ${q})) DESC
          LIMIT ${PER_TYPE_LIMIT}`,
        ctx.db.$queryRaw<Row[]>`
          SELECT id, name AS title, sku AS subtitle
          FROM products
          WHERE searchable @@ websearch_to_tsquery('simple', ${q})
          ORDER BY ts_rank(searchable, websearch_to_tsquery('simple', ${q})) DESC
          LIMIT ${PER_TYPE_LIMIT}`,
      ]);

      return [
        ...contacts.map((c): SearchResult => ({ type: "contact", ...c })),
        ...deals.map((d): SearchResult => ({ type: "deal", ...d })),
        ...products.map((p): SearchResult => ({ type: "product", ...p })),
      ];
    }),
});
