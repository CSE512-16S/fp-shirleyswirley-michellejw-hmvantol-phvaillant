$( document ).ready(function() {

	//compute the dimensions of the current div - #map
	var margin = {top: 10, left: 10, bottom: 10, right: 10}
	  , screen_width = parseInt(d3.select('#map').style('width'))
	  , height = parseInt(d3.select('#map').style('height'));

	//set the size of the svg to be the minimum of width and height - map ratio is 1
	var width = Math.min(screen_width - margin.left - margin.right, height - margin.top - margin.bottom)
	  , height = width;

	//create the svg element
	var svg = d3.select("#map").append("svg")
	    .attr("width", width)
	    .attr("height", height);

	//center svg elements
	d3.select("#map").attr("align","center"); 

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

	  // var thispoint = [];

	    //draw the locations path
	  locations.forEach(function(d) {
	    thispoint = svg.append("path")
	        //from the csv take lat long to create a path object
	        .datum({type: "Point", coordinates: [d.lon, d.lat]})
	        .attr("class", "locations")
	        .attr("fill","yellow")
	        .attr("d", path.pointRadius(8))
	        //add the attribute for location id
	        .attr("id","location_" + d.location_id)
	        .on("click", function() {show_information(d.location_id)});
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
	}

	d3.select(window).on('resize', resize);

	function resize() {
	    // adjust width and height when the window size changes
	   width = parseInt(d3.select('#map').style('width'))
	    , height = parseInt(d3.select('#map').style('height'))
	    , width = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom)
	    , height = width;

	    // update projection
	    projection
	        .translate([width / 2, height / 2])
	        .scale(width/2);

	    // resize the map container
	    svg
	        .style('width', width + 'px')
	        .style('height', height + 'px');

	    // resize the map
	    svg.selectAll('path').attr('d', path);
  }

    current_location = 1;
    $("#start_tour").on('click', function() {
      current_location =1;
      show_information(current_location);
      center_on_location(current_location);
    });

    d3.select("body").on({
        keydown: function(d) {
          if(d3.event.keyCode == 33) {
            current_location += 1;
            center_on_location(current_location);
            if (tour_stop > 4) {tour_stop=1};
          }
          if (d3.event.keyCode == 34) {
            current_location -= 1;
            center_on_location(current_location);
            if (tour_stop > 4) {tour_stop=1};
          }
        }
      })

    function center_on_location(current_location) {
      d3.transition()
          .duration(1250)
          .each("start", function() {
              console.log(current_location);
          })
          .tween("rotate", function() {
              var r = d3.interpolate(projection.rotate(), [-coordinates_locations[current_location][0],-coordinates_locations[current_location][1]]);
              return function(t) {
                projection.rotate(r(t));
                svg.selectAll("path.land").attr("d", path);
                svg.selectAll("path.locations").attr("d", path);
              };
            })
    }

  function show_information(current_location) {

    // Clear html within modal div container
    $("#imgdivID").html("");


    //LOTS OF WORK FOR MICHELLE TO RESIZE MODAL


    // Set the height of the modal based on the information pane
    // $("#myModal").on('show.bs.modal', function (){
    // $('.modal-body').css('height',parseInt($( information_pane ).height()*.75) + "px");
    // $('.modal-body').css('width',parseInt($( information_pane ).width()*.9) + "px");
    // $('.modal-header').css('width',parseInt($( information_pane ).width()*.9) + "px");
    // $('.modal-footer').css('width',parseInt($( information_pane ).width()*.9) + "px");
    // $('.modal-content').css('width',parseInt($( information_pane ).width()*.9) + "px");
    // $('.modal-dialog').css('width',parseInt($( information_pane ).width()*.9) + "px");
    // $('.modal-content').css('position.left',parseInt($( information_pane ).position().left) + "px");
    // })


    // Show the modal
    $("#myModal").modal('show');


	  //CHANGE THAT. NEEDS TO BE DETERMINED BY CSS
		var margin = {top:40, right:20, bottom:10, left:50};
		var width = {image: 720, plot:720*2-30, total: 720*2};
		var height = {image: 480, plot:480};

		  //ALL THESE LINES OF CODES WILL NEED TO DEPEND ON current_location
    // 	var defs = d3.select("#myModal")
  	 //   .append("svg")
  		//   .attr("class", "defs")
  		// 	.attr("x",0)
  		// 	.attr("y",0)
  		// 	.attr("width",0)
  		// 	.attr("height",0)
  		// 	.append("defs");

  		// defs.append("image")
  		// 	.attr("id", "satellite")
  		// 	//THAT NEEDS TO BE DETERMINED BY current_location
  		// 	//FOLDER images/
  		// 	//instead of athabasca.png you will call "img/"" + current_location
  		// 	.attr("xlink:href", "img/athabasca.png")
  		// 	//Count number of images in file so that 5 and 6 are not arbitrary
  		// 	.attr("width", width.image*5)
  		// 	.attr("height", height.image*6);

  		// defs.append("clipPath")
  		// 	.attr("id", "satellite-cp")
  		// 	.append("rect")
  		// 	.attr("x",0)
  		// 	.attr("y",0)
  		// 	.attr("height", height.image)
  		// 	.attr("width", width.image);

  		// var before = d3.select("#imgdivID")
  		// 	.append("svg")
  		// 	.attr("id", "before")
  		// 	.attr("width", width.image)
  		// 	.attr("height", height.image)
  		// 	.attr("x",0)
  		// 	.attr("y",0);

  		// var after = d3.select("#imgdivID")
  		// 	.append("svg")
  		// 	.attr("id", "after")
  		// 	.attr("width", width.image)
  		// 	.attr("height", height.image)
  		// 	//TO BE CHANGED
  		// 	.attr("x",720)
  		// 	.attr("y",0);


      // Add line plot  

  		// var x = d3.time.scale()
  		// 	.range([0,width.plot - margin.left - margin.right]);

  		// var yl = d3.scale.linear()
  		// 	.range([height.plot - margin.top - margin.bottom, margin.top]);
  		        
  		// var yg = d3.scale.linear()
  		// 	.range([height.plot - margin.top - margin.bottom, margin.top]);

  		// var x_axis = d3.svg.axis()
  		// 	.scale(x)
  		// 	.orient("bottom");

  		// var y_axisl = d3.svg.axis()
  		// 	.scale(yl)
  		// 	.orient("left");
  		        
  		// var y_axisg = d3.svg.axis()
  		// 	.scale(yg)
  		// 	.orient("right");

  		// var linel = d3.svg.line()
  		// 	.x(function(d) { return x(d.date); })
  		// 	.y(function(d) { return yl(d.fakelocaldata); });
  		        
  		// var lineg = d3.svg.line()
  		// 	.x(function(d) { return x(d.date); })
  		// 	.y(function(d) { return yg(d.fakeglobaldata); });

  		// var svg = d3.select("#imgdivID")
  		// 	.append("svg")
  		// 	.attr("id", "plot")
  		// 	.attr("width", width.total)
  		// 	.attr("height", height.plot)
  		// 	.attr("x",0)
  		// 	.attr("y",height.image);

  		// svg.append("text")
  		// 	.attr("class", "x label")
  		// 	.attr("id", "label")
  		// 	.attr("text-anchor", "middle")
  		// 	.attr("x", (width.plot)/2)
  		// 	.attr("y", height.plot - margin.bottom/3)
  		// 	.text("Year")
  		// 	.style("font-weight", "bold");

  		// svg.append("text")
  		// 	.attr("class", "y label")
  		// 	.attr("id", "label")
  		// 	.attr("text-anchor", "middle")
  		// 	.attr("transform", "translate("+margin.left/3+","+(height.plot-margin.top-margin.bottom)/2+")rotate(-90)")
  		// 	.text("Y VARIABLE")
  		// 	.style("font-weight", "bold");

  		// // define global variables for keyboard and mouse input
  		// var alldots = null;
  		// var activeidx = 0;
  		// var activemouse = null;

		//   //depend of current_location
  // 		d3.csv("timeline/athabasca.csv", function(data) {

  // 			var parseDate = d3.time.format("%m/%d/%Y").parse;

  // 			data.forEach(function(d) {
  // 				d.fakelocaldata = +d.fakelocaldata;
  // 				d.fakeglobaldata = +d.fakeglobaldata;
  // 				d.date = parseDate(d.date);
  // 				d.x = +d.x;
  // 				d.y = +d.y;
  // 			});

  // 			defs.selectAll("g")
  // 				.data(data).enter()
  // 				.append("g")
  // 					.attr("id", function(d) { return d.date.getFullYear(); })
  // 					.attr("clip-path", "url(#satellite-cp)")
  // 				.append("use")
  // 					//id of image
  // 					.attr("xlink:href", "#satellite")
  // 					.attr("transform", function(d) { return "translate("+d.x+","+d.y+")"; });

  // 			x.domain(d3.extent(data, function(d) { return d.date; }));
  // 			yl.domain(d3.extent(data, function(d) { return d.fakelocaldata; }));
  // 			yg.domain(d3.extent(data, function(d) { return d.fakeglobaldata; }));

  // 			svg.append("g")
  // 				.attr("class", "x axis")
  // 				.attr("transform", "translate(" + margin.left + "," + [height.plot - margin.top - margin.bottom] + ")")
  // 				.call(x_axis);

  // 			svg.append("g")
  //         .attr("class", "y axis")
  //         .style("fill", "steelblue")
  //         .attr("id", "localAxis")
  // 				.attr("transform", "translate(" + margin.left + ",0)")
  // 				.call(y_axisl);

  // 			svg.append("g")
  //         .attr("class", "y axis")
  //         .style("fill", "OrangeRed")
  // 				.style("opacity", 0)
  // 				.attr("id", "globalAxis")
  // 				.attr("transform", "translate(" + width.plot + ",0)")
  // 		                .call(y_axisg);

  // 			svg.append("path")
  // 				.datum(data)
  //         .attr("class", "line")
  //         .attr("stroke", "steelblue")
  //         .attr("id","localLine")
  // 				.attr("transform", "translate(" + margin.left + ",0)")
  // 				.attr("d",linel);

  // 			svg.append("path")
  // 				.datum(data)
  //           .attr("class", "line")
  //           .style("stroke", "OrangeRed")
  // 				.style("opacity", 0)
  // 				.attr("id", "globalLine")
  // 				.attr("transform", "translate(" + margin.left + ",0)")
  // 		                .attr("d",lineg);

		// 	  // Add local data legend title
  // 		  svg.append("text")
  // 				.attr("x", 0)
  // 				.attr("y", height.plot)
  // 				.attr("class", "legend")
  // 				.style("fill", "steelblue")
  // 				/*.on("click", function() {
  // 				    // Determine if current line is visible
  // 				    var activeline = localLine.active ? false : true,
  // 					newOpacity = activeline ? 0 : 1;
  // 				    // Hide or show the elements
  // 				    d3.select("#localLine").style("opacity", newOpacity);
  // 				    d3.select("#localAxis").style("opacity", newOpacity);
  // 				    // Update whether or not the elements are active
  // 				    localLine.active = activeline;
  // 				})*/
  // 				.text("Local time series");
  			
  // 			// Add global data legend title (clickable to appear/disappear)
  // 		  svg.append("text")
  // 				.attr("x", 300)
  // 				.attr("y", height.plot)
  // 				.attr("class", "legend")
  // 				.style("fill", "OrangeRed")
  // 		                .style("cursor", "pointer")
  // 				.on("click", function() {
		// 		    // Determine if current line is visible
		// 		    var activeline = globalLine.active ? false : true,
  // 					newOpacity = activeline ? 0 : 1;
		// 		    // Hide or show the elements
		// 		    d3.select("#globalLine").style("opacity", newOpacity);
		// 		    d3.select("#globalAxis").style("opacity", newOpacity);
		// 		    // Update whether or not the elements are active
		// 		    globalLine.active = activeline;
  // 				})
  // 				.text("Global time series");

  // 			var dots = svg.selectAll("circle")
		// 			.data(data).enter()
  // 				.append("circle")
		// 			.attr("id", function(d) { return "y" + d.date.getFullYear(); })
		// 			.attr("cx", function(d) { return x(d.date); })
		// 			.attr("cy", function(d) { return yl(d.fakelocaldata); })
		// 			.attr("transform", "translate("+margin.left+",0)")
		// 			.attr("r", "10px")
		// 			.style("stroke", "steelblue")
		// 			.style("stroke-width", "3px")
		// 			.style("fill", "steelblue");

  // 			d3.select("circle#y1984").style("fill", "white");
  // 			d3.select("circle#y2011").style("fill", "white");

  // 			var before = d3.select("#before")
  // 				.append("svg")
  // 					.attr("viewBox", "0 0 " + width.image + " " + height.image)
  // 					.style("display", "inline")
  // 					.style("height", "1em")
  // 					.style("width", (width.image/height.image) + "em")
  // 				.append("use")
  // 					.attr("id", "image1")
  // 					//depends on current_location
  // 					.attr("xlink:href", "#1984");

  // 			var after = d3.select("#after")
  // 				.append("svg")
  // 					.attr("viewBox", "0 0 " + width.image + " " + height.image)
  // 					.style("display", "inline")
  // 					.style("height", "1em")
  // 					.style("width", (width.image/height.image) + "em")
  // 				.append("use")
  // 					.attr("id", "image2")
  // 					.attr("xlink:href", "#2011");

  // 			d3.select("#before")
  // 				.append("text")
  // 				.attr("id", "before-text")
  // 				.text("1984")
  // 				.attr("x",10)
  // 				.attr("y",30)
  // 				.style("font-size", "24px")
  // 				.style("fill","white");

  // 			d3.select("#after")
  // 				.append("text")
  // 				.text("2011")
  // 				.attr("x",10)
  // 				.attr("y",30)
  // 				.style("font-size", "24px")
  // 				.style("fill","white");

  // 		    alldots = d3.selectAll("circle");

  //       //---------------------------------
  //       // MOUSE INTERACTIVITY
  //       //---------------------------------
  // 			dots.on({
  // 						mouseover: function(d) {
  // 				                    d3.select(this).style("fill", "white");
  // 				                    this.style.cursor = "pointer";
  // 						},
  // 						mouseout: function(d) {
  // 							if (this != activemouse) {
  // 								d3.select(this).style("fill", "steelblue");
  // 							}
  // 						},
  // 						click: function(d) {
  // 							d3.selectAll("circle").style("fill", "steelblue");
  // 							d3.select("circle#y2011").style("fill", "white"); // this is needed to keep last dot blue after clicking on it
  // 							activemouse = this;
  // 				                        activeidx = findindexbyid(alldots,activemouse.id); 
  // 				                        d3.select(activemouse).style("fill", "white");
  // 							d3.select("use#image1").attr("xlink:href", "#" + activemouse.id.substring(1,5));
  // 				                        d3.select("#before-text").text(activemouse.id.substring(1,5));
  // 						}
  // 					});

  // 			//---------------------------------
  //       // RIGHT-LEFT ARROW KEY STEPTHROUGH
  //       //---------------------------------
  //       d3.select("#imgdivID").on({
		// 		  keydown: function(d,i) {
  // 					if (d3.event.keyCode == 39) { // when you click the right arrow key...
  // 		                            if (activeidx<alldots.size()-1) {activeidx++;} // don't go further right than there are pts
  // 		                            d3.selectAll("circle").style("fill", "steelblue");
  // 		                            d3.select("circle#y2011").style("fill", "white");
  // 		                            d3.select(alldots[0][activeidx]).style("fill", "white");
  // 					    d3.select("use#image1").attr("xlink:href", "#" + alldots[0][activeidx].id.substring(1,5));
  // 					    d3.select("#before-text").text(alldots[0][activeidx].id.substring(1,5));
  // 		                        }
  // 					if (d3.event.keyCode == 37) { // when you click the left arrow key...
  // 		                            if (activeidx>0) {activeidx--;} // don't go further left than there are pts
  // 		                            d3.selectAll("circle").style("fill", "steelblue");
  // 		                            d3.select("circle#y2011").style("fill", "white");
  // 		                            d3.select(alldots[0][activeidx]).style("fill", "white");
  // 					    d3.select("use#image1").attr("xlink:href", "#" + alldots[0][activeidx].id.substring(1,5));
  // 					    d3.select("#before-text").text(alldots[0][activeidx].id.substring(1,5));
  // 		                        }
  // 				}
		// 	  });

		// }); //end d3.csv -> load data file for line plot

    } // end function show_information


});