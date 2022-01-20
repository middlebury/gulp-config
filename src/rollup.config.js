const { babel } = require('@rollup/plugin-babel');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonJS = require('@rollup/plugin-commonjs');
const { uglify } = require('rollup-plugin-uglify');
const sizes = require('rollup-plugin-sizes');
const filesize = require('rollup-plugin-filesize');
const typescript = require('@rollup/plugin-typescript');

const browsers = require('./browserslist-config');

module.exports = (input) => {
  const PROD = process.env.NODE_ENV === 'production';

  return {
    input,
    plugins: [
      babel({
        exclude: /node_modules\/(?!(dom7|ssr-window|swiper|micromodal|lozad|focus-within)\/).*/,
        presets: [
          [
            '@babel/preset-env',
            {
              targets: browsers,
              modules: false
            }
          ]
        ],
        plugins: [
          // ['@babel/transform-react-jsx', { pragma: 'h' }],
          '@babel/plugin-proposal-class-properties'
        ]
      }),
      nodeResolve(),
      typescript({ module: 'ESNext' }),
      commonJS({
        // ignore importing optional momentjs, which comes with pikaday
        extension: ['.tsx', '.ts', '.js'],
        ignore: ['moment']
      }),
      PROD && uglify(),
      PROD && sizes(),
      PROD && filesize()
    ]
  };
};
