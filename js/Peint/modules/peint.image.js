//	Peint.image
// This module provides basic drawing utilities.
// You can fill color regions and draw images or image regions.
window.Peint.extend({
	image: {
		depends: ['sizes']
		, imgs: {}
		/**
		 * Load one or several images and execute callback when all images are loaded.
		 * 
		 * @param string or array
		 * 	Accepts a single URL, comma-seperated URLs or an array of URLs.
		 * 
		 * @param function
		 * 	The callback to execute when all images have completed loading.
		 */
		, load: function(urls, callback){
			// We can import more than one script at a time
			// and delay our callback until all modules are loaded!
			if (typeof urls != 'object' || ! (urls instanceof Array)){
				var urls = urls.split(',');
			}
			
			// Send require list to console.
			Utils.debug && Utils.log('Loading image'+(urls.length > 1 ? 's' : '')+' "'+urls.join('", "')+'"...');
			
			// Make a storage array for our loaded images.
			var images = [];
			
			// Create a 'self' alias, we'll need it later.
			var self = this;
			
			// Loop through images.
			for (var image in urls){
				// Create a temporary image object.
				this.imgs[urls[image]] = new Image();
				
				// Setup our onload event.
				this.imgs[urls[image]].onload = function(){
					Utils.debug && Utils.log('"'+this.id+'" loaded.');
					
					// Store the loaded status of this image.
					self.imgs[this.id].loaded = true;
					
					// Check our whole list to see if all images have been loaded.
					var complete = true;
					for (var i in urls){
						if (typeof self.imgs[urls[i]].loaded == 'undefined'){
							complete = false;
						}
					}
					
					// Add loaded image to array.
					images.push(this);
					
					// Execute the callback when all images have loaded.
					if (complete && typeof callback == 'function'){
						callback.apply(self.imgs, images);
						Utils.debug && Utils.log('image.load() completed on "'+this.id+'", callback executed.');
					}
				};
				
				// Once we set the src the image loads right away,
				// so make sure to set it AFTER onload.
				this.imgs[urls[image]].src = urls[image];
				this.imgs[urls[image]].id = urls[image];
			}
			
			return this;
		}
		/**
		 * Draw an image to the screen.
		 * 
		 * @param Image
		 * 	The image element that should be drawn.
		 * 
		 * @param coords object
		 * 	Size rect, defaults to 0/0/img.width/img.height
		 * 
		 * @param coords object
		 * 	Crop rect, defaults to 0/0/img.width/img.height
		 */
		, draw: function(image, rect, rect2){
			var rect = rect || {};
			
			// Transform width and height.
			rect.width = Peint.modules.sizes.measure(rect.owidth, image.width, true);
			rect.height = Peint.modules.sizes.measure(rect.oheight, image.height, true);
			
			// Transform origins.
			rect.xorigin = Peint.modules.sizes.measure(rect.xorigin, image.width);
			rect.yorigin = Peint.modules.sizes.measure(rect.yorigin, image.height);
			
			// If crop rectangle has been supplied, do some fixes and swap args.
			if (typeof rect2 != 'undefined'){
				// Transform crop width and height.
				rect2.width = Peint.modules.sizes.measure(rect2.owidth, image.width, true);
				rect2.height = Peint.modules.sizes.measure(rect2.oheight, image.height, true);
				
				// Prevent width and height from expanding
				// outside original image size.
				if (rect2.width > (image.width - rect2.x)){
					rect2.width = image.width - rect2.x;
				}
				if (rect2.height > (image.height - rect2.y)){
					rect2.height = image.height - rect2.y;
				}
				
				// rect2 needs to come first if we are cropping.
				// Kind of odd, but swapping it this way makes Peint
				// a bit easier to understand.
				Peint.context.drawImage(
					image
					, rect2.x || 0
					, rect2.y || 0
					, rect2.width || 0
					, rect2.height || 0
					, (rect.x || 0) + rect.xorigin
					, (rect.y || 0) + rect.yorigin
					, rect.width || 0
					, rect.height || 0
				);
			
			// Let's just draw the image normally,
			// using supplied coordinates and dimensions.
			} else {
				Peint.context.drawImage(
					image
					, (rect.x || 0) + rect.xorigin
					, (rect.y || 0) + rect.yorigin
					, rect.width || 0
					, rect.height || 0
				);
			}
			
			return this;
		}
	}
});