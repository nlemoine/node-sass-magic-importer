'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = _interopDefault(require('path'));
var GlobImporter = _interopDefault(require('node-sass-glob-importer/dist/GlobImporter.js'));
var PackageImporter = _interopDefault(require('node-sass-package-importer/dist/PackageImporter.js'));
var SelectorImporter = _interopDefault(require('node-sass-selector-importer/dist/SelectorImporter.js'));
var fs = _interopDefault(require('fs'));
var uniqueConcat = _interopDefault(require('unique-concat'));

/**
 * Selector specific imports, module importing,
 * globbing support, import files only once.
 */
var MagicImporter = function MagicImporter(options) {
  if ( options === void 0 ) options = {};

  var defaultOptions = {
    includePaths: [process.cwd()]
  };
  /** @type {Object} */
  this.options = Object.assign({}, defaultOptions, options);
  /** @type {Object} */
  this.onceStore = {};
};

/**
 * Find the absolute URL for a given relative URL.
 * @param {string} url - Import url from node-sass.
 * @return {string} Absolute import url.
 */
MagicImporter.prototype.getAbsoluteUrl = function getAbsoluteUrl (url) {
  var absoluteUrl = url;
  if (!path.isAbsolute(url)) {
    this.options.includePaths.some(function (includePath) {
      try {
        absoluteUrl = path.normalize(path.join(includePath, absoluteUrl));
        return fs.statSync(absoluteUrl).isFile();
      } catch (e) {}
      return false;
    });
  }
  return absoluteUrl;
};

/**
 * Store the given URL and selector filters
 * and determine if the URL should be imported.
 * @param {string} url - Import url from node-sass.
 * @param {Array} selectorFilters - CSS selectors and replacement selectors.
 * @return {boolean|Object} - Absolute URL and selector filters or false.
 */
MagicImporter.prototype.store = function store (url, selectorFilters) {
    var this$1 = this;
    if ( selectorFilters === void 0 ) selectorFilters = null;

  var absoluteUrl = this.getAbsoluteUrl(url);

  // URL is not in store: store and load the URL.
  if (this.onceStore[absoluteUrl] === undefined) {
    this.onceStore[absoluteUrl] = selectorFilters;
    return { url: absoluteUrl, selectorFilters: selectorFilters };
  }

  // URL is in store without filters, filters given: load the URL.
  if (this.onceStore[absoluteUrl] === null && selectorFilters) {
    // eslint-disable-next-line no-console
    console.warn(("Warning: double import of file \"" + url + "\""));
    return { url: absoluteUrl, selectorFilters: selectorFilters };
  }

  // URL and filters in store, URL without filters given:
  // load and remove filters from store.
  if (this.onceStore[absoluteUrl] && !selectorFilters) {
    // eslint-disable-next-line no-console
    console.warn(("Warning: double import of file \"" + url + "\""));
    this.onceStore[absoluteUrl] = null;
    return { url: absoluteUrl, selectorFilters: selectorFilters };
  }

  // URL and filters in store, URL with same and other filters given:
  // only load other filters that not already are stored.
  if (this.onceStore[absoluteUrl] && selectorFilters) {
    var concatSelectorFilters = uniqueConcat(
      this.onceStore[absoluteUrl],
      selectorFilters
    );
    // If stored and given selector filters are identically, do not load.
    if (JSON.stringify(concatSelectorFilters) !== JSON.stringify(this.onceStore[absoluteUrl])) {
      var selectorFiltersDiff = selectorFilters.filter(function (x) { return !this$1.onceStore[absoluteUrl].some(function (y) { return JSON.stringify(x) === JSON.stringify(y); }); }
      );
      this.onceStore[absoluteUrl] = concatSelectorFilters;
      return { url: absoluteUrl, selectorFilters: selectorFiltersDiff };
    }
  }
  return false;
};

/**
 * Synchronously resolve the path to a node-sass import url.
 * @param {string} url - Import url from node-sass.
 * @return {string} Fully resolved import url or null.
 */
MagicImporter.prototype.resolveSync = function resolveSync (url) {
  var data = null;
  var resolvedUrl = url;

  // Try to resolve glob pattern url.
  var globImporter = new GlobImporter();
  var globFiles = globImporter.resolveSync(url, this.options.includePaths);
  if (globFiles) {
    return { contents: globFiles.map(function (x) { return ("@import '" + x + "';"); }).join('\n') };
  }

  // Parse url to eventually extract selector filters.
  var selectorImporter = new SelectorImporter();
  selectorImporter.options.includePaths = this.options.includePaths;
  var urlData = selectorImporter.parseUrl(resolvedUrl);
  resolvedUrl = urlData.url;
  var selectorFilters = urlData.selectorFilters;

  // Try to resolve a module url.
  var packageImporter = new PackageImporter();
  var packageFile = packageImporter.resolveSync(resolvedUrl);
  if (packageFile) {
    resolvedUrl = packageFile;
    data = { file: resolvedUrl };
  }

  var storedData = this.store(resolvedUrl, selectorFilters);

  if (!storedData) {
    return {
      file: '',
      contents: ''
    };
  }

  resolvedUrl = storedData.url;
  selectorFilters = storedData.selectorFilters;

  // Filter selectors.
  var filteredContents = selectorImporter.extractSelectors(resolvedUrl, selectorFilters);
  if (filteredContents) {
    data = { contents: filteredContents };
  }

  return data;
};

/**
 * Asynchronously resolve the path to a node-sass import url.
 * @param {string} url - Import url from node-sass.
 * @return {Promise} Promise for a fully resolved import url.
 */
MagicImporter.prototype.resolve = function resolve (url) {
    var this$1 = this;

  return new Promise(function (promiseResolve) {
    promiseResolve(this$1.resolveSync(url));
  });
};

var magicImporter = new MagicImporter();
/**
 * Magic importer for node-sass
 * @param {string} url - The path in import as-is, which LibSass encountered.
 * @param {string} prev - The previously resolved path.
 * @param {Function} done - A callback function to invoke on async completion.
 */
function index (url, prev, done) {
  // Create an array of include paths to search for files.
  var includePaths = [];
  if (path.isAbsolute(prev)) {
    includePaths.push(path.dirname(prev));
  }
  magicImporter.options.includePaths = includePaths
    .concat(this.options.includePaths.split(path.delimiter));

  // Merge default with custom options.
  if (this.options.magicImporter) {
    Object.assign(magicImporter.options, this.options.magicImporter);
  }
  magicImporter.resolve(url).then(function (data) { return done(data); });
}

module.exports = index;