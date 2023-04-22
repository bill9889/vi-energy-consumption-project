const width = 1200;
const height = 900;

d3.json("./maps/latin-america.json").then(function (data) {

    const zoom = d3.zoom()
	  .scaleExtent([1, 8])
	  .on("zoom", zoomed);

    const svg = d3.select('body')
	  .append('svg')
	  .attr('width', width)
	  .attr('height', height)
	  .on("click", reset);

    const projection = d3.geoNaturalEarth1()
	  .scale(540)
	  .translate([width / 2, height / 1.4]);

    const path = d3.geoPath(projection);

    const g = svg.append("g");

    const countries = g.append('g')
	  .attr("fill", "#444")
	  .attr("cursor", "pointer")
          .selectAll("path")
	  .data(topojson.feature(data, data.objects.countries).features)
	  .enter()
	  .append("path")
	  .on("click", clicked)
	  .attr("d", path);

    countries.append("title")
	.text(d => d.properties.name);

    g.append("path")
	.attr("fill", "none")
	.attr("stroke", "white")
	.attr("stroke-linejoin", "round")
	.attr("d", path(topojson.mesh(data, data.objects.countries, (a, b) => a !== b)));

    svg.call(zoom)
    
    function reset() {
	countries.transition().style("fill", null);
	svg.transition().duration(750).call(
	    zoom.transform,
	    d3.zoomIdentity,
	    d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
	);
    }

    function clicked(event, d) {
	const [[x0, y0], [x1, y1]] = path.bounds(d);
	event.stopPropagation();
	countries.transition().style("fill", null);
	d3.select(this).transition().style("fill", "red");
	svg.transition().duration(750).call(
	    zoom.transform,
	    d3.zoomIdentity
		.translate(width / 2, height / 2)
		.scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
		.translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
	    d3.pointer(event, svg.node())
	);
    }

    function zoomed(event, d) {
	g.attr("transform", event.transform);
	g.attr("stroke-width", 1 / event.transform.k);
    }               
    
});

