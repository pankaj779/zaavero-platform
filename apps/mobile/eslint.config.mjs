import reactLibraryConfig from '@graphology/config/eslint/react-library';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...reactLibraryConfig,
  {
    rules: {
      // React Native / Expo surfaces (async handlers, enum-like status strings,
      // template literals with numbers) fight the strictest shared rules. Keep
      // unused-var + hooks safety; relax the rest for the mobile package.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
    },
  },
  {
    ignores: [
      'dist/**',
      '.expo/**',
      'node_modules/**',
      'babel.config.js',
      'metro.config.js',
      'jest.config.js',
      'jest.setup.js',
      'vitest.config.ts',
      'vitest.setup.ts',
      'expo-env.d.ts',
      'eslint.config.mjs',
      '**/__tests__/**',
      '**/*.test.ts',
      'android/**',
      'ios/**',
    ],
  },
];
