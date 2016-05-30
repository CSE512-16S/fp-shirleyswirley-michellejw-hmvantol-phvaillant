var single_img_width, single_img_height, total_img_width, total_img_height;

var show_info_inside_modal = function(current_location) {

//d3.csv("timeline/location" + current_location + ".csv",
d3.csv("timeline/athabasca.csv",
        
        function(d) { return { 
            x: +d.x,
            y: +d.y
        }; },

        function(data) {
            imgxpos = data.map(function(d) {return Math.abs(d.x)});
            imgypos = data.map(function(d) {return Math.abs(d.y)});;
            single_img_width = Math.min.apply(0, imgxpos.filter(Number));
            single_img_height = Math.min.apply(0, imgypos.filter(Number));
            total_img_width = Math.max.apply(0, imgxpos.filter(Number)) + single_img_width;
            total_img_height = Math.max.apply(0, imgypos.filter(Number)) + single_img_height;
            
        }

);

console.log(single_img_width);

// --- Define image width and height
//CHANGE THAT. NEEDS TO BE DETERMINED BY CSS
var margin = {top:40, right:20, bottom:10, left:50};
var width = {image: single_img_width, plot: single_img_width*2, total: single_img_width*2+30, image_total: total_img_width};
var height = {image: single_img_height, plot: single_img_height, image_total: total_img_height};

//ALL THESE LINES OF CODES WILL NEED TO DEPEND ON current_location
// NOTE: myModal is so named in viz.js; must change name here if name is changed there 
var defs = d3.select("#myModal")
        .append("svg")
        .attr("class", "defs")
        .attr("x",0)
        .attr("y",0)
        .attr("width",0)
        .attr("height",0)
        .append("defs");

defs.append("image")
	.attr("id", "satellite")
	//THAT NEEDS TO BE DETERMINED BY current_location
	//FOLDER images/
	//instead of athabasca.png you will call "img/"" + current_location
	.attr("xlink:href", "img/location" + current_location + ".png")
	//Count number of images in file so that 5 and 6 are not arbitrary
	.attr("width", width.image_total)
	.attr("height", height.image_total);

defs.append("clipPath")
	.attr("id", "satellite-cp")
	.append("rect")
	.attr("x",0)
	.attr("y",0)
	.attr("height", height.image)
	.attr("width", width.image);

var before = d3.select("#imgdivID")
	.append("svg")
	.attr("id", "before")
	.attr("width", width.image)
	.attr("height", height.image)
	.attr("x",0)
	.attr("y",0);

var after = d3.select("#imgdivID")
	.append("svg")
	.attr("id", "after")
	.attr("width", width.image)
	.attr("height", height.image)
	//TO BE CHANGED
	.attr("x",720)
	.attr("y",0);

// --- Set up line plot features 
var x = d3.time.scale()
	.range([0,width.plot - margin.left - margin.right]);

// l = local
var yl = d3.scale.linear()
	.range([height.plot - margin.top - margin.bottom, margin.top]);

// g = global
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
	.y(function(d) { return yl(d.fakelocaldata); });
     
var lineg = d3.svg.line()
	.x(function(d) { return x(d.date); })
	.y(function(d) { return yg(d.fakeglobaldata); });

var svg = d3.select("#imgdivID")
	.append("svg")
	.attr("id", "plot")
	.attr("width", width.total)
	.attr("height", height.plot)
	.attr("x",0)
	.attr("y",height.image);

svg.append("text")
	.attr("class", "x label")
	.attr("id", "label")
	.attr("text-anchor", "middle")
	.attr("x", (width.plot)/2)
	.attr("y", height.plot - margin.bottom/3)
	.text("Year")
	.style("font-weight", "bold");

svg.append("text")
	.attr("class", "y label")
	.attr("id", "label")
	.attr("text-anchor", "middle")
	.attr("transform", "translate("+margin.left/3+","+(height.plot-margin.top-margin.bottom)/2+")rotate(-90)")
	.text("Y VARIABLE")
	.style("font-weight", "bold");

// --- Define global variables for keyboard and mouse input
var alldots = null;
var activeidx = 0;
var activemouse = null;

// MAKE DEPENDENT ON CURRENT_LOCATION
// --- Load data
d3.csv("timeline/athabasca.csv", function(data) {

	var parseDate = d3.time.format("%m/%d/%Y").parse;

	data.forEach(function(d) {
		d.fakelocaldata = +d.fakelocaldata;
		d.fakeglobaldata = +d.fakeglobaldata;
		d.date = parseDate(d.date);
		d.x = +d.x;
		d.y = +d.y;
	});

	defs.selectAll("g")
		.data(data).enter()
		.append("g")
			.attr("id", function(d) { return d.date.getFullYear(); })
			.attr("clip-path", "url(#satellite-cp)")
		.append("use")
			//id of image
			.attr("xlink:href", "#satellite")
			.attr("transform", function(d) { return "translate("+d.x+","+d.y+")"; });

	x.domain(d3.extent(data, function(d) { return d.date; }));
	yl.domain(d3.extent(data, function(d) { return d.fakelocaldata; }));
	yg.domain(d3.extent(data, function(d) { return d.fakeglobaldata; }));

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(" + margin.left + "," + [height.plot - margin.top - margin.bottom] + ")")
		.call(x_axis);

	svg.append("g")
                .attr("class", "y axis")
                .style("fill", "steelblue")
                .attr("id", "localAxis")
  	        .attr("transform", "translate(" + margin.left + ",0)")
  	        .call(y_axisl);

  	svg.append("g")
                .attr("class", "y axis")
                .style("fill", "OrangeRed")
  	        .style("opacity", 0)
  	        .attr("id", "globalAxis")
  	        .attr("transform", "translate(" + width.plot + ",0)")
  	        .call(y_axisg);

        svg.append("path")
        	.datum(data)
                .attr("class", "line")
                .attr("stroke", "steelblue")
                .attr("id","localLine")
        	.attr("transform", "translate(" + margin.left + ",0)")
        	.attr("d",linel);
        
        svg.append("path")
  		.datum(data)
                .attr("class", "line")
                .style("stroke", "OrangeRed")
  	        .style("opacity", 0)
  	        .attr("id", "globalLine")
  	        .attr("transform", "translate(" + margin.left + ",0)")
  	        .attr("d",lineg);

        // --- Add local data legend title
  	svg.append("text")
  	        .attr("x", 0)
  	        .attr("y", height.plot)
  	        .attr("class", "legend")
  	        .style("fill", "steelblue")
                /*.on("click", function() {
                    // Determine if current line is visible
                    var activeline = globalLine.active ? false : true,
                	newOpacity = activeline ? 0 : 1;
                    // Hide or show the elements
                    d3.select("#globalLine").style("opacity", newOpacity);
                    d3.select("#globalAxis").style("opacity", newOpacity);
                    // Update whether or not the elements are active
                    globalLine.active = activeline;
                })*/
                .text("Local time series");

  	// --- Add global data legend title (clickable to appear/disappear)
  	svg.append("text")
                .attr("x", 300)
                .attr("y", height.plot)
                .attr("class", "legend")
                .style("fill", "OrangeRed")
                .style("cursor", "pointer")
                .on("click", function() {
                    // Determine if current line is visible
                    var activeline = globalLine.active ? false : true,
                	newOpacity = activeline ? 0 : 1;
                    // Hide or show the elements
                    d3.select("#globalLine").style("opacity", newOpacity);
                    d3.select("#globalAxis").style("opacity", newOpacity);
                    // Update whether or not the elements are active
                    globalLine.active = activeline;
                })
                .text("Global time series");

  	var dots = svg.selectAll("circle")
  			.data(data).enter()
  		.append("circle")
  			.attr("id", function(d) { return "y" + d.date.getFullYear(); })
  			.attr("cx", function(d) { return x(d.date); })
  			.attr("cy", function(d) { return yl(d.fakelocaldata); })
  			.attr("transform", "translate("+margin.left+",0)")
  			.attr("r", "10px")
  			.style("stroke", "steelblue")
  			.style("stroke-width", "3px")
  			.style("fill", "steelblue");

  	d3.select("circle#y1984").style("fill", "white");
  	d3.select("circle#y2011").style("fill", "white");

  	var before = d3.select("#before")
  		.append("svg")
  			.attr("viewBox", "0 0 " + width.image + " " + height.image)
  			.style("display", "inline")
  			.style("height", "1em")
  			.style("width", (width.image/height.image) + "em")
  		.append("use")
  			.attr("id", "image1")
  			//MAKE DEPENDENT ON CURRENT_LOCATION
  			.attr("xlink:href", "#1984");

  	var after = d3.select("#after")
  		.append("svg")
  			.attr("viewBox", "0 0 " + width.image + " " + height.image)
  			.style("display", "inline")
  			.style("height", "1em")
  			.style("width", (width.image/height.image) + "em")
  		.append("use")
  			.attr("id", "image2")
  			.attr("xlink:href", "#2011");

  	d3.select("#before")
  		.append("text")
  		.attr("id", "before-text")
  		.text("1984")
  		.attr("x",10)
  		.attr("y",30)
  		.style("font-size", "24px")
  		.style("fill","white");

  	d3.select("#after")
  		.append("text")
  		.text("2011")
  		.attr("x",10)
  		.attr("y",30)
  		.style("font-size", "24px")
  		.style("fill","white");

  	alldots = d3.selectAll("circle");

        // --- Add mouse interactivity
        dots.on({
                mouseover: function(d) {
                    d3.select(this).style("fill", "white");
                    this.style.cursor = "pointer";
                },
                mouseout: function(d) {
                	if (this != activemouse) {
                		d3.select(this).style("fill", "steelblue");
                	}
                },
                click: function(d) {
                	d3.selectAll("circle").style("fill", "steelblue");
                	d3.select("circle#y2011").style("fill", "white"); // this is needed to keep last dot blue after clicking on it
                	activemouse = this;
                        activeidx = findindexbyid(alldots,activemouse.id); 
                        d3.select(activemouse).style("fill", "white");
                	d3.select("use#image1").attr("xlink:href", "#" + activemouse.id.substring(1,5));
                        d3.select("#before-text").text(activemouse.id.substring(1,5));
                }
        });

        // --- Right-left arrow key stepthrough
        d3.select("#imgdivID").on({
            keydown: function(d,i) {
                if (d3.event.keyCode == 39) { // when you click the right arrow key...
                    if (activeidx<alldots.size()-1) {activeidx++;} // don't go further right than there are pts
                    d3.selectAll("circle").style("fill", "steelblue");
                    d3.select("circle#y2011").style("fill", "white");
                    d3.select(alldots[0][activeidx]).style("fill", "white");
            	    d3.select("use#image1").attr("xlink:href", "#" + alldots[0][activeidx].id.substring(1,5));
            	    d3.select("#before-text").text(alldots[0][activeidx].id.substring(1,5));
                }
            	if (d3.event.keyCode == 37) { // when you click the left arrow key...
                    if (activeidx>0) {activeidx--;} // don't go further left than there are pts
                    d3.selectAll("circle").style("fill", "steelblue");
                    d3.select("circle#y2011").style("fill", "white");
                    d3.select(alldots[0][activeidx]).style("fill", "white");
            	    d3.select("use#image1").attr("xlink:href", "#" + alldots[0][activeidx].id.substring(1,5));
            	    d3.select("#before-text").text(alldots[0][activeidx].id.substring(1,5));
                }
              }
        });

}); // end d3.csv

} // end show_info_inside_modal function

//-----------------
// HELPER FUNCTIONS
//-----------------
function findindexbyid(arraytosearch, idtosearch) {
    for (var i = 0; i < arraytosearch.size(); i++) {
        if (arraytosearch[0][i].id == idtosearch) {return i;}
    }
    return null;
}

