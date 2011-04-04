/************************************************************
 *                                                          *
 *	Copyright 2011 - Stephen Belanger                        *
 *	                                                         *
 *	BSD Licensed                                             *
 *                                                          *
 ************************************************************/
window.Utils.extend({
	string: {
		/**
		 * Converts first character in string to uppercase.
		 */
		ucfirst: function(str) {
			return str.charAt(0).toUpperCase() + str.slice(1);
		}
		/**
		 * Remove all spaces from start and end of string.
		 */
		, trim: function(str) {
			return str.replace(/^\s+|\s+$/g,'');
		}
		/**
		 * Convert \n to <br /> and \r\n to </p><p>.
		 */
		, brp: function(str){
			str = str.replace(/\r\n/ig, '</p><p>').replace(/\n/ig, '<br />');
			
			// Get first occurence indexes.
			var fep = str.indexOf('</p>');
			var fsp = str.indexOf('<p>');
			
			// Get last occurence indexes.
			var lep = str.lastIndexOf('</p>');
			var lsp = str.lastIndexOf('<p>');
			
			// Check if first <p> occurs before first </p>.
			if (fep >= 0 && (fsp < 0 || (fsp > fep))){
				str = '<p>'+str;
			}
			
			// Check if last </p> occurs after last <p>.
			if (lsp >= 0 && lsp > lep){
				str = str+'</p>';
			}
			
			Utils.log(fsp,fep,lsp,lep);
			
			return str;
		}
		/**
		 * Convert <br /> to \n and <p></p> to \r\n.
		 */
		, unbrp: function(str){
			return str.replace(/(\r|\n)\s*/ig, '').replace(/(<br>|<br\s*\/>)/ig, '\r\n').replace(/<p>/ig, '').replace(/<\/\s*p>/ig, '\r\n\r\n');
		}
		/**
		 * Convert unbrp'ed string to line array.
		 */
		, str_to_arr: function(str){
			return str.replace(/\r\n\s*/ig, '\n\n').split('\n');
		}
	}
});