// NOTE: divs are so named in index.html; must change names here if names are changed there 

// --- Define global variables for keyboard and mouse input
var activeidx = 0;
var activemouse = null;
var alldots = null;
var activedotcolor = "yellow";
var inactivedotcolor = "LightGray";
var activedotsize = "15px";
var inactivedotsize = "8px";

function show_info_inside_modal(current_location) {

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
    var margin = {top:100, right:0.2*single_img_width, bottom:10, left:0.2*single_img_width};
    var width = {image: single_img_width, plot: single_img_width*2, image_total: total_img_width};
    var height = {image: single_img_height, plot: 1.8*single_img_height, image_total: total_img_height};

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
        .append("text")
        .text(fulldata[0].imgsrctext);
    $("#imgsrc").on('click', function() {
        window.open(fulldata[0].imgsrcurl);
    });

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
            .attr("viewBox", "0 0 " + width.plot + " " + height.plot)
            .classed("svg-content", true);
    
    // label x-axis
    svg.append("text")
        .attr("class", "xlabel")
        .attr("text-anchor", "middle")
        .attr("x", (width.plot)/2)
        .attr("y", height.plot+margin.bottom*6-margin.top)
        .style("fill", "black")
        .text("Year")

    // label local data left y-axis
    svg.append("text")
        .attr("class", "ylabel")
        .attr("id", "ylabell")
        .attr("text-anchor", "middle")
        .attr("transform", "translate("+(margin.left)/2+","+(height.plot)/2+")rotate(-90)")
        .style("fill", localdatacolor)
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
                d3.select(this).style("font-size", "35px");
            },
            mouseout: function() {
                d3.select(this).style("font-size", "25px");
            }
        })
        .text(fulldata[0].localylabel);

    // label global data right y-axis
    svg.append("text")
        .attr("class", "ylabel")
        .attr("id", "ylabelg")
        .attr("text-anchor", "middle")
        .attr("transform", "translate("+(width.plot-margin.left/2)+","+(height.plot)/2+")rotate(90)")
        .style("fill", globaldatacolor)
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
            },
            mouseover: function() {
                d3.select(this).style("font-size", "35px");
            },
            mouseout: function() {
                d3.select(this).style("font-size", "25px"); // defined in style.css
            }
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

    // plot dots along the x-axis corresponding to images
    /*var dots = svg.selectAll("circle")
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
    */
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

