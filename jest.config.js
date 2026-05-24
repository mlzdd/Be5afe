const aliases = {
  '^@app/(.*)$': '<rootDir>/src/app/$1',
  '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  '^@infra/(.*)$': '<rootDir>/src/infra/$1',
  '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  '^@products/(.*)$': '<rootDir>/src/products/$1',
  '^@schema/(.*)$': '<rootDir>/schema/$1',
};

module.exports = {
  projects: [
    // Pure node env — only for tests with zero RN dependency (scripts, schema utils)
    {
      displayName: 'logic',
      testEnvironment: 'node',
      transform: { '^.+\\.(ts|tsx)$': ['babel-jest', { presets: ['babel-preset-expo'] }] },
      moduleNameMapper: aliases,
      testMatch: [
        '<rootDir>/scripts/**/*.test.ts',
        '<rootDir>/src/shared/**/__tests__/**/*.test.ts',
        '<rootDir>/src/shared/**/*.test.ts',
      ],
    },
    // jest-expo preset for all hook + component tests (handles RN 0.81 module format)
    {
      displayName: 'rn',
      preset: 'jest-expo',
      moduleNameMapper: aliases,
      testMatch: [
        '<rootDir>/src/modules/**/__tests__/**/*.test.ts',
        '<rootDir>/src/modules/**/*.test.ts',
        '<rootDir>/src/products/**/__tests__/**/*.test.ts',
        '<rootDir>/src/products/**/*.test.ts',
        '<rootDir>/src/infra/**/__tests__/**/*.test.ts',
        '<rootDir>/src/infra/**/*.test.ts',
        '<rootDir>/src/app/**/__tests__/**/*.test.ts',
        '<rootDir>/src/**/__tests__/**/*.test.tsx',
        '<rootDir>/src/**/*.test.tsx',
      ],
    },
  ],
  forceExit: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'schema/**/*.ts',
    '!**/__tests__/**',
    '!**/index.ts',
  ],
};
