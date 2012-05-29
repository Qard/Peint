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