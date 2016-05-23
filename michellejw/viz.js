
//compute the dimensions of the current div - #map
var margin = {top: 10, left: 10, bottom: 10, right: 10}
  , width = parseInt(d3.select('#map').style('width'))
  , height = parseInt(d3.select('#map').style('height'));

//set the size of the svg to be the minimum of width and height - map ratio is 1
var width = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom)
  , height = width;

//create the svg element
var svg = d3.select("#map").append("svg")
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
    .await(ready);







//When a task completes, it must call the provided callback. The first argument to the callback should be null if the task is successfull, or the error if the task failed.
function ready(error, world, locations) {

  if (error) throw error;

  //the world file is a topojson files
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

  var thispoint = [];

    //draw the locations path
  locations.forEach(function(d) {
    thispoint = svg.append("path")
        //from the csv take lat long to create a path object
        .datum({type: "Point", coordinates: [d.lon, d.lat]})
        .attr("class", "locations")
        .attr("fill","yellow")
        .attr("d", path.pointRadius(8))
        //add the attribute for location id
        .attr("id",d.location_id)
        //.attr("boobooo","hello")
        .on("click",mouseClick);
  });

//console.log(d3.selectAll("path.locations").attr("boobooo"));


  //Drag event
  svg.selectAll("path").call(d3.behavior.drag()
        .origin(function() { var r = projection.rotate(); return {x: r[0] / sens, y: -r[1] / sens}; })
        .on("drag", function() {
          //make sure that the rotate event stops when you start draging
          d3.select('#animate').node().checked=false;
          var rotate = projection.rotate();
          projection.rotate([d3.event.x * sens, -d3.event.y * sens, rotate[2]]);
          svg.selectAll("path.land").attr("d", path)
          svg.selectAll("path.locations").attr("d", path);
        }))



  //start spinning_globe
  spinning_globe();

  d3.timer.flush();

}

//prepare values for spinning effect
//If rotation is specified, sets the projection’s three-axis rotation to the specified angles λ, φ and γ (yaw, pitch and roll, or equivalently longitude, latitude and roll) in degrees and returns the projection. If rotation is not specified, returns the current rotation which defaults [0, 0, 0]. If the specified rotation has only two values, rather than three, the roll is assumed to be 0°.
var time = Date.now();
var rotate = [0, 0];
var velocity = [0.015,-0];
function spinning_globe() {

  //for more information on transition and timer: https://github.com/d3/d3/wiki/Transitions#d3_timer
  //Start a custom animation timer, invoking the specified function repeatedly until it returns true.  
   d3.timer(function() {

      // get current time
      var dt = Date.now() - time;

      //console.log(dt);

      // get the new position from modified projection function
      projection.rotate([rotate[0] + velocity[0] * dt, rotate[1] + velocity[1] * dt]);

      // update countries and locations position = redraw
      svg.selectAll("path.land").attr("d", path);
      svg.selectAll("path.locations").attr("d", path);

      //that would be pretty to stop animating when we uncheck rotating checkbox, but I don't know how to restart the rotation!
      if(d3.select('#animate').node().checked==false) {
        return true;
      }

   });

}

//stop or start rotating - this piece of code is extremely ugly I want to ask during office hours how to make that prettier
//does not work because sets everything on initial position
// d3.select('#animate')
//       .on("change", function() {
//           if (velocity[0]==0.015) {
//             velocity[0]=0;
//           }
//           else {
//             velocity[0]=0.015;
//           }
//       });

//when change, check if rotating is checked and if so, restart the rotation
d3.select('#animate')
      .on("change", function() {
          if (d3.select('#animate').node().checked) {
            spinning_globe();
          }
      });

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

var active = null; // variable to record which point has been clicked

var thissvg = [];





function mouseClick() {
  d3.select(active).style("fill","yellow")
  // Clear html within modal div container
  $("#imgdivID").html("")
  active = this;
  d3.select(active).style("fill","green")
    .attr("data-toggle","modal")
    .attr("data-target","#myModal")

  currentlocation = d3.select(active).attr("id");

  //draw_modal(current_location);






  //Insert image/plot stuff

  // should be able to extract dimensions directly from image, right? 
  //think about responsive modal (dimensions)
  var w = 720,
      h = 480/2;

  var width = .8*w,
      height = .8*h;

  //d3.select("#imgdivID").remove()

  var svg = d3.select("#imgdivID")
    .append("svg")
    .attr("id", "satellite")
    .attr("width", width)
    .attr("height", height);
    // .classed("svg-container",true)
    // .classed("svg-content-responsive", true);
    // .attr("viewBox", "0 0 " + width + " " + height);

//current_img = location_img_ + current_location
//location_img_ + (1,2,3,4)
  var image = svg.append("image")
    .attr("xlink:href","flooding.png")
    .attr("width", width)
    .attr("height", height)
    .attr("id","flooding")
    .style("opacity",1);


  svg.append("text")
    .text("November 7, 1984")
    .attr("x",10)
    .attr("y",25)
    .style("font-size", "24px")
    .style("fill","white");

  svg.append("text")
    .text("October 12, 2015")
    .attr("x",.5*width+10)
    .attr("y",25)
    .style("font-size", "24px")
    .style("fill","white");

  var margin = {top:40, right:20, bottom:10, left:50};

  var x = d3.time.scale()
    .range([0,width - margin.left - margin.right]);

  var y = d3.scale.linear()
    .range([height - margin.top - margin.bottom, margin.top]);

  var x_axis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

  var y_axis = d3.svg.axis()
    .scale(y)
    .orient("left");

  var line = d3.svg.line()
    .x(function(d) { return x(d.year); })
    .y(function(d) { return y(d.fake_data); });

  d3.csv("flooding.csv", function(data) {
    
    var parseDate = d3.time.format("%Y").parse;

    data.forEach(function(d) {
      d.year = parseDate(d.year);
      d.fake_data = +d.fake_data;
    });

    x.domain(d3.extent(data, function(d) { return d.year; }));

    y.domain(d3.extent(data, function(d) { return d.fake_data; }));

    console.log(data);

    svg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("transform", "translate(" + margin.left + ",0)")
      .attr("d",line)
      .style("opacity",0);

    console.log(d3.selectAll("path.line"))

    svg.selectAll("circle")
      .data(data).enter()
      .append("circle")
      .filter(function(d) { return (d.year.getTime() == parseDate("1984").getTime() || d.year.getTime() == parseDate("2015").getTime()) ; })
      .attr("cx", function(d) { return x(d.year); })
      .attr("cy", function(d) { return y(d.fake_data); })
      .attr("transform", "translate("+margin.left+",0)")
      .attr("r", "6px")
      .style("opacity",0);

    svg.selectAll("text")
      .data(data).enter()
      .append("text")
      .filter(function(d) { return (d.year.getTime() == parseDate("1984").getTime() || d.year.getTime() == parseDate("2015").getTime()) ; })
      .attr("id", "label")
      .text(function(d) { return d.year.getFullYear(); })
      .attr("x", function(d) { return x(d.year)+5; })
      .attr("y", function(d) { return y(d.fake_data)-5; })
      .attr("transform", "translate("+margin.left+",0)")
      .style("font-size", "14px")
      .style("opacity",0);

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(" + margin.left + "," + [height - margin.top - margin.bottom] + ")")
      .call(x_axis)
      .style("opacity",0);

    svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + margin.left + ",0)")
      .call(y_axis)
      .style("opacity",0);

    svg.append("text")
      .attr("class", "x label")
      .attr("id", "label")
      .attr("text-anchor", "middle")
      .attr("x", width/2)
      .attr("y", height - margin.bottom)
      .attr("font-size", "14px")
      .text("Year")
      .style("font-weight", "bold")
      .style("opacity",0);

    svg.append("text")
      .attr("class", "y label")
      .attr("id", "label")
      .attr("text-anchor", "middle")
      .attr("transform", "translate("+margin.left/3+","+(height-margin.top-margin.bottom)/2+")rotate(-90)")
      .attr("font-size", "14px")
      .text("Flooding (m)")
      .style("font-weight", "bold")
      .style("opacity",0);

    var click = 0;

    svg.on({
      "mouseover":function(d) {
        d3.select("image").style("opacity",0.5);
        d3.selectAll("g").style("opacity",1);
        d3.selectAll("path.line").style("opacity",1);
        d3.selectAll("#label").style("opacity",1)
        d3.selectAll("circle").style("opacity",1);
      },

      "mouseout": function(d) {
        d3.select("image").style("opacity",1);
        d3.selectAll("g").style("opacity",0);
        d3.selectAll("path.line").style("opacity",0);
        d3.selectAll("#label").style("opacity",0)
        d3.selectAll("circle").style("opacity",0);
      },

      "click": function(d) {
        if (click == 0) {
          d3.select("image").style("opacity",0.5);
          d3.selectAll("g").style("opacity",1);
          d3.select("path").style("opacity",1);
          d3.selectAll("#label").style("opacity",1)
          d3.selectAll("circle").style("opacity",1);
          click++;
        }
        else {
          d3.select("image").style("opacity",1);
          d3.selectAll("g").style("opacity",0);
          d3.select("path").style("opacity",0);
          d3.selectAll("#label").style("opacity",0)
          d3.selectAll("circle").style("opacity",0);
          click = 0;
        }
        
      }
    });
  });





}






