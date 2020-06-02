const { createConfig } = require('../../');

module.exports = createConfig({
  styles: {
    dest: './'
  },
  scripts: {
    dest: './js/bundle.js'
  }
});
