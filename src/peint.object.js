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