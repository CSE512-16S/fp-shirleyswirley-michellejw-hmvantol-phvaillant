//var w = 720*2,
//	h = 480;

//var width = .7*w,
//	height = .7*h;

var modalsvg = d3.select("#imgdivID")
		.append("svg")
		.attr("id", "satellite")
		//.attr("width", width)
		//.attr("height", height)
		//.classed("svg-container",true)
		//.classed("svg-content-responsive", true);
		//.attr("viewBox", "0 0 " + width + " " + height);

var image = modalsvg.append("image")
	.attr("xlink:href","flooding.png")
	//.attr("width", width)
	//.attr("height", height)
	.attr("id","flooding")
	.style("opacity",1);

console.log("hello from inside imageblock.js")