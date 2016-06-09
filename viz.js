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

	//create the map svg element and the tooltip
	var map_svg = d3.select("#map").append("svg")
		.attr("class","map_svg")
	    .attr("width", width_map)
	    .attr("height", height_map);
	var tooltip = d3.select('#map-container').append('div')
            .attr('class', 'hidden tooltip');

	//create the global variables for plot size
	var x, yl, yg, x_axis, y_axisl, y_axisg, linel, lineg, svg_plot, bar, barwidth, width, height, labely_local, labely_global;
	var years_img = [];

	//binary for firing mouseout event or not
	var mouseout = true;

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
    	.pointRadius(7);
    var path_clicked = d3.geo.path()
    	.projection(projection)
    	.pointRadius(13);
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
	        .on("click", function(e) {
	        	map_svg.select("#location_" + current_location).attr("fill","yellow")
	        								.attr("d", path);
	        	d3.select(this).attr("fill","orange")
	        					.attr("d", path_clicked);
	        	current_location = d.location_id;
	        	mouseout = false;
	        	center_on_location(current_location);
	        	show_info_inside_modal(current_location);
	        })
	        .on('mousemove', function() {
	        		//The mouse variable below does not have the same value whether we use chrome or firefox: why??
                    //var mouse = d3.mouse(map_svg.node()).map(function(d) {
                    //    return parseInt(d);
                    //});
	        		//console.log(mouse);
                    tooltip.classed('hidden', false)
                        .attr('style', 'left:' + (d3.event.pageX + 15) +
                                'px; top:' + (d3.event.pageY - 35) + 'px')
                        .html(d.location_name);
                })
            .on('mouseout', function() {
	            	if (mouseout) {
	                    tooltip.classed('hidden', true);
	                }
                });
	    coordinates_locations[d.location_id] = [d.lon,d.lat,d.location_name];
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

	    	//resize the tooltip when shown (modal on)
	    	tooltip.attr('style', 'left:' + (screen_width/2 + 15) +
                                'px; top:' + (screen_height/2 - 35) + 'px')

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

			//resize the plot
			width.plot = modal_main_view_width;
			height.plot = ratio_plotdiv*modal_main_view_height;
			x.range([0,width.plot - margin_plot.left - margin_plot.right]);
			yl.range([height.plot - margin_plot.top - margin_plot.bottom, margin_plot.top]);
			yg.range([height.plot - margin_plot.top - margin_plot.bottom, margin_plot.top]);
			x_axis.scale(x);
			y_axisl.scale(yl);
			y_axisg.scale(yg);

			svg_plot.select("#xlabel").attr("x", (width.plot)/2)
				        .attr("y", height.plot-margin_plot.top/4)
			svg_plot.select("#ylabell").attr("transform", "translate(0,"+(height.plot-margin_plot.bottom)/2 +")rotate(-90)");
			svg_plot.select("#ylabelg").attr("transform", "translate("+(width.plot-0.65*margin_plot.left)+","+(height.plot-margin_plot.bottom)/2+")rotate(90)");

			barwidth = width.plot/50;
			bars.attr("x", function(d) { return x(d.date) - (barwidth/2);})
					            .attr("y", margin_plot.top)
					            .attr("transform", "translate("+margin_plot.left+",0)")
					            .attr("width", barwidth+"px")
					            .attr("height", [height.plot-margin_plot.top*2-margin_plot.bottom].toString() + "px")
			svg_plot.select(".xaxis-bottom").attr("transform", "translate(" + margin_plot.left + "," + [height.plot - margin_plot.top - margin_plot.bottom] + ")")
				        .call(x_axis);
			svg_plot.select("#localAxis").attr("transform", "translate(" + (margin_plot.left-barwidth/2) + ",0)").call(y_axisl);
			svg_plot.select("#globalAxis").attr("transform", "translate(" + (width.plot-margin_plot.right+barwidth/2) + ",0)").call(y_axisg);
			svg_plot.select("#localLine").attr("transform", "translate(" + margin_plot.left + ",0)")
				            .attr("d",linel);
			svg_plot.select("#globalLine").attr("transform", "translate(" + margin_plot.left + ",0)")
				            .attr("d",lineg);

			d3.selectAll("tspan").remove();
			d3.select("#annodiv").selectAll(".annotation").text(function(d) { return d.annotation; }).call(wrap, modal_main_view_width*5/6-20, 1.1, true);
			svg_plot.selectAll("#ylabell").text(labely_local).call(wrap, modal_main_view_height*ratio_plotdiv-margin_plot.bottom,0.2, false);
			svg_plot.selectAll("#ylabelg").text(labely_global).call(wrap, modal_main_view_height*ratio_plotdiv-margin_plot.bottom,0.2, false);



	} // end of resize function

	//click events functions
	d3.select("#modal-up").on('click', function() {
    	map_svg.select("#location_" + current_location).attr("fill","yellow").attr("d",path);
        current_location += 1;
        current_location = current_location % (n_locations+1);
        if (current_location==0) {current_location=1};
        map_svg.select("#location_" + current_location).attr("fill","orange").attr("d",path_clicked);
        center_on_location(current_location);
        show_info_inside_modal(current_location);
    });

    //make sure that no locations are selected when modal closes
    $('#myModal').on('hidden.bs.modal', function () {
    	map_svg.select("#location_" + current_location).attr("fill","yellow").attr("d",path);
    	current_location = 0;
    	tooltip.classed('hidden', true);
    	mouseout = true;
	});

    d3.select("#modal-down").on('click', function() {
    	map_svg.select("#location_" + current_location).attr("fill","yellow").attr("d",path);
        current_location -= 1;
        current_location = current_location % (n_locations+1);
        if (current_location<=0) {current_location=n_locations};
        map_svg.select("#location_" + current_location).attr("fill","orange").attr("d",path_clicked);
        center_on_location(current_location);
        show_info_inside_modal(current_location);
    });

    d3.select("#left").on('click', function() {
    	step_through_time(37);
    })

     d3.select("#right").on('click', function() {
    	step_through_time(39);
    })

	//start tour - showing modal
    d3.select("#start_tour").on('click', function() {
    	map_svg.select("#location_" + current_location).attr("fill","yellow").attr("d",path);
	    current_location = 1;
	    map_svg.select("#location_" + current_location).attr("fill","orange").attr("d",path_clicked);
      	$("#myModal").modal('show');
      	center_on_location(current_location);
      	show_info_inside_modal(current_location);
    });

    //up and down chevrons

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

      // screen width and screen height for positioning
		tooltip.classed('hidden', false)
                .attr('style', 'left:' + (screen_width/2 + 15) +
                                'px; top:' + (screen_height/2 - 35) + 'px')
                .html(coordinates_locations[current_location][2]);

    } //end of center_on_location function


    //write function for showing info inside modal

    // --- Define global variables for keyboard and mouse input
	var activeidx = 0;
	var activemouse = null;
	var allbars = null;
	var activebarcolor = "#6E6E6E";
	var annotedbarcolor = "#BDBDBD";
	var inactivebarcolor = "#E6E6E6";

	// --- Define global plot variables
	var margin_plot = {top:5, right:110, bottom:60, left:75};

    function show_info_inside_modal(current_location) {

    	$("#modal-title").html("<button type='button' class='close btn-modal' data-dismiss='modal'>&times;</button>");
	    $("#imgdiv").html("");
	    $("#plotdiv").html("");
	    $("#moreinfodiv").html("");
	    $("#annodiv").html("");


	    activeidx = 0;
		activemouse = null;
		allbars = null;

		$("#myModal").modal('show');

		d3.csv("timeline/location" + current_location + ".csv", function(chart_data) {

			// --- Make data into numbers    
		    var parseDate = d3.time.format("%m/%d/%Y").parse;
		    chart_data.forEach(function(d,i) {
		        d.localdata = +d.localdata;
		        d.globaldata = +d.globaldata;
		        d.date = parseDate(d.date);
		        d.x = +d.x;
		        d.y = +d.y;
		        d.singleimgwidth = +d.singleimgwidth;
		        d.singleimgheight = +d.singleimgheight;
		        d.totalimgwidth = +d.totalimgwidth;
		        d.totalimgheight = +d.totalimgheight;
		        years_img[i] = chart_data[i].date.getFullYear();
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
		    width = {image: single_img_width, plot: modal_main_view_width, image_total: total_img_width};
		    height = {image: single_img_height, plot: ratio_plotdiv*modal_main_view_height, image_total: total_img_height};

		    function draw_imgdiv() {
			    	//----------------------------------
			    // Display location title within div=titlediv
			    //----------------------------------
			    var title = d3.select("#modal-title")
			        .append("text")
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

			    // define default font size for year labels on top of images (px)
			    // (will be rescaled)
			    var yrlabelfontsize = (height.image)/3;
			    //var yrlabelfontsize = 150;

                            // define max widths inside imgdiv of each img (%)
                            // (default to 50% to take up entire div width)
                            var imgmaxwidth = 50;

                            // prevent img scrolling by calculating the img ht
                            // needed to fit inside the allotted imgdiv
                            var ratio_imgdiv = 0.4; // defined in style.css as img-div container height
                            var scalefactor = modal_main_view_width/(2*width.image);
                            var newimght = height.image*scalefactor; 
                            if (ratio_imgdiv*modal_main_view_height < newimght) {
                                var newscalefactor=ratio_imgdiv*modal_main_view_height/newimght;
                                imgmaxwidth = newscalefactor*imgmaxwidth; 
                            } else {
                                var newscalefactor=scalefactor;
                            }

                            // rescale yr label font size appropriately
                            yrlabelfontsize = scalefactor*yrlabelfontsize;

                            // define year label positions
			    var xposyrlabel = width.image;
                            var yposyrlabel = yrlabelfontsize/1.2;

			    // initially display the earliest image on the left by default
                            var before = d3.select("#imgdiv")
			        .append("svg")
			            .attr("viewBox", "0 0 " + width.image + " " + height.image)
			            .attr("id", "svgbefore")
			            .style("display", "inline")
                                    .style("max-width", imgmaxwidth+"%")
			        .append("use")
			            .attr("id", "imagebefore")
			            .attr("xlink:href", "#imgID" + min_imgID);

			    d3.select("#svgbefore")
			        .append("text")
			        .attr("class", "imgtext")
			        .attr("id", "before-text")
			        .text(years_img[min_imgID])
			        .attr("x",xposyrlabel)
			        .attr("y",yposyrlabel)
			        .style("font-size", yrlabelfontsize+"px")

                            // initially display the most recent image on the right by default 
			    var after = d3.select("#imgdiv")
			        .append("svg")
			            .attr("viewBox", "0 0 " + width.image + " " + height.image)
			            .attr("id", "svgafter")
			            .style("display", "inline")
                                    .style("max-width", imgmaxwidth+"%")
			        .append("use")
			            .attr("id", "imageafter")
			            .attr("xlink:href", "#imgID" + max_imgID);
			    
			    d3.select("#svgafter")
			        .append("text")
			        .attr("class", "imgtext")
			        .text(years_img[max_imgID])
			        .attr("x", xposyrlabel)
			        .attr("y", yposyrlabel)
			        .style("font-size", yrlabelfontsize+"px")

		    } //end of function draw_imgdiv

		    function draw_plotdiv() {
		    	
		    	    //---------------------------------
				    // Set up all line plot features and
				    // then plot lines within div=plotdiv
				    //----------------------------------

				    x = d3.time.scale()
				        .range([0,width.plot - margin_plot.left - margin_plot.right]);
				    
				    // l = local data
				    yl = d3.scale.linear()
				        .range([height.plot - margin_plot.top - margin_plot.bottom, margin_plot.top]);
				    
				    // g = global data
				    yg = d3.scale.linear()
				        .range([height.plot - margin_plot.top - margin_plot.bottom, margin_plot.top]);
				    
				    x_axis = d3.svg.axis()
				        .scale(x)
				        .orient("bottom");
				    
				    y_axisl = d3.svg.axis()
				        .scale(yl)
			                .ticks(5)
				        .orient("left");
				         
				    y_axisg = d3.svg.axis()
				        .scale(yg)
			                .ticks(5)
				        .orient("right");
				    
				    linel = d3.svg.line()
				        .x(function(d) { return x(d.date); })
				        .y(function(d) { return yl(d.localdata); });
				         
				    lineg = d3.svg.line()
				        .x(function(d) { return x(d.date); })
				        .y(function(d) { return yg(d.globaldata); });

				    // set up plot area 
				    svg_plot = d3.select("#plotdiv")
				        .append("svg")
				            .attr("id", "plot")
				            .classed("svg-container", true);

				    // label x-axis - positioning
				    svg_plot.append("text")
				        .attr("class", "xlabel")
				        .attr("id","xlabel")
				        .attr("text-anchor", "middle")
				        .attr("x", (width.plot)/2)
				        .attr("y", height.plot-margin_plot.bottom/7)
				        .text("Year");

				    // label local data left y-axis
				    labely_local = chart_data[0].localylabel;
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
				        .text(labely_local)

				    // label global data right y-axis
				    labely_global = chart_data[0].globalylabel;
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
				        .text(labely_global)
				    
				    // define data domains
				    if (chart_data[0].ymin == 'null') {
				    	yl.domain(d3.extent(chart_data, function(d) { return d.localdata; }));
				    	yg.domain(d3.extent(chart_data, function(d) { return d.globaldata; }));
				    }
				    else {
				    	yl.domain([chart_data[0].ymin,chart_data[0].ymax]);
				    	yg.domain([chart_data[0].ymin,chart_data[0].ymax]);
				    }
				    x.domain(d3.extent(chart_data, function(d) { return d.date; }));

				    // draw rectangles in background
			        barwidth = width.plot/100;
				    bars = svg_plot.selectAll("rect")
				            .data(imgdata).enter()
				            .append("rect")
					            .attr("id", function(d) { return "rectID" + d.id; })
					            .attr("class", "barinplot")
					            .attr("x", function(d) { return x(d.date) - (barwidth/2);})
					            .attr("y", margin_plot.top)
					            .attr("transform", "translate("+margin_plot.left+",0)")
					            .attr("width", barwidth+"px")
					            .attr("height", [height.plot-margin_plot.top*2-margin_plot.bottom].toString() + "px")
					            .style("stroke-width", "3px")
					            .style("fill", function(d) {
					            	if (!!d.annotation) {return annotedbarcolor}
					            	else {return inactivebarcolor}
					            });

					// draw x-axis
				    svg_plot.append("g")
				        .attr("class", "xaxis-bottom")
				        .attr("transform", "translate(" + margin_plot.left + "," + [height.plot - margin_plot.top - margin_plot.bottom] + ")")
				        .call(x_axis)
			                .selectAll("text")
				            .attr("transform", "rotate(-40)")
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

				    // add annotations
				    d3.select("#annodiv").append("svg")
				    		.attr("id","anno_svg")
				    		.attr("class","svg-content-responsive")
				    	.selectAll("text#anno")
			           	.data(imgdata).enter()
			            .append("text")
			                .attr("id", function(d) { return "annoID" + d.id; })
			                .attr("class", "annotation") // from css
			                .attr("dy", "0.8em")
			                .style("opacity", 0)
			                .text(function(d) { return d.annotation; })
			                .attr("x","50%")
			                .attr("y","25%")
			                .style("text-anchor","middle")
			                
			        setTimeout(function() {
			        	d3.selectAll(".annotation").call(wrap, modal_main_view_width*5/6-20, 1.1, true);
			        	svg_plot.selectAll("#ylabell").call(wrap, modal_main_view_height*ratio_plotdiv-margin_plot.bottom,0.2, false);
			        	svg_plot.selectAll("#ylabelg").call(wrap, modal_main_view_height*ratio_plotdiv-margin_plot.bottom,0.2, false);
			        }, 200);

				    // differently color/size the bars at the very beginning and end of the time series
				    d3.select("#annoID" + min_imgID).style("opacity", 1);
				    d3.select("rect#rectID" + min_imgID).classed("activebar",true);

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
				    d3.select("rect#rectID" + max_imgID).classed("activebar",true);


		    } //end of draw_plotdiv

		    //draw image div and plot div
		    draw_imgdiv();
		    draw_plotdiv();

		    // add image src info and data src info buttons

		    d3.select("#imgsrc").text(chart_data[0].imgsrctext)
		    	.on('click', function() {
					window.open(chart_data[0].imgsrcurl);
				});

	        d3.select("#localsrc").text(chart_data[0].localdatasrctext)
	        	.on('click', function() {
	         		window.open(chart_data[0].localdatasrcurl);
	       		});

		    d3.select("#globalsrc").text(chart_data[0].globaldatasrctext)
		    	.on('click', function() {
	         		window.open(chart_data[0].globaldatasrcurl);
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
		      d3.select(allbars[0][activeidx]).classed("activebar", false);
		      if (keyCode == 39 && activeidx<allbars.size()-1) { // right arrow key
		          activeidx++; // don't go further right than there are pts
		      }
		      if (keyCode == 37 && activeidx>0) { // left arrow key
		          activeidx--; // don't go further left than there are pts
		      }
		      d3.select(allbars[0][activeidx]).classed("activebar", true);
		      d3.select("text#annoID" + allbars[0][activeidx].id.substring(6)).style("opacity",1);
		      d3.select("use#imagebefore").attr("xlink:href", "#imgID" + allbars[0][activeidx].id.substring(6));
		      d3.select("#before-text").text(years_img[allbars[0][activeidx].id.substring(6)]);
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
	    d3.select(this).classed("activebar",true);
	    this.style.cursor = "pointer";
	    d3.select("text#annoID" + allbars[0][activeidx].id.substring(6)).style("opacity",0);
	    d3.select("text#annoID" + this.id.substring(6)).style("opacity",1);
	}

	function mouseout_timeline() {
	    // NOTE: activemouse.id.substring(6) is the selected number following "rectID" 
	    if (findindexbyid(allbars,this.id) != activeidx) {
	    	d3.select(this).classed("activebar", false);
	        d3.select("text#annoID" + this.id.substring(6)).style("opacity",0);
	        d3.select("text#annoID" + allbars[0][activeidx].id.substring(6)).style("opacity",1);
	        d3.select("rect#rectID" + max_imgID).classed("activebar",true);
	    }
	}

	function click_timeline() {
	    // NOTE: activemouse.id.substring(6) is the selected number following "rectID" 
	    d3.select("text#instructions").style("opacity",0);
	    d3.select("text#annoID" + allbars[0][activeidx].id.substring(6)).style("opacity",0);
	    d3.select("#plotdiv").select("svg#plot").selectAll("rect").classed("activebar", false);
	    d3.select("rect#rectID" + max_imgID).classed("activebar",true);
	    activemouse = this;
	    activeidx = findindexbyid(allbars,activemouse.id);
	    d3.select(allbars[0][activeidx]).classed("activebar",true);
	    d3.select("text#annoID" + allbars[0][activeidx].id.substring(6)).style("opacity",1);
	    d3.select("use#imagebefore").attr("xlink:href", "#imgID" + allbars[0][activeidx].id.substring(6));
	    d3.select("#before-text").text(years_img[allbars[0][activeidx].id.substring(6)]);
	}
		
	function wrap(text, width, ems, init_x) {
		  var x;
		  text.each(function() {
			    var text = d3.select(this),
			        words = text.text().split(/\s+/).reverse(),
			        word,
			        line = [],
			        lineNumber = 0,
			        lineHeight = ems, // ems
			        y = text.attr("y"),
			        dy = parseFloat(text.attr("dy"));
			    if (init_x) {x = text.attr("x")} else { x = 0};
			        //change 0 to x
			    var tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
			    while (word = words.pop()) {
			      line.push(word);
			      tspan.text(line.join(" "));
			      if (tspan.node().getComputedTextLength() > width) {
			        line.pop();
			        tspan.text(line.join(" "));
			        line = [word];
			        //change 0 to x
			        tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
		      }
		    }
		  });
	}

}); // end document ready function
