// Peint.text
// This module provides font selection and text rendering.
window.Peint.extend({
	text: {
		depends: ['colors','sizes']
		, canvas: null
		, context: null
		/**
		 * Initialize the draw2d module by supplying canvas and context references.
		 */
		, init: function(self, canvas, context){
			this.context = context;
			this.canvas = canvas;
			this.parent = self;
			
			return this;
		}
		/**
		 * Handy helper for generating a font definition.
		 */
		, font: function(name, size, color){
			var font = name || 'Arial';
			var size = size || 18;
			var color = color || Peint.modules.colors.rgb(0,0,0);
			
			return {
				font: name
				, size: size
				, color: color
			};
		}
		/**
		 * Draw a text string.
		 */
		, message: function(text, style, rect){
			var rect = rect || {};
			var lines = text.split("\n");
			
			// Setup the font.
			Peint.context.textBaseline = "top";
			Peint.context.font = style.size+'px '+style.font;
			
			// Generate a color string.
			Peint.context.fillStyle = Peint.modules.colors.rgbaToString(style.color);
			
			// Adjust the yorigin based on the height of all lines added together.
			rect.yorigin = Peint.modules.sizes.measure(rect.yorigin, lines.length * parseInt(style.size));
			
			// Find the length of the longest line.
			var longest = 0;
			for (i = 0; i < lines.length; i++) {
				var textsize = Peint.context.measureText(lines[i]);
				if (textsize.width > longest) longest = textsize.width;
			}
			
			// Use the longest line length to calculate x offset.
			rect.xorigin = Peint.modules.sizes.measure(rect.xorigin, longest);
			
			// Adjust width and height.
			rect.width = longest;
			rect.height = lines.length * parseInt(style.size);
			
			// Draw our filled text line-by-line.
			for (i = 0; i < lines.length; i++) {
				// Get the dimensions of our current line.
				var textsize = Peint.context.measureText(lines[i]);
				textsize.height = lines.length * parseInt(style.size);
				
				// Draw the current line.
				Peint.context.fillText(lines[i], (rect.x || 0) + rect.xorigin, ((rect.y || 0) + rect.yorigin) + (i * style.size));
			}
			
			return this;
		}
	}
});