const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push('db', 'mp3', 'ttf', 'obj', 'png', 'jpg');

// Production optimizations
if (process.env.NODE_ENV === 'production') {
    config.transformer = {
      ...config.transformer,
      minifierConfig: {
        mangle: {
          keep_fnames: true,
        },
        output: {
          comments: false,
        },
      },
    };
  }

module.exports = config;