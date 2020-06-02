const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const combineMediaQuery = require('postcss-combine-media-query');

const browserlist = require('./browserslist-config');

module.exports = () => {
  const PROD = process.env.NODE_ENV === 'production';

  const plugins = [autoprefixer(browserlist)];

  if (PROD) {
    plugins.push(cssnano(), combineMediaQuery());
  }

  return {
    plugins
  };
};
