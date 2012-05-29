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