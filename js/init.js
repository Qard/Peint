// Initialize our management libraries.
var peint = Peint.init('#screen');

// Attach module system.
Utils.attach_module_system(peint, 'peint');

// Enable debug mode.
Utils.debug = true;

Utils.require('string', function(str){
	var ele = document.querySelector('#message');
	var msg = ele.innerHTML;

	// Load required modules. Now Peint supports loading more than one
	// module at a time. You can use a comma-seperated string, or an array.
	// The supplied callback will be delayed until all modules are loaded.
	Peint.require('viewport,shapes,sizes,image,text,colors,events,region', function(viewport,shapes,sizes,image,text,colors,events,region){
		// Load all our images using the supplied paths.
		// image.load() can also use a comma-seperated string or array.
		// Again, the callback will be delayed untill all images are loaded.
		image.load('/img/beta.png,/img/download.png', function(beta,download){
			// Create a frame counter.
			var counter = 0;
			var title_color = colors.rgb(255,255,255);
			var dl_color = colors.rgb(180,220,255);
			var dl_crop = sizes.coords({
				top: 0
				, left: 0
				, width: 304
				, height: 82
			});
			var viewport_size = viewport.size();
		
			// Create drawing handler to redraw at a timed interval.
			// This is entirely optional, you could also just draw once,
			// since canvas automagically redraws it's current state.
			// This is handy for high-motion applications like games.
			var draw = function(){
				// Tell the console that we are looping.
				Utils.debug && Utils.log('drawing...');
				
				/*******************************
				 * 
				 * Draw our cool background.
				 * 
				 *******************************/
				
				// Establish gradient bar height.
				var h = viewport_size.height / 100;
				
				// Draw horizontal gradient bars.
				for (var i = 1; i < 100; i++){
					shapes.rect(colors.rgb(200-(i+1),50-((i+1)/2),0), sizes.coords({
						top: i * h - h
						, left: 0
						, width: '100%'
						, height: '2%'
					}));
				}
				
				// Establish gradient bar width.
				var w = viewport_size.width / 100;
				
				// Draw vertical gradient bars.
				for (var i = 1; i < 100; i++){
					shapes.rect(colors.rgba(20+((i+1)/2),50,0,(i%5)/75), sizes.coords({
						left: i * w - w
						, top: 0
						, width: '2%'
						, height: '100%'
					}));
				}
				
				/*******************************
				 * 
				 * Draw our title.
				 * 
				 *******************************/
				
				// Get transformed text position coordinates.
				var title_loc = sizes.coords({
					top: '18%'
					, right: '50%'
					, xorigin: '-50%'
					, yorigin: '-50%'
				});
				
				// The text position can never be less than 300px from the top,
				// otherwise it will overlap the title text.
				if (title_loc.y < 110){
					title_loc.y = 110;
				}
				
				// Now let's try some text. This is a bit more complicated,
				// and the interface is likely to change.
				text.message(
					'Peint'
					, text.font('BallparkWeiner', 150, title_color)
					, title_loc
				);
				 
				/*******************************
				 * 
				 * Draw our content text.
				 * 
				 *******************************/
				
				// Get transformed text position coordinates.
				var text_loc = sizes.coords({
					top: '50%'
					, right: '50%'
					, xorigin: '-50%'
					, yorigin: '-50%'
				});
				
				// The text position can never be less than 300px from the top,
				// otherwise it will overlap the title text.
				if (text_loc.y < 300){
					text_loc.y = 300;
				}
				
				// Let's show off multiline text rendering!
				text.message(
					str.unbrp(msg)
					, text.font('Helvetica', 20, colors.rgb(255,255,255))
					, text_loc
				);
				 
				/*******************************
				 * 
				 * Draw our download button.
				 * 
				 *******************************/
				
				// Get transformed text position coordinates.
				var dl_loc = sizes.coords({
					top: '50%'
					, right: '50%'
					, width: 152
					, height: 41
					, xorigin: '-50%'
					, yorigin: '-50%'
				});
				
				// Position it at the same vertical pixel column
				// as the text, but just a bit below it.
				dl_loc.y = text_loc.y - (text_loc.yorigin * 1.8);
				dl_loc.x = text_loc.x;
				dl_loc.xorigin = text_loc.xorigin;
				
				// Draw the download button.
				image.draw(download, dl_loc, dl_crop);
				 
				/*******************************
				 * 
				 * Define title region.
				 * 
				 *******************************/
				
				// Set region location.
				// Will create a new region if named region doesn't exist yet.
				region.set('title', title_loc);
				
				// We only need to bind events once.
				if ( ! region.has_listener('title', 'mouseover')){
					// Show our handy region events.
					// These only execute when the mouse location
					// is inside the region area.
					region.bind('title', 'mouseover', function(){
						title_color = colors.rgb(100,10,0);
						draw();
					});
					region.bind('title', 'mouseout', function(){
						title_color = colors.rgb(255,255,255);
						draw();
					});
				}
				 
				/*******************************
				 * 
				 * Define download button region.
				 * 
				 *******************************/
				
				// Set region location.
				// Will create a new region if named region doesn't exist yet.
				region.set('download', dl_loc);
				
				// We only need to bind events once.
				if ( ! region.has_listener('download', 'mouseover')){
					// Show our handy region events.
					// These only execute when the mouse location
					// is inside the region area.
					region.bind('download', 'click', function(){
						window.location = "peint.zip"
					});
					region.bind('download', 'mouseover', function(){
						dl_crop = sizes.coords({
							top: 83
							, left: 0
							, width: 304
							, height: 82
						});
						dl_color = colors.rgb(255,180,60);
						draw();
					});
					region.bind('download', 'mouseout', function(){
						dl_crop = sizes.coords({
							top: 0
							, left: 0
							, width: 304
							, height: 82
						});
						dl_color = colors.rgb(180,220,255);
						draw();
					});
				}
				
				/*******************************
				 * 
				 * Use counter to show events.
				 * 
				 *******************************/
				
				// Increment the frame counter.
				counter++;
				
				// Draw 10 frames, then stop.
				// Demonstrates the handy event bind/unbind system.
				if (counter == 100) {
					events.unbind('draw');
				}
			};
			
			// Create onresize handler.
			var resizer = function(){
				// Get current viewport dimensions.
				viewport_size = viewport.size();
				
				// Position and resize the canvas.
				// We are using a 100% width & height canvas,
				// so we don't need to play with the dimensions.
				sizes.position().resize(viewport_size);
				
				Utils.debug && Utils.log('Viewport resized.');
				
				// Execute the draw handler.
				draw();
			};
			
			// Testing a click attached to the canvas.
			// Events should bubble up to containing elements,
			// so the window.click handler below will also get fired.
			// Click event callbacks have been simplified to take x and y
			// as the first and second arguments. Optionally the raw
			// mouse event can be collected via the third argument.
			events.bind('click', function(x,y){
				Utils.debug && Utils.log('Element "canvas" has been clicked at '+x+'x'+y+'.');
			});
			
			// Testing a click attached to the window behind the canvas.
			// Events should bubble up to it, so this will get fired.
			// Note that viewport has it's own seperate bind system.
			viewport.bind('click', function(x,y){
				Utils.debug && Utils.log('Element "window" has been clicked at '+x+'x'+y+'.');
			});
			
			// Attach handlers to the resize and load events of window.
			// That's a pretty handy reason to be able to bind to window. ;)
			viewport.bind('resize', resizer).bind('load', resizer);
			
			// Attach a draw handler that loops 30 times per second.
			events.bind('draw', draw, 1000 / 30);
		});
	});
});