// Peint.events
// Manages attaching of events to the canvas,
// including a custom draw event.
window.Peint.extend({
	events : {
		draw_handler: null
		, listeners: {}
		/**
		 * Bind events to the canvas element.
		 */
		, bind: function(event, func, capture){
			// Fake a draw handler.
			if (event == 'draw'){
				this.draw_handler = setInterval(func, capture || 10);
			// Otherwise, create a standard listener and store a reference.
			} else {
				// Fill the first two args with x/y coords for user-friendliness.
				this.listeners[event] = function(e){ func(e.x,e.y,e); };
				Peint.canvas.addEventListener(event, this.listeners[event], capture || true);
			}
			return this;
		}
		/**
		 * Unbind events from the canvas element.
		 */
		, unbind: function(event, func){
			// Remove our faked draw handler.
			if (event == 'draw'){
				clearInterval(this.draw_handler);
			// Otherwise, remove a standard listener.
			} else {
				Peint.canvas.removeEventListener(event, func || this.listeners[event]);
			}
			
			return this;
		}
	}
});