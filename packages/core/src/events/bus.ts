import { z } from "zod";

// ── Event definition ──────────────────────────────────────────────────────────

export type TenantEventDef<Name extends string, Schema extends z.ZodType> = {
  readonly name: Name;
  readonly schema: Schema;
};

export function defineTenantEvent<Name extends string, Schema extends z.ZodType>(
  name: Name,
  schema: Schema
): TenantEventDef<Name, Schema> {
  return { name, schema };
}

// ── Handler type ──────────────────────────────────────────────────────────────

type Handler<T> = (event: { tenantId: string; payload: T }) => Promise<void> | void;

// ── EventBus ──────────────────────────────────────────────────────────────────

class EventBus {
  private handlers = new Map<string, Handler<unknown>[]>();

  /** Subscribe to an event. Returns an unsubscribe function. */
  on<Schema extends z.ZodType>(
    def: TenantEventDef<string, Schema>,
    handler: Handler<z.infer<Schema>>
  ): () => void {
    const list = this.handlers.get(def.name) ?? [];
    list.push(handler as Handler<unknown>);
    this.handlers.set(def.name, list);

    return () => {
      const current = this.handlers.get(def.name) ?? [];
      this.handlers.set(
        def.name,
        current.filter((h) => h !== handler)
      );
    };
  }

  /** Emit an event to all registered handlers (Zod-validated payload). */
  async emit<Schema extends z.ZodType>(
    def: TenantEventDef<string, Schema>,
    tenantId: string,
    payload: z.infer<Schema>
  ): Promise<void> {
    const validated = def.schema.parse(payload);
    const list = this.handlers.get(def.name) ?? [];
    await Promise.all(list.map((h) => h({ tenantId, payload: validated })));
  }

  /** Remove all handlers (useful in tests). */
  reset(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();
