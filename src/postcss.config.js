import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import combineMediaQuery from 'postcss-combine-media-query';
import sortCSSmq from 'sort-css-media-queries';
import mqpacker from 'mqpacker';
import { browserlist } from './browserslist-config.js';

export const postcssConfig = () => {
  const PROD = process.env.NODE_ENV === 'production';

  const plugins = [autoprefixer(browserlist)];

  if (PROD) {
    plugins.push(cssnano(), combineMediaQuery(), mqpacker({
      sort: sortCSSmq
    }));
  }

  return {
    plugins
  };
};
