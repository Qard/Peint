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

// klass
// -----

// The Klass module provides a generic, class-based inheritance system.
// It adds several conveniences, including easy superclass access.
Peint.define('klass', function (require, exports, module) {
  var slice = Array.prototype.slice, ext = _.extend
  function ctor () {}

  module.exports = function () {}

  // Here's where the magic happens. We swap out the prototype of
  // a generic constructor, and apply it to the extended class.
  module.exports.extend = function (prt, stat) {
    var supr = this

    // If we have a constructor to extend with, use that.
    // Otherwise, create an empty one to call the superclass.
    var child = (prt && prt.hasOwnProperty('constructor'))
      ? prt.constructor
      : function () { return supr.apply(this, arguments) }

    // Now, we must inherit any static methods. Then we swap
    // and apply the superclass prototype to the extended class.
    ext(child, supr)
    ctor.prototype = supr.prototype
    child.prototype = new ctor()

    // If we have any prototype methods or static methods,
    // now is the time to mix those in.
    prt && ext(child.prototype, prt)
    stat && ext(child, stat)

    // Now ensure the constructor property is correct and
    // provide our supr convenience wrapper.
    // 
    // Functions attached to the superclass prototype can be
    // executed in one of two ways.
    // 
    //     Base.supr(this, 'constructor', 'args')
    //     Base.supr.constructor.call(this, 'args')
    child.prototype.constructor = child
    child.supr = ext(function (self, fn) {
      return child.supr[fn].apply(self, slice.call(arguments, 2))
    }, supr.prototype)

    // Lastly, the callee is attached to the child class to
    // allow for continued extendability.
    child.extend = arguments.callee
    return child
  }
});

// support
// --------------

// The support module provides basic feature detection, shims and polyfills.
Peint.define('support', function (require, exports) {
  exports.canvas = (function (e) {
    return !!(e.getContext && e.getContext('2d'))
  })(document.createElement('canvas'))

  // Unfortunately, requestAnimationFrame is not widely
  // supported yet. We need to provide a shim to
  // ensure an equivalent is always available.
  window.requestAnimFrame = (function () {
    return  window.requestAnimationFrame
      || window.webkitRequestAnimationFrame
      || window.mozRequestAnimationFrame
      || window.oRequestAnimationFrame
      || window.msRequestAnimationFrame
      || function (fn) {
        return window.setTimeout(fn, 1000 / 60)
      }
  })()

  // Just as with requestAnimationFrame, cancelAnimationFrame
  // is also not widely supported. Another shim is needed.
  window.cancelRequestAnimFrame = (function() {
    return window.cancelAnimationFrame
      || window.webkitCancelRequestAnimationFrame
      || window.mozCancelRequestAnimationFrame
      || window.oCancelRequestAnimationFrame
      || window.msCancelRequestAnimationFrame
      || clearTimeout
  })()
})

// events
// ------

// The events module provides a lightweight, regex-supported event system.
// All major components extend from this module to provide easy propagation
// of events like clicks or touches, mouse over or out and internal events
// such as change and render events.
Peint.define('events', function (require, exports, module) {
  var util = require('util')

  // First off, we should build an event list unique to this object.
  module.exports = util.Klass.extend({
    constructor: function () {
      this.events = []
    }

    // Using `on` we can add events to the event list.
    // These can be matched in several different ways;
    // 
    //     plain text    mouse:over
    //     wildcard      mouse:*
    //     regex         /mouse:\S*/
    , on: function (id, fn) {
      this.events.push({
        id: util.wildcardify(id)
        , fn: fn
      })
      return this
    }

    // Using `emit` we can emit an event to all matching
    // listeners. All arguments after the first are passed
    // through to the executed listener.
    , emit: function (i) {
      var args = Array.prototype.slice.call(arguments, 1)
        , self = this
      _.chain(this.events)
        .filter(function (e) { return e.id.test(i) })
        .each(function (e) {
          // Using `this.event` you can get information about
          // the running event that called the listener.
          // This is particularly useful in situations where
          // a listener receives similarly handled events,
          // but needs to distinguish between them.
          self.event = function () {
            return {
              trigger: i
              , match: e
              , arguments: args
            }
          }
          e.fn.apply(self, args)
        })
      return this
    }
  })
});

// object
// ------

// This module provides basic display object functionality.
// All display objects extend from this class at some level.
// Even the canvas is handled as a display object; the viewport.
Peint.define('object', function (require, exports, module) {
  var Events = require('events')
    , util = require('util')

  // All display objects provide event interfaces,
  // which are inherited here.
  var Obj = module.exports = Events.extend({
    constructor: function (opt) {
      Obj.supr(this, 'constructor')

      // All objects are assigned some sane defaults
      // which can be adjusted to manage placement.
      this.attrs = {
        left: 0
        , top: 0
        , width: 0
        , height: 0
        , sliceX: 0
        , sliceY: 0
        , sliceWidth: 0
        , sliceHeight: 0
        , xorigin: 'left'
        , yorigin: 'top'
      }
      this.set(opt || {}, { silent: true })
    }

    // Using `clone` you can created an identical clone of an object.
    // You can also pass in a hash of extra properties to apply to
    // the newly created clone during construction.
    , clone: function (obj) {
      var desc = _.extend({}, this.attrs, obj || {})
      return new Obj.supr(this, 'constructor', desc)
    }

    // This is a simplified wrapper around `util.animate` for
    // animating positioning properties of the current object.
    , animate: function (prop, opt) {
      var self = this
      var obj = _.extend({
        set: function (val) {
          var data = {}
          data[prop] = val
          self.set(data)
        }
      }, opt)
      return util.animate(this.attrs, prop, obj)
    }

    // You should always use `set` when changing properties
    // of display objects that will require re-rendering.
    // This function handle applying those properties to the
    // `this.attrs` hash and emitting the change event.
    // 
    // The change event can be silenced by providing
    // { silent: true } as the second argument.
    , set: function (attrs, opts) {
      _.extend(this.attrs, attrs)
      ;(opts && opts.silent) || this.emit('change')
    }

    // Get is a convenient function to get individual named
    // properties or the entire `this.attrs` hash.
    , get: function (attr) {
      return attr ? this.attrs[attr] : this.attrs
    }

    // You can use `isIntersecting` to detect collisions with
    // this object. It is used internally to propagate mouse events.
    , isIntersecting: function (obj) {
      var a = this.attrs
        , x = obj[0]
        , y = obj[1]
        , w = obj[2] || 0
        , h = obj[3] || 0

      if (x > a.left && (x + w) < (a.left + a.width)) {
        if (y > a.top && (y + h) < (a.top + a.height)) {
          return true
        }
      }
      return false
    }

    // These four functions are helpers to move display objects
    // up and down through the display stack. This works with
    // both sorting in the base canvas, and within groups.
    // A change event will be emitted to inform the parent
    // that it needs to be re-rendered.
    , toTop: function () {
      this._activeCanvas._children.top(this)
      this.emit('change')
    }
    , toBottom: function () {
      this._activeCanvas._children.bottom(this)
      this.emit('change')
    }
    , up: function () {
      this._activeCanvas._children.up(this)
      this.emit('change')
    }
    , down: function () {
      this._activeCanvas._children.down(this)
      this.emit('change')
    }

    // *Experimental*
    // This is used to support aligning draw x and y origins
    // to opposite sides of the object, or to the middle point.
    , getRealPos: function () {
      var pos = {
        x: {
          left: this.attrs.left
          , center: this.attrs.left - (this.attrs.width / 2)
          , right: this.attrs.left - this.attrs.width
        }
        , y: {
          top: this.attrs.top
          , middle: this.attrs.top - (this.attrs.height / 2)
          , bottom: this.attrs.top - this.attrs.height
        }
      }
      return [
        pos.x[this.attrs.xorigin]
        , pos.y[this.attrs.yorigin]
      ]
    }

    // Each object goes through three stages of rendering;
    // 
    //     Pre-render     Translate, scale and rotate context
    //     Render         Draw object
    //     Post-render    Restore context
    //
    // First, we must translate the context position.
    // Then we have apply rotation, if we have the information.
    // After that, we apply scaling, if we have the information.
    // Lastly, we emit the render:pre event.
    , _preRender: function () {
      var ctx = this._activeCanvas._ctx
      ctx.states = 0
      ctx.save()
      ctx.states++

      var pos = this.getRealPos()
      ctx.translate(pos[0], pos[1])

      if (this.attrs.rotation) {
        ctx.rotate(Math.PI / 180 * this.attrs.rotation)
        ctx.states++
      }

      if (this.attrs.scale) {
        ctx.scale(this.attrs.scale, this.attrs.scale)
        ctx.states++
      }

      this.emit('render:pre', ctx)
      return this
    }

    // Not much happens here, that's left up to the extended
    // display objects. All this does is emit the render event.
    , _render: function () {
      this.emit('render', this._activeCanvas._ctx)
      return this
    }

    // The last step is to restore the previous context state.
    , _postRender: function () {
      var ctx = this._activeCanvas._ctx
      this.emit('render:post', ctx)
      while (ctx.states--) ctx.restore()
      return this
    }
  })
});

// canvas
// ------

// The `canvas` module manages the canvas dom element, and functions
// as a container
Peint.define('canvas', function (require, exports, module) {
  var Obj = require('object')
    , util = require('util')
    , support = require('support')

  // Throw an error if canvas is not supported.
  if ( ! support.canvas) {
    throw new Error('Canvas not supported')
  }

  // First, we must attempt to get a canvas element and
  // matching context. The provided `el` could be a selector,
  // a jquery object, a canvas dom element, or even empty.
  // We should try to intelligently predict how we should behave.
  var Canvas = module.exports = Obj.extend({
    constructor: function (el, m) {
      Canvas.supr(this, 'constructor')

      typeof el === 'string' && (el = util.$(el))
      ;(el && el.length) && (el = el[0])
      if ( ! (el instanceof HTMLCanvasElement)) {
        el = document.createElement('canvas')
      }

      // We also need to give the canvas a tab index,
      // so we can capture keyboard events.
      el.tabIndex = '1'

      // Now that we have that dealt with; we should store
      // the element, along with the context, and generate
      // our list of display objects.
      this._el = el
      this._ctx = this._el.getContext(m || '2d')
      this._children = new util.Stack
      this._lastFrame = 0

      // Lastly, we should initialize the base event
      // propagation system. We need to check if the instance
      // is a `Canvas` because `Group` inherits from it, and
      // we don't want to double up our event propagation.
      if (this instanceof Canvas) {
        this._initEvents()
        this._initKeys()
      }

      // Let's also start listening for change events and toggle
      // the `this.changed` state to indicate a re-render is needed.
      var self = this
      this.on('changed', function () {
        self.changed = true
      })
    }

    // Here we handle the setup of mouse events.
    , _initEvents: function () {
      var self = this

      // This helper function creates named type listeners.
      function ev (type, cb) {
        // When we receive a mouse event, we first should transform
        // the raw event to scope to the position of the canvas.
        // To do that, we create a transformed tap list.
        return function (e) {
          var taps = util.MouseEvent(e, {
            left: self._el.offsetLeft
            , top: self._el.offsetTop
          })

          // Next, we should emit base-level taps and interate
          // our display object list. For each child object,
          // we need to transform the tap information again to
          // scope to the position of that object.
          self.emit('mouse:'+type, taps)
          _(self._children).each(function (child) {
            var newTaps = util.MouseEvent(taps, child.get())

            // If any of the taps intersect with a child object,
            // we should propagate the transformed event up to it.
            _(taps).each(function (point) {
              if (child.isIntersecting(point)) {
                child.emit('mouse:'+type, newTaps)
              }
            })
          })
          e.preventDefault()
        }
      }

      // Now let's use that helper to attach some listeners
      this._el.addEventListener('mousedown', ev('down'))
      this._el.addEventListener('touchstart', ev('down'), false)
      this._el.addEventListener('mouseup', ev('up'))
      this._el.addEventListener('touchend', ev('up'), false)

      // Move events need to work a bit differently, because we
      // also want to emit mouse:over and mouse:out events.
      function move (e) {
        var taps = util.MouseEvent(e, {
          left: self._el.offsetLeft
          , top: self._el.offsetTop
        })

        // As usual, emit base-level taps, interate our display
        // object list, and transform the tap information again
        // to scope to the position of the object.
        self.emit('mouse:move', taps)
        _(self._children).each(function (child) {
          var newTaps = util.MouseEvent(taps, child.get())

          // This time, however; we will be using the `this._hovered`
          // property to toggle hover state, allowing us to detect
          // the over and out mouse movements and propagate them to
          // the child display object.
          _(taps).each(function (point) {
            if (child.isIntersecting(point)) {
              child.emit('mouse:move', newTaps)
              if ( ! child._hovered) {
                child._hovered = true
                child.emit('mouse:over', newTaps)
              }
            } else {
              if (child._hovered) {
                child._hovered = false
                child.emit('mouse:out', newTaps)
              }
            }
          })
        })
        e.preventDefault()
      }

      // Now attach the move listeners
      this._el.addEventListener('mousemove', move)
      this._el.addEventListener('touchmove', move, false)
    }

    // Here we handle the setup of keyboard events.
    , _initKeys: function () {
      var self = this, downKeys = []

      // All keyboard events are handled basically the same,
      // so we use this generic helper to receive them.
      // It emits a simple keys:`type` event, but it also emits
      // named events for individual keys, along with combo keys.
      function keyTrigger (type, e) {
        self.emit('keys:'+type, e)
        var keys = _(['ctrl','alt','shift'])
          .filter(function (v) { return e[v+'Key'] })
        keys.push(String.fromCharCode(e.which).toLowerCase())
        self.emit('keys:'+type+':'+keys.join('+'), e)
      }

      var realDoc = window.parent || window

      // This just passes press events through as-is.
      realDoc.addEventListener('keypress', function (e) {
        keyTrigger('press', e)
      })

      // Normally the dom `keydown` and `keyup` events trigger continuously,
      // rather than activating once like you might expect. To fix this,
      // we must store a list of currently held keys and ignore keys
      // that have already been placed in the list. 
      realDoc.addEventListener('keydown', function (e) {
        if (!~downKeys.indexOf(e.which)) {
          downKeys.push(e.which)
          keyTrigger('down', e)
        }
      })

      // We also need to remember to remove keys from the list of held keys
      // on `keyup` or future `keydown` events will continue to be stopped.
      realDoc.addEventListener('keyup', function (e) {
        var index = downKeys.indexOf(e.which)
        !!~index && downKeys.splice(index, 1)
        keyTrigger('up', e)
      })
    }

    // The `Canvas` class needs to pull `width` and `height` properties from
    // set calls to adjust the size of the canvas dom element.
    , set: function (obj) {
      obj.width && (this._el.width = obj.width)
      obj.height && (this._el.height = obj.height)
      return Canvas.supr(this, 'set', obj)
    }

    // The `start` and `stop` functions provide a convenient method of handling
    // re-rendering, so you don't have to think about it. Just add objects to
    // the display object list and this'll take care of rendering when there
    // is rendering to be done. You can stop and start the loop anytime.
    , start: function () {
      var self = this
      ;(function render () {
        self.renderLoop = requestAnimFrame(render)
        self.render()
      })()
    }
    , stop: function () {
      if (self.renderLoop) {
        cancelRequestAnimFrame(self.renderLoop)
      }
    }

    // You can set the background color using this. This will simply create
    // a `Rect` display object instance and add it to the display object list.
    , fill: function (color, rect) {
      this.factory('rect', _.extend(rect || {
        left: 0
        , top: 0
        , width: this._el.width
        , height: this._el.height
      }, { color: color }))
    }

    // Use `add` to add display objects to the list and connect a change event
    // to trigger a canvas re-render anytime that object changes.
    , add: function (obj, opt) {
      var self = this
      obj._activeCanvas = this
      this._children.push(obj)
      obj.on('change', function () { self.changed = true })
      this.changed = true
    }

    // Here we handle the actual rendering. This only renders the canvas a single time,
    // so it's recommended that you use `start` to keep an active loop.
    // 
    // This will first clear the state, then it will render each display object in the
    // list using the three-stage render system. Finally, it will emit a render event
    // to signal that rendering has completed.
    , render: function () {
      if (this.changed) {
        this.changed = false
        this._ctx.clearRect(0, 0, this._el.width, this._el.height)
        for (var i = 0; i < this._children.length; i++) {
          this._children[i]._preRender()._render()._postRender()
        }
        this.emit('render')
      }
    }

    // This is a convenient factory helper to create and auto-add display objects.
    , factory: function (type, opt) {
      var obj = require(type.toLowerCase())
      var inst = new obj(opt)
      inst.set(opt)
      this.add(inst)
      return inst
    }
  })
});

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
    return document['getElement' + ({
      '#': 'ById', '.': 'sByClassName'
    }[f] || 'sByTagName')]({
      '#': s, '.': s
    }[f] || i)
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

// text
// -----------

// This module handles rendering of text. In most situations, it's
// better to place text using dom elements, but you can use this if
// you need more flexibility for things like rotations or post-process.
Peint.define('text', function (require, exports, module) {
  var Obj = require('object')
  var props = [
    'font'
    , 'shadowColor'
    , 'shadowOffsetX'
    , 'shadowOffsetY'
    , 'shadowBlur'
  ]

  // First, we create a Text display object with some sensible defaults.
  var Text = module.exports = Obj.extend({
    constructor: function (opt) {
      Text.supr(this, 'constructor', _.extend({
        font: '10px Arial'
        , color: 'rgb(0,0,0)'
      }, opt))
    }

    // When set is called, we need to do some extra manipulation to
    // split up shadow into it's parts. It's arranged in the same way
    // as the css text-shadow property to match the font attribute.
    , set: function (obj, val) {
      if (obj.shadow) {
        var parts = obj.shadow.split(' ')
        if (parts.length === 4) {
          obj.shadowColor = parts[3]
          obj.shadowOffsetX = parseInt(parts[0])
          obj.shadowOffsetY = parseInt(parts[1])
          obj.shadowBlur = parseInt(parts[2])
        }
      }
      Text.supr(this, 'set', obj, val)
    }

    // Before rendering, we need to apply the styles to the context.
    // We need to map `color` and `yorigin` to `fillStyle` and `textBaseline`
    // respectively, but other properties match the same naming conventions.
    // The result text is also measured and the `width` and `height`
    // attributes are adjusted to match.
    // 
    // NOTE: The height adjustment only works properly with px sizes.
    , _preRender: function () {
      var ctx = this._activeCanvas._ctx, attrs = this.attrs

      ctx.save()
      ctx.textBaseline = attrs.yorigin
      ctx.fillStyle = attrs.color
      _.each(props, function (v) {
        ctx[v] = attrs[v]
      })

      var dim = ctx.measureText(attrs.text)
      this.attrs.width = dim.width
      this.attrs.height = parseInt(attrs.font)

      return Text.supr(this, '_preRender')
    }
    
    // Now we can just render the content of the `text` attribute
    , _render: function () {
      var ctx = this._activeCanvas._ctx, attrs = this.attrs
      ctx.fillText(attrs.text, 0, 0)
      return Text.supr(this, '_render')
    }

    , _postRender: function () {
      var ctx = this._activeCanvas._ctx
      ctx.restore()
      return Text.supr(this, '_postRender')
    }
  })
});

// rect
// ----

// This module handles drawing of simple rectangles. It may be replaced in the
// future with a shapes class which can handle other basic shapes and lines. 
Peint.define('rect', function (require, exports, module) {
  var Obj = require('object')

  // There's nothing special to do during construction.
  // Just pass any options through.
  var Rect = module.exports = Obj.extend({
    constructor: function (opt) {
      Rect.supr(this, 'constructor', opt)
    }

    , _preRender: function () {
      var ctx = this._activeCanvas._ctx
        , attrs = this.attrs

      ctx.save()
      ctx.fillStyle = attrs.color || '#000000'
      return Rect.supr(this, '_preRender')
    }

    // For the render step, we just need to set the fill color
    // and draw the rectangle to the specified dimensions.
    , _render: function () {
      var ctx = this._activeCanvas._ctx
        , el = this._activeCanvas._el
        , attrs = this.attrs
      ctx.fillRect(0, 0
        , Math.min(attrs.width, el.width)
        , Math.min(attrs.height, el.height)
      )
      return Rect.supr(this, '_render')
    }

    , _postRender: function () {
      var ctx = this._activeCanvas._ctx
      ctx.restore()
      return Rect.supr(this, '_postRender')
    }
  })
});

// group
// -----

// This module provides a grouping system so you can manipulate several
// display object together. Useful for things like composing characters
// from limb and torso graphics or generating tile-maps.
Peint.define('group', function (require, exports, module) {
  var Canvas = require('canvas')
    , Img = require('image')
    , util = require('util')

  // Groups are actually just Canvas objects, with some tweaks to make
  // them share their changes upward to a higher parent canvas context.
  // 
  // Using a method involving a group-sized image and data uris, groups
  // appear to the parent context as simple being an image.
  var Group = module.exports = Canvas.extend({
    constructor: function (opt) {
      Group.supr(this, 'constructor')
      this.set(opt || {})
      this.start()

      this.attrs.image = new Image()
      this.loaded = true

      // Because groups have their own set of child display objects,
      // we need to bridge event propagation on to the group children.
      // Once again, we need to translate the tap points and calculate
      // intersections so we can figure out what should receive events.
      var self = this
      _.each(['over','down','up'], function (type) {
        self.on('mouse:'+type, function (e) {
          _(self._children).each(function (child) {
            var taps = util.MouseEvent(e, child.attrs)
            _(e).each(function (point) {
              if (child.isIntersecting(point)) {
                child.emit('mouse:'+type, taps)
              }
            })
          })
        })
      })
    }

    // Whenever the state of the group changes, we need to re-render
    // the state texture using the data url of the canvas context.
    // Serializing the canvas to a data url and applying it to the
    // state texture is asynchronous, so we need to wait for the
    // onload event to trigger before emitting the change event.
    , render: function () {
      var isChanged = this.changed
        , ret = Group.supr(this, 'render')
        , self = this

      if (isChanged) {
        this.attrs.image.src = this._el.toDataURL()
        this.attrs.image.onload = function () {
          self.emit('change')
        }
      }
      
      return ret
    }
    
    // Since we are emulating an image, we can just borrow the
    // renderer from the image class.
    , _preRender: function () {
      return Img.prototype._preRender.call(this)
    }
    , _render: function () {
      return Img.prototype._render.call(this)
    }
    , _postRender: function () {
      return Img.prototype._postRender.call(this)
    }
  })
});

// image
// -----

// This module handles loading and rendering of images. It supports
// rendering full images, or rendering sliced regions--handy when
// combined with the animation class.
Peint.define('image', function (require, exports, module) {
  var Obj = require('object')

  var Img = module.exports = Obj.extend({
    constructor: function (opt) {
      var self = this, image
      Img.supr(this, 'constructor', opt)
      this.setImg(opt.image || opt.url)
    }

    // This sets the image for the instance to use.
    , setImg: function (img) {
      var self = this
      this.loaded = false

      // The image class can be given a url or an already loaded image.
      // In particular, cloned images will receive an existing image.
      // To receive these two possible inputs, we use this helper,
      // which adjusts the width and height properties to match the
      // supplied image. Then the image:loaded and change events are
      // emitted to ensure it gets rendered, even if it's a clone.
      function done () {
        self.set({
          image: img
          , width: img.width
          , height: img.height
        }, { silent: true })
        self.loaded = true
        setTimeout(function () {
          self.emit('image:loaded').emit('change')
        }, 0)
      }

      // If we've received a preloaded image, we should just skip to
      // the `done` step. Otherwise, we should try to use `opt.url` to
      // load the image and use the `done` helper as the onload event.
      if (typeof img !== 'string') done()
      else {
        image = new Image()
        image.src = img
        image.onload = done
        img = image
      }
    }

    // Here we render the image to the parent context. The render should
    // only occur when there is a loaded image to render.
    , _render: function () {
      if (this.loaded) {
        var attrs = this.attrs, el = this._activeCanvas._el
        this._activeCanvas._ctx.drawImage(
          this.attrs.image
          , Math.max(0, attrs.sliceX || 0)
          , Math.max(0, attrs.sliceY || 0)
          , attrs.sliceWidth || attrs.width
          , attrs.sliceHeight || attrs.height
          , 0
          , 0
          , attrs.width
          , attrs.height
        )
      }
      return Img.supr(this, '_render')
    }
  })
});

// animation
// ---------

// This module handles animated images. Most of the rendering parts are
// just delegated to the Img superclass, so this does little more than
// translating frame numbers to scaleX/Y/Width/Height changes.
Peint.define('animation', function (require, exports, module) {
  var Img = require('image')

  // This is a simple frame-stepping helper. It just handles incrementing
  // and decrementing a frame number with a loop-back point.
  function Frames (count) {
    this.count = count
    this.frame = 0
  }
  Frames.prototype.next = function () {
    return this.frame < (this.count-1) ? this.frame++ : this.frame = 0
  }
  Frames.prototype.prev = function () {
    return this.frame > 0 ? this.frame-- : this.frame = this.count-1
  }

  // We can't do anything until the associated images is loaded, so just
  // pass off to the superclass and attach an event to delay the startup.
  var Anim = module.exports = Img.extend({
    constructor: function (opt) {
      Anim.supr(this, 'constructor', opt)
      this.on('image:loaded', this._loaded)
    }

    // Now that the image has loaded, we can use the image properties to
    // calculate our frame slices and start the animation. We use `opts.cols`
    // and `opts.rows` to determine the column and row height, which tells
    // us what the final tile size should be. Animated images should be
    // arranged horizontally, so each row is a different animationg. Once we've
    // calculated rows and columns, we can attach the frame-stepper and start.
    , _loaded: function () {
      var self = this
        , anim = this.attrs.animation
        , img = this.attrs.image
        , width = img.width / anim.cols
        , height = img.height / anim.rows

      this.set({
        sliceWidth: width
        , sliceHeight: height
        , width: width
        , height: height
      })

      this._frame = new Frames(anim.cols)
      this.play()
    }

    // We have some basic controls to pause and play the animation.
    , pause: function () {
      this.animating = false
    }
    , play: function () {
      this.animating = true
      this._animate()
    }

    // These are for stepping through the frames of an animation. In some cases,
    // you might want to display a paused animation and jump to specific frames
    // based on external triggers.
    , next: function () {
      var tileSize = this.attrs.image.width / this.attrs.animation.cols
      this.set({
        sliceX: this._frame.next() * tileSize
      })
    }
    , prev: function () {
      var tileSize = this.attrs.image.width / this.attrs.animation.cols
      this.set({
        sliceX: this._frame.prev() * tileSize
      })
    }

    // Here we have the animation loop. It uses the `animation.duration`
    // attribute to determine time between frame steps and will continuously
    // recall itself in a setTimeout for easily canceling in the pause helper.
    , _animate: function () {
      if (this.animating) {
        var self = this
        setTimeout(function () {
          self.next()
          self._animate()
        }, this.attrs.animation.duration)
      }
    }
  })
});