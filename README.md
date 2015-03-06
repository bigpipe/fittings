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
- An object, which should have a `path` and `expose` property.
- When it's a string that starts with `require('path').sep`, it assumes it's the
  absolute path to a library that needs to be included and automatically wraps
  it in an array.
- Last case, it will attempt to the module systems module resolving method
  (`require.resolve`) on the string to get the absolute path for the given
  module.

#### fittings.template

The template should contain a small template which introduces the templates that
is shared between client and server. This template receives 2 tags:

- `{fittings:name}` Which is the name or md5 hash of library. This name is
  already wrapped in quotes so it's save to use as property in objects.
- `{fittings:client}` which contains the template function that needs to be
  added.

An example implementation could be:

```js
mylibrary.register({fittings:name}, {fittings:client});
```

Which would result in to something like:

```js
mylibrary.register("0f8bf99b55994d676634fae81fff2405", function (data) {
  with (data) return '<div>your '+ name +'</div>';
});
```

#### fittings.plugins

Kinda the same as the template, but instead of introducing templates you're
adding new plugins. Just like the template it has `name` and `client` template
key.

#### fittings.bootstrap

The bootstrap property allows you to provide a small bootstrap template which
will be included by the [bootstrap-pagelet][bootstrap]. This template receives
all the information of the bootstrap pagelet so you can pass the amount pagelets
the page expects to flush out etc.

```html
<script>
var BigPipe = require('bigpipe')
  , pipe;

pipe = new BigPipe(undefined, { pagelets: {fittings:length}, id: '{fittings:id}' });
</script>
```

Please see [fittings.library](#fittingslibrary) on how to use `require` to
access your supplied libraries.

#### fittings.fragment

The actual fragment that is written to the page when a pagelet is rendered.

This is the actual HTML fragment that is written to the page once a pagelet is
rendering. It has the following template tags available:

- `{fittings:template}` The HTML string that the pagelet generated. It has all
  it's HTML comments removed so it should be save be added within a HTML comment
  if needed.
- `{fittings:name}` The name of pagelet that is flushing it's output.
- `{fittings:id}` The unique id of this pagelet.
- `{fittings:data}` Additional state and data that the pagelet has generated
  which should be synced to the client. See the pagelet's internal render method
  for all JSON it's returning.
- `{fittings:state}` The state that needs to be synced from server to client.

An example template could be:

```html
<script type="pagelet/html" name={fittings:name} id={fittings:id}>
  {fittings:template}
</script>
<script>render({fittings:data}, {fittings:state});</script>
```

#### fittings.library

The location of the client side libraries that should be included. As you might
have read in the [processing](#processing) section, there are many ways of
specifying the location of the libraries. The specified libraries will be passed
in to Browserify by default. If you've set an object it will use the `expose`
property to "register" it in the require method. If you passed it a full string
it will use the file name as module name. This allows you to require the library
on the client side and initialize it anyway you want it.

```js
Fittings.extend({
  library: require('path').join(__dirname, 'file.extension'),
  library: [require.resolve('module-name')],
  library: {
    path: require('path').join(__dirname, 'lib', 'whatever.extension'),
    expose: 'woop'
  }
});
```

## License

MIT

[bigpipe.js]: https://github.com/bigpipe/bigpipe.js
[bootstrap]: https://github.com/bigpipe/bootstrap-pagelet
