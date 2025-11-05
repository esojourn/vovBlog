const js = require('@eslint/js')
const typescript = require('typescript-eslint')
const nextPlugin = require('@next/eslint-plugin-next')
const reactPlugin = require('eslint-plugin-react')

module.exports = [
  {
    ignores: ['.next', 'node_modules', 'dist', '.git', '.env.local'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescript.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: 'readonly',
      },
    },
    plugins: {
      '@next/next': nextPlugin,
      react: reactPlugin,
      '@typescript-eslint': typescript.plugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescript.configs.recommended.rules,
      '@next/next/no-html-link-for-pages': 'warn',
      'react/react-in-jsx-scope': 'off',
    },
  },
]
