import path from 'node:path';
import fs from 'node:fs';
import merge from 'lodash.merge';
import gulp from 'gulp';
const { series, parallel } = gulp;
import {deleteAsync} from 'del';
import browserSync from 'browser-sync';
import postcss from 'gulp-postcss';
import imagemin, { mozjpeg, optipng, svgo } from 'gulp-imagemin';
import size from 'gulp-size';
import gulpSass from 'gulp-sass';
import nodeSass from 'node-sass';
import data from 'gulp-data';
import gulpTwig from 'gulp-twig';
import yaml from 'js-yaml';
import { glob } from 'glob';
import plumber from 'gulp-plumber';
import sourcemaps from 'gulp-sourcemaps';
import gulpIf from 'gulp-if';

import { rollup } from 'rollup';
import { rollupConfig } from './rollup.config.js';
import { postcssConfig } from './postcss.config.js';

const sass = gulpSass(nodeSass);
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
    env: {},
    parser: yaml
  },
  twig: {
    src: src('twig/**/*.twig'),
    watch: src('twig/**/*.twig'),
    dest: dist(),
    parser: gulpTwig,
    parserOptions: {
      base: src('twig'),
      filters: []
    }
  },
  postcssPlugins: [],
  afterBuild: [],
  beforeBuild: [],
  typescriptBuild: false 
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
  const files = glob.sync(dataPaths.src);

  const contents = files.map((path) => fs.readFileSync(path, 'utf8'));

  const parsedYaml = contents.map((content) => yaml.load(content));
  
  const data = parsedYaml.reduce((obj, data) => {
    return {
      ...obj,
      ...data,
      env: {
        production: process.env.NODE_ENV === 'production',
        ...dataPaths.env
      }
    };
  }, {});
  
  return data;
};

export function createConfig(options = {}) {
  const config = merge({}, defaultOptions, options);

  let PROD = false;

  const clean = () => deleteAsync(config.clean);

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
      .pipe(gulp.dest(config.styles.dest))
      .pipe(browserSync.stream());
  };

  const scripts = () => {
    const { src, dest } = config.scripts;

    if (!fs.existsSync(src)) {
      log(`No js found in ${src}`);
      return Promise.resolve();
    }

    log(`Bundling scripts in ${src} with rollup`);

    return rollup(rollupConfig(src, config.typescriptBuild))
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
          mozjpeg({ progressive: true }),
          optipng({ optimizationLevel: 5 }),
          svgo({ cleanupIDs: false })
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
      .pipe(data(parseData(config.data)))
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

  const setProd = async () => {
    log('Setting production flag');
    process.env.NODE_ENV = 'production';
    PROD = process.env.NODE_ENV === 'production';

    return Promise.resolve();
  };

  const buildTasks = series([
    ...config.beforeBuild,
    parallel(html, styles, scripts, images),
    ...config.afterBuild
  ]);

  const build = series(clean, buildTasks, reportFilesizes);

  const dev = parallel(build, watch, serve);

  return {
    dev,
    build: series(setProd, build),
    clean,
    scripts,
    styles,
    watch,
    serve
  };
}

