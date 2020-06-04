const gulp = require('gulp');
const browserSync = require('browser-sync');
const cp = require('child_process');
const merge = require('lodash.merge');

const { createConfig } = require('./create-gulp-config');

const createJekyllConfig = (options) => {
  const jekyll = (done) => {
    const jekyllOpts = ['build'];

    if (process.env.NODE_ENV !== 'production') {
      jekyllOpts.push('--baseurl', '');
    }

    return cp
      .spawn('jekyll', jekyllOpts, {
        stdio: 'inherit'
      })
      .on('close', () => {
        browserSync.reload();
      })
      .on('exit', done);
  };

  const copyFiles = (from, to) => () =>
    gulp.src(from).pipe(gulp.dest(to)).pipe(browserSync.stream());

  const jekyllOptions = {
    clean: ['./_site', './css/', './js/'],
    scripts: {
      src: './_js/index.js',
      dest: './js/bundle.js',
      watch: './_js/**/*.js'
    },
    styles: {
      src: './_scss/main.scss',
      dest: './css',
      watch: './_scss/**/*.scss'
    },
    browserSyncOptions: {
      server: {
        baseDir: './_site'
      }
    },
    afterBuild: [jekyll],
    watch: (watch) => {
      watch(['./css/*.css'], copyFiles('./css/*.css', './_site/css/'));
      watch(['./js/*.js'], copyFiles('./js/*.js', './_site/js/'));
      // copy rebuilt files to site folder and stream them on change
      watch(['**/*.{html,md,yml}', '!_site/**'], jekyll);
    }
  };

  const config = merge({}, jekyllOptions, options);

  return createConfig(config);
};

module.exports = {
  createJekyllConfig
};
