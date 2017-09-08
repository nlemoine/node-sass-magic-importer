# node-sass-glob-importer
[![Build Status](https://travis-ci.org/maoberlehner/node-sass-magic-importer.svg?branch=master)](https://travis-ci.org/maoberlehner/node-sass-magic-importer)
[![GitHub stars](https://img.shields.io/github/stars/maoberlehner/node-sass-magic-importer.svg?style=social&label=Star)](https://github.com/maoberlehner/node-sass-magic-importer)

Custom node-sass importer to which allows you to use glob syntax in imports

Globbing allows pattern matching operators to be used to match multiple files at once.

```scss
// Import all files inside the `scss` directory and subdirectories.
@import: 'scss/**/*.scss';
```

## Usage
```js
var sass = require('node-sass');
var glopImporter = require('node-sass-glob-importer');

sass.render({
  ...
  importer: glopImporter()
  ...
});
```

### CLI
```bash
node-sass --importer node_modules/node-sass-glob-importer/dist/cli.js -o dist src/index.scss
```

## Upgrade from 3.x.x to 5.x.x
It is not possible anymore to set the `includePaths` option when initializing the importer. Use the [node-sass includePaths option](https://github.com/sass/node-sass#includepaths) instead.

## Why is there no 4.x version?
This module is maintained in [one repository](https://github.com/maoberlehner/node-sass-magic-importer) together with multiple other node-sass custom importers. The node-sass-magic-importer repository is using a [monorepo approach](https://medium.com/@maoberlehner/monorepos-in-the-wild-33c6eb246cb9) with fixed versions for all packages. The projects maintained in the node-sass-magic-importer monorepo started out as separate repositories with separate versioning, so when they were integrated into the monorepo, the versions of all projects were raised to 5.0.0 and are in sync since then.

## node-sass-magic-importer
This module is powered by [node-sass-magic-importer](https://github.com/maoberlehner/node-sass-magic-importer).

## About
### Author
Markus Oberlehner  
Website: https://markus.oberlehner.net  
Twitter: https://twitter.com/MaOberlehner  
PayPal.me: https://paypal.me/maoberlehner

### License
MIT