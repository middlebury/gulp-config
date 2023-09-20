import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonJS from '@rollup/plugin-commonjs';
import { uglify } from 'rollup-plugin-uglify';
import sizes from 'rollup-plugin-sizes';
import filesize from 'rollup-plugin-filesize';
import typescript from '@rollup/plugin-typescript';

// const browsers = require('./browserslist-config.js');
const browsers = ['> 1%', 'Firefox ESR', 'not dead', 'not op_mini all'];

export const rollupConfig = (input, ts) => {
  const PROD = process.env.NODE_ENV === 'production';
  let tsBuild = [];

  if(ts === true) {
    tsBuild = [typescript({ module: 'ESNext' })];
  }

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
      ...tsBuild,
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
