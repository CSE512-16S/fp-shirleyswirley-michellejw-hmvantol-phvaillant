
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
        //.on("mouseenter",mouseEnter)
        //.on("mouseleave",mouseLeave)
        .on("click",mouseClick);
  });






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
var isclicked = 0; // variable to record if a point has been clicked (for controlling hovering)

function mouseClick() {
  //console.log("mouseClick")
  d3.select(active).style("fill","yellow")
  isclicked = 0;
  active = this;
  d3.select(active).style("fill","green")
    .attr("data-toggle","modal")
    .attr("data-target","#myModal")
}

// function mouseEnter(d) {
//   //console.log("mouseEnter")
//   //d3.select(this).style("fill","lightgreen")
// }

// function mouseLeave(d) {
//   //console.log("mouseLeave")
//   //d3.select(this).style("fill","yellow")
// }

// %('#myModal').on('shown.bs.modal',function() {
//   $('#myInput').focus()
// })


