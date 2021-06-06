module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2021,
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:import/errors', 'plugin:import/warnings'],
  rules: {
    'import/order': ['warn', { alphabetize: { order: 'asc' } }],
    'no-restricted-imports': ['error', { patterns: ['./', '../'] }],
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
  overrides: [
    {
      files: ['*.vue'],
      globals: {
        EventListener: true,
        Uint16: true,
        Uint8: true,
      },
      extends: [
        'plugin:vue/vue3-recommended',
        'plugin:import/typescript',
        '@vue/typescript/recommended',
        '@vue/prettier',
        '@vue/prettier/@typescript-eslint',
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
    {
      files: ['*.ts'],
      extends: ['plugin:import/typescript', 'plugin:@typescript-eslint/recommended', 'prettier'],
      rules: {
        '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      },
    },
    {
      files: ['*.js'],
      extends: ['prettier'],
    },
  ],
}
