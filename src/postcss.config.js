const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const combineMediaQuery = require('postcss-combine-media-query');
const sortCSSmq = require('sort-css-media-queries');
const mqpacker = require("mqpacker");

const browserlist = require('./browserslist-config');

module.exports = () => {
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
