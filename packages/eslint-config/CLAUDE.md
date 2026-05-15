# @repo/eslint-config

Shared ESLint flat configs consumed by every workspace package via `extends`.

## Exports

- `@repo/eslint-config/base` — TS + Prettier-compatible base rules, plus `eslint-plugin-turbo` for env-var hygiene. Used by `packages/db` and similar non-React packages.
- `@repo/eslint-config/next-js` — extends base, adds React, React Hooks, and `@next/eslint-plugin-next` rules (including `core-web-vitals`). Used by `apps/web`.

`eslint-plugin-only-warn` is on the base config: lint errors are downgraded to warnings. The `--max-warnings 0` flag in each package's `lint` script is what fails CI, so warnings still gate merges — they're just easier to spot locally.

## Adding a new package

Pick `base` (Node / library) or `next-js` (Next.js app). Create `eslint.config.js` in the package:

```js
import { config } from "@repo/eslint-config/base";

/** @type {import("eslint").Linter.Config[]} */
export default config;
```
