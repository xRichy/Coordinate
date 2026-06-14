"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cookie-consent";
const noop = () => () => {};

/**
 * Minimal GDPR cookie banner. Only shown when product analytics is configured
 * (NEXT_PUBLIC_POSTHOG_KEY) — without it there are no analytics cookies to
 * consent to. Choice is stored in localStorage.
 *
 * useSyncExternalStore reads localStorage without a setState-in-effect: it
 * returns false on the server (hidden) and the real value after hydration.
 */
export function CookieBanner() {
  const consentMissing = useSyncExternalStore(
    noop,
    () => !localStorage.getItem(STORAGE_KEY),
    () => false
  );
  const [dismissed, setDismissed] = useState(false);

  const analyticsOn = !!process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!analyticsOn || !consentMissing || dismissed) return null;

  function choose(value: "accepted" | "rejected") {
    localStorage.setItem(STORAGE_KEY, value);
    setDismissed(true);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div className="mx-auto max-w-3xl rounded-xl border border-border/60 bg-popover/95 backdrop-blur-md shadow-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-sm text-muted-foreground flex-1">
          Usiamo cookie tecnici e, con il tuo consenso, strumenti di analisi per migliorare il prodotto.{" "}
          <Link href="/privacy" className="text-primary hover:underline">Privacy policy</Link>.
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => choose("rejected")}>Rifiuta</Button>
          <Button size="sm" onClick={() => choose("accepted")}>Accetta</Button>
        </div>
      </div>
    </div>
  );
}
