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
const data = require('gulp-data');
const twig = require('gulp-twig');
const yaml = require('js-yaml');
const glob = require('glob');
const plumber = require('gulp-plumber');
const sourcemaps = require('gulp-sourcemaps');
const gulpIf = require('gulp-if');

const { rollup } = require('rollup');
const rollupConfig = require('./rollup.config');

const postcssConfig = require('./postcss.config');

const { cwd } = process;

const DIST_DIR = 'dist';
const SOURCE_DIR = 'src';

const dist = (parts = '') => path.resolve(cwd(), DIST_DIR, parts);
const src = (parts) => path.resolve(cwd(), SOURCE_DIR, parts);

const defaultOptions = {
  clean: dist(),
  styles: {
    src: src('scss/*.scss'),
    watch: src('scss/**/*.scss'),
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
  data: {
    src: src('data/**/*.yml'),
    watch: src('data/**/*.yml'),
    parser: yaml
  },
  twig: {
    src: src('twig/**/*.twig'),
    watch: src('twig/**/*.twig'),
    dest: dist(),
    parser: twig,
    parserOptions: {
      base: src('twig'),
      filters: []
    }
  },
  postcssPlugins: [],
  afterBuild: [],
  beforeBuild: []
};

const log = (...args) => console.info(...args);
const errorHandler = function (err) {
  log(`Gulp error in ${err.plugin}
    ---
    ${err.toString()}
  `);
  this.emit('end');
};

const parseData = (dataPaths) => {
  const files = glob.sync(dataPaths);

  const contents = files.map((path) => fs.readFileSync(path, 'utf8'));

  const parsedYaml = contents.map((content) => yaml.safeLoad(content));

  const data = parsedYaml.reduce((obj, data) => {
    return {
      ...obj,
      ...data
    };
  }, {});

  return data;
};

function createConfig(options = {}) {
  const config = merge({}, defaultOptions, options);

  const PROD = process.env.NODE_ENV === 'production';

  const clean = () => del(config.clean);

  const serve = () => browserSync.init(config.browserSyncOptions);

  const styles = () => {
    return gulp
      .src(config.styles.src, {
        allowEmpty: true
      })
      .pipe(gulpIf(!PROD, sourcemaps.init()))
      .pipe(sass().on('error', sass.logError))
      .pipe(postcss(postcssConfig))
      .pipe(gulpIf(!PROD, sourcemaps.write('./')))
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
          sourcemap: !PROD
        })
      )
      .then(() => {
        browserSync.stream();
      });
  };

  const images = () => {
    return gulp
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
  };

  const html = () => {
    return gulp
      .src(config.twig.src)
      .pipe(
        plumber({
          errorHandler
        })
      )
      .pipe(data(parseData(config.data.src)))
      .pipe(config.twig.parser(config.twig.parserOptions))
      .pipe(gulp.dest(config.twig.dest))
      .pipe(browserSync.stream());
  };

  const reportFilesizes = () => {
    return gulp
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
  };

  const watch = () => {
    gulp.watch(config.styles.watch, styles);
    gulp.watch(config.scripts.watch, scripts);
    gulp.watch(config.images.watch, images);
    gulp.watch(config.twig.watch, html);

    if (config.data) {
      gulp.watch(config.data.watch, html);
    }

    if (config.watch) {
      config.watch(gulp.watch);
    }
  };

  const buildTasks = gulp.series([
    ...config.beforeBuild,
    gulp.parallel(html, styles, scripts, images),
    ...config.afterBuild
  ]);

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

module.exports = { createConfig };
