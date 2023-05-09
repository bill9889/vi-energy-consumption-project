//Data
var data_directory = "maps/latin-america.geojson"
var csv_file = "data-dummy.csv"
var csv_access = "csv_assets/energy_access.csv"
var csv_energy_consumption = "csv_assets/energy_consumption.csv"
var csv_inflation = "csv_assets/inflation.csv"
var csv_enrollment = "csv_assets/school_enrollment.csv"

//global
var current_country = ""
var current_csv = csv_inflation
var consumption_data = ""

//Specification
var w = 900;
var h = 600;
var w2 = 1350;
var h2 = 1200;
var padding = 40;
var spider_ratio = 2.5
var innerRadius = 450
var outerRadius = Math.min(w, h)

//Other data
columns = ["Year", "Data"]
energy_access_description = "This data represents the percentage of the population of a country that has access to electricity"
inflation_description = "This data corresponds to the percentage of inflation, which is measured by the annual growth rate of the implicit GDP deflator"
enrollment_description = "This data corresponds to the net secondary enrollment rate"

document.getElementById("country").innerHTML = "N/A";
document.getElementById("secondary_variable").innerHTML = "Inflation";
document.getElementById("secondary_description").innerHTML = inflation_description;


function findCountryData(country, dataset){
    for (let i=0; i < dataset.length; i++) {
        if (dataset[i].country_name == country) {
            return dataset[i];
        }
    }
}

function checkRange(num, min, max) {
    return num >= min && num <= max;
  }
  


d3.csv(csv_energy_consumption).then( function(data) {
    consumption_data = data;
})

function makeTitle(svg, name, subtitle) {
    svg.append("text")
        .attr("transform", "translate(" + padding + "," + 25 + ")")
        .attr("dy", "0em")
        .attr("font-size", "1.2em")
        .style("text-anchor", "left")
        .style("font-family", "sans-serif")
        .text(name);

    svg.append("text")
        .attr("transform", "translate(" + padding + "," + 25 + ")")
        .attr("dy", "1.4em")
        .attr("font-size", "0.9em")
        .style("text-anchor", "left")
        .style("opacity", 0.7)
        .style("font-family", "sans-serif")
        .text(subtitle);
}

function makeAxisTitles(svg, yaxis, xaxis) {
    svg.append("text")
        .attr("transform", "translate(" + (padding / 5) + ", " + (h / 2) + ") rotate(-90)")
        .attr("dy", "1em")
        .style("font-size", "1.2em")
        .style("text-anchor", "middle")
        .style("font-family", "sans-serif")
        .text(yaxis);

    svg.append("text")
        .attr("transform", "translate(" + (w / 2) + "," + (h - padding/2) + ")")
        .attr("dy", "1em")
        .attr("class", "x-axis-title")
        .attr("font-size", "1.2em")
        .style("text-anchor", "middle")
        .style("font-family", "sans-serif")
        .text(xaxis);
}

// Create the color function, and generate data for legends
colorlegend = [20e3, 40e3, 60e3, 80e3, 100e3]
var color = d3.scaleSequential(d3.interpolateViridis)
    .domain([0, 120000]);

function makeXscale(data, name) {
    var min = d3.min(data.features, function(d) { return d.properties[name]; })
    var max = d3.max(data.features, function(d) { return d.properties[name]; })
    var xScale = d3.scaleLinear()
        .domain([min, max])
        .range([0 + padding + 40, w - padding])

    return xScale
}

// Function to make legend for chloropleth
function makeLegend(svg, data, colorfunc, yoffset = (h / 2) - 100) {
    // Create legend
    var legend = svg.selectAll("g")
        .data(data)
        .enter()
        .append("g")
        .attr("transform", function(d, i) { return "translate(" + -100 + "," + (yoffset + padding + (i * 20)) + ")" })

    legend.append("rect")
        .attr("class", "legend-rect")
        .attr("x", w - 150)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", function(d) { return color(d) })

    legend.append("text")
        .attr("class", "legend-text")
        .attr("x", w - 100)
        .attr("font-family", "sans-serif")
        .attr("y", 9.5)
        .attr("dy", "0.4em")
        .attr("font-size", "0.8em")
        .text(function(d) { return formatAsThousands(d); })

    return legend
}

var formatAsThousands = d3.format(","); //e.g. converts 123456 to "123,456"

//Create SVG element
var svg = d3.select("body").select("#Plot1")
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .attr("transform", "translate(300,150)");

    svg2 = d3.select("body").select("#Plot2")
    .append("svg")
    .attr("width", w2)
    .attr("height", h2)
    .style("font-family", "sans-serif");
    
d3.json(data_directory).then( function(json) {

    var projection = d3.geoNaturalEarth1()
        .fitSize([w - 50, h - 50], json)

    var path = d3.geoPath(projection);

    //Bind data and create one path per GeoJSON feature
    var geos = svg.selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("transform", "translate(-50,50)")
        .style("fill", function(d) {
            //Get data value
            var value = 60000;//d.properties.income;
            if (value) {
                return color(value);
            } else {
                return "#ccc";
            }
        })

        geos.on("click", function(d) {
            svg.selectAll("path")
                .transition()
                .duration(150)
                .style("fill", "#21918c")

            d3.select(this)
                .transition()
                .duration(150)
                .style("fill", "orange")

            var xPosition = 250;
            var yPosition = 250;
    
            d3.select("#tooltip")
                    .style("left", (d.pageX) + "px")   
                    .style("top", (d.pageY - 30) + "px")
                    .select("#value")
                    .text(d.currentTarget.__data__.properties.name);
    
            d3.select("#tooltip").classed("hidden", false)

            current_country =  d.currentTarget.__data__.properties.name
            var country_data_parsed = []

            d3.csv(current_csv).then( function(data){
                var country_data_raw = findCountryData(current_country, data)
                Object.keys(country_data_raw).map((key) => country_data_parsed.push({"Year": key, "Data": parseFloat(country_data_raw[key])}));

                changeCountry(country_data_parsed)
                document.getElementById("country").innerHTML = current_country;
                
            })

          
        })

    geos.on("mouseover", function(d) {
        d3.select(this)
            .transition()
            .duration(150)

        var xPosition = 250;
        var yPosition = 250;

        d3.select("#tooltip")
                .style("left", (d.pageX) + "px")   
                .style("top", (d.pageY - 30) + "px")
                .select("#value")
                .text(d.currentTarget.__data__.properties.name);

        d3.select("#tooltip").classed("hidden", false)

        // var update_data = calc_data(d.properties)
        // update_poly = []
        // update_data.forEach(function(d, i) { 
        //     x = (radius * d) * (1 - Math.sin(i * (2*Math.PI) / total))
        //     x += (h/2 + padding*spider_ratio - (radius *d))
        //     y = (radius * d) * (1 - Math.cos(i * (2*Math.PI) / total))
        //     y += (h/2 + padding - (radius * d))
        //     update_poly.push({ 'x' : x, 'y': y})
        // })
        // svg2.selectAll("circle")
        //     .data(update_data)
        //     .transition()
        //     .duration(200)
        //     .attr("cx", function(l, i) { return ( (radius * l) * (1 - Math.sin(i * radians / total)) )})
        //     .attr("cy", function(l, i) { return ( (radius * l) * (1 - Math.cos(i * radians / total)) )})
        //     .attr("r", 5)
        //     .attr("transform", function(l) { return ("translate(" + (h/2 + padding*spider_ratio - (radius * l)) + "," + (h/2 + padding - (radius * l)) + ")") })
        //     .attr("fill", "black")
        //     .attr("opacity", "0.8")

        // svg2.selectAll("polygon")
        //     .data([update_poly])
        //     .transition()
        //     .duration(200)
        //     .style("stroke", "black")
        //     .style('fill', "gray")
        //     .attr("points",function(l) { 
        //         return l.map(function(l) {
        //             return [l.x, l.y].join(",");
        //         }).join(" ")
        //     })
        //     .attr("opacity", 0.5)
    })

    geos.on("mouseout", function(d) {
        d3.select(this)
            .transition()
            .duration(300)


        d3.select("#tooltip").classed("hidden", true)
    })

});

d3.csv(csv_inflation).then( function(xdata) {

    var country_data_parsed = []
    var country_data_raw = findCountryData("Default", xdata)
    delete country_data_raw["country_name"]

    Object.keys(country_data_raw).map((key) => country_data_parsed.push({"Year": key, "Data": parseFloat(country_data_raw[key])}));

    var data = country_data_parsed

    var band = d3.scaleBand()
        .domain(data.map(d => d.Year))
        .range([0, 2 * Math.PI])
        .align(0)


    var radial = d3.scaleRadial()
        .domain([0, d3.max(data,(d, _, data) => {
            let total = 0;
            for (let i = 1; i < columns.length; ++i) total += d[columns[i]] = +d[columns[i]];
            return total;  
            })])
        .range([innerRadius, outerRadius])

    var ordinal =d3.scaleSequential(d3.interpolateBlues)
        .domain([0, d3.max(data,(d, _, data) => {
            let total = 0;
            for (let i = 1; i < columns.length; ++i) total += d[columns[i]] = +d[columns[i]];
            return total;  
            })])

    var arc = d3.arc()
        .innerRadius(d => radial(d[0]))
        .outerRadius(d => radial(d[1]))
        .startAngle(d => band(d.data.Year))
        .endAngle(d => band(d.data.Year) + band.bandwidth())
        .padAngle(0.01)
        .padRadius(innerRadius)


    svg2.append("g")
        .selectAll("g")
        .data(d3.stack().keys(columns.slice(1))(data))
        .join("g")
        .selectAll("path")
        .data(d => d)
        .join("path")
        .attr("fill", d => ordinal(d.key))
        .attr("d", arc)
        .attr("transform", "translate(" + ((w2) / 2) + "," + ((h2) / 2) + ")")
        .style("fill", function(d) {
            //Get data value
            var value = 60000;//d.properties.income;
            var country_consumption_data = findCountryData(current_country,consumption_data)
            delete country_data_raw["country_name"]
            if (value) {
                return color(value);
            } else {
                return "#ccc";
            }});

    var g = svg2.append("g")
                .attr("text-anchor", "middle")
                .attr("transform", "translate(" + ((w2) / 2) + "," + ((h2) / 2) + ")")
                .selectAll("g")
                .data(data)
                .join("g")
                .attr("transform", d => `                                                                                                                                                                           
                    rotate(${((band(d.Year) + band.bandwidth() / 2) * 180 / Math.PI - 90)})
                    translate(${innerRadius},0)
                `)
    
    g.append("line")
        .attr("x2", -5)
        .attr("stroke", "#000")

    g.append("text")
        .attr("transform", d => (band(d.Year) + band.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI
            ? "rotate(90)translate(0,16)"
            : "rotate(-90)translate(0,-9)")
        .text(d => d.Year)
    

    var g = svg2.append("g")
                .attr("text-anchor", "middle")
    
    g.append("text")
                .attr("y", d => -radial(radial.ticks(5).pop()))
                .attr("dy", "-1em")
                .text("Population")
                .selectAll("g")
                .data(radial.ticks(5).slice(1))
                .join("g")
                .attr("fill", "none")
                .attr("transform", "translate(" + ((w2) / 2) + "," + ((h2) / 2) + ")");

    g.append("circle")
                .attr("stroke", "#000")
                .attr("stroke-opacity", 0.5)
                .attr("r", radial)
                .attr("transform", "translate(" + ((w2) / 2) + "," + ((h2) / 2) + ")");
});

function changeCountry(data) {
    data.pop()
    updateSVG (data)
}



function changeTheme() {
    var country_data_parsed = []
    select_value = document.getElementById('format').value
    document.getElementById("secondary_variable").innerHTML = select_value;

    if (select_value === "Energy Access"){
        current_csv = csv_access;
        document.getElementById("secondary_description").innerHTML = energy_access_description;
    } else if (select_value === "Inflation"){
        current_csv = csv_inflation;
        document.getElementById("secondary_description").innerHTML = inflation_description;
    } else if (select_value === "Secondary Enrollment"){
        current_csv = csv_enrollment;
        document.getElementById("secondary_description").innerHTML = enrollment_description;
    } else {
        document.getElementById("secondary_description").innerHTML = "";
    }

    var country_data_parsed = []
    d3.csv(current_csv).then( function(data){
        if (current_country === ""){
            current_country = "Default"
        }

        var country_data_raw = findCountryData(current_country, data)
        delete country_data_raw["country_name"]
        Object.keys(country_data_raw).map((key) => country_data_parsed.push({"Year": key, "Data": parseFloat(country_data_raw[key])}));
        updateSVG(country_data_parsed)
        })
}

function updateSVG (data){
    d3.selectAll("g").remove()

    var band = d3.scaleBand()
        .domain(data.map(d => d.Year))
        .range([0, 2 * Math.PI])
        .align(0)


    var radial = d3.scaleRadial()
        .domain([0, d3.max(data,(d, _, data) => {
            let total = 0;
            for (let i = 1; i < columns.length; ++i) total += d[columns[i]] = +d[columns[i]];
            return total;  
            })])
        .range([innerRadius, outerRadius])

    var ordinal =d3.scaleSequential(d3.interpolateBlues)
        .domain([0, d3.max(data,(d, _, data) => {
            let total = 0;
            for (let i = 1; i < columns.length; ++i) total += d[columns[i]] = +d[columns[i]];
            return total;  
            })])

    var arc = d3.arc()
        .innerRadius(d => radial(d[0]))
        .outerRadius(d => radial(d[1]))
        .startAngle(d => band(d.data.Year))
        .endAngle(d => band(d.data.Year) + band.bandwidth())
        .padAngle(0.01)
        .padRadius(innerRadius)


    svg2.append("g")
        .selectAll("g")
        .data(d3.stack().keys(columns.slice(1))(data))
        .join("g")
        .selectAll("path")
        .data(d => d)
        .join("path")
        .attr("fill", d => ordinal(d.key))
        .attr("d", arc)
        .attr("transform", "translate(" + ((w2) / 2) + "," + ((h2) / 2) + ")")
        .style("fill", function(d) {
            //MAX 3895,436156
            //MIN 18,96851107
            var value = 60000;//d.properties.income;
            if (current_country === ""){
                current_country ="Default"
            }
            var country_consumption_data = findCountryData(current_country,consumption_data)

            // console.log(country_consumption_data[d.data["Year"]])
            // console.log(d.data["Year"])
            // console.log(d.data["Data"])
            if (checkRange(country_consumption_data[d.data["Year"]], 0, 999)) {
                return "#FFB888";
            } else if (checkRange(country_consumption_data[d.data["Year"]], 1000, 1999)) {
                return "#FF8C3F";
            } else if (checkRange(country_consumption_data[d.data["Year"]], 2000, 2999)) {
                return "#E45C00";
            } else if (checkRange(country_consumption_data[d.data["Year"]], 3000, 3999)) {
                return "#C0362C";
            }
        });

    var g = svg2.append("g")
                .attr("text-anchor", "middle")
                .attr("transform", "translate(" + ((w2) / 2) + "," + ((h2) / 2) + ")")
                .selectAll("g")
                .data(data)
                .join("g")
                .attr("transform", d => `                                                                                                                                                                           
                    rotate(${((band(d.Year) + band.bandwidth() / 2) * 180 / Math.PI - 90)})
                    translate(${innerRadius},0)
                `)
    
    g.append("line")
        .attr("x2", -5)
        .attr("stroke", "#000")

    g.append("text")
        .attr("transform", d => (band(d.Year) + band.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI
            ? "rotate(90)translate(0,16)"
            : "rotate(-90)translate(0,-9)")
        .text(d => d.Year)
    

    var g = svg2.append("g")
                .attr("text-anchor", "middle")
    
    g.append("text")
                .attr("y", d => -radial(radial.ticks(5).pop()))
                .attr("dy", "-1em")
                .text("Population")
                .selectAll("g")
                .data(radial.ticks(5).slice(1))
                .join("g")
                .attr("fill", "none")
                .attr("transform", "translate(" + ((w2) / 2) + "," + ((h2) / 2) + ")");

    g.append("circle")
                .attr("stroke", "#000")
                .attr("stroke-opacity", 0.5)
                .attr("r", radial)
                .attr("transform", "translate(" + ((w2) / 2) + "," + ((h2) / 2) + ")");
}


