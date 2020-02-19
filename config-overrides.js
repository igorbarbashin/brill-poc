module.exports = function override(config, env) {
  //do stuff with the webpack config...

  console.log(config);
  config.module.rules.push({
    test: /\.glsl$/i,
    use: [
      {
        loader: 'raw-loader',
        options: {
          esModule: false
        }
      }
    ]
  });

  /**
   * module: {
        loaders: [
            {
                test: /\.glsl$/,
                loader: 'webpack-glsl'
            }
        ]
    }
   */
  return config;
};
