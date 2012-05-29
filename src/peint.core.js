//     Peint.js 0.0.1
//     (c) 2012 Stephen Belanger, Opzi Inc.
//     Peint may be freely distributed under the MIT license.

// Initial Setup
// -------------
(function () {
  // Peint depends on underscore for much
  // of it's array handling functionality.
  if ( ! this._) {
    throw new Error('Underscore is required')
  }

  // Build the global object
  window.Peint = {}

  // Peint uses CommonJS to manage it's components,
  // making it easily extendable; and making inheritance
  // much easier to manage.
  Peint.modules = {}

  function build (module) {
    var fn = module.fn
    module.exports = {}
    delete module.fn
    fn(Peint.require, module.exports, module)
    return module.exports
  }

  // To use modules, they first must be required
  // 
  //     var Img = Peint.require('image')
  Peint.require = function (id) {
    if ( ! Peint.modules[id]) {
      throw new Error('module ' + id + ' not found')
    }
    return Peint.modules[id].fn
      ? build(Peint.modules[id])
      : Peint.modules[id].exports
  }

  // You can also define your own Peint modules,
  // if you wish to extend the functionality.
  //
  //     Peint.define('event-log', function (require, exports) {
  //       var Events = require('events')
  //       exports.listen = function (obj) {
  //         obj.on('*', function () {
  //           console.log(this.event())
  //         })
  //       }
  //     })
  Peint.define = function (id, fn) {
    if (Peint.modules[id]) {
      throw new Error('module ' + id + ' already defined')
    }
    Peint.modules[id] = { id: id, fn: fn }
  }

  Peint.define.remove = function (id) {
    delete Peint.modules[id]
  }

  // You can also just load all modules into a namespaced object.
  // This may be removed later as modules become more branched.
  // 
  //     var Engine = Peint.all()
  //     var canvas = new Engine.Canvas('#viewport')
  Peint.define('all', function (require, exports) {
    exports.support = require('support')
    exports.Klass = require('klass')
    exports.util = require('util')
    exports.Events = require('events')
    exports.Object = require('object')
    exports.Canvas = require('canvas')
    exports.Rect = require('rect')
    exports.Image = require('image')
    exports.Animation = require('animation')
    exports.Group = require('group')
    exports.Text = require('text')
  })

  Peint.all = function () {
    return Peint.require('all')
  }
}).call(this);