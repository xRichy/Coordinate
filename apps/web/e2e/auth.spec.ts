import { test, expect } from "@playwright/test";

const ADMIN_A = { email: "admin-a@e2e.local", password: "E2ePass123!", slug: "e2e-a" };

// T6.1 — login → tenant dashboard.
test("login porta alla dashboard del tenant", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(ADMIN_A.email);
  await page.locator('input[type="password"]').fill(ADMIN_A.password);
  await page.getByRole("button", { name: "Accedi" }).click();
  await page.waitForURL(`**/t/${ADMIN_A.slug}/dashboard`, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("credenziali errate non autenticano", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(ADMIN_A.email);
  await page.locator('input[type="password"]').fill("password-sbagliata");
  await page.getByRole("button", { name: "Accedi" }).click();
  await expect(page).toHaveURL(/\/login/);
});
