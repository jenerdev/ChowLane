import tseslint from "typescript-eslint";

/** Shared ESLint flat config for the internal TypeScript packages. */
const config = tseslint.config(...tseslint.configs.recommended, {
  ignores: ["dist/**", "node_modules/**"],
});

export default config;
