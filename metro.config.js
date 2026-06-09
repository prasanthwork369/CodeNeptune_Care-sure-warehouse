const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Move SVG from asset extensions to source extensions
// so react-native-svg-transformer converts them to React components
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg', 'mjs'];
// Fix for TanStack Query v5 and other ESM packages
config.resolver.unstable_enablePackageExports = true;

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

module.exports = withNativeWind(config, { input: './global.css' });