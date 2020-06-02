const browserSync = require('browser-sync');
const cp = require('child_process');
const merge = require('lodash.merge');

const { createConfig, PROD } = require('./create-gulp-config');

const createJekyllConfig = (options) => {
  const jekyllOpts = ['build'];

  if (!PROD) {
    jekyllOpts.push('--baseurl', '');
  }

  const jekyll = (done) => {
    return cp
      .spawn('jekyll', jekyllOpts, {
        stdio: 'inherit'
      })
      .on('close', () => {
        browserSync.reload();
      })
      .on('exit', done);
  };

  const jekyllOptions = {
    dist: './_site',
    scripts: {
      src: './_js/index.js',
      dest: './js/bundle.js',
      watch: './_js/**/*.js'
    },
    styles: {
      src: './_scss/main.scss',
      watch: './_scss/**/*.scss',
      dest: './css'
    },
    browserSyncOptions: {
      server: {
        baseDir: './_site'
      }
    },
    beforeBuild: [jekyll],
    watch: (watch) => {
      watch(['**/*.{html,md,yml}', '!_site/**'], jekyll);
    }
  };

  const config = merge({}, options, jekyllOptions);

  return createConfig(config);
};

module.exports = {
  createJekyllConfig
};
