describe('fittings', function () {
  'use strict';

  var Fittings = require('./')
    , assume = require('assume');

  it('is exported as a function', function () {
    assume(Fittings).is.a('function');
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

    it('will replace {fittings:tags}', function fn() {
      var Framework = Fittings.extend({
        library: ['./test.js'],
        template: 'global[{fittings:hash}] = {fittings:client};'
      }), f = new Framework()
      , data = { hash: '"moo"', client: fn.toString() };

      assume(f.get('template', data)).equals('global["moo"] = '+ fn.toString() +';');
    });
  });
});
