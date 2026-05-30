# (modules) — Module Route Re-exports

This route group contains one re-export file per module route. Each file is exactly one line.

## Convention

```
apps/web/src/app/t/[tenant]/(modules)/<module-id>/<path>/page.tsx
```

Each file re-exports the page component from the corresponding module package:

```ts
export { default } from "@coordinate/modules-<module-id>/pages/<PageName>";
```

## Adding a route for a new module

1. Make sure the module package exists at `packages/modules/<id>/` and is listed in `apps/web/package.json` as a workspace dependency.
2. Add a path alias in `apps/web/tsconfig.json`:
   ```json
   "@coordinate/modules-<id>": ["../../packages/modules/<id>/src/index.ts"],
   "@coordinate/modules-<id>/pages/*": ["../../packages/modules/<id>/src/pages/*.tsx"]
   ```
3. Create the page component in `packages/modules/<id>/src/pages/<PageName>.tsx` with a default export.
4. Create the re-export file here:
   ```
   apps/web/src/app/t/[tenant]/(modules)/<id>/<path>/page.tsx
   ```
   Content:
   ```ts
   export { default } from "@coordinate/modules-<id>/pages/<PageName>";
   ```

## Example

- Module: `packages/modules/example/src/pages/DemoPage.tsx`
- Re-export: `apps/web/src/app/t/[tenant]/(modules)/example/demo/page.tsx`
- URL: `/t/<slug>/example/demo`

## Notes

- The `(modules)` group name means it is invisible in the URL — routes resolve as `/t/<slug>/<id>/<path>`, not `/t/<slug>/(modules)/<id>/<path>`.
- No layout is defined at the group level; each module inherits the tenant layout at `t/[tenant]/layout.tsx`.
- Keep each re-export file to exactly one line. Business logic belongs in the module package, not here.
