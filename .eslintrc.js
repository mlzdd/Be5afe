module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  rules: {
    // Enforce module boundary direction:
    // shared/* must not import from modules/* or products/*
    // modules/* must not import from products/*
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          {
            target: './src/shared',
            from: './src/modules',
            message: 'shared/ must not import from modules/',
          },
          {
            target: './src/shared',
            from: './src/products',
            message: 'shared/ must not import from products/',
          },
          {
            target: './src/modules',
            from: './src/products',
            message: 'modules/ must not import from products/',
          },
          {
            target: './src/infra',
            from: './src/modules',
            message: 'infra/ must not import from modules/ — infra is a low-level adapter layer',
          },
          {
            target: './src/infra',
            from: './src/products',
            message: 'infra/ must not import from products/',
          },
        ],
      },
    ],
    // No direct Firebase/Supabase imports outside infra/
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'firebase/firestore',
            message: 'Import Firestore through @infra/database/firestore only.',
          },
          {
            name: 'firebase/auth',
            message: 'Import Firebase Auth through @infra/auth/firebase only.',
          },
          {
            name: '@firebase/app',
            message: 'Import Firebase through @infra/ only.',
          },
        ],
      },
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      // Infra layer is allowed to import Firebase directly — it is the adapter
      files: ['src/infra/**/*.ts', 'src/infra/**/*.tsx'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
      rules: {
        'import/no-restricted-paths': 'off',
      },
    },
  ],
};
