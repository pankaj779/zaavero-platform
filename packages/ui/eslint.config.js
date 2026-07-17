import reactLibraryConfig from '@graphology/config/eslint/react-library';

export default [
  ...reactLibraryConfig,
  // Test files are excluded from tsconfig (build emits from src), so the
  // typed-lint project service cannot resolve them; vitest still runs them.
  { ignores: ['src/**/*.test.ts'] },
];
