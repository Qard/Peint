// util
// ----

// This module provides convenient utilities. For the most part
// these helpers are all just used internally.
Peint.define('util', function (require, exports) {
  var Klass = require('klass')

  // We don't specifically depend on jQuery, but we do need some
  // jQuery-like functionality for selection, so find or polyfill.
  var $ = window.jQuery || window.Zepto || function (i, f, s) {
    f = i[0], s = i.substr(1)
    return document['getElement' + ({ '#': 'ById', '.': 'sByClassName' }[f] || 'sByTagName')]({ '#': s, '.': s }[f] || i)
  }

  // First, lets expose the more basic parts.
  exports.Klass = Klass
  exports.$ = $
  exports._ = _
  _.extend(exports, _)

  // This is a wildcard-to-regex builder. It's used in the events
  // module to support wildcard fragments. Supports;
  // 
  //     plain text    mouse:over
  //     wildcard      mouse:*
  //     regex         /mouse:\S*/
  exports.wildcardify = function (reg) {
    if (typeof reg === 'string') {
      reg = new RegExp('^' + reg.replace(/\*/g, '[a-z0-9]*') + '$', 'i')
    }
    return reg
  }

  // This handles the display object stacks in canvas and group objects.
  // Really it's just a thin layer around Array for sorting.
  function Stack () {
    Array.apply(this, arguments)
  }
  Stack.prototype = new Array
  exports.Stack = Stack

  // You can move the position of an item before another.
  Stack.prototype.move = function (a, b) {
    if (b >= this.length) {
      var k = b - this.length
      while ((k--) + 1) this.push(undefined)
    }
    this.splice(b, 0, this.splice(a, 1)[0])
    return this
  }

  // Or you can move items up and down the stack.
  Stack.prototype.up = function (item) {
    var index = this.indexOf(item)
    !!~index && this.move(index, index-1)
    return this
  }

  Stack.prototype.down = function (item) {
    var index = this.indexOf(item)
    !!~index && this.move(index, index+1)
    return this
  }

  // You can also move items straight to the top or bottom of the stack.
  Stack.prototype.top = function (item) {
    var index = this.indexOf(item)
    if (!!~index) {
      this.splice(this.indexOf(item), 1)
      this.push(item)
    }
    return this
  }

  Stack.prototype.bottom = function (item) {
    var index = this.indexOf(item)
    if (!!~index) {
      this.splice(this.indexOf(item), 1)
      this.unshift(item)
    }
    return this
  }

  // Or even empty it.
  Stack.prototype.empty = function () {
    this.splice(0, this.length)
    return this
  }

  // This is a handy utility for animating a property of a hash.
  // Unlike most animation systems, this is not tried to the dom,
  // so it works great for animating any type of property.
  function Animate (obj, prop, opts) {
    var self = this

    this.obj = obj
    this.prop = prop
    this.from = obj[prop]

    _.extend(this, opts)
    this.animDiff = this.to - this.from

    this.then = new Date()
    this.timer = setInterval(function() {
      self.step.call(self)
    }, 4)
  }

  // We this we can set the value of the animated property. This is
  // used internally to ensure perfectly completed animation, rather
  // than potentially hitting a fractional remainder and failing.
  Animate.prototype.set = function (val) {
    this.obj[this.prop] = val
  }

  // Here we make an animation step. This function is called at high
  // frequency to ensure smooth interpolation, and will calculate the
  // time difference between steps compared to the total duration to
  // smoothly adjust the value toward the final point.
  Animate.prototype.step = function() {
    this.now = new Date()
    this.diff = this.now - this.then

    if (this.diff > this.time) {
      this.set(this.to)
      this.obj[this.prop] = this.to
      this.callback && this.callback.call(this)
      clearInterval(this.timer)
      return
    }

    this.set((this.animDiff * (
      Math.floor((this.diff / this.time) * 100) / 100
    )) + this.from)
  }

  // This helper is provided as both a class and an instance factory.
  exports.Animate = Animate
  exports.animate = function (el, prop, opts) {
    return new Animate(el, prop, opts)
  }

  // These helpers are used to translate mouse and touch events
  // to useable touch points and lists.
  exports.TouchPoint = function (e) {
    return _.isArray(e) ? e : [e.pageX, e.pageY]
  }

  exports.TouchList = function (e) {
    return _.isArray(e) ? e : [e].concat(e.touches || [])
  }

  // This creates transformed touch events using a supplied context.
  exports.MouseEvent = function (e, ctx) {
    return _(exports.TouchList(e)).map(function (e) {
      e = exports.TouchPoint(e)
      return [ e[0] - ctx.left, e[1] - ctx.top ]
    })
  }
});