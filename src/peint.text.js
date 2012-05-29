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
  })
});