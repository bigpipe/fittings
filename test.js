describe('fittings', function () {
  'use strict';

  process.env.DIAGNOSTICS = 'fittings';

  var Fittings
    , Framework = require('./')
    , assume = require('assume');

  //
  // All Fitting instances require a `name` attribute. Instead of adding it to
  // each test, we just pre-define it on our customized fittings instance.
  //
  Fittings = Framework.extend({
    name: 'fixture'
  });

  it('is exported as a function', function () {
    assume(Fittings).is.a('function');
  });

  it('requires a name', function () {
    var y = Fittings.extend({ woop: 'woop' });

    assume(y).throws('name');
  });

  it('calls an optional initialize method', function (next) {
    var XYZ = Fittings.extend({
      initialize: function (thing) {
        assume(this).instanceOf(XYZ);
        assume(thing).equals('wut');

        next();
      }
    });

    var xyz = new XYZ('wut');
  });

  it('writes to stdout when calling a method that is not overrided', function (next) {
    var write = process.stdout.write;

    process.stdout.write = function (data) {
      process.stdout.write = write;

      assume(data).includes('Missing override');
      assume(data).includes('`.template`');

      next();
    };

    var framework = new Fittings();

    framework.get('library');
    framework.get('template');
  });

  describe("#get", function () {
    it('returns an array for library', function () {
      var Framework = Fittings.extend({
        library: require.resolve('./test.js')
      }), f = new Framework();

      assume(f.get('library')).is.a('array');
      assume(f.get('library')).has.length(1);
    });

    it('attempts to resolve the library if its not an absolute path', function () {
      var Framework = Fittings.extend({
        library: './test.js'
      }), f = new Framework();

      assume(f.get('library')).has.length(1);
      assume(f.get('library')[0]).deep.equals({
        path: require.resolve('./test.js'),
        expose: 'test'
      });
    });

    it('executes the library function', function () {
      var Framework = Fittings.extend({
        library: function () {
          return ['1'];
        }
      }), f = new Framework();

      assume(f.get('library')[0]).deep.equals({
        path: '1',
        expose: '1'
      });
    });

    it('leaves arrays alone for now', function () {
      var Framework = Fittings.extend({
        library: ['./test.js']
      }), f = new Framework();

      assume(f.get('library')).has.length(1);
      assume(f.get('library')[0]).deep.equals({
        path: './test.js',
        expose: 'test'
      });
    });

    it('accepts objects', function () {
      var Framework = Fittings.extend({
        library: { path: './test.js', expose: 'moo' }
      }), f = new Framework();

      assume(f.get('library')).has.length(1);
      assume(f.get('library')[0]).deep.equals({
        path: './test.js',
        expose: 'moo'
      });
    });

    it('will replace {fittings:tags}', function () {
      /* istanbul ignore next */
      function woop(){ console.log('lol'); }

      var Framework = Fittings.extend({
        library: ['./test.js'],
        template: 'global[{fittings:hash}] = {fittings:client};'
      }), f = new Framework()
      , data = { hash: '"moo"', client: woop.toString() };

      assume(f.get('template', data)).equals('global["moo"] = '+ woop.toString() +';');
    });

    it('will replace multiple occurrences', function () {
      /* istanbul ignore next */
      function woop(){ console.log('lol'); }

      var Framework = Fittings.extend({
        template: '{fittings:hash} {fittings:hash}'
      }), f = new Framework()
      , data = { hash: '"moo"' };

      assume(f.get('template', data)).equals('"moo" "moo"');
    });

    it('assumes that functions replace stuff them selfs', function () {
      var Framework = Fittings.extend({
        library: ['./test.js'],
        template: function (dataset) {
          assume(dataset).deep.equals(data);
          return 'foo';
        }
      }), f = new Framework()
      , data = { what: 'ever', data: 'you', want: 'here' };

      assume(f.get('template', data)).equals('foo');
    });

    it('leaves $ signs alone', function () {
      /* istanbul ignore next */
      function example() {
        if (!('$' in global)) return;

        console.log($);
      }

      var Framework = Fittings.extend({
        library: ['./test.js'],
        template: 'global[{fittings:hash}] = {fittings:client};'
      }), f = new Framework()
      , data = { hash: '"moo"', client: example.toString() };

      assume(f.get('template', data)).includes("'$'");
    });

    it('executes the set functions with context set to fittings', function (next) {
      var Framework = Fittings.extend({
        library: function () {
          assume(this).equals(f);
          next();

          return __filename;
        },
        template: function (dataset) {
          assume(this).equals(f);

          return f.get('library')[0].expose;
        }
      }), f = new Framework();

      assume(f.get('template')).equals('test');
    });
  });

  describe('.template', function () {
    it('returns a string', function () {
      var Framework = Fittings.extend({
        template: 'woop'
      }), f = new Framework();

      assume(f.get('template')).is.a('string');
      assume(f.get('template')).equals('woop');
    });
  });

  describe('.plugin', function () {
    it('returns a string', function () {
      var Framework = Fittings.extend({
        plugin: 'woop'
      }), f = new Framework();

      assume(f.get('plugin')).is.a('string');
      assume(f.get('plugin')).equals('woop');
    });
  });

  describe('.bootstrap', function () {
    it('returns a string', function () {
      var Framework = Fittings.extend({
        bootstrap: 'woop'
      }), f = new Framework();

      assume(f.get('bootstrap')).is.a('string');
      assume(f.get('bootstrap')).equals('woop');
    });
  });

  describe('.fragment', function () {
    it('returns a string', function () {
      var Framework = Fittings.extend({
        fragment: 'woop'
      }), f = new Framework();

      assume(f.get('fragment')).is.a('string');
      assume(f.get('fragment')).equals('woop');
    });
  });

  describe('.library', function () {
    it('returns an array', function () {
      var Framework = Fittings.extend({
        library: function () { return []; }
      }), f = new Framework();

      assume(f.get('library')).is.a('array');
    });
  });

  describe('.middleware', function () {
    it('returns an object for functions', function () {
      var Framework = Fittings.extend({
        middleware: function () { return {}; }
      }), f = new Framework();

      assume(f.get('middleware')).is.a('object');
    });

    it('returns an object', function () {
      var Framework = Fittings.extend({
        middleware: {}
      }), f = new Framework();

      assume(f.get('middleware')).is.a('object');
    });
  });

  describe('.use', function () {
    it('returns an object for functions', function () {
      var Framework = Fittings.extend({
        use: function () { return {}; }
      }), f = new Framework();

      assume(f.get('use')).is.a('object');
    });

    it('returns an object', function () {
      var Framework = Fittings.extend({
        use: {}
      }), f = new Framework();

      assume(f.get('use')).is.a('object');
    });
  });

  describe('integration', function () {
    var port = 2024
      , app;

    this.timeout(30000);

    beforeEach(function (next) {
      app = require('bigpipe').createServer({
        dist: '/tmp/dist',
        port: port++,
      });

      app.once('listening', next);
      app.once('error', next);
    });

    afterEach(function () {
      app.destroy();
    });

    it('automatically adds the set middleware', function () {
      /* istanbul ignore next */
      function middleware(req, res, next) {
        next();
      }

      var Framework = Fittings.extend({
        middleware: {
          foo: middleware
        }
      });

      assume(app.middleware.indexOf('foo')).equals(-1);
      assume(app.framework(Framework)).equals(app);
      assume(app._framework).is.instanceOf(Framework);
      assume(app.middleware.indexOf('foo')).does.not.equal(-1);
    });

    it('automatically adds the set plugin', function (next) {
      var Framework = Fittings.extend({
        use: {
          hello: {
            server: function (server) {
              assume(app).equals(server);
              next();
            }
          }
        }
      });

      assume(app.framework(Framework)).equals(app);
    });

    it('automatically adds the specified event listeners', function (next) {
      var Framework = Fittings.extend({
        on: {
          woop: function woop(wat) {
            assume(wat).equals('hi');
            assume(this).equals(app);

            next();
          }
        }
      });

      assume(app.framework(Framework)).equals(app);
      app.emit('woop', 'hi');
    });
  });

  describe('#on', function () {
    it('exposes the `on` method', function () {
      assume(Fittings.on).is.a('function');
    });

    it('assigns custom Fittings to module.exports', function () {
      var x = module.exports
        , Y = Fittings.extend({ woop: 'woop' });

      assume(Y.on(module)).equals(Y);
      assume(module.exports).equals(Y);

      module.exports = x;
    });
  });
});
