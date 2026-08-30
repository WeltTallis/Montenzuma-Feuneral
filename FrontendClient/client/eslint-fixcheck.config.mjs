// Minimal eslint flat config compatible with eslint 8.57 (ESLINT_USE_FLAT_CONFIG=true).
// Purpose: find *undefined identifiers* (missing imports) like the `User` bug
// that crashed the production bundle.
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'public/**'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-undef': 'error',
      'no-unused-vars': 'off',
      'no-const-assign': 'error',
    },
  },
];
