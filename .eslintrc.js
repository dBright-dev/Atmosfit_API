module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    'ecmaVersion': 2018,
  },
  extends: [
    'eslint:recommended',
    'google',
  ],
  rules: {
  // Turn off JSDoc requirements for every function.
    'require-jsdoc': 'off',
    // Turn off the 80-character line limit.
    'max-len': 'off',
    // Keep other default rules
    'no-unused-vars': 'warn',
  },
  overrides: [
    {
      files: ['**/*.spec.*'],
      env: {
        mocha: true,
      },
      rules: {
        'max-len': 'off',
        'require-jsdoc': 'off',
        'new-cap': 'off',
      },
    },
  ],
  globals: {},
};
