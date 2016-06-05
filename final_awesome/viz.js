$( document ).ready(function() {

	//compute the dimensions of the current div - #map
	var margin_map = {top: 70, left: 10, bottom: 70, right: 10}
	  , screen_width = parseInt(d3.select('#map-container').style('width'))
	  , screen_height = parseInt(d3.select('#map-container').style('height'));

	//set the size of the svg to be the minimum of width and height - map ratio is 1
	var width = Math.min(screen_width - margin_map.left - margin_map.right, screen_height - margin_map.top - margin_map.bottom)
	  , height = width;

	//var modal_height = screen_height - 55;
	modal_height = screen_height - 55;
	//var modal_main_view_height = 0;
	modal_main_view_height = 0;
	//var modal_main_view_width = 0.5833333333*($("#myModal").width());
	modal_main_view_width = 0.5833333333*($("#myModal").width());
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

	  d3.select('#map').style('width',width + 'px');
	  d3.select('#map').style('height',height + 'px');

	//create the svg element
	var svg = d3.select("#map").append("svg")
		.attr("class","map_svg")
	    .attr("width", width)
	    .attr("height", height);

	//different d3 projections. https://github.com/d3/d3/wiki/Geo-Projections
	var projection = d3.geo.orthographic()
	    //If scale is specified, sets the projection’s scale factor to the specified value and returns the projection. If scale is not specified, returns the current scale factor which defaults to 150. The scale factor corresponds linearly to the distance between projected points.
	    //A scale of 1 projects the whole world onto a 1x1 pixel.  So a scale of 400 projects onto a 400x400 square. 
	    .scale(width/2)
	    //If angle is specified, sets the projection’s clipping circle radius to the specified angle in degrees and returns the projection.
	    .clipAngle(90)
	    //The translate parameter simply refers to where the centre of this square should be in pixels.  So a translate of [200, 200] projects the origin onto [200, 200] in pixel-space. 
	    //If point is specified, sets the projection’s translation offset to the specified two-element array [x, y] and returns the projection.
	    .translate([width / 2, height / 2])
	    //If precision is specified, sets the threshold for the projection’s adaptive resampling to the specified value in pixels and returns the projection.
	    //D3 3.0’s projections use adaptive resampling to increase the accuracy of projected lines and polygons while still performing efficiently (http://bl.ocks.org/mbostock/3795544).
	    .precision(0.6);

	//create path variable
	var path = d3.geo.path()
    	.projection(projection);

    //adding water
	//in the style sheet change color of class water
	svg.append("path")
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
	    .await(ready);


	var coordinates_locations = {};
	var n_locations = 0;

	//When a task completes, it must call the provided callback. The first argument to the callback should be null if the task is successfull, or the error if the task failed.
	function ready(error, world, locations) {

	  if (error) throw error;

	  //the world file is a topojson file
	  //Returns the GeoJSON Feature or FeatureCollection for the specified object in the given topology. If the specified object is a GeometryCollection, a FeatureCollection is returned, and each geometry in the collection is mapped to a Feature. Otherwise, a Feature is returned.
	  //https://github.com/mbostock/topojson/wiki/API-Reference
	  var countries = topojson.feature(world, world.objects.countries).features;

	  //sens for dragging call
	  sens = 0.25

	  //draw the countries paths
	  var world = svg.selectAll("path.land")
	    .data(countries)
	      .enter().append("path")
	      .attr("class", "land")
	      .attr("d", path);

	    //draw the locations path
	  locations.forEach(function(d) {
	  	n_locations += 1;
	    thispoint = svg.append("path")
	        //from the csv take lat long to create a path object
	        .datum({type: "Point", coordinates: [d.lon, d.lat]})
	        .attr("class", "locations")
	        .attr("fill","yellow")
	        .attr("d", path.pointRadius(8))
	        //add the attribute for location id
	        .attr("id","location_" + d.location_id)
	        .on("click", function() {
		        			center_on_location(d.location_id);
		        			show_info_inside_modal(d.location_id);
		        		});
	    coordinates_locations[d.location_id] = [d.lon,d.lat];
	  });

	  //Drag event
	  svg.selectAll("path").call(d3.behavior.drag()
	        .origin(function() { var r = projection.rotate(); return {x: r[0] / sens, y: -r[1] / sens}; })
	        .on("drag", function() {
	          //make sure that the rotate event stops when you start draging
	          var rotate = projection.rotate();
	          projection.rotate([d3.event.x * sens, -d3.event.y * sens, rotate[2]]);
	          svg.selectAll("path.land").attr("d", path)
	          svg.selectAll("path.locations").attr("d", path);
	        }))
	} // End function ready

	d3.select(window).on('resize', resize);

	function resize() {
	   
		//compute the dimensions of the current div - #map
		var screen_width = parseInt(d3.select('#map-container').style('width'))
		  , screen_height = parseInt(d3.select('#map-container').style('height'));

		//set the size of the svg to be the minimum of width and height - map ratio is 1
		var width = Math.min(screen_width - margin_map.left - margin_map.right, screen_height - margin_map.top - margin_map.bottom)
		  , height = width;

		// update projection
	    projection
	        .translate([width / 2, height / 2])
	        .scale(width/2);

		d3.select('#map').style('width',width + 'px');
	  	d3.select('#map').style('height',height + 'px');

			    // resize the map id
	    svg
	        .style('width', width + 'px')
	        .style('height', height + 'px');

	    // resize the map
	    svg.selectAll('path').attr('d', path);

		//var modal_height = screen_height - 55;
		modal_height = screen_height - 55;
		//var modal_main_view_height = 0;
		modal_main_view_height = 0;
		//var modal_main_view_width = 0.5833333333*($("#myModal").width());
		modal_main_view_width = 0.5833333333*($("#myModal").width());
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

                // remake/resize all plot elements                
	        $("#plotdiv").html("");
        plotplot(modal_main_view_width,modal_main_view_height);

  	};

  	current_location = 1;

    $("#start_tour").on('click', function() {
      current_location =1;
      center_on_location(current_location);
      show_info_inside_modal(current_location);
    });

    $("#modal-up").on('click', function() {
    	current_location += 1;
    	current_location = current_location % (n_locations+1);
        if (current_location==0) {current_location=1};
    	center_on_location(current_location);
    	show_info_inside_modal(current_location);
    });

    $("#modal-down").on('click', function() {
    	current_location -= 1;
    	current_location = current_location % (n_locations+1);
        if (current_location==0) {current_location=n_locations};
    	center_on_location(current_location);
    	show_info_inside_modal(current_location);
    });

    function center_on_location(current_location) {
      d3.transition()
          .duration(1250)
          .tween("rotate", function() {
              var r = d3.interpolate(projection.rotate(), [-coordinates_locations[current_location][0],-coordinates_locations[current_location][1]]);
              return function(t) {
                projection.rotate(r(t));
                svg.selectAll("path.land").attr("d", path);
                svg.selectAll("path.locations").attr("d", path);
              };
            })
    }

    $("body").on('keyup', function(e) {
        if (e.keyCode==39) {
            document.getElementById("right").className = "glyphicon glyphicon-triangle-right col-xs-1 gray1 gi-3x";
        }
        if (e.keyCode==37) {
            document.getElementById("left").className = "glyphicon glyphicon-triangle-left col-xs-1 gray1 gi-3x";
        }
        if (e.keyCode==38) {
            document.getElementById("modal-up").className = "glyphicon glyphicon-chevron-up gray1 gi-5x";
        }
        if (e.keyCode==40) {
            document.getElementById("modal-down").className = "glyphicon glyphicon-chevron-down gray1 gi-5x";
        }
    });

    // --- Define global variables for keyboard and mouse input
	var activeidx = 0;

    d3.select("body").on({
        keydown: function(d) {
          // when you click the down arrow key, go to next location
          if(d3.event.keyCode == 38) { 
          	activeidx = 0;
          	document.getElementById("modal-up").className = "glyphicon glyphicon-chevron-up gray2 gi-5x";
            current_location += 1;
            current_location = current_location % (n_locations+1);
            if (current_location==0) {current_location=1};
            center_on_location(current_location);
            show_info_inside_modal(current_location);
          }
          // when you click the up arrow key, go to prev location
          if (d3.event.keyCode == 40) {
          	activeidx = 0;
          	document.getElementById("modal-down").className = "glyphicon glyphicon-chevron-down gray2 gi-5x";
            current_location -= 1;
            current_location = current_location % (n_locations+1);
            if (current_location==0) {current_location=n_locations};
            center_on_location(current_location);
            show_info_inside_modal(current_location);
          }
          // when you click the right/left arrow keys, step through the timeline
          if (d3.event.keyCode == 39) {
          	document.getElementById("right").className = "glyphicon glyphicon-triangle-right col-xs-1 gray2 gi-3x";
          	step_through_time(d3.event.keyCode);
          } 
          if (d3.event.keyCode == 37) {
          	document.getElementById("left").className = "glyphicon glyphicon-triangle-left col-xs-1 gray2 gi-3x";
                // 39 = right arrow key, 37 = left arrow key
        	step_through_time(d3.event.keyCode);
          }
        }
     }) //end of select body

	var activemouse = null;
	var allbars = null;
	var activebarcolor = "Gray";
	var inactivebarcolor = "LightGray";

	// --- Define global plot variables
	var margin = {top:50, right:110, bottom:50, left:75};

	function show_info_inside_modal(current_location) {

        $("#modal-title").html("");
	    $("#imgdiv").html("");
	    $("#plotdiv").html("");
	    $("#moreinfodiv").html("");

	    $("#myModal").modal('show');

		d3.csv("timeline/location" + current_location + ".csv", function(data) {

		    // --- Just for data reference clarity later
		    fulldata = data;

		    // --- Make data into numbers    
		    var parseDate = d3.time.format("%m/%d/%Y").parse;
		    fulldata.forEach(function(d) {
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
		    for (var i = 0; i < fulldata.length; i++) {fulldata[i].id = id++;}
		    // Data associated with images
		    imgdata = fulldata.filter(filterByX);
		    // Data associated with non-null local data
		    localdata = fulldata.filter(filterByLocalData);
		    // Data associated with non-null global data
		    globaldata = fulldata.filter(filterByGlobalData);

		    // --- Calculate begin and end IDs of image time series 
		    imgIDarray = imgdata.map(function(d) { return +d.id; });
		    min_imgID = Math.min.apply(null,imgIDarray);
		    max_imgID = Math.max.apply(null,imgIDarray);

		    // --- Define image size attributes
                    single_img_width = fulldata[0].singleimgwidth; 
		    single_img_height = fulldata[0].singleimgheight; 
                    total_img_width = fulldata[0].totalimgwidth; 
		    total_img_height = fulldata[0].totalimgheight; 

		    // --- Define margins + plot and image widths/heights
		    var width = {image: single_img_width, plot: modal_main_view_width, image_total: total_img_width};
		    var height = {image: single_img_height, plot: 0.5*modal_main_view_height, image_total: total_img_height};

		    //----------------------------------
		    // Display location title within div=titlediv
		    //----------------------------------
		    var title = d3.select("#modal-title")
		        .append("text")
		        .attr("class","title-modal")
		        .text(fulldata[0].title)
		    
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
		        .text(fulldata[min_imgID].date.getFullYear())
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
		        .text(fulldata[max_imgID].date.getFullYear())
		        .attr("x", xposyrlabel)
		        .attr("y", yposyrlabel)
		        .style("font-size", "100px")
                        .style("text-anchor", "end")
		        .style("fill","white");

		    // add image src info on top of after image
		    d3.select("#imgsrc")
		        .text(fulldata[0].imgsrctext);
		    $("#imgsrc").on('click', function() {
		        window.open(fulldata[0].imgsrcurl);
		    });

		    //---------------------------------
		    // Plot all line plot features
		    // within div=plotdiv
		    //----------------------------------
	            $("#plotdiv").html("");
                    plotplot(modal_main_view_width,modal_main_view_height);

		    //---------------------------------
		    // Add more info to div=moreinfodiv 
		    //---------------------------------
		    var moreinfo = d3.select("#moreinfodiv")
		        .append("text")
		        .attr("class","moreinfo")
		        //.attr("x", 800)
		        //.attr("y", 800)
		        .text(fulldata[0].moreinfo)

		}); // end d3.csv
		// end show_info_inside_modal function
	};

        function plotplot(modal_main_view_width,modal_main_view_height) {

	    plotwidth = modal_main_view_width;
	    plotheight = 0.5*modal_main_view_height;

            //---------------------------------
	    // Set up all line plot features and
	    // then plot lines within div=plotdiv
	    //----------------------------------

	    var x = d3.time.scale()
	        .range([0,plotwidth - margin.left - margin.right]);
	    
	    // l = local data
	    var yl = d3.scale.linear()
	        .range([plotheight - margin.top - margin.bottom, margin.top]);
	    
	    // g = global data
	    var yg = d3.scale.linear()
	        .range([plotheight - margin.top - margin.bottom, margin.top]);
	    
	    var x_axis = d3.svg.axis()
	        .scale(x)
	        .orient("bottom");
	    
	    var y_axisl = d3.svg.axis()
	        .scale(yl)
                .ticks(5)
	        .orient("left");
                //.tickFormat(function(d) {var formatNumber=d3.format(".0f"); return formatNumber(d);});
	         
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
	    var svg = d3.select("#plotdiv")
	        .append("svg")
	            .attr("id", "plot")
	            .attr("width","100%")
	            .attr("height","100%")
	            //.attr("preserveAspectRatio", "xMinYMin meet")
	            //.attr("viewBox", "0 0 " + plotwidth + " " + plotheight)
	            .classed("svg-content", true);
	    
	    // label x-axis
	    svg.append("text")
	        .attr("class", "xlabel")
	        .attr("id","xlabel")
	        .attr("text-anchor", "middle")
	        .attr("x", (plotwidth)/2)
	        .attr("y", plotheight-margin.top)
	        //.attr("y", plotheight+margin.bottom*6-margin.top)
	        .text("Year")

	    // label local data left y-axis
	    svg.append("text")
	        .attr("class", "ylabel")
	        .attr("id", "ylabell")
	        .attr("text-anchor", "middle")
	        //.attr("transform", "translate("+(margin.left)/5+","+(plotheight)/2+")rotate(-90)")
	        .attr("transform", "translate(0,"+(plotheight-margin.bottom)/2+")rotate(-90)")
	        // .style("fill", localdatacolor)
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
	            // mouseover: function() {
	            //     d3.select(this).style("font-size", "35px");
	            // },
	            // mouseout: function() {
	            //     d3.select(this).style("font-size", "25px");
	            // }
	        })
	        .text(fulldata[0].localylabel)
	        .call(wrap, yl.range()[0]-yl.range()[1]);

	    // label global data right y-axis
	    svg.append("text")
	        .attr("class", "ylabel")
	        .attr("id", "ylabelg")
	        .attr("text-anchor", "middle")
	        .attr("transform", "translate("+(plotwidth-margin.left+margin.left/5)+","+(plotheight-margin.bottom)/2+")rotate(90)")
	        // .style("fill", globaldatacolor)
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
	            } //,
	            // mouseover: function() {
	            //     // d3.select(this).style("font-size", "35px");
	            //     d3.select(this).attr("class", "ylabel-highlight");
	            // },
	            // mouseout: function() {
	            //     d3.select(this).attr("class", "ylabel"); // defined in style.css
	            // }
	        })
	        .text(fulldata[0].globalylabel)
	        .call(wrap, yg.range()[0]-yg.range()[1]);

	    // define data domains
	    x.domain(d3.extent(fulldata, function(d) { return d.date; }));
	    yl.domain(d3.extent(fulldata, function(d) { return d.localdata; }));
	    yg.domain(d3.extent(fulldata, function(d) { return d.globaldata; }));

	    // draw rectangles in background
        var barwidth = plotwidth/50;
	    var bars = d3.select("#plotdiv").select("svg#plot").selectAll("rect")
	            .data(imgdata).enter()
	            .append("rect")
	            .attr("id", function(d) { return "rectID" + d.id; })
	            .attr("x", function(d) { return x(d.date) - (barwidth/2);})
	            .attr("y", margin.top)
	            .attr("transform", "translate("+margin.left+",0)")
	            .attr("width", barwidth+"px")
	            .attr("height", [plotheight-margin.top*2-margin.bottom].toString() + "px")
	            .style("stroke-width", "3px")
	            .style("fill", inactivebarcolor);

	    // draw x-axis
	    svg.append("g")
	        .attr("class", "xaxis-bottom")
	        .attr("transform", "translate(" + margin.left + "," + [plotheight - margin.top - margin.bottom] + ")")
	        .call(x_axis)
                .selectAll("text")
	            .attr("transform", "rotate(-65)")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .style("text-anchor", "end")

	    // draw local data left y-axis
	    svg.append("g")
	            .attr("class", "yaxis-l")
	            .attr("id", "localAxis")
	            .attr("transform", "translate(" + (margin.left-barwidth/2) + ",0)")
	            .call(y_axisl);
	    
	    // draw global data right y-axis
	    svg.append("g")
	            .attr("class", "yaxis-g")
	            .style("opacity", 1)
	            .attr("id", "globalAxis")
	            .attr("transform", "translate(" + (plotwidth-margin.right+barwidth/2) + ",0)")
	            .call(y_axisg);
	    
	    // draw local data line
	    svg.append("path")
	        .datum(localdata)
	            .attr("class", "line-l")
	            .attr("id","localLine")
	            .attr("transform", "translate(" + margin.left + ",0)")
	            .attr("d",linel);
	    
	    // draw global data line
	    svg.append("path")
	        .datum(globaldata)
	            .attr("class", "line-g")
	            .style("opacity", 1) // show global data initially by default
	            .attr("id", "globalLine")
	            .attr("transform", "translate(" + margin.left + ",0)")
	            .attr("d",lineg);

	    // add local data source clickable button
	    d3.select("#localsrc")
	        .text(fulldata[0].localdatasrctext);
	    $("#localsrc").on('click', function() {
	        window.open(fulldata[0].localdatasrcurl);
	    });

	    // add global data source clickable button
	    d3.select("#globalsrc")
	        .text(fulldata[0].globaldatasrctext);
	    $("#globalsrc").on('click', function() {
	        window.open(fulldata[0].globaldatasrcurl);
	    });

	                                                        
	    // add annotations
	   
	    d3.select("#annodiv").append("svg")
	    		.attr("width", modal_main_view_width)
	    		.attr("height", modal_main_view_height*0.1)
	    	.selectAll("text#anno")
           	.data(imgdata).enter()
            .append("text")
                .attr("id", function(d) { return "annoID" + d.id; })
                .attr("class", "annoID")
                .attr("class", "annotation") // from css
                .attr("x", modal_main_view_width*0.8*0.5)
                .attr("y", modal_main_view_height*0.1*0.5)
                .attr("dx", "1em")
                .style("opacity", 0)
                // .style("text-anchor","middle")
                .text(function(d) { return d.annotation; });
	            
	     d3.select("#annodiv").selectAll("text").call(wrap_anno, modal_main_view_width*0.8);


	    // add prelim instructions where annotated text will be after hovering/clicking bars
	    // anno.append("text")
     //        .attr("id", "instructions")
     //        .attr("x", (plotwidth)/2)
     //        .attr("y", margin.top/2)
     //        //.attr("transform", "translate("+margin.left+",0)")
     //        .text("Click on plot elements below; use left/right arrow keys to step through time")
     //        .style("fill","black")
     //        .style("text-anchor","middle");

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

            // --- right/left arrow key step through defined in viz.js
        } // end plotplot function

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
		      d3.select("rect#rectID" + max_imgID).style("fill", activebarcolor);
		      d3.select(allbars[0][activeidx]).style("fill", activebarcolor);
		      d3.select("text#annoID" + allbars[0][activeidx].id.substring(6)).style("opacity",1);
		      d3.select("use#imagebefore").attr("xlink:href", "#imgID" + allbars[0][activeidx].id.substring(6));
		      d3.select("#before-text").text(fulldata[allbars[0][activeidx].id.substring(6)].date.getFullYear());
		  }; //end step_through_time function

		//-----------------
		// HELPER FUNCTIONS
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

}); //end of document ready
