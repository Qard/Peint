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