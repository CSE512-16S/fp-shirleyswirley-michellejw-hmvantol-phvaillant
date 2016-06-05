$( document ).ready(function() {

	//compute the dimensions of the current div - #map
	var margin = {top: 10, left: 10, bottom: 10, right: 10}
	  , screen_width = parseInt(d3.select('#map-container').style('width'))
	  , screen_height = parseInt(d3.select('#map-container').style('height'));

	//set the size of the svg to be the minimum of width and height - map ratio is 1
	var width = Math.min(screen_width - margin.left - margin.right, screen_height - margin.top - margin.bottom)
	  , height = width;

	var modal_height = screen_height - 55;
	var modal_main_view_height = 0;
	var modal_main_view_width = 0.5833333333*($("#myModal").width());
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
		var margin = {top: 10, left: 10, bottom: 10, right: 10}
		  , screen_width = parseInt(d3.select('#map-container').style('width'))
		  , screen_height = parseInt(d3.select('#map-container').style('height'));

		//set the size of the svg to be the minimum of width and height - map ratio is 1
		var width = Math.min(screen_width - margin.left - margin.right, screen_height - margin.top - margin.bottom)
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

		var modal_height = screen_height - 55;
		var modal_main_view_height = 0;
		var modal_main_view_width = 0.5833333333*($("#myModal").width());
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

		// width.plot = modal_main_view_width;
		// height.plot = modal_main_view_height*0.5;
		// x.range([0,width.plot - margin.left - margin.right]);
		// yl.range([height.plot - margin.top - margin.bottom, margin.top]);
		// yg.range([height.plot - margin.top - margin.bottom, margin.top]);
		// x_axis.scale(x);
		// y_axisl.scale(yl);
		// y_axisg.scale(yg);

		//create the variables for the plot - not optimal at all....
		var x = d3.time.scale()
		        .range([0,modal_main_view_width - margin.left - margin.right]);
		    
		    // l = local data
		    var yl = d3.scale.linear()
		        .range([modal_main_view_height*0.5 - margin.top - margin.bottom, margin.top]);
		    
		    // g = global data
		    var yg = d3.scale.linear()
		        .range([modal_main_view_height*0.5 - margin.top - margin.bottom, margin.top]);
		    
		    var x_axis = d3.svg.axis()
		        .scale(x)
		        .orient("bottom");
		    
		    var y_axisl = d3.svg.axis()
		        .scale(yl)
		        .orient("left");
		         
		    var y_axisg = d3.svg.axis()
		        .scale(yg)
		        .orient("right");

		    var linel = d3.svg.line()
		        .x(function(d) { return x(d.date); })
		        .y(function(d) { return yl(d.localdata); });
		         
		    var lineg = d3.svg.line()
		        .x(function(d) { return x(d.date); })
		        .y(function(d) { return yg(d.globaldata); });

		    		    // define data domains
		    x.domain(d3.extent(fulldata, function(d) { return d.date; }));
		    yl.domain(d3.extent(fulldata, function(d) { return d.localdata; }));
		    yg.domain(d3.extent(fulldata, function(d) { return d.globaldata; }));

	    //resize plot
	    chart = d3.select("#plot");
	    chart.selectAll("#xlabel").attr("x", (modal_main_view_width)/2)
		        .attr("y", margin.top)

		chart.selectAll("#ylabelg").attr("transform","translate("+(modal_main_view_width-margin.left/2)+","+(modal_main_view_height)/2+")rotate(90)");
		chart.selectAll("#ylabell").attr("transform", "translate("+(margin.left)/2+","+(modal_main_view_height)/4+")rotate(-90)");

		//resize of xaxis bottom does not work;
		chart.selectAll(".xaxis-bottom").attr("transform", "translate(" + margin.left + "," + [modal_main_view_height*0.5 - margin.top - margin.bottom] + ")")
		        .call(x_axis);
		chart.selectAll("#localAxis").call(y_axisl);
		chart.selectAll("#localLine").attr("d",linel);
		chart.selectAll("#globalLine").attr("d",lineg);
		chart.selectAll("rect").attr("x", function(d) { return x(d.date);})
		            .attr("y", modal_main_view_height*0.5 - margin.top - margin.bottom - 10);
		chart.selectAll("text#anno").attr("x", (modal_main_view_width)/2);


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

    d3.select("body").on({
        keydown: function(d) {
          // when you click the down arrow key, go to next location
          if(d3.event.keyCode == 38) { 
            current_location += 1;
            current_location = current_location % (n_locations+1);
            if (current_location==0) {current_location=1};
            center_on_location(current_location);
            show_info_inside_modal(current_location);
          }
          // when you click the up arrow key, go to prev location
          if (d3.event.keyCode == 40) {
            current_location -= 1;
            current_location = current_location % (n_locations+1);
            if (current_location==0) {current_location=n_locations};
            center_on_location(current_location);
            show_info_inside_modal(current_location);
          }
          // when you click the right/left arrow keys, step through the timeline
          if (d3.event.keyCode == 39 || d3.event.keyCode == 37) {
                // 39 = right arrow key, 37 = left arrow key
        	step_through_time(d3.event.keyCode);
          }
        }
     }) //end of select body

	// --- Define global variables for keyboard and mouse input
	var activeidx = 0;
	var activemouse = null;
	var alldots = null;
	var activedotcolor = "yellow";
	var inactivedotcolor = "LightGray";
	var activedotsize = "15px";
	var inactivedotsize = "8px";

	function show_info_inside_modal(current_location) {

		$("#modal-title").html("");
	    $("#imgdiv").html("");
	    $("#plotdiv").html("");
	    $("#moreinfodiv").html("");

	    $("#myModal").modal('show');

	    activeidx = 0;
	    alldots = null;
	    activemouse = null;

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
		    });

		    // --- Subselect the following data: 
		    var id = 0;
		    for (var i = 0; i < fulldata.length; i++) {fulldata[i].id = id++;}
		    // Data associated with images
		    var imgdata = fulldata.filter(filterByX);
		    // Data associated with non-null local data
		    var localdata = fulldata.filter(filterByLocalData);
		    // Data associated with non-null global data
		    var globaldata = fulldata.filter(filterByGlobalData);

		    // --- Calculate begin and end IDs of image time series 
		    imgIDarray = imgdata.map(function(d) { return +d.id; });
		    min_imgID = Math.min.apply(null,imgIDarray);
		    max_imgID = Math.max.apply(null,imgIDarray);

		    // --- Calculate image size attributes
		    imgxpos = imgdata.map(function(d) { return Math.abs(d.x); });
		    imgypos = imgdata.map(function(d) { return Math.abs(d.y); });
		    single_img_width = Math.min.apply(0, imgxpos.filter(Number));
		    single_img_height = Math.min.apply(0, imgypos.filter(Number));
		    total_img_width = Math.max.apply(0, imgxpos.filter(Number)) + single_img_width;
		    total_img_height = Math.max.apply(0, imgypos.filter(Number)) + single_img_height;

		    // --- Define margins + plot and image widths/heights
		    //var margin = {top:100, right:20, bottom:10, left:50};
		    //why the margin depending of img width and height? seems to do weird thing
		    var margin = {top:10, right:10, bottom:10, left:10};
		    //var margin = {top:100, right:0.2*single_img_width, bottom:10, left:0.2*single_img_width};
		    var width = {image: single_img_width, plot: modal_main_view_width, image_total: total_img_width};
		    var height = {image: single_img_height, plot: 0.5*modal_main_view_height, image_total: total_img_height};
		    //var width = {image: single_img_width, plot: single_img_width*2, image_total: total_img_width};
		    // var height = {image: single_img_height, plot: 1.8*single_img_height, image_total: total_img_height};
		    //var height = {image: single_img_height, plot: single_img_height, image_total: total_img_height};


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
		    var xposyrlabel = 15, yposyrlabel = 35;

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
		        .style("font-size", "30px")
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
		        .style("font-size", "30px")
		        .style("fill","white");

		    // add image src info on top of after image
		    d3.select("#imgsrc")
		        .text(fulldata[0].imgsrctext);
		    $("#imgsrc").on('click', function() {
		        window.open(fulldata[0].imgsrcurl);
		    });

		    //---------------------------------
		    // Set up all line plot features and
		    // then plot lines within div=plotdiv
		    //----------------------------------
		    // var localdatacolor = "steelblue";
		    // var globaldatacolor = "orangered";

		    var x = d3.time.scale()
		        .range([0,width.plot - margin.left - margin.right]);
		    
		    // l = local data
		    var yl = d3.scale.linear()
		        .range([height.plot - margin.top - margin.bottom, margin.top]);
		    
		    // g = global data
		    var yg = d3.scale.linear()
		        .range([height.plot - margin.top - margin.bottom, margin.top]);
		    
		    var x_axis = d3.svg.axis()
		        .scale(x)
		        .orient("bottom");
		    
		    var y_axisl = d3.svg.axis()
		        .scale(yl)
		        .orient("left");
		         
		    var y_axisg = d3.svg.axis()
		        .scale(yg)
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
		            //.attr("viewBox", "0 0 " + width.plot + " " + height.plot)
		            .classed("svg-content", true);
		    
		    // label x-axis
		    svg.append("text")
		        .attr("class", "xlabel")
		        .attr("id","xlabel")
		        .attr("text-anchor", "middle")
		        .attr("x", (width.plot)/2)
		        .attr("y", margin.top)
		        //.attr("y", height.plot+margin.bottom*6-margin.top)
		        .text("Year")

		    // label local data left y-axis
		    svg.append("text")
		        .attr("class", "ylabel")
		        .attr("id", "ylabell")
		        .attr("text-anchor", "middle")
		        .attr("transform", "translate("+(margin.left)/2+","+(height.plot)/2+")rotate(-90)")
		        // .style("fill", localdatacolor)
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
		        .text(fulldata[0].localylabel);

		    // label global data right y-axis
		    svg.append("text")
		        .attr("class", "ylabel")
		        .attr("id", "ylabelg")
		        .attr("text-anchor", "middle")
		        .attr("transform", "translate("+(width.plot-margin.left/2)+","+(height.plot)/2+")rotate(90)")
		        // .style("fill", globaldatacolor)
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
		        .text(fulldata[0].globalylabel);

		    // define data domains
		    x.domain(d3.extent(fulldata, function(d) { return d.date; }));
		    yl.domain(d3.extent(fulldata, function(d) { return d.localdata; }));
		    yg.domain(d3.extent(fulldata, function(d) { return d.globaldata; }));
		    
		    // draw x-axis
		    svg.append("g")
		        .attr("class", "xaxis-bottom")
		        .attr("transform", "translate(" + margin.left + "," + [height.plot - margin.top - margin.bottom] + ")")
		        .call(x_axis);
		    
		    // draw local data left y-axis
		    svg.append("g")
		            .attr("class", "yaxis-l")
		            .attr("id", "localAxis")
		            .attr("transform", "translate(" + margin.left + ",0)")
		            .call(y_axisl);
		    
		    // draw global data right y-axis
		    svg.append("g")
		            .attr("class", "yaxis-g")
		            .style("opacity", 1)
		            .attr("id", "globalAxis")
		            .attr("transform", "translate(" + (width.plot-margin.left) + ",0)")
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

		    var dots = d3.select("#plotdiv").select("svg#plot").selectAll("rect")
		            .data(imgdata).enter()
		            .append("rect")
		            .attr("id", function(d) { return "rectID" + d.id; })
		            .attr("x", function(d) { return x(d.date);})
		            .attr("y", height.plot - margin.top - margin.bottom - 10)
		            .attr("transform", "translate("+margin.left+",0)")
		            .attr("width", inactivedotsize)
		            .attr("height", inactivedotsize)
		            .style("stroke", function(d) {if (d.annotation != '') {return "black"; }
		                                        else {return inactivedotcolor; } })
		            .style("stroke-width", "3px")
		            .style("fill", inactivedotcolor);
		                                                        
		    // add annotations
		    var anno = svg.selectAll("text#anno")
		            .data(imgdata).enter()
		            .append("text") 
		                .attr("id", function(d) { return "annoID" + d.id; })
		                .attr("class", "annoID")
		                .attr("class", "annotation") // from css
		                .attr("x", (width.plot)/2)
		                .attr("y", 60)
		                .text(function(d) { return d.annotation; })
		                .style("opacity", 0)
		                .style("text-anchor","middle");

		    // add prelim instructions where annotated text will be after hovering/clicking dots
		    svg.append("text")
		            .attr("id", "instructions")
		            .attr("x", (width.plot)/2)
		            .attr("y", 60)
		            //.attr("transform", "translate("+margin.left+",0)")
		            .text("Click on plot elements below; use left/right arrow keys to step through time")
		            .style("fill","black");

		    // differently color/size the dots at the very beginning and end of the time series
		    d3.select("rect#rectID" + min_imgID).style("fill", activedotcolor).attr("width",activedotsize).attr("height",activedotsize);
		    d3.select("rect#rectID" + max_imgID).style("fill", activedotcolor).attr("width",activedotsize).attr("height",activedotsize);

		    //---------------------------------
		    // Add interactivity to dots along the x-axis corresponding
		    // to images, all still within div=plotdiv
		    //---------------------------------
		    alldots = d3.select("#plotdiv").select("svg#plot").selectAll("rect");

		    // --- mouse-dot interactivity
		    dots.on("click", click_timeline)
		        .on("mouseover", mouseover_timeline)
		        .on("mouseout", mouseout_timeline);

		    // --- right/left arrow key step through defined in viz.js 

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

	function step_through_time(keyCode) {
		      d3.select("text#instructions").style("opacity",0);
		      d3.select("text#annoID" + alldots[0][activeidx].id.substring(6)).style("opacity",0);
		      if (keyCode == 39 && activeidx<alldots.size()-1) { // right arrow key
		          activeidx++; // don't go further right than there are pts
		      }
		      if (keyCode == 37 && activeidx>0) { // left arrow key
		          activeidx--; // don't go further left than there are pts
		      }
		      d3.select("#plotdiv").select("svg#plot").selectAll("rect").style("fill", inactivedotcolor).attr("width",inactivedotsize).attr("height",inactivedotsize);
		      d3.select("rect#rectID" + max_imgID).style("fill", activedotcolor).attr("width",activedotsize).attr("height",activedotsize);
		      d3.select(alldots[0][activeidx]).style("fill", activedotcolor).attr("width",activedotsize).attr("height",activedotsize);
		      d3.select("text#annoID" + alldots[0][activeidx].id.substring(6)).style("opacity",1);
		      d3.select("use#imagebefore").attr("xlink:href", "#imgID" + alldots[0][activeidx].id.substring(6));
		      d3.select("#before-text").text(fulldata[alldots[0][activeidx].id.substring(6)].date.getFullYear());
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
		    d3.select(this).style("fill", activedotcolor).attr("width",activedotsize).attr("height",activedotsize);
		    this.style.cursor = "pointer";
		    d3.select("text#annoID" + alldots[0][activeidx].id.substring(6)).style("opacity",0);
		    d3.select("text#annoID" + this.id.substring(6)).style("opacity",1);
		}

		function mouseout_timeline() {
		    // NOTE: activemouse.id.substring(6) is the selected number following "rectID" 
		    if (findindexbyid(alldots,this.id) != activeidx) {
		        d3.select(this).style("fill", inactivedotcolor).attr("width",inactivedotsize).attr("height",inactivedotsize);
		        d3.select("text#annoID" + this.id.substring(6)).style("opacity",0);
		        d3.select("text#annoID" + alldots[0][activeidx].id.substring(6)).style("opacity",1);
		        d3.select("rect#rectID" + max_imgID).style("fill", activedotcolor); // this is needed to keep last dot white after hovering over it
		    }
		}

		function click_timeline() {
		    // NOTE: activemouse.id.substring(6) is the selected number following "rectID" 
		    d3.select("text#instructions").style("opacity",0);
		    d3.select("text#annoID" + alldots[0][activeidx].id.substring(6)).style("opacity",0);
		    d3.select("#plotdiv").select("svg#plot").selectAll("rect").style("fill", inactivedotcolor).attr("width",inactivedotsize).attr("height",inactivedotsize);
		    d3.select("rect#rectID" + max_imgID).style("fill", activedotcolor).attr("width",activedotsize).attr("height",activedotsize); // this is needed to keep last dot white after clicking on it
		    activemouse = this;
		    activeidx = findindexbyid(alldots,activemouse.id);
		    d3.select(alldots[0][activeidx]).style("fill", activedotcolor).attr("width",activedotsize).attr("height",activedotsize);
		    d3.select("text#annoID" + alldots[0][activeidx].id.substring(6)).style("opacity",1);
		    d3.select("use#imagebefore").attr("xlink:href", "#imgID" + alldots[0][activeidx].id.substring(6));
		    d3.select("#before-text").text(fulldata[alldots[0][activeidx].id.substring(6)].date.getFullYear());
		}


}); //end of document ready