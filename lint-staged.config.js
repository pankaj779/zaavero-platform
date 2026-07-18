/** @type {import('lint-staged').Config} */
export default {
  // Package-level `pnpm lint` (turbo) is the authoritative ESLint gate.
  // Running eslint --fix across the monorepo from husky OOMs on large commits
  // and breaks Next.js pages-dir resolution when invoked from the repo root.
  '*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,yml,yaml}': ['prettier --write'],
};
