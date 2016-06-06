$( document ).ready(function() {

	//ratio of plotdiv in mainview modal (defined here but used later in modal info function)
	var ratio_plotdiv = 0.5;

	//compute the dimensions of the current div - #map-container
	var screen_width = parseInt(d3.select('#map-container').style('width'))
	  , screen_height = parseInt(d3.select('#map-container').style('height'));

	 //values from css
	var margin_map_top_bottom = 70;
	var margin_modal_height = 55;

	//compute modal dimensions
	var modal_height = screen_height - margin_modal_height;
	var modal_main_view_height = 0;

	modal_main_view_width = 0.5833333333*($("#myModal").width());

	  //set the size of the svg to be the minimum of width and height - map ratio is 1
	var width_map = Math.min(screen_width, screen_height - 2*margin_map_top_bottom)
	  , height_map = width_map;

	//behavior: if more than cutoff points, then 0.8 and 0.2, otherwise all for mainview
	if (modal_height > 1000) {
		modal_main_view_height = modal_height*0.8;
		d3.select('#modal-main-view').style('height', modal_main_view + 'px');
		d3.select('#modal-secondary-view').style('height', modal_height*0.2 + 'px');
	}
	else {
		modal_main_view_height = modal_height;
		d3.select('#modal-main-view').style('height',modal_height + 'px');
		d3.select('#modal-secondary-view').style('height','200px');
	}

	d3.select('#map').style('width', width_map + 'px');
	d3.select('#map').style('height', height_map + 'px');

	//create the svg element
	var map_svg = d3.select("#map").append("svg")
		.attr("class","map_svg")
	    .attr("width", width_map)
	    .attr("height", height_map);

	    //different d3 projections. https://github.com/d3/d3/wiki/Geo-Projections
	var projection = d3.geo.orthographic()
	    //If scale is specified, sets the projection’s scale factor to the specified value and returns the projection. If scale is not specified, returns the current scale factor which defaults to 150. The scale factor corresponds linearly to the distance between projected points.
	    //A scale of 1 projects the whole world onto a 1x1 pixel.  So a scale of 400 projects onto a 400x400 square. 
	    .scale(width_map/2)
	    //If angle is specified, sets the projection’s clipping circle radius to the specified angle in degrees and returns the projection.
	    .clipAngle(90)
	    //The translate parameter simply refers to where the centre of this square should be in pixels.  So a translate of [200, 200] projects the origin onto [200, 200] in pixel-space. 
	    //If point is specified, sets the projection’s translation offset to the specified two-element array [x, y] and returns the projection.
	    .translate([width_map / 2, height_map / 2])
	    //If precision is specified, sets the threshold for the projection’s adaptive resampling to the specified value in pixels and returns the projection.
	    //D3 3.0’s projections use adaptive resampling to increase the accuracy of projected lines and polygons while still performing efficiently (http://bl.ocks.org/mbostock/3795544).
	    .precision(0.6);

	//create path variable and plan the location click behavior.
	var path = d3.geo.path()
    	.projection(projection)
    	.pointRadius(8);
    var path_clicked = d3.geo.path()
    	.projection(projection)
    	.pointRadius(12);
    var current_location = 0;

    //adding water
	//in the style sheet change color of class water
	map_svg.append("path")
	  //The type "Sphere" is also supported, which is useful for rendering the outline of the globe. A sphere has no coordinates.
	  .datum({type: "Sphere"})
	  .attr("class", "water")
	  .attr("d", path);

	//load the files
	//read more about queue() tasks: https://github.com/d3/d3-queue
	queue()
	    .defer(d3.json, "world.json")
	    .defer(d3.csv, "locations.csv")
	    //here will go every other external files / or not
	    .await(draw_globe);

	var coordinates_locations = {};
	var n_locations = 0;

	//When a task completes, it must call the provided callback. The first argument to the callback should be null if the task is successfull, or the error if the task failed.
	function draw_globe(error, world, locations) {

	  if (error) throw error;

	  //the world file is a topojson file
	  //Returns the GeoJSON Feature or FeatureCollection for the specified object in the given topology. If the specified object is a GeometryCollection, a FeatureCollection is returned, and each geometry in the collection is mapped to a Feature. Otherwise, a Feature is returned.
	  //https://github.com/mbostock/topojson/wiki/API-Reference
	  var countries = topojson.feature(world, world.objects.countries).features;

	  //sens for dragging call
	  sens = 0.25

	  //draw the countries paths
	  var world = map_svg.selectAll("path.land")
	    .data(countries)
	      .enter().append("path")
	      .attr("class", "land")
	      .attr("d", path);

	    //draw the locations path
	  locations.forEach(function(d) {
	  	n_locations += 1;
	    thispoint = map_svg.append("path")
	        //from the csv take lat long to create a path object
	        .datum({type: "Point", coordinates: [d.lon, d.lat]})
	        .attr("class", "locations")
	        .attr("fill","yellow")
	        // .attr("class","nonactivepoint")
	        .attr("d", path)
	        //add the attribute for location id
	        .attr("id","location_" + d.location_id)
	        .on("click", function() {
	        	map_svg.select("#location_" + current_location).attr("fill","yellow")
	        								.attr("d", path);
	        	d3.select(this).attr("fill","orange")
	        					.attr("d", path_clicked);
	        	current_location = d.location_id;
	        	center_on_location(current_location);
	        })
	        // .on("click", function() {
		       //  			center_on_location(d.location_id);
		       //  			show_info_inside_modal(d.location_id);
		       //  		});
	    coordinates_locations[d.location_id] = [d.lon,d.lat];
	  });

	  //Drag event
	  map_svg.selectAll("path").call(d3.behavior.drag()
	        .origin(function() { var r = projection.rotate(); return {x: r[0] / sens, y: -r[1] / sens}; })
	        .on("drag", function() {
	          //make sure that the rotate event stops when you start draging
	          var rotate = projection.rotate();
	          projection.rotate([d3.event.x * sens, - d3.event.y * sens, rotate[2]]);
	          map_svg.selectAll("path.land").attr("d", path);
	          map_svg.selectAll("path.locations").attr("d", path);
	          map_svg.select("#location_" + current_location).attr("d", path_clicked);
	        }))
	} // End function draw_globe

	d3.select(window).on('resize', resize);

	//resize behavior
	function resize() {

					//compute the dimensions of the current div - #map-container
			screen_width = parseInt(d3.select('#map-container').style('width'))
			  , screen_height = parseInt(d3.select('#map-container').style('height'));

			width_map = Math.min(screen_width, screen_height - 2*margin_map_top_bottom)
	  			, height_map = width_map;

	  		// update projection
		    projection
		        .translate([width_map / 2, height_map / 2])
		        .scale(width_map/2);

			d3.select('#map').style('width',width_map + 'px');
		  	d3.select('#map').style('height',height_map + 'px');

				    // resize the map id
		    map_svg
		        .style('width', width_map + 'px')
		        .style('height', height_map + 'px');

		    // resize the map - beware that the clicked location has a particular path
	    	map_svg.selectAll("path").attr("d", path);
	    	map_svg.select("#location_" + location_clicked).attr("d", path_clicked);

	} // end of resize function

	//click events functions

	//start tour - showing modal
    $("#start_tour").on('click', function() {
    	map_svg.select("#location_" + current_location).attr("fill","yellow").attr("d",path);
	    current_location = 1;
	    map_svg.select("#location_" + current_location).attr("fill","orange").attr("d",path_clicked);
      	$("#myModal").modal('show');
      	center_on_location(current_location);
      	show_info_inside_modal(current_location);
    });

    //disable default behavior: moves the window
    window.addEventListener("keydown", function(e) {
    // space and arrow keys
		    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
		        e.preventDefault();
		    }
		}, false);

    //keyboard events
    d3.select("body").on({
        keydown: function(d) {
          // when you click the down arrow key, go to next location
          if(d3.event.keyCode == 38) { 
          	d3.select("#modal-up").classed("gray2", true);
            map_svg.select("#location_" + current_location).attr("fill","yellow").attr("d",path);
            current_location += 1;
            current_location = current_location % (n_locations+1);
            if (current_location==0) {current_location=1};
            map_svg.select("#location_" + current_location).attr("fill","orange").attr("d",path_clicked);
            center_on_location(current_location);
            //show_info_inside_modal(current_location);
          }
          // when you click the up arrow key, go to prev location
          if (d3.event.keyCode == 40) {
            d3.select("#modal-down").classed("gray2", true);
            map_svg.select("#location_" + current_location).attr("fill","yellow").attr("d",path);
            current_location -= 1;
            current_location = current_location % (n_locations+1);
            if (current_location<=0) {current_location=n_locations};
            map_svg.select("#location_" + current_location).attr("fill","orange").attr("d",path_clicked);
            center_on_location(current_location);
            //show_info_inside_modal(current_location);
          }
          // when you click the right/left arrow keys, step through the timeline
          if (d3.event.keyCode == 39) {
          	 d3.select("#right").classed("gray2",true);
          	//step_through_time(d3.event.keyCode);
          } 
          if (d3.event.keyCode == 37) {
          	d3.select("#left").classed("gray2", true);
        	//step_through_time(d3.event.keyCode);
          }
        },
        keyup: function(d) {
        	if (d3.event.keyCode==39) {
          	 	d3.select("#right").classed("gray2", false);
	        }
	        if (d3.event.keyCode==37) {
	        	d3.select("#left").classed("gray2", false);
	        }
	        if (d3.event.keyCode==38) {
	            d3.select("#modal-up").classed("gray2", false);
	        }
	        if (d3.event.keyCode==40) {
	            d3.select("#modal-down").classed("gray2", false);
	        }
	     }
     }) //end of select body

    //center location function
    function center_on_location(current_location) {

      d3.transition()
          .duration(1250)
          .tween("rotate", function() {
              var r = d3.interpolate(projection.rotate(), [-coordinates_locations[current_location][0],-coordinates_locations[current_location][1]]);
              return function(t) {
                projection.rotate(r(t));
                map_svg.selectAll("path.land").attr("d", path);
                map_svg.selectAll("path.locations").attr("d", path);
                map_svg.select("#location_" + current_location).attr("d", path_clicked);
              };
            })

    } //end of center_on_location function


    //write function for showing info inside modal

    // --- Define global variables for keyboard and mouse input
	var activeidx = 0;
	var activemouse = null;
	var allbars = null;
	var activebarcolor = "Gray";
	var inactivebarcolor = "LightGray";

    function show_info_inside_modal(current_location) {

    	$("#modal-title").html("");
	    $("#imgdiv").html("");
	    $("#plotdiv").html("");
	    $("#moreinfodiv").html("");

	    activeidx = 0;
		activemouse = null;
		allbars = null;

		$("#myModal").modal('show');

		d3.csv("timeline/location" + current_location + ".csv", function(chart_data) {

			// --- Make data into numbers    
		    var parseDate = d3.time.format("%m/%d/%Y").parse;
		    chart_data.forEach(function(d) {
		        d.localdata = +d.localdata;
		        d.globaldata = +d.globaldata;
		        d.date = parseDate(d.date);
		        d.x = +d.x;
		        d.y = +d.y;
		        d.singleimgwidth = +d.singleimgwidth;
		        d.singleimgheight = +d.singleimgheight;
		        d.totalimgwidth = +d.totalimgwidth;
		        d.totalimgheight = +d.totalimgheight;
		    });	

		            // --- Subselect the following data: 
		    var id = 0;
		    for (var i = 0; i < chart_data.length; i++) {chart_data[i].id = id++;}
		    // Data associated with images
		    imgdata = chart_data.filter(filterByX);
		    // Data associated with non-null local data
		    localdata = chart_data.filter(filterByLocalData);
		    // Data associated with non-null global data
		    globaldata = chart_data.filter(filterByGlobalData);

		    // --- Calculate begin and end IDs of image time series 
		    imgIDarray = imgdata.map(function(d) { return +d.id; });
		    min_imgID = Math.min.apply(null,imgIDarray);
		    max_imgID = Math.max.apply(null,imgIDarray);

		    // --- Define image size attributes
            single_img_width = chart_data[0].singleimgwidth; 
		    single_img_height = chart_data[0].singleimgheight; 
            total_img_width = chart_data[0].totalimgwidth; 
		    total_img_height = chart_data[0].totalimgheight; 

		    // --- Define margins + plot and image widths/heights
		    var width = {image: single_img_width, plot: modal_main_view_width, image_total: total_img_width};
		    var height = {image: single_img_height, plot: ratio_plotdiv*modal_main_view_height, image_total: total_img_height};

		    //----------------------------------
		    // Display location title within div=titlediv
		    //----------------------------------
		    var title = d3.select("#modal-title")
		        .append("text")
		        .attr("class","title-modal")
		        .text(chart_data[0].title);

		    //----------------------------------
		    // Set up image display features in overarching div=imgdiv
		    // w/ both images also within div=imgdiv
		    //----------------------------------

		    var defs = d3.select("#imgdiv")
		        .append("svg")
		        .attr("class", "defs")
		        .attr("x",0)
		        .attr("y",0)
		        .attr("width",0)
		        .attr("height",0)
		        .append("defs");
		    
		    defs.append("image")
		        .attr("class", "sidebysideimage")
		        .attr("id", "satellite")
		        .attr("xlink:href", "img/location" + current_location + ".png")
		        .attr("width", width.image_total)
		        .attr("height", height.image_total);
		    
		    defs.append("clipPath")
		        .attr("id", "satellite-cp")
		        .append("rect")
		        .attr("x",0)
		        .attr("y",0)
		        .attr("height", height.image)
		        .attr("width", width.image);

		    // append/enter image data
		    defs.selectAll("g")
		        .data(imgdata).enter()
		        .append("g")
		            .attr("id", function(d) { return "imgID" + d.id; })
		            .attr("clip-path", "url(#satellite-cp)")
		        .append("use")
		            //id of image
		            .attr("xlink:href", "#satellite")
		            .attr("transform", function(d) { return "translate("+d.x+","+d.y+")"; });

		    // define year label positions on top of images
		    var xposyrlabel = single_img_width, yposyrlabel = 75;

		    // initially display the earliest image on the left by default
		    var before = d3.select("#imgdiv")
		        .append("svg")
		            .attr("viewBox", "0 0 " + width.image + " " + height.image)
		            .attr("id", "svgbefore")
		            .style("display", "inline")
		            .classed("sidebysideimage", true)
		        .append("use")
		            .attr("id", "imagebefore")
		            .attr("xlink:href", "#imgID" + min_imgID);

		    d3.select("#svgbefore")
		        .append("text")
		        .attr("id", "before-text")
		        .text(chart_data[min_imgID].date.getFullYear())
		        .attr("x",xposyrlabel)
		        .attr("y",yposyrlabel)
		        .style("font-size", "100px")
                        .style("text-anchor", "end")
		        .style("fill","white");

		    // initially display the most recent image on the right by default 
		    var after = d3.select("#imgdiv")
		        .append("svg")
		            .attr("viewBox", "0 0 " + width.image + " " + height.image)
		            .attr("id", "svgafter")
		            .style("display", "inline")
		            .classed("sidebysideimage", true)
		        .append("use")
		            .attr("id", "imageafter")
		            .attr("xlink:href", "#imgID" + max_imgID);
		    
		    d3.select("#svgafter")
		        .append("text")
		        .text(chart_data[max_imgID].date.getFullYear())
		        .attr("x", xposyrlabel)
		        .attr("y", yposyrlabel)
		        .style("font-size", "100px")
                        .style("text-anchor", "end")
		        .style("fill","white");

		    // add image src info on top of after image
		    d3.select("#imgsrc")
		        .text(chart_data[0].imgsrctext);
		    $("#imgsrc").on('click', function() {
		        	window.open(fulldata[0].imgsrcurl);
		    	});

		    //---------------------------------
		    // Add more info to div=moreinfodiv 
		    //---------------------------------
		    var moreinfo = d3.select("#moreinfodiv")
		        .append("text")
		        .attr("class","moreinfo")
		        .text(fulldata[0].moreinfo)

		}); // end d3.csv
		
	}; // end show_info_inside_modal function

	//-----------------
	// HELPER FUNCTIONS FOR PLOT DIV
		//-----------------
	function findindexbyid(arraytosearch, idtosearch) {
	    for (var i = 0; i < arraytosearch.size(); i++) {
	        if (arraytosearch[0][i].id == idtosearch) {return i;}
	    }
		    return null;
	}

	function filterByX(obj,invalidEntries) {
	   if ('x' in obj && typeof(obj.x) === 'number' && !isNaN(obj.x)) {
	      return true;
	   }
	   else {
	      invalidEntries++;
	      return false;
	   }
	}

	function filterByLocalData(obj,invalidEntries) {
	   if ('localdata' in obj && typeof(obj.localdata) === 'number' && !isNaN(obj.localdata)) {
	      return true;
	   }
	   else {
	      invalidEntries++;
	      return false;
	   }
	}

	function filterByGlobalData(obj,invalidEntries) {
	   if ('globaldata' in obj && typeof(obj.globaldata) === 'number' && !isNaN(obj.globaldata)) {
	      return true;
	   }
	   else {
	      invalidEntries++;
	      return false;
	   }
	}

	function mouseover_timeline() {
	    // NOTE: activemouse.id.substring(6) is the selected number following "rectID" 
	    d3.select("text#instructions").style("opacity",0);
	    d3.select(this).style("fill", activebarcolor);
	    this.style.cursor = "pointer";
	    d3.select("text#annoID" + allbars[0][activeidx].id.substring(6)).style("opacity",0);
	    d3.select("text#annoID" + this.id.substring(6)).style("opacity",1);
	}

	function mouseout_timeline() {
	    // NOTE: activemouse.id.substring(6) is the selected number following "rectID" 
	    if (findindexbyid(allbars,this.id) != activeidx) {
	        d3.select(this).style("fill", inactivebarcolor);
	        d3.select("text#annoID" + this.id.substring(6)).style("opacity",0);
	        d3.select("text#annoID" + allbars[0][activeidx].id.substring(6)).style("opacity",1);
	        d3.select("rect#rectID" + max_imgID).style("fill", activebarcolor); // this is needed to keep last dot white after hovering over it
	    }
	}

	function click_timeline() {
	    // NOTE: activemouse.id.substring(6) is the selected number following "rectID" 
	    d3.select("text#instructions").style("opacity",0);
	    d3.select("text#annoID" + allbars[0][activeidx].id.substring(6)).style("opacity",0);
	    d3.select("#plotdiv").select("svg#plot").selectAll("rect").style("fill", inactivebarcolor);
	    d3.select("rect#rectID" + max_imgID).style("fill", activebarcolor);
	    activemouse = this;
	    activeidx = findindexbyid(allbars,activemouse.id);
	    d3.select(allbars[0][activeidx]).style("fill", activebarcolor);
	    d3.select("text#annoID" + allbars[0][activeidx].id.substring(6)).style("opacity",1);
	    d3.select("use#imagebefore").attr("xlink:href", "#imgID" + allbars[0][activeidx].id.substring(6));
	    d3.select("#before-text").text(fulldata[allbars[0][activeidx].id.substring(6)].date.getFullYear());
	}
		
	function wrap(text, width) {
		  text.each(function() {
			    var text = d3.select(this),
			        words = text.text().split(/\s+/).reverse(),
			        word,
			        line = [],
			        lineNumber = 0,
			        lineHeight = .2, // ems
			        y = text.attr("y"),
			        dy = parseFloat(text.attr("dy")),
			        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
			    while (word = words.pop()) {
			      line.push(word);
			      tspan.text(line.join(" "));
			      if (tspan.node().getComputedTextLength() > width) {
			        line.pop();
			        tspan.text(line.join(" "));
			        line = [word];
			        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
		      }
		    }
		  });
	}

	function wrap_anno(text, width) {
		  text.each(function() {
		    var text = d3.select(this),
		        words = text.text().split(/\s+/).reverse(),
		        word,
		        line = [],
		        lineNumber = 0,
		        lineHeight = 1.1, // ems
		        y = text.attr("y"),
		        dy = parseFloat(text.attr("dy")),
		        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
		    while (word = words.pop()) {
		      line.push(word);
		      tspan.text(line.join(" "));
		      if (tspan.node().getComputedTextLength() > width) {
		        line.pop();
		        tspan.text(line.join(" "));
		        line = [word];
		        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
		      }
		    }
		});
	}

}); // end document ready function