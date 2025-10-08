module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'simple-import-sort'],
  rules: {
    'simple-import-sort/imports': ['warn', {
      groups: [
        // React imports first
        ['^react$', '^react-dom$'],
        // External packages
        ['^@?\\w'],
        // Internal packages starting with @/
        ['^@/'],
        // Side effect imports
        ['^\\u0000'],
        // Parent imports
        ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
        // Other relative imports
        ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
        // Style imports
        ['^.+\\.s?css$']
      ]
    }],
    'simple-import-sort/exports': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-empty-interface': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
}
