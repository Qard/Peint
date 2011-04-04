// Peint.sizes
// This module provides several handy size and measurement tools.
// It handles the conversion of px and percentage dimensions,
// and left/right/top/bottom origins to point usable by canvas.
window.Peint.extend({
	sizes: {
		/**
		 * Converts our various supported dimension types (100, '100px', '100%')
		 * to more usable float values based on supplied destination dimension.
		 * 
		 * @param coords object
		 * 	Source rect.
		 * 
		 * @param coords object
		 * 	Dest rect.
		 * 
		 * @param boolean
		 * 	Switches 'undefined' default from minimum to maximum.
		 */
		measure: function(source, destination, usemax){
			// Converts percentages based on destination size,
			// and converts 'px' strings to usable floats.
			// usemax can be toggled to make empty values return destination size.
			return ((source+'').indexOf('%') > -1)
				? destination * (parseFloat(source) / 100)
				: (parseFloat(source) || (usemax ? destination : 0));
		}
		/**
		 * Transforms coordinates from left/right/top/bottom and percentages.
		 * Supported values are; 100, '100px' and '100%'
		 * 
		 * @param coords object
		 * 	Can contain left/right/top/bottom offsets and x/y
		 * 	origin offsets in integer, px and percentage formats.
		 */
		, coords: function(r){
			var r = r || {};
			
			// Transform x coordinate.
			r.x = (typeof r.left != 'undefined')
				? this.measure(r.left, Peint.canvas.width)
				: ((typeof r.right != 'undefined')
					? (Peint.canvas.width - this.measure(r.right, Peint.canvas.width))
					: 0
				);
			
			// Transform y coordinate.
			r.y = (typeof r.top != 'undefined')
				? this.measure(r.top, Peint.canvas.height)
				: ((typeof r.bottom != 'undefined')
					? (Peint.canvas.height - this.measure(r.bottom, Peint.canvas.height))
					: 0
				);
			
			// Transform width.
			r.owidth = r.width || 0;
			r.width = this.measure(r.width, Peint.canvas.width, true);
			
			// Transform height.
			r.oheight = r.height || 0;
			r.height = this.measure(r.height, Peint.canvas.height, true);
			
			r.xorigin = r.xorigin || 0;
			r.yorigin = r.yorigin || 0;
			
			return r;
		}
		/**
		 * Adjust the position of our canvas. Forces absolute positioning.
		 * 
		 * @param coords object
		 * 	Can contain left/right/top/bottom offsets
		 * 	in integer, px and percentage formats.
		 */
		, position: function(r){
			var r = r || {};
			Peint.canvas.style.position = 'absolute';
			
			// Transform x coordinate.
			if (typeof r.right != 'undefined'){
				Peint.canvas.style.right = (Peint.canvas.width - this.measure(r.right, Peint.canvas.width));
			} else {
				Peint.canvas.style.left = this.measure(r.left || 0, Peint.canvas.width);
			}
			
			// Transform y coordinate.
			if (typeof r.bottom != 'undefined'){
				Peint.canvas.style.bottom = (Peint.canvas.height - this.measure(r.bottom, Peint.canvas.height));
			} else {
				Peint.canvas.style.top = this.measure(r.top || 0, Peint.canvas.height);
			}
			
			// Log debug information when in debug mode.
			if (Utils.debug){
				Utils.log(
					'canvas#'+Peint.canvas.id+' positioned at: {'
					+(Peint.canvas.style.top
						? 'top:'+parseInt(Peint.canvas.style.top)
						: 'bottom:'+parseInt(Peint.canvas.style.bottom)
					)
					+','
					+(Peint.canvas.style.left
						? 'left:'+parseInt(Peint.canvas.style.left)
						: 'right:'+parseInt(Peint.canvas.style.right)
					)
					+'}'
				);
			}
			
			return this;
		}
		/**
		 * Adjust the size of our canvas.
		 * Can be used with a viewport resize listener to resize
		 * the canvas automatically to always fit the screen.
		 */
		, resize: function(width, height){
			if (typeof height == 'undefined'){
				height = width.height;
				width = width.width;
			}
			
			Peint.canvas.width = width;
			Peint.canvas.height = height;
			
			Utils.debug && Utils.log('canvas#'+Peint.canvas.id+' resized to: {width:'+width+',height:'+height+'}');
			
			return this;
		}
	}
});