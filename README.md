# Middlebury Gulp Config

> Create gulp configs for static sites (jekyll) or other frontend systems

## Requirements

- Node.js >=14

## Getting started

### 1. Install packages

```bash
# main gulp package is also required as a peer dependency
npm install --save-dev gulp @middlebury/gulp-config
```

### 2. Add gulp config file to root of your project.

```js
// gulpfile.js

const { createConfig } = require('@middlebury/gulp-config');

module.exports = createConfig();
```

### 3. Add scripts

Add the dev and build tasks to your `package.json`.

```json
{
  "scripts": {
    "start": "gulp dev",
    "build": "gulp build"
  }
}
```

> `gulp build` automatically sets `NODE_ENV=production`

## Configuration

The gulp config comes with some standard assets paths by default.

```js
const defaultOptions = {
  clean: './dist',
  // Set up for Sass by default
  styles: {
    src: './src/scss/*.scss',
    watch: './src/scss/**/*.scss',
    dest: './dist/css'
  },
  // Scripts use rollup to bundle into a single file
  // so the destination is a file name, not a folder.
  scripts: {
    src: './src/js/index.js',
    watch: './src/js/**/*.js',
    dest: './dist/js/bundle.js'
  },
  images: {
    src: './src/img/*.{jpg,png,svg}',
    watch: './src/img/*.{jpg,png,svg}',
    dest: './dist/img'
  },
  browserSyncOptions: {
    open: false,
    notify: false,
    server: {
      baseDir: dist()
    },
    ghostMode: false
  },
  afterBuild: [],
  beforeBuild: []
};
```

Pass your own config to `createConfig(myOptions)` and they will be merged with the defaults.

## Jekyll configuration

If you have a jekyll website, you can use a preset gulp config that will run jekyll via command line.

```js
const { createJekyllConfig } = require('@middlebury/gulp-config');

module.exports = createJekyllConfig();
```

The Jekyll config differs slightly like using `_site` as `dist`. See examples directoy how to set up your files.

## Releasing

You'll need to be part of the [@middlebury](https://www.npmjs.com/org/middlebury) npm org to publish.

```bash
npm version <patch|minor|major>
git push --tags
git push
npm publish
```
