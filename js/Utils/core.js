/************************************************************
 *                                                          *
 *	Utils is just a handy glue library with helper methods.  *
 * It also provides a drop-in module system for any object. *
 *	                                                         *
 *	Copyright 2011 - Stephen Belanger                        *
 *	                                                         *
 *	BSD Licensed                                             *
 *                                                          *
 ************************************************************/
window.Utils = {
	debug: false
	/**
	 * Alias for consistent logging.
	 */
	, log: (window.console && typeof console.log === "function")
		? function(){ console.log.apply(console, arguments); }
		: alert
	/**
	 * Converts first character in a string to uppercase.
	 */
	, ucfirst: function(str) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
	, text_ele_to_arr: function(selector){
		var element = document.querySelector(selector);
		
		var content = element.innerHTML;
		content = content.replace(/<br>/ig, '\n').replace(/<p>/ig, '').replace(/<\/p>/ig, '\r\n');
		
		content = content.split('\n');
		for (var i in content){
			content[i] = content[i].replace(/^\s+|\s+$/g,'');
		}
		
		return content;
	}
	/**
	 * Attaches the require and extend module system functionality to any object.
	 * 
	 * @param object
	 * 	The object to attach the module system to.
	 * 
	 * @param string
	 * 	The file prefix, for example; utils.string.js has a 'utils' prefix.
	 * 
	 * @param string
	 * 	The path to the module directory.
	 */
	, attach_module_system: function(obj, prefix, moddir){
		/**
		 * This allows us to asynchronously load external modules,
		 * and execute code once it is ready via a supplied callback.
		 */
		obj.require = function(names, callback){
			// We can import more than one script at a time
			// and delay our callback until all modules are loaded!
			if (typeof names != 'object' || ! (names instanceof Array)){
				var names = names.split(',');
			}
			
			// Send require list to console.
			Utils.debug && Utils.log('Including module'+(names.length > 1 ? 's' : '')+' "'+names.join('", "')+'".');
			var modules = [];
			
			// Attempt to add multiple scripts.
			for (var a in names){
				// Store "this" in self, so we point to the right place in onload.
				var self = this;
				
				// Wrap in an anonymous functions so script-specific variables don't leak.
				(function(self){
					// Only inject the script element if it's not present already.
					if (typeof self.modules[names[a]] == 'undefined'){
						// Create new script element.
						var s = document.createElement('script');
						
						// Attach an onload handler to the current script.
						var id = a;
						s.onload = function(){
							// Inform us when an onload of our required scripts has fired.
							Utils.debug && Utils.log('"'+this.id+'" has been loaded.');
							
							// This keeps a record of whether we
							// are done loading all our modules yet.
							var complete = true;
							for (var b in names){
								if (typeof self.modules[names[b]] == 'undefined'){
									complete = false;
								}
							}
							
							// Add module to module array.
							modules.push(self.modules[names[id]]);
							
							// Execute the callback when all modules have loaded.
							if (complete && typeof callback != 'undefined'){
								callback.apply(self, modules);
								Utils.debug && Utils.log('require() completed in "'+names[id]+'", callback executed.');
							}
						};
						
						// Set our script location and other stuff.
						var prefix = typeof self.module_prefix != 'undefined'
							? self.module_prefix+'.'
							: '';
						s.src = self.module_dir+'/'+prefix+names[a]+'.js';
						s.id = self.module_prefix+'.'+names[a]+'.js';
						s.type = 'text/javascript';
						s.async = true;
						
						// Add our required script to the end of the body element.
						document.getElementsByTagName('BODY')[0].appendChild(s);
					}
				})(self);
			}
			
			return this;
		};
		/**
		 * Abstracts loading of modules.
		 */
		obj.extend = function(opt){
			for (var module in opt){
				// Collect depends list.
				var deps = opt[module].depends || [];
				
				// Loop through dependencies.
				for (var dep in deps){
					// Throw an error if it's not present or queued to be loaded.
					if (typeof this.modules[deps[dep]] == 'undefined'){
						Utils.debug && Utils.log([
							'Dependency notice; "'+deps[dep]+'" not loaded yet!'
							, 'Be sure to include it before using the "'+module+'" module.'
						].join(' '));
					}
				}
				this.modules[module] = opt[module];
			}
		};
		obj.module_prefix = obj.module_prefix || prefix;
		obj.module_dir = obj.module_dir || moddir || '/js/'+this.ucfirst(obj.module_prefix)+'/modules';
		obj.modules = obj.modules || {};
	}
};

// Attach Utils module system to itself.
window.Utils.attach_module_system(window.Utils, 'utils');