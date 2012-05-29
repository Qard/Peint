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

    // For the render step, we just need to set the fill color
    // and draw the rectangle to the specified dimensions.
    , _render: function () {
      var ctx = this._activeCanvas._ctx
        , el = this._activeCanvas._el
        , attrs = this.attrs
      ctx.fillStyle = attrs.color || '#000000'
      ctx.fillRect(0, 0
        , Math.min(attrs.width, el.width)
        , Math.min(attrs.height, el.height)
      )
      return Rect.supr(this, '_render')
    }
  })
});