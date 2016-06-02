// NOTE: divs are so named in index.html and viz.js; must change names here if names are changed there 

var show_info_inside_modal = function(current_location) {

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
    console.log('imgdata=',imgdata);
    console.log('fulldata=',fulldata);
    console.log('localdata=',localdata);
    console.log('globaldata=',globaldata);

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
    var margin = {top:100, right:20, bottom:10, left:50};
    var width = {image: single_img_width, plot: single_img_width*2, total: single_img_width*2+30, image_total: total_img_width};
    var height = {image: single_img_height, plot: single_img_height+margin.top, image_total: total_img_height};

    //----------------------------------
    // Display location title within div=titlediv
    //----------------------------------
    var title = d3.select("#titlediv")
        .append("text")
        .attr("class","title")
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
        .attr("class", "sidebysideimages")
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

    // initially display the earliest image on the left by default
    var before = d3.select("#imgdiv")
    	.append("svg")
            .attr("viewBox", "0 0 " + width.image + " " + height.image)
            .style("display", "inline")
            .classed("sidebysideimages", true)
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

    // initially display the most recent image on the right by default 
    var after = d3.select("#imgdiv")
        .append("svg")
            .attr("viewBox", "0 0 " + width.image + " " + height.image)
            .style("display", "inline")
            .classed("sidebysideimages", true)
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

    // add image src info on top of after image
    d3.select("#after")
        .append("a")
            .attr("xlink:href", fulldata[0].imgsrcurl)
        .append("text")
            .text("img src: " + fulldata[0].imgsrctext)
            //.text("click here")
            .attr("id", "imgsrc")
            .attr("x", width.image/2)
            //.attr("x", width.image)
            //.attr("y", height.image)
            .attr("y", 30)
            .style("font-size", "24px")
            .style("fill","lightblue")
            .style("cursor", "pointer")
            .style("text-anchor", "right");

    //---------------------------------
    // Set up all line plot features and
    // then plot lines within div=plotdiv
    //----------------------------------
    var localdatacolor = "steelblue";
    var globaldatacolor = "orangered";

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
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 " + width.total + " " + height.plot)
            .classed("svg-content", true);
            //.attr("width", width.total)
            //.attr("height", height.plot)
            //.attr("x",0)
            //.attr("y",height.image);
    
    // label x-axis
    svg.append("text")
    	.attr("class", "xlabel")
    	//.attr("id", "xlabel")
    	.attr("text-anchor", "middle")
    	.attr("x", (width.plot)/2)
        .attr("y", height.plot+margin.bottom*3-margin.top)
    	.text("Year")
    	.style("font-size", "20px")
    	.style("fill", "black")
    	.style("font-weight", "bold");

    // label local data left y-axis
    svg.append("text")
    	.attr("class", "ylabel")
    	.attr("id", "ylabell")
    	.attr("text-anchor", "middle")
    	.attr("transform", "translate("+margin.left/3+","+(height.plot-margin.top-margin.bottom)/2+")rotate(-90)")
        .style("fill", localdatacolor)
    	.style("font-size", "20px")
    	.style("font-weight", "bold")
        .style("cursor", "pointer")
        .on({
            click: function() {
                // Determine if current line is visible
                var activeline = ylabell.active ? false : true,
                    newOpacity = activeline ? 0 : 1;
                // Hide or show the elements
                d3.select("#localLine").style("opacity", newOpacity);
                // Update whether or not the elements are active
                ylabell.active = activeline;
            },
            mouseover: function() {
                d3.select(this).style("font-size", "40px");
            },
            mouseout: function() {
                d3.select(this).style("font-size", "20px");
            }
        })
    	.text(fulldata[0].localylabel);

    // label global data right y-axis
    svg.append("text")
    	.attr("class", "ylabel")
    	.attr("id", "ylabelg")
    	.attr("text-anchor", "middle")
    	.attr("transform", "translate("+(width.plot-margin.left)+","+(height.plot-margin.top-margin.bottom)/2+")rotate(90)")
        .style("fill", globaldatacolor)
    	.style("font-size", "20px")
    	.style("font-weight", "bold")
        //.style("opacity", 1)
        .style("cursor", "pointer")
        .on({
            click: function() {
                // Determine if current line is visible
                var activeline = ylabelg.active ? false : true,
                    newOpacity = activeline ? 0 : 1;
                // Hide or show the elements
                d3.select("#globalLine").style("opacity", newOpacity);
                // Update whether or not the elements are active
                ylabelg.active = activeline;
            },
            mouseover: function() {
                d3.select(this).style("font-size", "40px");
            },
            mouseout: function() {
                d3.select(this).style("font-size", "20px");
            }
        })
    	.text(fulldata[0].globalylabel);

    // define data domains
    x.domain(d3.extent(fulldata, function(d) { return d.date; }));
    yl.domain(d3.extent(fulldata, function(d) { return d.localdata; }));
    yg.domain(d3.extent(fulldata, function(d) { return d.globaldata; }));
    
    // draw x-axis
    svg.append("g")
    	.attr("class", "xaxis")
    	.attr("transform", "translate(" + margin.left + "," + [height.plot - margin.top - margin.bottom] + ")")
    	.call(x_axis);
    
    // draw local data left y-axis
    svg.append("g")
            .attr("class", "yaxis")
            .style("fill", localdatacolor)
            .attr("id", "localAxis")
            .attr("transform", "translate(" + margin.left + ",0)")
            .call(y_axisl);
    
    // draw global data right y-axis
    svg.append("g")
            .attr("class", "yaxis")
            .style("fill", globaldatacolor)
            .style("opacity", 1)
            .attr("id", "globalAxis")
            .attr("transform", "translate(" + width.plot + ",0)")
            .call(y_axisg);
    
    // draw local data line
    svg.append("path")
    	.datum(localdata)
            .attr("class", "line")
            .attr("stroke", localdatacolor)
            .attr("id","localLine")
    	    .attr("transform", "translate(" + margin.left + ",0)")
    	    .attr("d",linel);
    
    // draw global data line
    svg.append("path")
    	.datum(globaldata)
            .attr("class", "line")
            .style("stroke", globaldatacolor)
            .style("opacity", 1) // show global data initially by default
            .attr("id", "globalLine")
            .attr("transform", "translate(" + margin.left + ",0)")
            .attr("d",lineg);

    // FOR HELENA TO MAKE PRETTY
    // BETTER PRACTICE FOR MAKING SOMETHING CLICKABLE IS AS FOLLOWS:
    // http://bl.ocks.org/curran/88d03aa54097367eaae1
    // ALSO SEE ADD IMG SRC INFO SECTION ABOVE
    // add local data source clickable button
    svg.append("text")
            .attr("x", 0)
            .attr("y", height.plot+margin.bottom*3-margin.top)
            .style("fill", localdatacolor)
            .style("cursor", "pointer")
            .on("click", function() {
                // GOES TO fulldata[0].localdatasrcurl 
            })
            .text(fulldata[0].localdatasrctext);

    // FOR HELENA TO MAKE PRETTY
    // BETTER PRACTICE FOR MAKING SOMETHING CLICKABLE IS AS FOLLOWS:
    // http://bl.ocks.org/curran/88d03aa54097367eaae1
    // ALSO SEE ADD IMG SRC INFO SECTION ABOVE
    // add global data source clickable button
    svg.append("text")
            .attr("x", width.plot*3/4)
    	    //.attr("transform", "translate("+(width.plot-margin.left)+","+(height.plot-margin.top-margin.bottom)/2+")")
            .attr("y", height.plot+margin.bottom*3-margin.top)
            .style("fill", globaldatacolor)
            .style("cursor", "pointer")
            .on("click", function() {
                // GO TO fulldata[0].globaldatasrcurl
            })
            .text(fulldata[0].globaldatasrctext);

    //---------------------------------
    // Set up and plot dots along the x-axis corresponding
    // to images, all still within div=plotdiv
    //----------------------------------
    var activedotcolor = "white";
    var inactivedotcolor = "steelblue";
    var activedotsize = "15px";
    var inactivedotsize = "5px";

    // FOR HELENA TO MAKE INTO SQUARES 
    // plot dots along the x-axis corresponding to images
    var dots = svg.selectAll("circle")
    		.data(imgdata).enter()
    	        .append("circle")
    		.attr("id", function(d) { return "circID" + d.id; })
    		.attr("cx", function(d) { return x(d.date); })
    		.attr("cy", height.plot-margin.bottom-margin.top) // along x-axis
    		.attr("transform", "translate("+margin.left+",0)")
    		.attr("r", inactivedotsize)
    		.style("stroke", inactivedotcolor)
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
    		.attr("transform", "translate("+margin.left+",0)")
                .text(function(d) { return d.date.getFullYear() + ": " + d.annotation; })
                .style("opacity", 0)
                .style("text-anchor","middle");

    // FOR HELENA:
    // AFTER YOU ADD ARROWS TO INDICATE MOVING LEFT/RIGHT, YOU CAN REMOVE THIS
    // add prelim instructions where annotated text will be after hovering/clicking dots
    svg.append("text")
            .attr("id", "instructions")
            .attr("x", (width.plot)/2)
            .attr("y", 60)
    	    .attr("transform", "translate("+margin.left+",0)")
            .text("Hover over and click on plot elements below; use left/right arrow keys to step through time")
            .style("font-size", "30px")
            .style("font-family", "sans-serif")
            .style("fill", "black")
            .style("text-anchor","middle");

    // differently color/size the dots at the very beginning and end of the time series
    d3.select("circle#circID" + min_imgID).style("fill", activedotcolor).attr("r",activedotsize);
    d3.select("circle#circID" + max_imgID).style("fill", activedotcolor).attr("r",activedotsize);

    //---------------------------------
    // Add interactivity to dots along the x-axis corresponding
    // to images, all still within div=plotdiv
    //---------------------------------
    // define global variables for keyboard and mouse input
    var activeidx = 0;
    var activemouse = null;
    var alldots = d3.selectAll("circle");

    // --- mouse-dot interactivity
    dots.on({
            mouseover: function(d) {
                d3.select("text#instructions").style("opacity",0);
                d3.select(this).style("fill", activedotcolor).attr("r",activedotsize);
                this.style.cursor = "pointer";
                d3.select("text#annoID" + alldots[0][activeidx].id.substring(6)).style("opacity",0);
                d3.select("text#annoID" + this.id.substring(6)).style("opacity",1);
            },
            mouseout: function(d) {
            	if (findindexbyid(alldots,this.id) != activeidx) {
            	    d3.select(this).style("fill", inactivedotcolor).attr("r",inactivedotsize);
                    d3.select("text#annoID" + this.id.substring(6)).style("opacity",0);
                    d3.select("text#annoID" + alldots[0][activeidx].id.substring(6)).style("opacity",1);
            	}
            	d3.select("circle#circID" + max_imgID).style("fill", activedotcolor); // this is needed to keep last dot white after hovering over it
            },
            click: function(d) {
                d3.select("text#instructions").style("opacity",0);
                // activemouse.id.substring(6) is the selected
                // circle's id number following "circID" 
                d3.select("text#annoID" + alldots[0][activeidx].id.substring(6)).style("opacity",0);
            	d3.selectAll("circle").style("fill", inactivedotcolor).attr("r",inactivedotsize);
            	d3.select("circle#circID" + max_imgID).style("fill", activedotcolor).attr("r",activedotsize); // this is needed to keep last dot white after clicking on it
            	activemouse = this;
                activeidx = findindexbyid(alldots,activemouse.id); 
                d3.select(alldots[0][activeidx]).style("fill", activedotcolor).attr("r",activedotsize);
                d3.select("text#annoID" + alldots[0][activeidx].id.substring(6)).style("opacity",1);
                d3.select("use#imagebefore").attr("xlink:href", "#imgID" + alldots[0][activeidx].id.substring(6));
                d3.select("#before-text").text(fulldata[alldots[0][activeidx].id.substring(6)].date.getFullYear());
                //console.log('activemouse.id.substring(6)=',activemouse.id.substring(6));
                //console.log('activemouse=',activemouse);
            }
    });
    
    // --- right-left arrow key stepthrough
    // FIGURE OUT BODY SELECTING FOR ARROW KEY FUNCTIONALITY
    d3.select("body").on({
    //d3.select("#plotdiv").on({
        keydown: function(d,i) {
            if (d3.event.keyCode == 39) { // when you click the right arrow key...
                //console.log('right');
                d3.select("text#instructions").style("opacity",0);
                d3.select("text#annoID" + alldots[0][activeidx].id.substring(6)).style("opacity",0);
                if (activeidx<alldots.size()-1) {activeidx++;} // don't go further right than there are pts
                d3.selectAll("circle").style("fill", inactivedotcolor).attr("r",inactivedotsize);
                d3.select("circle#circID" + max_imgID).style("fill", activedotcolor).attr("r", activedotsize);
                d3.select(alldots[0][activeidx]).style("fill", activedotcolor).attr("r", activedotsize);
                d3.select("text#annoID" + alldots[0][activeidx].id.substring(6)).style("opacity",1);
        	d3.select("use#imagebefore").attr("xlink:href", "#imgID" + alldots[0][activeidx].id.substring(6));
        	d3.select("#before-text").text(fulldata[alldots[0][activeidx].id.substring(6)].date.getFullYear());
            }
            if (d3.event.keyCode == 37) { // when you click the left arrow key...
                //console.log('left');
                d3.select("text#instructions").style("opacity",0);
                d3.select("text#annoID" + alldots[0][activeidx].id.substring(6)).style("opacity",0);
                if (activeidx>0) {activeidx--;} // don't go further left than there are pts
                d3.selectAll("circle").style("fill", inactivedotcolor).attr("r",inactivedotsize);
                d3.select("circle#circID" + max_imgID).style("fill", activedotcolor).attr("r",activedotsize);
                d3.select(alldots[0][activeidx]).style("fill", activedotcolor).attr("r",activedotsize);
                d3.select("text#annoID" + alldots[0][activeidx].id.substring(6)).style("opacity",1);
        	d3.select("use#imagebefore").attr("xlink:href", "#imgID" + alldots[0][activeidx].id.substring(6));
        	d3.select("#before-text").text(fulldata[alldots[0][activeidx].id.substring(6)].date.getFullYear());
            }
          }
    });

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
