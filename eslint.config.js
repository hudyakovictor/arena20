import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

// SIGNAL ARENA conventions (00_CONVENTIONS.md):
// - no React in the game client (Phaser/rexUI/Graphics only)
// - no `any` in shared/ domain schemas
// - HEX/emoji/icon-font checks live in scripts/check-conventions.mjs (CI)
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/dev-dist/**',
      'github_project/**',
      'admin/dist/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  // JS-утилиты вне tsconfig: типопроверка не нужна, базовые правила остаются.
  {
    files: ['eslint.config.js', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { projectService: false },
    },
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['eslint.config.js', 'scripts/*.mjs'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
    },
  },
  {
    // T000: no-react-in-game — игровой UI только Phaser/rexUI/Graphics.
    files: ['client/**/*.ts', 'server/**/*.ts', 'shared/**/*.ts', 'admin/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              message: 'React запрещён: игровой UI — только Phaser/rexUI/Graphics.',
            },
            {
              name: 'react-dom',
              message: 'React запрещён: игровой UI — только Phaser/rexUI/Graphics.',
            },
            {
              name: 'lightweight-charts',
              message: 'Готовые web-графики запрещены: только свой CandleChart на Graphics.',
            },
          ],
          patterns: [
            {
              group: ['react-*', '**/react'],
              message: 'React запрещён: игровой UI — только Phaser/rexUI/Graphics.',
            },
          ],
        },
      ],
    },
  },
  {
    // T001: strict, никакого any в доменных схемах shared/.
    files: ['shared/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'scripts/**/*.mjs'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  prettier,
);
