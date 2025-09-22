const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

//     assetExts: [...defaultConfig.resolver.assetExts, "lottie"],
const config = getDefaultConfig(__dirname);
config.resolver.assetExts = [
    ...config.resolver.assetExts,
    'lottie', // Add 'lottie' if using `.lottie` files
];

module.exports = withNativeWind(config, { input: './global.css' });
