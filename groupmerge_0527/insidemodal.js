// NOTE: myModal, imgdivID are so named in viz.js; must change names here if names are changed there 

var show_info_inside_modal = function(current_location) {

d3.csv("timeline/location" + current_location + ".csv", function(data) {

    console.log(data);

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

    // --- Subselect the data associated with images
    var id = 0;
    for (var i = 0; i < fulldata.length; i++) {fulldata[i].id = id++;}
    var imgdata = fulldata.filter(filterByX);
    console.log('imgdata=',imgdata);
    console.log('fulldata=',fulldata);

    // --- Calculate begin and end IDs of image time series 
    imgIDarray = imgdata.map(function(d) { return +d.id; });
    min_imgID = Math.min.apply(null,imgIDarray);
    max_imgID = Math.max.apply(null,imgIDarray);
    console.log('imgIDarray=',imgIDarray);
    console.log('min_imgID=',min_imgID);
    console.log('max_imgID=',max_imgID);

    // --- Calculate image size attributes
    imgxpos = imgdata.map(function(d) { return Math.abs(d.x); });
    imgypos = imgdata.map(function(d) { return Math.abs(d.y); });
    single_img_width = Math.min.apply(0, imgxpos.filter(Number));
    single_img_height = Math.min.apply(0, imgypos.filter(Number));
    total_img_width = Math.max.apply(0, imgxpos.filter(Number)) + single_img_width;
    total_img_height = Math.max.apply(0, imgypos.filter(Number)) + single_img_height;
    console.log('single_img_width=',single_img_width);
    console.log('total_img_height=',total_img_height);

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
    	.text(fulldata[0].localylabel)
    	.style("font-weight", "bold");

    // --- Plot line plot
    x.domain(d3.extent(fulldata, function(d) { return d.date; }));
    yl.domain(d3.extent(fulldata, function(d) { return d.localdata; }));
    yg.domain(d3.extent(fulldata, function(d) { return d.globaldata; }));
    
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
    	.datum(fulldata)
            .attr("class", "line")
            .attr("stroke", "steelblue")
            .attr("id","localLine")
    	.attr("transform", "translate(" + margin.left + ",0)")
    	.attr("d",linel);
    
    svg.append("path")
    	.datum(fulldata)
            .attr("class", "line")
            .style("stroke", "OrangeRed")
            .style("opacity", 0) // don't show global data initially by default
            .attr("id", "globalLine")
            .attr("transform", "translate(" + margin.left + ",0)")
            .attr("d",lineg);
    
    // --- Add local data legend title
    svg.append("text")
            .attr("x", 0)
            .attr("y", height.plot)
            .attr("class", "legend")
            .style("fill", "steelblue")
            // Uncomment the following block to allow clickable title
            // that appears/disappears local data line plot
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

    // --- Append/enter image data
    defs.selectAll("g")
    	.data(imgdata).enter()
    	.append("g")
    		.attr("id", function(d) { return "imgID" + d.id; })
    		.attr("clip-path", "url(#satellite-cp)")
    	.append("use")
    		//id of image
    		.attr("xlink:href", "#satellite")
    		.attr("transform", function(d) { return "translate("+d.x+","+d.y+")"; });

    // --- Plot the line plot dots
    var dots = svg.selectAll("circle")
    		.data(imgdata).enter()
    	        .append("circle")
    		.attr("id", function(d) { return "circID" + d.id; })
    		.attr("cx", function(d) { return x(d.date); })
    		.attr("cy", function(d) { return yl(d.localdata); })
    		.attr("transform", "translate("+margin.left+",0)")
    		.attr("r", "10px")
    		.style("stroke", "steelblue")
    		.style("stroke-width", "3px")
    		.style("fill", "steelblue");

    // --- Add annotations (clickable to appear/disappear)
    var anno = svg.selectAll("text#anno")
                .data(imgdata).enter()
                .append("text") 
    		.attr("id", function(d) { return "annoID" + d.id; })
    		.attr("class", "annoID")
    		.attr("x", function(d) { return x(d.date); })
    		.attr("y", function(d) { return yl(d.localdata); })
    		.attr("transform", "translate("+margin.left+",0)")
                .text(function(d) { return d.annotation; })
    		.style("font-size", "20px")
    		.style("font-family", "sans-serif")
    		.style("fill", "red")
                .style("opacity", 0);

    // --- Add anno data legend title (clickable to appear/disappear)
    svg.append("text")
            .attr("x", 1000)
            .attr("y", height.plot)
            .attr("class", "legend")
            .style("fill", "OrangeRed")
            .style("cursor", "pointer")
            .on("click", function() {
                // Determine if annotations are visible
                var activeanno = anno.active ? false : true,
            	newOpacity = activeanno ? 0 : 1;
                // Hide or show the elements
                d3.selectAll("text.annoID").style("opacity", newOpacity);
                // Update whether or not the elements are active
                anno.active = activeanno;
                console.log(anno.active);
            })
            .text("Annotations");

    // --- Differently color the dots at the very beginning and end of the time series
    d3.select("circle#circID" + min_imgID).style("fill", "white");
    d3.select("circle#circID" + max_imgID).style("fill", "white");

    // --- Initially display the earliest image on the left by default
    var before = d3.select("#before")
    	.append("svg")
    		.attr("viewBox", "0 0 " + width.image + " " + height.image)
    		.style("display", "inline")
    		.style("height", "1em")
    		.style("width", (width.image/height.image) + "em")
    	.append("use")
    		.attr("id", "imagebefore")
    		.attr("xlink:href", "#imgID" + min_imgID);
    
    d3.select("#before")
    	.append("text")
    	.attr("id", "before-text")
    	.text(fulldata[min_imgID].date.getFullYear())
    	.attr("x",10)
    	.attr("y",30)
    	.style("font-size", "24px")
    	.style("fill","white");
    
    // --- Initially display the most recent image on the right by default 
    var after = d3.select("#after")
    	.append("svg")
    		.attr("viewBox", "0 0 " + width.image + " " + height.image)
    		.style("display", "inline")
    		.style("height", "1em")
    		.style("width", (width.image/height.image) + "em")
    	.append("use")
    		.attr("id", "imageafter")
    		.attr("xlink:href", "#imgID" + max_imgID);
    
    d3.select("#after")
    	.append("text")
    	.text(fulldata[max_imgID].date.getFullYear())
    	.attr("x",10)
    	.attr("y",30)
    	.style("font-size", "24px")
    	.style("fill","white");

    // --- Define global variables for keyboard and mouse input
    var activeidx = 0;
    var activemouse = null;
    var alldots = d3.selectAll("circle");

    // --- Mouse-dot interactivity
    dots.on({
            mouseover: function(d) {
                d3.select(this).style("fill", "white");
                this.style.cursor = "pointer";
                d3.select("text#annoID" + this.id.substring(6)).style("opacity",1);
            },
            mouseout: function(d) {
            	if (this != activemouse) {
            	    d3.select(this).style("fill", "steelblue");
                    d3.select("text#annoID" + this.id.substring(6)).style("opacity",0);
            	}
            },
            click: function(d) {
            	d3.selectAll("circle").style("fill", "steelblue");
            	d3.select("circle#circID" + max_imgID).style("fill", "white"); // this is needed to keep last dot white after clicking on it
            	activemouse = this;
                activeidx = findindexbyid(alldots,activemouse.id); 
                d3.select(activemouse).style("fill", "white");
                // activemouse.id.substring(6) is the selected
                // circle's id number following "circID" 
                d3.select("use#imagebefore").attr("xlink:href", "#imgID" + activemouse.id.substring(6));
                d3.select("#before-text").text(fulldata[activemouse.id.substring(6)].date.getFullYear());
                console.log('activemouse.id.substring(6)=',activemouse.id.substring(6));
                console.log('activemouse=',activemouse);
            }
    });
    
    // --- Right-left arrow key stepthrough
    //d3.select("body").on({
    d3.select("#imgdivID").on({
        keydown: function(d,i) {
            if (d3.event.keyCode == 39) { // when you click the right arrow key...
                //console.log('right');
                if (activeidx<alldots.size()-1) {activeidx++;} // don't go further right than there are pts
                d3.selectAll("circle").style("fill", "steelblue");
                d3.select("circle#circID" + max_imgID).style("fill", "white");
                d3.select(alldots[0][activeidx]).style("fill", "white");
        	d3.select("use#imagebefore").attr("xlink:href", "#imgID" + alldots[0][activeidx].id.substring(6));
        	d3.select("#before-text").text(fulldata[alldots[0][activeidx].id.substring(6)].date.getFullYear());
            }
            if (d3.event.keyCode == 37) { // when you click the left arrow key...
                //console.log('left');
                if (activeidx>0) {activeidx--;} // don't go further left than there are pts
                d3.selectAll("circle").style("fill", "steelblue");
                d3.select("circle#circID" + max_imgID).style("fill", "white");
                d3.select(alldots[0][activeidx]).style("fill", "white");
        	d3.select("use#imagebefore").attr("xlink:href", "#imgID" + alldots[0][activeidx].id.substring(6));
        	d3.select("#before-text").text(fulldata[alldots[0][activeidx].id.substring(6)].date.getFullYear());
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

function filterByX(obj,invalidEntries) {
   if ('x' in obj && typeof(obj.x) === 'number' && !isNaN(obj.x)) {
      return true;
   }
   else {
      invalidEntries++;
      return false;
   }
}
