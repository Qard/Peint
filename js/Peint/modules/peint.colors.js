//	Peint.colors
// This module provides basic color utilities.
// You can rgb/rgba arrays and convert to color strings.
window.Peint.extend({
	colors: {
		/**
		 * Generates a color array, only sets alpha if supplied.
		 */
		rgba: function(r,g,b,a){
			var o = { red: r, green: g, blue: b };
			if (typeof a != 'undefined'){ o.alpha = a; }
			return o;
		}
		/**
		 * Alias rgba()
		 */
		, rgb: function(r,g,b){
			return this.rgba(r,g,b);
		}
		/**
		 * Converts rgb/rgba object or array to color string format.
		 */
		, rgbaToString: function(arr){
			return (typeof arr.red != undefined)
				? ((typeof arr.alpha != 'undefined')
					? 'rgba('+arr.red+','+arr.green+','+arr.blue+','+arr.alpha+')'
					: 'rgb('+arr.red+','+arr.green+','+arr.blue+')'
				)
				: ((arr.length == 4)
					? 'rgba('+arr[0]+','+arr[1]+','+arr[2]+','+arr[3]+')'
					: 'rgb('+arr[0]+','+arr[1]+','+arr[2]+')'
				);
		}
	}
});