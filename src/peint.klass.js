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