module.exports = function(api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        'react-native-reanimated/plugin',
        ['module-resolver', {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@contexts': './src/contexts',
            '@utils': './src/utils',
            '@api': './src/api',
            '@styles': './src/styles',
            '@hooks': './src/hooks',
            '@services': './src/services',
            '@assets': './assets',
          }
        }]
      ],
    };
  };