import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import { eventBus, defineTenantEvent } from "./bus";
import { leadStatusChanged } from "./crm-pipeline.events";

beforeEach(() => {
  eventBus.reset();
});

describe("eventBus", () => {
  it("delivers payload to a registered handler", async () => {
    const handler = vi.fn();
    eventBus.on(leadStatusChanged, handler);

    await eventBus.emit(leadStatusChanged, "tenant-1", {
      leadId: "lead-abc",
      title: "Test deal",
      previousStatus: "new",
      newStatus: "contacted",
    });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      payload: {
        leadId: "lead-abc",
        title: "Test deal",
        previousStatus: "new",
        newStatus: "contacted",
      },
    });
  });

  it("calls all registered handlers", async () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    eventBus.on(leadStatusChanged, h1);
    eventBus.on(leadStatusChanged, h2);

    await eventBus.emit(leadStatusChanged, "tenant-1", {
      leadId: "l1",
      title: "A",
      previousStatus: "new",
      newStatus: "won",
    });

    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });

  it("unsubscribe stops delivery", async () => {
    const handler = vi.fn();
    const unsub = eventBus.on(leadStatusChanged, handler);
    unsub();

    await eventBus.emit(leadStatusChanged, "t1", {
      leadId: "l1",
      title: "A",
      previousStatus: "new",
      newStatus: "contacted",
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects invalid payload at runtime", async () => {
    const badEvent = defineTenantEvent("test.event", z.object({ num: z.number() }));
    const handler = vi.fn();
    eventBus.on(badEvent, handler);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(eventBus.emit(badEvent, "t1", { num: "not-a-number" } as any)).rejects.toThrow();
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not deliver events for different event names", async () => {
    const eventA = defineTenantEvent("event.a", z.object({ x: z.string() }));
    const eventB = defineTenantEvent("event.b", z.object({ y: z.string() }));
    const handlerA = vi.fn();

    eventBus.on(eventA, handlerA);
    await eventBus.emit(eventB, "t1", { y: "hello" });

    expect(handlerA).not.toHaveBeenCalled();
  });
});
