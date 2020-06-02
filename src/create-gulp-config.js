const path = require('path');
const fs = require('fs');
const merge = require('lodash.merge');
const gulp = require('gulp');
const del = require('del');
const browserSync = require('browser-sync');
const postcss = require('gulp-postcss');
const imagemin = require('gulp-imagemin');
const size = require('gulp-size');
const sass = require('gulp-sass');

const { rollup } = require('rollup');
const rollupConfig = require('./rollup.config');

const postcssConfig = require('./postcss.config');

const { cwd } = process;

const DIST_DIR = 'dist';
const SOURCE_DIR = 'src';

const dist = (parts = '') => path.resolve(cwd(), DIST_DIR, parts);
const src = (parts) => path.resolve(cwd(), SOURCE_DIR, parts);

const defaultOptions = {
  dist: dist(),
  styles: {
    src: src('{scss,css}/index.{scss,css}'),
    watch: src('scss,css}/**/*.{scss,css}'),
    dest: dist('css')
  },
  scripts: {
    src: src('js/index.js'),
    watch: src('js/**/*.js'),
    dest: dist('js/bundle.js')
  },
  images: {
    src: src('img/*.{jpg,png,svg}'),
    watch: src('img/*.{jpg,png,svg}'),
    dest: dist('img')
  },
  browserSyncOptions: {
    open: false,
    notify: false,
    server: {
      baseDir: dist()
    },
    ghostMode: false
  },
  html: {
    src: src('html'),
    watch: src('html'),
    dist: dist('html')
  },
  postcssPlugins: [],
  afterBuild: [],
  beforeBuild: []
};

const log = (...args) => console.info(...args);

function createConfig(options = {}) {
  const config = merge({}, defaultOptions, options);

  const clean = () => del(config.dist);

  const serve = () => browserSync.init(config.browserSyncOptions);

  const styles = () => {
    return gulp
      .src(config.styles.src, {
        allowEmpty: true
      })
      .pipe(sass().on('error', sass.logError))
      .pipe(postcss(postcssConfig))
      .pipe(gulp.dest(config.styles.dest));
  };

  const scripts = () => {
    const { src, dest } = config.scripts;

    if (!fs.existsSync(src)) {
      log(`No js found in ${src}`);
      return Promise.resolve();
    }

    log(`Bundling scripts in ${src} with rollup`);

    return rollup(rollupConfig(src))
      .then((bundle) =>
        bundle.write({
          file: dest,
          format: 'iife',
          sourcemap: !process.env.NODE_ENV === 'production'
        })
      )
      .then(() => {
        browserSync.stream();
      });
  };

  const images = () =>
    gulp
      .src(config.images.src)
      .pipe(
        imagemin([
          imagemin.mozjpeg({ progressive: true }),
          imagemin.optipng({ optimizationLevel: 5 }),
          imagemin.svgo({
            plugins: [{ removeDimensions: true }, { cleanupIDs: false }]
          })
        ])
      )
      .pipe(gulp.dest(config.images.dest))
      .pipe(browserSync.stream());

  const reportFilesizes = () =>
    gulp
      .src(dist('**/*.css'))
      .pipe(
        size({
          showFiles: true,
          showTotal: false
        })
      )
      .pipe(
        size({
          showFiles: true,
          gzip: true,
          showTotal: false
        })
      );

  const watch = () => {
    gulp.watch(config.styles.watch, styles);
    gulp.watch(config.scripts.watch, scripts);
    gulp.watch(config.images.watch, images);

    if (config.watch) {
      config.watch(gulp.watch);
    }
  };

  let buildTasks = [
    ...config.beforeBuild,
    gulp.parallel(styles, scripts, images),
    ...config.afterBuild
  ];

  const setProd = () => {
    log('Setting production flag');
    process.env.NODE_ENV = 'production';
    return Promise.resolve();
  };

  const build = gulp.series(clean, buildTasks, reportFilesizes);

  const dev = gulp.parallel(serve, build, watch);

  return {
    dev,
    build: gulp.series(setProd, build),
    clean,
    scripts,
    styles,
    watch,
    serve
  };
}

