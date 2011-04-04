// Peint.sizes
// This module provides several handy size and measurement tools.
// It handles the conversion of px and percentage dimensions,
// and left/right/top/bottom origins to point usable by canvas.
window.Peint.extend({
	region: {
		regions: {}
		/**
		 * Convert a coordinate array to a region array.
		 */
		, from_coords: function(p){
			return {
				x: p.x + p.xorigin
				, y: p.y + p.yorigin
				, width: p.width
				, height: p.height
				, hovered: false
				, listeners: {}
			};
		}
		/**
		 * Determine if the supplied x/y coordinates
		 * are within the supplied region.
		 */
		, in: function(x, y, r){
			return ((x > r.x && x < (r.x + r.width)) && (y > r.y && y < (r.y + r.height)));
		}
		/**
		 * Check if a region exists in our list.
		 */
		, has: function(name){
			return (typeof this.regions[name] != 'undefined');
		}
		/**
		 * Set named region array values.
		 */
		, set: function(n, r){
			if (typeof r.listeners == 'undefined'){
				r = this.from_coords(r);
			}
			if (typeof this.regions[n] == 'undefined'){
				this.regions[n] = r;
			} else {
				this.regions[n].x = r.x;
				this.regions[n].y = r.y;
				this.regions[n].width = r.width;
				this.regions[n].height = r.height;
			}
			return this.regions[n];
		}
		/**
		 * Remove region array from list.
		 */
		, remove: function(name){
			this.regions[name] = null;
			return this;
		}
		/**
		 * Check if a listener type has been set for specified region.
		 */
		, has_listener: function(name, event){
			return (typeof this.regions[name] != 'undefined' && typeof this.regions[name].listeners[event] != 'undefined');
		}
		/**
		 * Bind events to regions.
		 */
		, bind: function(name, event, func, capture){
			// Don't even bother if the asociated region doesn't exist.
			if (typeof this.regions[name] == 'undefined'){
				Utils.debug && Utils.log('That region could not be found!');
				return this;
			}
			
			// Grab a self-reference in case we need it.
			var self = this;
			
			// Hack for mousemove to manage mouseover/mouseout events.
			if (event == 'mouseover'){ event = 'mousemove'; }
			switch (event){
				// Mouseout events get stored directly and called
				// by the mousemove event later.
				case 'mouseout':
					this.regions[name].listeners[event] = func;
					
					// Add a mousemove event if none exists yet.
					if (typeof this.regions[name].listeners.mousemove == 'undefined'){
						// Construct listener.
						this.regions[name].listeners.mousemove = function(e){
							// Check if we are in the region before trying to run events.
							if ( ! self.in(e.x, e.y, self.regions[name])){
								var mouseout = self.regions[name].listeners.mouseout;
								if (self.regions[name].hovered){
									mouseout(e.x,e.y,e);
								}
								self.regions[name].hovered = false;
							}
						};
						Peint.canvas.addEventListener(event, this.regions[name].listeners[event], capture || true);
					}
					break;
				
				// Mousemove primarily handles the mouseover event,
				// but also switches to mouseout on region exit.
				case 'mousemove':
					// Construct listener.
					this.regions[name].listeners[event] = function(e){
						// Check if we are in the region before trying to run events.
						if (self.in(e.x, e.y, self.regions[name])){
							if ( ! self.regions[name].hovered){
								func(e.x,e.y,e);
							}
							self.regions[name].hovered = true;
						
						// If we aren't in the region, check if we've run a mouseout event.
						// If not, we should probably do that.
						} else {
							var mouseout = self.regions[name].listeners.mouseout;
							if (typeof mouseout == 'function' && self.regions[name].hovered){
								mouseout(e.x,e.y,e);
							}
							self.regions[name].hovered = false;
						}
					};
					Peint.canvas.addEventListener(event, this.regions[name].listeners[event], capture || true);
					break;
				
				// Other types of events are easy. We don't need to worry about emulation.
				default:
					// Grab reference to region module and construct listener.
					var self = this;
					this.regions[name].listeners[event] = function(e){
						// Check if we are in the region before trying to run events.
						if (self.in(e.x, e.y, self.regions[name])){
							func(e.x,e.y,e);
						}
					};
					Peint.canvas.addEventListener(event, this.regions[name].listeners[event], capture || true);
					break;
			}
			
			return this;
		}
		/**
		 * Unbind region event.
		 */
		, unbind: function(name, event, func){
			Peint.canvas.removeEventListener(event, func || this.regions[name].listeners[event]);
			return this;
		}
	}
});