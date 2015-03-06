'use strict';

var debug = require('diagnostics')('fittings')
  , read = require('fs').readFileSync
  , path = require('path');

/**
 * Small helper function to generate warnings on all the things.
 *
 * @param {String} reason
 * @returns {Function} Configured warning function
 * @api private
 */
function warn(reason) {
  return function warning() {
    debug(reason);
    return '';
  };
}

/**
 * Fittings is the default framework provider for BigPipe.
 *
 * @constructor
 * @api public
 */
function Fittings() {
  /* Checkout http://github.com/bigpipe/bigpipe.js for example usage */
}

/**
 * The directory in which our properties or assets live.
 *
 * @type {String}
 * @private
 */
Fittings.prototype.directory = '';

/**
 * Get one of the properties.
 *
 * @param {String} what Property name that should either be a fn or string.
 * @param {Object} data Data that can be introduced.
 * @return {String}
 * @api public
 */
Fittings.prototype.get = function get(what, data) {
  if (what === 'library') return this.resolve(what);
  return this.evaluate(what, data);
};

/**
 * Attempt to locate the location of a library.
 *
 * @param {String} what Property name that should either be a fn or string.
 * @returns {Array}
 * @api private
 */
Fittings.prototype.resolve = function resolve(what) {
  what = this[what];

  /**
   * As the libraries as run through browserify it makes sense to give them
   * a custom export name. When it's an object we assume that they already
   * follow our required structure. If this is not the case we use the filename
   * as the name it should be exposed under.
   *
   * @param {String|Object} where Either the location of a file or object.
   * @returns {Object}
   * @api private
   */
  function makeitso(where) {
    if ('string' === typeof where) {
      where = {
        expose: path.basename(where).replace(new RegExp(path.extname(where).replace('.', '\\.') +'$'), ''),
        path: where
      };
    }

    return where;
  }

  var type = typeof what;

  if (Array.isArray(what)) return what.map(makeitso);
  if ('function' === type) return what().map(makeitso);
  if ('string' === type && what.charAt(0) === path.sep) return [what].map(makeitso);
  if ('object'=== type) return [what].map(makeitso);

  return [require.resolve(what)].map(makeitso);
};

/**
 * Either evaluate a function or template a string.
 *
 * @param {String} what Property name that should either be a fn or string.
 * @param {Object} data Data that can be introduced.
 * @return {String}
 * @api private
 */
Fittings.prototype.evaluate = function evaluate(what, data) {
  if ('function' === typeof this[what]) return this[what](data);

  what = this[what].replace(/\$/, '\$');

  Object.keys(data).forEach(function each(key) {
    what = what.replace('{fittings:'+ key +'}', function hack() {
      return data[key];
    });
  });

  return what;
};

/**
 * Generate the wrapper around the template.
 *
 * @type {String|Function}
 * @public
 */
Fittings.prototype.template = warn('Missing override for the `.template` property, build is ignoring them.');

/**
 * Generate the wrapper around the plugins.
 *
 * @type {String|Function}
 * @public
 */
Fittings.prototype.plugin = warn('Missing override for the `.plugin` property, build is ignoring them.');

/**
 * The bootstrapper.
 *
 * @type {String|Function}
 * @public
 */
Fittings.prototype.bootstrap = warn('Missing override for the `.bootstrap` property, no startup code included.');

/**
 * The actual chunk of the response that is written for each Pagelet. The
 * current template is compatible with our `bigpipe.js` client code but if you
 * want to use the pagelets as a stand alone template/view you might want to
 * change this to a simple string.
 *
 * @type {String|Function}
 * @public
 */
Fittings.prototype.fragment = warn('Missing override for the `.fragment` property, html can\'t be rendered.');

/**
 * The location of the client side libraries that should be included. Can either
 * be a string, array or a function which returns an array or string.
 *
 * @type {String|Array}
 * @public
 */
Fittings.prototype.library = [];

/**
 * Extend the library, if needed.
 *
 * @type {Function}
 * @api public
 */
Fittings.extend = require('extendible');

/**
 * Expose the Fittings on the exports and parse our the directory. This ensures
 * that we can properly resolve all relative properties:
 *
 * ```js
 * Fittings.extend({
 *   ..
 * }).on(module);
 * ```
 *
 * The use of this function is for convenience and optional. Developers can
 * choose to provide absolute paths to files.
 *
 * @param {Module} module The reference to the module object.
 * @returns {Pagelet}
 * @api public
 */
Fittings.on = function on(module) {
  this.prototype.directory = path.dirname(module.filename);
  return module.exports = this;
};

//
// Expose our default fittings.
//
module.exports = Fittings;
