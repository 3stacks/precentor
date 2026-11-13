// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // dist/ is the web build. The engine comes from Open 1650 with its own style.
    ignores: ['dist/*', '.expo/*', 'assets/corpus/*', 'playwright-report/*', 'test-results/*'],
  },
]);
