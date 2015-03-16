'use strict';

var debug = require('diagnostics')('fittings')
  , replaces = require('replaces')
  , destroy = require('demolish')
  , Ultron = require('ultron')
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
 * @param {BigPipe} bigpipe
 * @api public
 */
function Fittings(bigpipe) {
  if (!this.name) throw new Error('The fittings.name property is required.');

  this.ultron = new Ultron(bigpipe);
  this.bigpipe = bigpipe;

  this.setup();
}

/**
 * The directory in which our properties or assets live.
 *
 * @type {String}
 * @private
 */
Fittings.prototype.directory = '';

/**
 * Assign all our custom hooks in to the BigPipe framework.
 *
 * @api private
 */
Fittings.prototype.setup = function setup() {
  var middleware = this.get('middleware')
    , plugins = this.get('use')
    , events = this.get('on');

  //
  // Introduce the middleware layers that we've added.
  //
  Object.keys(middleware).forEach(function each(name) {
    this.middleware.use(name, middleware[name]);
  }, this.bigpipe);

  //
  // Adding all the plugins.
  //
  Object.keys(plugins).forEach(function each(name) {
    this.use(name, plugins[name]);
  }, this.bigpipe);

  //
  // And listen to all the events.
  //
  Object.keys(events).forEach(function each(name) {
    this.on(name, events[name]);
  }, this.ultron);

  if ('function' === typeof this.initialize) {
    this.initialize(this.bigpipe);
  }
};

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
  what = this[what] || what;

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
  if ('function' === type) return resolve.call(this, what.call(this));
  if ('string' === type && what.charAt(0) === path.sep) return [what].map(makeitso);
  if ('object'=== type) return [what].map(makeitso);

  return [require.resolve(what)].map(makeitso);
};

/**
 * The Regular Expression that is used process the content. It's name spaced to
 * fittings by default and supports various of escaping styles.
 *
 * @type {RegExp}
 * @api public
 */
Fittings.prototype.tag = /{fittings(\W+)([^}]+?)}/g;

/**
 * Either evaluate a function or template a string.
 *
 * @param {String} what Property name that should either be a fn or string.
 * @param {Object} data Data that can be introduced.
 * @return {String|Object}
 * @api private
 */
Fittings.prototype.evaluate = function evaluate(what, data) {
  var type = typeof this[what];
  data = data || {};

  if ('function' === type) return this[what].call(this, data);
  if ('object' === type) return this[what];

  return replaces(this[what], this.tag, data);
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
 * The various of middleware layers that need to be loaded in to the server.
 *
 * @type {Object}
 * @public
 */
Fittings.prototype.middleware = {};

/**
 * The plugins that need to be executed on the server/client.
 *
 * @type {Object}
 * @public
 */
Fittings.prototype.use = {};

/**
 * EventEmitters.
 *
 * @type {Object}
 * @public
 */
Fittings.prototype.on = {};

/**
 * Completely destroy the fittings instance and remove all of it's added
 * resources from the server (where possible).
 *
 * @api public
 */
Fittings.prototype.destroy = destroy('ultron', {
  before: function before() {
    var middleware = this.get('middleware');

    //
    // Manually remove the middleware, we cannot remove plugins as there is no
    // API for it and no way to "un-evaluate" the server side executed parts of
    // it.
    //
    Object.keys(middleware).forEach(function (name) {
      this.middleware.remove(name);
    }, this.bigpipe);

    //
    // Also manually nuke the `bigpipe` property or `demolish` with call the
    // destroy method on `bigpipe` causing you to also completely destroy the
    // server when you switch frameworks.
    //
    this.bigpipe = null;
  }
});

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
