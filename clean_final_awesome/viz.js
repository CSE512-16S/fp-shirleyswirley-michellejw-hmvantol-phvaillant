$( document ).ready(function() {

	//ratio of plotdiv in mainview modal (defined here but used later in modal info function)
	//and ratio mainview in modal body
	var ratio_plotdiv = 0.5;
	var ratio_mainview = 0.8;

	//compute the dimensions of the current div - #map-container
	var screen_width = parseInt(d3.select('#map-container').style('width'))
	  , screen_height = parseInt(d3.select('#map-container').style('height'));

	 //values from css
	var margin_map_top_bottom = 70;
	var margin_modal_height = 47;

	//compute modal dimensions
	var modal_height = screen_height - margin_modal_height;
	var modal_main_view_height = 0;

	modal_main_view_width = 0.5833333333*($("#myModal").width());

	  //set the size of the svg to be the minimum of width and height - map ratio is 1
	var width_map = Math.min(screen_width, screen_height - 2*margin_map_top_bottom)
	  , height_map = width_map;

	//behavior: if more than cutoff points, then 0.8 and 0.2, otherwise all for mainview
	if (modal_height > 1000) {
		modal_main_view_height = modal_height*ratio_mainview;
		d3.select('#modal-main-view').style('height', modal_main_view_height + 'px');
		d3.select('#modal-secondary-view').style('height', modal_height*(1-ratio_mainview) + 'px');
	}
	else {
		modal_main_view_height = modal_height;
		d3.select('#modal-main-view').style('height', modal_main_view_height + 'px');
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
	    	map_svg.select("#location_" + current_location).attr("d", path_clicked);

	    	//resize img div
	    	//compute modal dimensions
			modal_height = screen_height - margin_modal_height;

			modal_main_view_width = 0.5833333333*($("#myModal").width());

			//behavior: if more than cutoff points, then 0.8 and 0.2, otherwise all for mainview
			if (modal_height > 1000) {
				modal_main_view_height = modal_height*ratio_mainview;
				d3.select('#modal-main-view').style('height', modal_main_view_height + 'px');
				d3.select('#modal-secondary-view').style('height', modal_height*(1-ratio_mainview) + 'px');
			}
			else {
				modal_main_view_height = modal_height;
				d3.select('#modal-main-view').style('height', modal_main_view_height + 'px');
				d3.select('#modal-secondary-view').style('height','200px');
			}

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
        	n_key = d3.event.keyCode;
          // when you click the down arrow key, go to next location
          if(n_key == 38) { 
          	d3.select("#modal-up").classed("gray2", true);
            map_svg.select("#location_" + current_location).attr("fill","yellow").attr("d",path);
            current_location += 1;
            current_location = current_location % (n_locations+1);
            if (current_location==0) {current_location=1};
            map_svg.select("#location_" + current_location).attr("fill","orange").attr("d",path_clicked);
            center_on_location(current_location);
            show_info_inside_modal(current_location);
          }
          // when you click the up arrow key, go to prev location
          if (n_key == 40) {
            d3.select("#modal-down").classed("gray2", true);
            map_svg.select("#location_" + current_location).attr("fill","yellow").attr("d",path);
            current_location -= 1;
            current_location = current_location % (n_locations+1);
            if (current_location<=0) {current_location=n_locations};
            map_svg.select("#location_" + current_location).attr("fill","orange").attr("d",path_clicked);
            center_on_location(current_location);
            show_info_inside_modal(current_location);
          }
          // when you click the right/left arrow keys, step through the timeline
          if (n_key == 39) {
          	 d3.select("#right").classed("gray2",true);
          	step_through_time(n_key);
          } 
          if (n_key == 37) {
          	d3.select("#left").classed("gray2", true);
        	step_through_time(n_key);
          }
        },
        keyup: function(d) {
        	n_key = d3.event.keyCode;
        	if (n_key==39) {
          	 	d3.select("#right").classed("gray2", false);
	        }
	        if (n_key==37) {
	        	d3.select("#left").classed("gray2", false);
	        }
	        if (n_key==38) {
	            d3.select("#modal-up").classed("gray2", false);
	        }
	        if (n_key==40) {
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

	// --- Define global plot variables
	var margin_plot = {top:50, right:110, bottom:50, left:75};

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

		    function draw_imgdiv() {
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

		    } //end of function draw_imgdiv

		    function draw_plotdiv() {
		    	
		    	    //---------------------------------
				    // Set up all line plot features and
				    // then plot lines within div=plotdiv
				    //----------------------------------

				    var x = d3.time.scale()
				        .range([0,width.plot - margin_plot.left - margin_plot.right]);
				    
				    // l = local data
				    var yl = d3.scale.linear()
				        .range([height.plot - margin_plot.top - margin_plot.bottom, margin_plot.top]);
				    
				    // g = global data
				    var yg = d3.scale.linear()
				        .range([height.plot - margin_plot.top - margin_plot.bottom, margin_plot.top]);
				    
				    var x_axis = d3.svg.axis()
				        .scale(x)
				        .orient("bottom");
				    
				    var y_axisl = d3.svg.axis()
				        .scale(yl)
			                .ticks(5)
				        .orient("left");
				         
				    var y_axisg = d3.svg.axis()
				        .scale(yg)
			                .ticks(5)
				        .orient("right");
				    
				    var linel = d3.svg.line()
				        .x(function(d) { return x(d.date); })
				        .y(function(d) { return yl(d.localdata); });
				         
				    var lineg = d3.svg.line()
				        .x(function(d) { return x(d.date); })
				        .y(function(d) { return yg(d.globaldata); });

				    // set up plot area 
				    var svg_plot = d3.select("#plotdiv")
				        .append("svg")
				            .attr("id", "plot")
				            .classed("svg-container", true);

				    // label x-axis - positioning
				    svg_plot.append("text")
				        .attr("class", "xlabel")
				        .attr("id","xlabel")
				        .attr("text-anchor", "middle")
				        .attr("x", (width.plot)/2)
				        .attr("y", height.plot-margin_plot.top/4)
				        .text("Year");

				    // label local data left y-axis
				    svg_plot.append("text")
				        .attr("class", "ylabel")
				        .attr("id", "ylabell")
				        .attr("text-anchor", "middle")
				        //here is the complicated line for positining on the left
				        .attr("transform", "translate(0,"+(height.plot-margin_plot.bottom)/2 +")rotate(-90)")
				        .attr("dy", "0.8em")
				        .on({
				            click: function() {
				                // Determine if current line is visible
				                var activeline = ylabell.active ? false : true,
				                    newOpacity = activeline ? 0 : 1;
				                // Hide or show the elements
				                d3.select("#localLine").style("opacity", newOpacity);
				                // Update whether or not the elements are active
				                ylabell.active = activeline;
				            } //,
				        })
				        .text(chart_data[0].localylabel)
				        //PROBLEM: WRAPPING FUNCTION IS NOT WORKING RIGHT NOW;
				        .call(wrap, yl.range()[0]-yl.range()[1],0.2);

				    // label global data right y-axis
				    svg_plot.append("text")
				        .attr("class", "ylabel")
				        .attr("id", "ylabelg")
				        .attr("text-anchor", "middle")
				        //here is the complicated line for positining on the right
				        .attr("transform", "translate("+(width.plot-0.65*margin_plot.left)+","+(height.plot-margin_plot.bottom)/2+")rotate(90)")
				        .attr("dy", "0.8em")
				        .style("opacity", 1)
				        .on({
				            click: function() {
				                // Determine if current line is visible
				                var activeline = ylabelg.active ? false : true,
				                    newOpacity = activeline ? 0 : 1;
				                // Hide or show the elements
				                d3.select("#globalLine").style("opacity", newOpacity);
				                // Update whether or not the elements are active
				                ylabelg.active = activeline;
				            }
				        })
				        .text(chart_data[0].globalylabel)
				        .call(wrap, yg.range()[0]-yg.range()[1],0.2);

				        //WRAP TO FIX
				        //console.log(svg_plot.selectAll("#ylabelg"));
				        //console.log(d3.select("#ylabell")
				       // console.log(d3.select("#ylabell").selectAll("text"));
				        //console.log(d3.select("#ylabell").selectAll("text").call(wrap,yg.range()[0]-yg.range()[1]))

				    // define data domains
				    x.domain(d3.extent(chart_data, function(d) { return d.date; }));
				    yl.domain(d3.extent(chart_data, function(d) { return d.localdata; }));
				    yg.domain(d3.extent(chart_data, function(d) { return d.globaldata; }));

				    // draw rectangles in background
			        var barwidth = width.plot/50;
				    var bars = svg_plot.selectAll("rect")
				            .data(imgdata).enter()
				            .append("rect")
					            .attr("id", function(d) { return "rectID" + d.id; })
					            .attr("x", function(d) { return x(d.date) - (barwidth/2);})
					            .attr("y", margin_plot.top)
					            .attr("transform", "translate("+margin_plot.left+",0)")
					            .attr("width", barwidth+"px")
					            .attr("height", [height.plot-margin_plot.top*2-margin_plot.bottom].toString() + "px")
					            .style("stroke-width", "3px")
					            .style("fill", inactivebarcolor);

					// draw x-axis
				    svg_plot.append("g")
				        .attr("class", "xaxis-bottom")
				        .attr("transform", "translate(" + margin_plot.left + "," + [height.plot - margin_plot.top - margin_plot.bottom] + ")")
				        .call(x_axis)
			                .selectAll("text")
				            .attr("transform", "rotate(-65)")
			                    .attr("dx", "-.8em")
			                    .attr("dy", ".15em")
			                    .style("text-anchor", "end");

			        // draw local data left y-axis
				    svg_plot.append("g")
				            .attr("class", "yaxis-l")
				            .attr("id", "localAxis")
				            .attr("transform", "translate(" + (margin_plot.left-barwidth/2) + ",0)")
				            .call(y_axisl);
				    
				    // draw global data right y-axis
				    svg_plot.append("g")
				            .attr("class", "yaxis-g")
				            .style("opacity", 1)
				            .attr("id", "globalAxis")
				            .attr("transform", "translate(" + (width.plot-margin_plot.right+barwidth/2) + ",0)")
				            .call(y_axisg);
				    
				    // draw local data line
				    svg_plot.append("path")
				        .datum(localdata)
				            .attr("class", "line-l")
				            .style("opacity", 1) // show local data initially by default
				            .attr("id","localLine")
				            .attr("transform", "translate(" + margin_plot.left + ",0)")
				            .attr("d",linel);
				    
				    // draw global data line
				    svg_plot.append("path")
				        .datum(globaldata)
				            .attr("class", "line-g")
				            .style("opacity", 1) // show global data initially by default
				            .attr("id", "globalLine")
				            .attr("transform", "translate(" + margin_plot.left + ",0)")
				            .attr("d",lineg);

				    // add annotations // CHANGE A LOT OF THINGS HERE
				    d3.select("#annodiv").append("svg")
				    		.attr("id","anno_svg")
				    		.attr("class","svg-content-responsive")
				    	.selectAll("text#anno")
			           	.data(imgdata).enter()
			            .append("text")
			                .attr("id", function(d) { return "annoID" + d.id; })
			                //.attr("class", "annoID")
			                .attr("class", "annotation") // from css
			                // .attr("x", modal_main_view_width*0.8*0.5)
			                // .attr("y", modal_main_view_height*0.1*0.1)
			                // .attr("dy", "0.8em")
			                .attr("x","50%")
			                .attr("y","50%")
			                .style("opacity", 0)
			                //.style("text-align","center")
			                .style("text-anchor","middle")
			                //.style("alignment-baseline","middle")
			                //.attr("transform", "translate("+modal_main_view_width*0.8*0.5+",0)")
			                .text(function(d) { return d.annotation; })
			                //.attr("d", function(d) { return console.log(d.annotation);})
			                .call(wrap, modal_main_view_width*5/6, 1.1);

			                //console.log(modal_main_view_width*5/6);
			                //console.log(d3.selectAll(".annotation"));
			                //console.log(wrap(d3.selectAll(".annotation"),modal_main_view_width*5/6,1.1));
				     

				    //d3.select("#annodiv").selectAll("text.annotation").call(wrap_anno, modal_main_view_width*0.8);
				    //console.log(d3.select("#annodiv").selectAll("text.annotation"))

				    // differently color/size the bars at the very beginning and end of the time series
				    d3.select("rect#rectID" + min_imgID).style("fill", activebarcolor);
				    d3.select("rect#rectID" + max_imgID).style("fill", activebarcolor);

				    //---------------------------------
				    // Add interactivity to bars along the x-axis corresponding
				    // to images, all still within div=plotdiv
				    //---------------------------------
				    allbars = d3.select("#plotdiv").select("svg#plot").selectAll("rect");

				    // --- mouse-dot interactivity
				    bars.on("click", click_timeline)
				        .on("mouseover", mouseover_timeline)
				        .on("mouseout", mouseout_timeline);

				    //color the last bar
				    d3.select("rect#rectID" + max_imgID).style("fill", activebarcolor);


		    } //end of draw_plotdiv

		    //draw image div and plot div
		    draw_imgdiv();
		    draw_plotdiv();

		    // add image src info on top of after image
		    d3.select("#imgsrc")
		        .text(chart_data[0].imgsrctext);
		    $("#imgsrc").on('click', function() {
		        	window.open(chart_data[0].imgsrcurl);
		    	});

		    //---------------------------------
			 // Add more info to div=moreinfodiv 
			//---------------------------------
			var moreinfo = d3.select("#moreinfodiv")
				    .append("text")
				    .attr("class","moreinfo")
				    .text(chart_data[0].moreinfo)

		}); // end d3.csv
		
	}; // end show_info_inside_modal function

	function step_through_time(keyCode) {
		      d3.select("text#instructions").style("opacity",0);
		      d3.select("text#annoID" + allbars[0][activeidx].id.substring(6)).style("opacity",0);
		      if (keyCode == 39 && activeidx<allbars.size()-1) { // right arrow key
		          activeidx++; // don't go further right than there are pts
		      }
		      if (keyCode == 37 && activeidx>0) { // left arrow key
		          activeidx--; // don't go further left than there are pts
		      }
		      d3.select("#plotdiv").select("svg#plot").selectAll("rect").style("fill", inactivebarcolor);
		      d3.select(allbars[0][activeidx]).style("fill", activebarcolor);
		      d3.select("text#annoID" + allbars[0][activeidx].id.substring(6)).style("opacity",1);
		      d3.select("use#imagebefore").attr("xlink:href", "#imgID" + allbars[0][activeidx].id.substring(6));
		      d3.select("#before-text").text(fulldata[allbars[0][activeidx].id.substring(6)].date.getFullYear());
		  }; //end step_through_time function

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
		
	function wrap(text, width, ems) {
		console.log(text,width,ems);
		  text.each(function() {
			    var text = d3.select(this),
			        words = text.text().split(/\s+/).reverse(),
			        word,
			        line = [],
			        lineNumber = 0,
			        lineHeight = ems, // ems
			        y = text.attr("y"),
			        dy = parseFloat(text.attr("dy")),
			        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
			        console.log(text,words, words.pop(),word);
			        console.log(word);
			        console.log(word = words.pop())
			    while (word = words.pop()) {
			      line.push(word);
			      console.log(word);
			      tspan.text(line.join(" "));
			      console.log(line, tspan.node());
			      console.log(tspan, tspan.node().getComputedTextLength(), width);
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