// NOTE: myModal is so named in viz.js; must change name here if name is changed there 

var years;

var show_info_inside_modal = function(current_location) {

d3.csv("timeline/location" + current_location + ".csv", function(data) {

    var parseDate = d3.time.format("%m/%d/%Y").parse;

    // --- Make data into numbers    
    data.forEach(function(d) {
    	d.localdata = +d.localdata;
    	d.globaldata = +d.globaldata;
    	d.date = parseDate(d.date);
    	d.x = +d.x;
    	d.y = +d.y;
    });

    // --- Calculate begin and end years of time series 
    years = data.map(function(d) { return d.date.getFullYear(); });
    minyear = Math.min.apply(null,years);
    maxyear = Math.max.apply(null,years);

    // --- Calculate image size attributes
    imgxpos = data.map(function(d) { return Math.abs(d.x); });
    imgypos = data.map(function(d) { return Math.abs(d.y); });
    single_img_width = Math.min.apply(0, imgxpos.filter(Number));
    single_img_height = Math.min.apply(0, imgypos.filter(Number));
    total_img_width = Math.max.apply(0, imgxpos.filter(Number)) + single_img_width;
    total_img_height = Math.max.apply(0, imgypos.filter(Number)) + single_img_height;

    // --- Define margins + plot and image widths/heights
    var margin = {top:40, right:20, bottom:10, left:50};
    var width = {image: single_img_width, plot: single_img_width*2, total: single_img_width*2+30, image_total: total_img_width};
    var height = {image: single_img_height, plot: single_img_height, image_total: total_img_height};

    // --- Set up image display features  
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
    	.attr("x",width.image)
    	.attr("y",0);
    
    // --- Set up all line plot features 
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
    	.y(function(d) { return yl(d.localdata); });
         
    var lineg = d3.svg.line()
    	.x(function(d) { return x(d.date); })
    	.y(function(d) { return yg(d.globaldata); });
    
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

    // --- Append/enter data
    defs.selectAll("g")
    	.data(data).enter()
    	.append("g")
    		.attr("id", function(d) { return d.date.getFullYear(); })
    		.attr("clip-path", "url(#satellite-cp)")
    	.append("use")
    		//id of image
    		.attr("xlink:href", "#satellite")
    		.attr("transform", function(d) { return "translate("+d.x+","+d.y+")"; });

    // --- Plot line plot
    x.domain(d3.extent(data, function(d) { return d.date; }));
    yl.domain(d3.extent(data, function(d) { return d.localdata; }));
    yg.domain(d3.extent(data, function(d) { return d.globaldata; }));
    
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
            // Uncomment the following block to allow clickable title --> appear/disappear local data
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

    // --- Plot the line plot dots
    var dots = svg.selectAll("circle")
    		.data(data).enter()
    	.append("circle")
    		.attr("id", function(d) { return "y" + d.date.getFullYear(); })
    		.attr("cx", function(d) { return x(d.date); })
    		.attr("cy", function(d) { return yl(d.localdata); })
    		.attr("transform", "translate("+margin.left+",0)")
    		.attr("r", "10px")
    		.style("stroke", "steelblue")
    		.style("stroke-width", "3px")
    		.style("fill", "steelblue");

    // --- Differently color the dots at the very beginning and end of the time series
    d3.select("circle#y" + minyear).style("fill", "white");
    d3.select("circle#y" + maxyear).style("fill", "white");
    
    var before = d3.select("#before")
    	.append("svg")
    		.attr("viewBox", "0 0 " + width.image + " " + height.image)
    		.style("display", "inline")
    		.style("height", "1em")
    		.style("width", (width.image/height.image) + "em")
    	.append("use")
    		.attr("id", "imagebefore")
    		.attr("xlink:href", "#" + minyear);
    
    var after = d3.select("#after")
    	.append("svg")
    		.attr("viewBox", "0 0 " + width.image + " " + height.image)
    		.style("display", "inline")
    		.style("height", "1em")
    		.style("width", (width.image/height.image) + "em")
    	.append("use")
    		.attr("id", "imageafter")
    		.attr("xlink:href", "#" + maxyear);
    
    d3.select("#before")
    	.append("text")
    	.attr("id", "before-text")
    	.text(minyear)
    	.attr("x",10)
    	.attr("y",30)
    	.style("font-size", "24px")
    	.style("fill","white");
    
    d3.select("#after")
    	.append("text")
    	.text(maxyear)
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
            	d3.select("circle#y" + maxyear).style("fill", "white"); // this is needed to keep last dot white after clicking on it
            	activemouse = this;
                activeidx = findindexbyid(alldots,activemouse.id); 
                d3.select(activemouse).style("fill", "white");
            	d3.select("use#imagebefore").attr("xlink:href", "#" + activemouse.id.substring(1,5));
                d3.select("#before-text").text(activemouse.id.substring(1,5));
            }
    });
    
    // --- Right-left arrow key stepthrough
    d3.select("#myModal").on({
        keydown: function(d,i) {
            if (d3.event.keyCode == 39) { // when you click the right arrow key...
                if (activeidx<alldots.size()-1) {activeidx++;} // don't go further right than there are pts
                d3.selectAll("circle").style("fill", "steelblue");
                d3.select("circle#" + maxyear).style("fill", "white");
                d3.select(alldots[0][activeidx]).style("fill", "white");
        	d3.select("use#imagebefore").attr("xlink:href", "#" + alldots[0][activeidx].id.substring(1,5));
        	d3.select("#before-text").text(alldots[0][activeidx].id.substring(1,5));
            }
            if (d3.event.keyCode == 37) { // when you click the left arrow key...
                if (activeidx>0) {activeidx--;} // don't go further left than there are pts
                d3.selectAll("circle").style("fill", "steelblue");
                d3.select("circle#y" + maxyear).style("fill", "white");
                d3.select(alldots[0][activeidx]).style("fill", "white");
        	d3.select("use#imagebefore").attr("xlink:href", "#" + alldots[0][activeidx].id.substring(1,5));
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

