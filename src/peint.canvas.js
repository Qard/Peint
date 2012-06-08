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
      console.log(window)

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