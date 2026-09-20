import { defineConfig } from "oxlint";

export default defineConfig({
  $schema: "./node_modules/oxlint/configuration_schema.json",

  ignorePatterns: [
    "**/node_modules/",
    "dist/",
    "quasar.config.*.temporary.compiled*",
    ".quasar/",
    "src-cordova/",
    "src-capacitor/",
    "src/router/typed-router.d.ts"
  ],

  options: {
    // Type-aware checks are noisy with current TS/Vue tooling; vue-tsc covers types in CI.
    typeAware: false,
    typeCheck: false,
    maxWarnings: 10
  },

  plugins: ["typescript", "vue", "import", "eslint", "promise", "unicorn"],

  categories: {
    correctness: "error"
    // style: 'error',
    // pedantic: 'warn',
    // suspicious: 'error',
    // perf: 'error',
    // restriction: 'error'
  },

  rules: {},

  env: {
    builtin: true
  }
});
