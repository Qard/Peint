/************************************************************
 *			///// //                                    	      *
 *		 //////  ////           /                 /           *
 *		//   /  /  ///         ///               //           *
 *	   /    /  /    ///         /                //          *
 *		   /  /      //                        ////////       *
 *		  // //      //  ///  ///   ///  //// ////////        *
 *		  // //      // / ///  ///   //// //// / //           *
 *		//// //      / /   ///  //    //   ////  //           *
 *	   / /// //     / //    /// //    //    //   //          *
 *		  // ///////  ////////  //    //    //   //           *
 *		  // //////   ///////   //    //    //   //           *
 *		  // //       //        //    //    //   //           *
 *		  // //       ////    / //    //    //   //           *
 *		  // //        ///////  /// / ///   ///   //          *
 *	 //   // //         /////    ///   ///   ///             *
 *	///   /  /                                               *
 *	 ///    /                                                *
 *	  //////                                                 *
 *		///                                                   *
 *                                                          *
 *	Peint is a spiffy graphics library for HTML5 and Canvas  *
 *	The name "Peint" is derived from Peinture,               *
 *	which is the French word for Paint.                      *
 *	                                                         *
 *	Peint.core                                               *
 *		This module just initializes the canvas.              *
 *	                                                         *
 *	Copyright 2011 - Stephen Belanger                        *
 *	                                                         *
 *	BSD Licensed                                             *
 *                                                          *
 ************************************************************/
// Create our screen manager system.
window.Peint = {
	mode: null
	, canvas: null
	, context: null
	/**
	 * This is our entry point to the Peint library.
	 * To initialize the library, you will need to supply a selector and a mode.
	 */
	, init: function(selector, mode){
		// Find our item using a css selector query.
		this.canvas = document.querySelector(selector);
		
		// Make sure canvas is actually supported, otherwise return false.
		if ( ! this.canvas.getContext) { return false; }
		
		// Get rendering context using selected graphics mode.
		// Will probably expand later to properly select 3d modes,
		// using browser specific name codes.
		this.mode = mode || '2d';
		this.context = this.canvas.getContext(this.mode);
		
		return this;
	}
};