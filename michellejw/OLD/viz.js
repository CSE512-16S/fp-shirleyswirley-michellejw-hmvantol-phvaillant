
var margin = {top: 10, left: 10, bottom: 10, right: 10}
  , width = parseInt(d3.select('#map').style('width'))
  , height = parseInt(d3.select('#map').style('height'));

var width = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom)
  , height = width;

var svg = d3.select("#map").append("svg")
    .attr("width",  width)
    .attr("height", height)
    .on("mousedown", mousedown);

var projection = d3.geo.azimuthal()
    .scale(width/2)
    .origin([-71.03,42.37])
    .mode("orthographic")
    .translate([width / 2, height / 2]);

var circle = d3.geo.greatCircle()
    .origin(projection.origin());

// TODO fix d3.geo.azimuthal to be consistent with scale
var scale =
	{ orthographic: width / 2
	, stereographic: width / 2
	, gnomonic: width / 2
	, equidistant: width / 2 / Math.PI * 2
	, equalarea: width / 2 / Math.SQRT2
	};

var path = d3.geo.path()
    .projection(projection);

d3.json("world-countries.json", function(collection) {
    feature = svg.selectAll("path")
        .data(collection.features)
      .enter().append("path")
      //function clip defined to get path from circle.clip
        .attr("d", clip);

    feature.append("title")
        .text(function(d) { return d.properties.name; });

    startAnimation();
    d3.select('#animate').on('click', function () {
      if (done) startAnimation(); else stopAnimation();
    });
 });

function clip(d) {
  return path(circle.clip(d));
}


// loading city locations from geoJSON
d3.json("points.geojson", function(error, data) {
         // Handle errors getting and parsing the data
         if (error) { return error; }

         // setting the circle size (not radius!) according to the number of inhabitants per city
         population_array = [];
         for (i = 0; i < data.features.length; i++) {
            population_array.push(data.features[i].properties.population);
         }
         max_population = population_array.sort(d3.descending)[0]
         var rMin = 0;
         var rMax = Math.sqrt(max_population / (peoplePerPixel * Math.PI));
         rScale.domain([0, max_population]);
         rScale.range([rMin, rMax]);
         path.pointRadius(function(d) {
            return d.properties ? rScale(d.properties.population) : 1;
         });
         // Drawing transparent circle markers for cities
         g.selectAll("path.cities").data(data.features)
            .enter().append("path")
            //.attr("class", "cities")
            .attr("d", path)
            .attr("fill", "#ffba00")
            .attr("fill-opacity", 0.3);
         // start spinning!
         //spinning_globe();
});







function stopAnimation() {
  done = true;
  d3.select('#animate').node().checked = false;
}

function startAnimation() {
  done = false;
  d3.timer(function() {
    var origin = projection.origin();
    origin = [origin[0] + .18, origin[1] + .06];
    projection.origin(origin);
    circle.origin(origin);
    refresh();
    return done;
  });
}

function refresh(duration) {
  (duration ? feature.transition().duration(duration) : feature).attr("d", clip);
}

d3.select(window)
    .on("mousemove", mousemove)
    .on("mouseup", mouseup);

function animationState() {
  return 'animation: '+ (done ? 'off' : 'on');
}

d3.select("select").on("change", function() {
  stopAnimation();
  projection.mode(this.value).scale(scale[this.value]);
  refresh(750);
});

var m0
  , o0
  , done
  ;

function mousedown() {
  stopAnimation();
  m0 = [d3.event.pageX, d3.event.pageY];
  o0 = projection.origin();
  d3.event.preventDefault();
}

function mousemove() {
  if (m0) {
    var m1 = [d3.event.pageX, d3.event.pageY]
      , o1 = [o0[0] + (m0[0] - m1[0]) / 8, o0[1] + (m1[1] - m0[1]) / 8];
    projection.origin(o1);
    circle.origin(o1);
    refresh();
  }
}

function mouseup() {
  if (m0) {
    mousemove();
    m0 = null;
  }
}


d3.select(window).on('resize', resize);

function resize() {
    // adjust things when the window size changes
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
    svg.selectAll('path').attr('d', clip);
}