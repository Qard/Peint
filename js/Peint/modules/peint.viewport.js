// Peint.viewport
// This module provides viewport management utilities.
// You can attach events to the window or get viewport
// dimensions to set the canvas size to fill the viewport.
window.Peint.extend({
	viewport: {
		listeners: {}
		, size: function(){
			var w = window
				, a = 'inner';

			if ( ! (a+'Width' in w)){
				a = 'client';
				e = document.documentElement || document.getElementsByTagName('body')[0];
			}

			return {
				width: w[a+'Width']
				, height: w[a+'Height']
			};
		}
		/**
		 * Binds events to "window" and provides a mechanism to fake "onload".
		 */
		, bind: function(event, func, capture){
			// Pretend like "window.onload" hasn't executed already. >.>
			if (event == 'load'){
				func.call();
			} else if (event == 'click') {
				this.listeners[event] = function(e){
					func(e.x,e.y,e);
				};
				window['on'+event] = this.listeners[event];
			} else {
				this.listeners[event] = func;
				window['on'+event] = func;
			}
			
			return this;
		}
		/**
		 * Unbind events.
		 */
		, unbind: function(event, func){
			window.removeEventListener(event, func || this.listeners[event]);
			
			return this;
		}
	}
});