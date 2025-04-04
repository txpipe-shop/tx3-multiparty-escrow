import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ["docs", "node_modules", ".github"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      globals: globals.node,
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      import: importPlugin,
    },
    rules: {
      "no-constant-condition": ["error", { checkLoops: false }],

      // explicit .js extensions in imports
      "import/extensions": [
        "error",
        "always",
        { js: "always", jsx: "always", ts: "never", ignorePackages: true },
      ],

      // recommended rules
      ...tseslint.configs.recommended.rules,

      // ignore unused variables prefixed with '_'
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      "@typescript-eslint/ban-ts-comment": "warn",
    },
  },
];
