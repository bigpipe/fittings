describe('fittings', function () {
  'use strict';

  process.env.DIAGNOSTICS = 'fittings';

  var Fittings = require('./')
    , assume = require('assume');

  it('is exported as a function', function () {
    assume(Fittings).is.a('function');
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
  });
});
