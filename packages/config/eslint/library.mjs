import tseslint from "typescript-eslint";

/** Shared ESLint flat config for the internal TypeScript packages. */
const config = tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" },
      ],
    },
  },
  { ignores: ["dist/**", "node_modules/**"] },
);

export default config;
