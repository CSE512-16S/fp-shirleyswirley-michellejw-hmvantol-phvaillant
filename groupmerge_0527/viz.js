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
          if(d3.event.keyCode == 38) {
            current_location += 1;
            current_location = current_location % 5;
            if (current_location==0) {current_location=1};
            center_on_location(current_location);
            show_information(current_location);
          }
          if (d3.event.keyCode == 40) {
            current_location -= 1;
            current_location = current_location % 5;
            if (current_location==0) {current_location=4};
            center_on_location(current_location);
            show_information(current_location);
          }
        }
      })

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

  function show_information(current_location) {

    // Clear html within modal div container
    // NOTE: If you change the name of the modal div container here,
    // you must change it in show_info_inside_modal.js as well
    $("#imgdivID").html("");

    //LOTS OF WORK FOR MICHELLE TO RESIZE MODAL

    modalwidth = (parseInt($('body').css('width'))-parseInt($('#map').css('width'))) + "px";
    modalheight = parseInt($('body').css('height')) + "px";
    // height of modal header + footer
    modal_hf = parseInt($('.modal-header').css('height')) + parseInt($('.modal-footer').css('height'));
    // Calculate modal body height 
    modal_body_ht = parseInt($('body').css('height'))  - (modal_hf);


    console.log("modal_hf=" + modal_hf)
    console.log("modalheight=" + modalheight)
    console.log("modal_body_ht=" + modal_body_ht)
    console.log("modal_footer_ht=" + parseInt($('.modal-footer').css('height')))

    // modalwidth = parseInt($( information_pane ).width()) + "px";
    // modalheight = parseInt($( information_pane).height()) + "px";

    // Set the height of the modal based on the information pane
    $("#myModal").on('show.bs.modal', function (){
      // $('#myModal').css('left',parseInt($( information_pane ).position().left) + "px");
      $('.modal-body').css('height',modal_body_ht);
      $('.modal-body').css('width',modalwidth);
      $('.modal-dialog').css('height',modalheight);
      $('.modal-dialog').css('width',modalwidth);
      $('.modal-content').css('height',modalheight);

      // $('.modal-dialog').css('left',(parseInt($('.modal-dialog').css('width')) - parseInt($( myModal ).width()) ) + "px");
    })


    console.log("modal_footer_ht=" + parseInt($('.modal-footer').css('height')))



    // Show the modal
    // NOTE: If you change the name of the modal here,
    // you must change it in show_info_inside_modal.js as well
    $("#myModal").modal('show');
        
    // Display all the contents of the modal
    // This function defined in insidemodal.js
    // show_info_inside_modal(current_location);

  } // end function show_information

});
