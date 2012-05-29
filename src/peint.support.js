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