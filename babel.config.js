module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@app': './src/app',
            '@shared': './src/shared',
            '@infra': './src/infra',
            '@modules': './src/modules',
            '@products': './src/products',
            '@schema': './schema',
          },
        },
      ],
    ],
  };
};
