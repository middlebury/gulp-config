import { createConfig } from '../../src/create-gulp-config.js';

export const { dev, build } = createConfig({
  styles: {
    dest: './'
  },
  scripts: {
    dest: './js/bundle.js'
  }
});
