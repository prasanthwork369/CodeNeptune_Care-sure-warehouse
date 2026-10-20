// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // eslint-config-expo 58 moved to eslint-plugin-react-hooks 7, whose
    // recommended preset adds React Compiler rules as errors. These five flag
    // existing patterns (Reanimated shared-value writes, Animated.Value refs,
    // reset-on-open effects, stateless inner components), not regressions.
    // Kept visible as warnings until they are refactored separately.
    rules: {
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
]);
