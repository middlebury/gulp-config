const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const combineMediaQuery = require('postcss-combine-media-query');

const browserlist = require('./browserslist-config');

const { PROD } = require('./index');

module.exports = () => {
  const plugins = [autoprefixer(browserlist)];

  if (PROD) {
    plugins.push(cssnano(), combineMediaQuery());
  }

  return {
    plugins
  };
};
