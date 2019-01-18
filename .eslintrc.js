module.exports = {
  extends: [
    'eslint-config-airbnb-base',
  ].map(require.resolve),
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 9,
  },
  rules: {
    'implicit-arrow-linebreak': 0,
    'max-len': ['error', { code: 120 }],
  }
};