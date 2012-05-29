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
      this.set({
        sliceX: this._frame.next() * (this.attrs.image.width / this.attrs.animation.cols)
      })
    }
    , prev: function () {
      this.set({
        sliceX: this._frame.prev() * (this.attrs.image.width / this.attrs.animation.cols)
      })
    }

    // Here we have the animation loop. It uses the `animation.duration` attribute
    // to determine the time between frame steps and will continuously recall itself
    // in a setTimeout for easily canceling in the pause helper.
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