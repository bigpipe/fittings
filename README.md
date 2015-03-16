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

## Table of Contents

- [Install](#install)
- [Usage](#usage)
  - [Processing](#processing)
    - [fittings.tag](#fittingstag)
    - [fittings.template](#fittingstemplate)
    - [fittings.plugins](#fittingsplugins)
    - [fittings.bootstrap](#fittingsbootstrap)
    - [fittings.fragment](#fittingsfragment)
    - [fittings.library](#fittingslibrary)
    - [fittings.middleware](#fittingsmiddleware)
    - [fittings.use](#fittingsuse)
    - [fittings.on](#fittingson)
  - [API](#API)
    - [fittings.get](#fittingsget)
- [License](#license)

## Install

This module is intended for server-side usage and is released in the public npm
registry. It can be installed by running the following command on the CLI:

```
npm install --save fittings
```

## Usage

This part of the documentation focuses on implementing, adding a new Framework
for the BigPipe framework. To create your own framework you need to extend the
returned Fittings class as seen in the following example:

```js
var Fittings = require('fittings');

Fittings.extend({
  template: 'foo.bar[{fittings:hash}] = {fittings:client};',
}).on(module);
```

The `.on(module)` automatically registers framework for you on the module so you
don't need add `module.exports = ..` anymore. We also use it to extract the
current directory of your file so we can do relative file lookups etc.

To understand how you can specify the framework you need to know how we process
your instructions and which properties are used by BigPipe and what each
property does.

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

Please do note that when you are using the **function** syntax that these
functions will be called for every single page/pagelet that is processed by
BigPipe. So try to keep these methods as light and fast as possible.

The template tags that we're using should be prefixed with `{fittings:` then the
name of the property you want to add here and finally closing with the `}`
again.

```
{fittings:name}
```

Will output:

```
john
```

If the supplied data object contains `{ name: 'john' }`. We also support extracting deeply nested properties using a dot notation. For example:

```
{fittings:data.array.2.thing}
```

This will says we should get the `data` property, which is an object and we want
it's `array` property. This property contains an array and we want the second
item. The second item is also an object so we want the property `thing` as
content.

The `:` char is a special data modifier instruction the modifier is the first
non word character that follows the fittings prefix. All our template tags are
processed by the [replaces] module which supports a variety of data output
modifiers:

- **`{fittings<>key}`** Make sure that the data we're trying to add to the
  template is save
  to use inside of HTML tags.
- **`{fittings~key}`** Transform the receiving data in to a JSON.stringify
  structure.
- **`{fittings@key}`** Transform the receiving data in to a JSON.stringify
  structure
  **without** crashing on circular references like a normal stringify operation
  would.
- **`{fittings$key}`** Transform the data using the circular JSON parser and
  ensure that every value inside the JSON is encoded using the `<>` modifier.
- **`{fittings%key}`** Escape the data using the `escape` function.
- Any other non `\W` is just ignored and will indicated that the data should
  just be pasted in as normal (like {fittings:key} is).

You can actually change the name and syntax of these placeholders as they are
processed using a regular expression.

#### fittings.tag

This is the regular expression that is used to find the special {fittings:what}
keywords in your templates. If want to use a custom syntax you can change this
regular expression to anything you want as long as it follows the following
restrictions:

- The first capturing group should be a modifier that is supported by the
  [replaces] module.
- The second capturing group is the name of the key or pattern that is used to
  extract the data.

#### fittings.template

The template should contain a small template which introduces the templates that
is shared between client and server. This template receives 2 properties:

- `name` Which is the name or md5 hash of library.
- `client` which contains the template function that needs to be added (already
  a string).

An example implementation could be:

```js
mylibrary.register({fittings~name}, {fittings:client});
```

Which would result in to something like:

```js
mylibrary.register("0f8bf99b55994d676634fae81fff2405", function (data) {
  with (data) return '<div>your '+ name +'</div>';
});
```

#### fittings.plugins

Kinda the same as the `fittings.template`, but instead of introducing templates
you're adding new plugins. Just like the template, it has a `name` and `client`
template key.

#### fittings.bootstrap

The bootstrap property allows you to provide a small bootstrap template which
will be included by the [bootstrap-pagelet][bootstrap] as `bootstrap` property.
This template receives all the information of the bootstrap pagelet so you can
pass the amount pagelets the page expects to flush out etc.

```html
<script>
var BigPipe = require('bigpipe')
  , pipe;

pipe = new BigPipe(undefined, { pagelets: {fittings:length}, id: {fittings~id} });
</script>
```

Please see [fittings.library](#fittingslibrary) on how to use `require` to
access your supplied libraries.

#### fittings.fragment

This is the actual fragment that is written to the page when a pagelet is
rendered.

This is the actual HTML fragment that is written to the page once a pagelet is
rendering. It has the following template tags available:

- `template` The HTML string that the pagelet generated. It has all
  it's HTML comments removed so it should be save be added within a HTML comment
  if needed.
- `name` The name of pagelet that is flushing it's output.
- `id` The unique id of this pagelet.
- `data` Additional data object that the pagelet has generated which should be
  synced to the client. See the Pagelet's internal render method for all various
  of properties that this object contains.
- `state` The state data that needs to be synced from server to client.

An example template could be:

```html
<script type="pagelet/html" name={fittings~name} id={fittings~id}>
  {fittings:template}
</script>
<script>render({fittings$data}, {fittings$state});</script>
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
}).on(module);
```

#### fittings.middleware

Additional middleware layers that need to be added to the BigPipe server. This
should be an object where the key is the name of the middleware layer and the
value is a pre-configured middleware layer.

```js
Fittings.extend({
  middleware: {
    static: require('serve-static')(__dirname)
  }
}).on(module);
```

#### fittings.use

Additional plugins that need to be added to the BigPipe server. This should be
an object where the key is the name of the plugin and the value is the required
plugin:

```js
Fittings.extend({
  use: {
    progress: require('bigpipe-progress')
  }
}).on(module);
```

#### fittings.on

Additional event that we listen on. We assume that this is an object where the
key is name of the event you want listen on and the value is the function that
should be executed for it. This uses the `EventEmitter#on` method internally so
your function will be called for each and every event.

```js
Fittings.extend({
  on: {
    log: function (line) {
      console.log(line);
    }
  }
}).on(module);
```

Please see the BigPipe framework documentation for the events that you can
listen for.

#### fittings.initialize

When you add an initialize function to fittings it will be called once a new
instance of the framework is created. It will receive the supplied BigPipe
instance as argument so you unlimited control.

```js
Fittings.extend({
  initialize: function initialize(bigpipe) {
  }
}).on(module);
```

### API

The library provides a small API for processing all the specified processing
instructions.

#### fittings.get

This method processes the set instructions for the given property name. If it's
a function it will execute it, if it's a string it will replace all the things
etc. The method accepts 2 arguments:

1. `property` The name of the property you want to have processed.
2. `data` Optional data object which will be passed in the processing function
   or used as replacement content for the `{fitting:*}` tags.

```js
var Framework = Fittings.extend({
  template: ..
});

var f = new Framework(bigpipe);
```

## License

MIT

[bigpipe.js]: https://github.com/bigpipe/bigpipe.js
[bootstrap]: https://github.com/bigpipe/bootstrap-pagelet
[replaces]: https://github.com/bigpipe/replaces
