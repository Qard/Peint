// Peint.shapes
// This module provides basic shape drawing utilities.
window.Peint.extend({
	shapes: {
		depends: ['colors']
		/**
		 * Fill area with defined rgb or rgba color.
		 * 
		 * @param color object
		 * 	The color to fill with.
		 * 
		 * @param coords object (optional)
		 * 	Fill rect. When blank, will fill the entire canvas.
		 */
		, rect: function(color, rect){
			var rect = rect || {};
			
			// Generate a color string.
			Peint.context.fillStyle = Peint.modules.colors.rgbaToString(color);
			
			// Draw our filled rectangle, and supply defaults if any rect values are missing.
			Peint.context.fillRect(
				rect.x || 0
				, rect.y || 0
				, rect.width || Peint.canvas.width
				, rect.height || Peint.canvas.height
			);
			
			return this;
		}
	}
});