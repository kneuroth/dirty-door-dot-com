# @repo/typescript-config

Shared `tsconfig.json` presets consumed by every workspace package via `extends`.

## Presets

- `@repo/typescript-config/base.json` — strict TypeScript with `NodeNext` modules, `noUncheckedIndexedAccess`, declarations on. Used by `packages/db`.
- `@repo/typescript-config/nextjs.json` — extends base, switches to `ESNext` + `Bundler` resolution, enables `next` plugin, `noEmit`, JSX. Used by `apps/web`.

(`react-library.json` exists for any future React-only library — currently unused since we have no shared UI package.)

## Adding a new package

```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src/**/*.ts"]
}
```
