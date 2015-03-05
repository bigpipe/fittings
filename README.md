# fittings

[![From bigpipe.io][from]](http://bigpipe.io)[![Version npm][version]](http://browsenpm.org/package/fittings)[![Build Status][build]](https://travis-ci.org/bigpipe/fittings)[![Dependencies][david]](https://david-dm.org/bigpipe/fittings)[![Coverage Status][cover]](https://coveralls.io/r/bigpipe/fittings?branch=master)

[from]: https://img.shields.io/badge/from-bigpipe.io-9d8dff.svg?style=flat-square
[version]: http://img.shields.io/npm/v/fittings.svg?style=flat-square
[build]: http://img.shields.io/travis/bigpipe/fittings/master.svg?style=flat-square
[david]: https://img.shields.io/david/bigpipe/fittings.svg?style=flat-square
[cover]: http://img.shields.io/coveralls/bigpipe/fittings/master.svg?style=flat-square

Fittings allows you to easily fit different client-side frameworks in to
BigPipe. It allows you to control:

- Which frameworks/libraries should be loaded in on every page.
- How the client/server-side shared templates should be exported and exposed on
  the client.
- Initialize the client-side plugins.
- Bootstrap the loading of the page.
- Control the structure of the HTML fragments that are written.

## Install

This module is intended for server-side usage and is released in the public npm
registry. It can be installed by running the following command on the CLI:

```
npm install --save fittings
```

## Usage

```js
var Fittings = require('fittings');

module.exports = Fittings.extend({
  template: 'foo.bar[{fittings:hash}] = {fittings:client};',
});
```

### Processing

The processing engine understands the set properties in two different ways: 

1. When the property is a function it will call the function with an object and
   assumes that it returns a **string** that can be used.
2. If it's a string it will our sophisticated template engine over it which
   replaces all `{fittings:<key>}` with the value of `<key>` and returns the
   newly generated string.

This applies to all properties except the library property as is processed in an
completely different way:

- If it's an Array, assumes that it should be left alone as is.
- If it's a function it will execute it and assumes it returns an Array.
- When it's a string that starts with `require('path').sep`, it assumes it's the
  absolute path to a library that needs to be included and automatically wraps
  it in an array.
- Last case, it will attempt to the module systems module resolving method
  (`require.resolve`) on the string to get the absolute path for the given
  module.

#### fittings.template

Wrapper for introducing the client-side template to the framework.

#### fittings.plugins

Wrapper for introducing the client-side plugins to the framework.

#### fittings.bootstrap

Library bootstrapping / initialization step.

#### fittings.fragment

The actual fragment that is written to the page when a pagelet is rendered.

#### fittings.library

The location of the client side libraries that should be included.

## License

MIT

[bigpipe.js]: https://github.com/
