//Data
var data_directory = "maps/latin-america.geojson";
var csv_file = "data-dummy.csv";
var csv_access = "csv_assets/energy_access.csv";
var csv_energy_consumption = "csv_assets/energy_consumption.csv";
var csv_inflation = "csv_assets/inflation.csv";
var csv_enrollment = "csv_assets/school_enrollment.csv";

//global
var current_country = "";
var current_csv = csv_inflation;
var consumption_data = "";
var select_value = document.getElementById("format").value;

//Specification
var w = 900;
var h = 600;
var w2 = 1350;
var h2 = 1300;
var padding = 40;
var spider_ratio = 2.5;
var innerRadius = 450;
var outerRadius = Math.min(w, h);

//Other data
columns = ["Year", "Data"];
energy_access_description =
    "This data represents the percentage of the population of a country that has access to electricity";
inflation_description =
    "This data corresponds to the percentage of inflation, which is measured by the annual growth rate of the implicit GDP deflator";
enrollment_description =
    "This data corresponds to the net secondary enrollment rate";

document.getElementById("country").innerHTML = "N/A";
document.getElementById("secondary_variable").innerHTML = "Inflation";
document.getElementById("secondary_description").innerHTML =
    inflation_description;

function findCountryData(country, dataset) {
    for (let i = 0; i < dataset.length; i++) {
        if (dataset[i].country_name == country) {
            return dataset[i];
        }
    }
}

function checkRange(num, min, max) {
    return num >= min && num <= max;
}

d3.csv(csv_energy_consumption).then(function (data) {
    consumption_data = data;
});

var color = d3.scaleSequential(d3.interpolateViridis).domain([0, 120000]);

var formatAsThousands = d3.format(",")

//Create SVG element
var svg = d3
    .select("body")
    .select("#Plot1")
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .attr("transform", "translate(300,150)");

svg2 = d3
    .select("body")
    .select("#Plot2")
    .append("svg")
    .attr("width", w2)
    .attr("height", h2)
    .style("font-family", "sans-serif");

d3.json(data_directory).then(function (json) {
    var projection = d3.geoNaturalEarth1().fitSize([w - 50, h - 50], json);

    var path = d3.geoPath(projection);


    var geos = svg
        .selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("transform", "translate(-50,50)")
        .style("fill", function (d) {
            var value = 60000; 
            if (value) {
                return color(value);
            } else {
                return "#ccc";
            }
        });

    geos.on("click", function (d) {
        svg.selectAll("path")
            .transition()
            .duration(150)
            .style("fill", "#21918c");

        d3.select(this).transition().duration(150).style("fill", "orange");

        var xPosition = 250;
        var yPosition = 250;

        d3.select("#tooltip")
            .style("left", d.pageX + "px")
            .style("top", d.pageY - 30 + "px")
            .select("#value")
            .text(d.currentTarget.__data__.properties.name);

        d3.select("#tooltip").classed("hidden", false);

        current_country = d.currentTarget.__data__.properties.name;
        var country_data_parsed = [];

        d3.csv(current_csv).then(function (data) {
            var country_data_raw = findCountryData(current_country, data);
            Object.keys(country_data_raw).map((key) =>
                country_data_parsed.push({
                    Year: key,
                    Data: parseFloat(country_data_raw[key]),
                })
            );

            changeCountry(country_data_parsed);
            document.getElementById("country").innerHTML = current_country;
        });
    });

    geos.on("mouseover", function (d) {
        d3.select(this).transition().duration(150);

        var xPosition = 250;
        var yPosition = 250;

        d3.select("#tooltip")
            .style("left", d.pageX + "px")
            .style("top", d.pageY - 30 + "px")
            .select("#value")
            .text(d.currentTarget.__data__.properties.name);

        d3.select("#tooltip").classed("hidden", false);
    });

    geos.on("mouseout", function (d) {
        d3.select(this).transition().duration(300);

        d3.select("#tooltip").classed("hidden", true);
    });
});

d3.csv(csv_inflation).then(function (xdata) {
    var country_data_parsed = [];
    var country_data_raw = findCountryData("Default", xdata);
    delete country_data_raw["country_name"];

    Object.keys(country_data_raw).map((key) =>
        country_data_parsed.push({
            Year: key,
            Data: parseFloat(country_data_raw[key]),
        })
    );

    var data = country_data_parsed;

    var band = d3
        .scaleBand()
        .domain(data.map((d) => d.Year))
        .range([0, 2 * Math.PI])
        .align(0);

    var radial = d3
        .scaleRadial()
        .domain([
            0,
            d3.max(data, (d, _, data) => {
                let total = 0;
                for (let i = 1; i < columns.length; ++i)
                    total += d[columns[i]] = +d[columns[i]];
                return total;
            }),
        ])
        .range([innerRadius, outerRadius]);

    var ordinal = d3.scaleSequential(d3.interpolateBlues).domain([
        0,
        d3.max(data, (d, _, data) => {
            let total = 0;
            for (let i = 1; i < columns.length; ++i)
                total += d[columns[i]] = +d[columns[i]];
            return total;
        }),
    ]);

    var arc = d3
        .arc()
        .innerRadius((d) => radial(d[0]))
        .outerRadius((d) => radial(d[1]))
        .startAngle((d) => band(d.data.Year))
        .endAngle((d) => band(d.data.Year) + band.bandwidth())
        .padAngle(0.01)
        .padRadius(innerRadius);

    svg2.append("g")
        .selectAll("g")
        .data(d3.stack().keys(columns.slice(1))(data))
        .join("g")
        .selectAll("path")
        .data((d) => d)
        .join("path")
        .attr("fill", (d) => ordinal(d.key))
        .attr("d", arc)
        .attr("transform", "translate(" + w2 / 2 + "," + h2 / 2 + ")")
        .style("fill", function (d) {
            //Get data value
            var value = 60000; //d.properties.income;
            var country_consumption_data = findCountryData(
                current_country,
                consumption_data
            );
            delete country_data_raw["country_name"];
            if (value) {
                return color(value);
            } else {
                return "#ccc";
            }
        });

    var g = svg2
        .append("g")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(" + w2 / 2 + "," + h2 / 2 + ")")
        .selectAll("g")
        .data(data)
        .join("g")
        .attr(
            "transform",
            (
                d
            ) => `                                                                                                                                                                           
                    rotate(${
                        ((band(d.Year) + band.bandwidth() / 2) * 180) /
                            Math.PI -
                        90
                    })
                    translate(${innerRadius},0)
                `
        );
    // This scale maintains area proportionality of radial bars
    g.append("line").attr("x2", -5).attr("stroke", "#000");

    g.append("text")
        .attr("transform", (d) =>
            (band(d.Year) + band.bandwidth() / 2 + Math.PI / 2) %
                (2 * Math.PI) <
            Math.PI
                ? "rotate(90)translate(0,16)"
                : "rotate(-90)translate(0,-9)"
        )
        .text((d) => d.Year);

    var g = svg2.append("g").attr("text-anchor", "middle");

    g.append("text")
        .attr("y", (d) => -radial(radial.ticks(5).pop()))
        .attr("dy", "-1em")
        .text("Population")
        .selectAll("g")
        .data(radial.ticks(5).slice(1))
        .join("g")
        .attr("fill", "none")
        .attr("transform", "translate(" + w2 / 2 + "," + h2 / 2 + ")");

    g.append("circle")
        .attr("stroke", "#000")
        .attr("stroke-opacity", 0.5)
        .attr("r", radial)
        .attr("transform", "translate(" + w2 / 2 + "," + h2 / 2 + ")");

    var y = d3
        .scaleRadial()
        .domain([0, d3.max(data, (d) => 100)])
        .range([innerRadius, outerRadius]);

    var yAxis = (g) =>
        g
            .attr("text-anchor", "middle")
            .call((g) =>
                g
                    .append("text")
                    .attr("x", -6)
                    .attr("y", (d) => -y(y.ticks(4).pop()))
                    .attr("dy", "-1em")
                    .text(select_value)
            )
            .call((g) =>
                g
                    .selectAll("g")
                    .data(y.ticks(4).slice(1))
                    .join("g")
                    .attr("fill", "none")
                    .call((g) =>
                        g
                            .append("circle")
                            .attr("stroke", "#000")
                            .attr("stroke-opacity", 0.5)
                            .attr("r", y)
                    )
                    .call((g) =>
                        g
                            .append("text")
                            .attr("x", -6)
                            .attr("y", (d) => -y(d))
                            .attr("dy", "0.35em")
                            .attr("stroke", "#fff")
                            .attr("stroke-width", 5)
                            .text(y.tickFormat(10, "s"))
                            .clone(true)
                            .attr("fill", "#000")
                            .attr("stroke", "none")
                    )
            );

    svg2.append("g")
        .call(yAxis)
        .attr("transform", "translate(" + w2 / 2 + "," + h2 / 2 + ")");
});

function changeCountry(data) {
    data.pop();
    updateSVG(data);
}

function changeTheme() {
    var country_data_parsed = [];
    select_value = document.getElementById("format").value;
    document.getElementById("secondary_variable").innerHTML = select_value;

    if (select_value === "Energy Access") {
        current_csv = csv_access;
        document.getElementById("secondary_description").innerHTML =
            energy_access_description;
    } else if (select_value === "Inflation") {
        current_csv = csv_inflation;
        document.getElementById("secondary_description").innerHTML =
            inflation_description;
    } else if (select_value === "Secondary Enrollment") {
        current_csv = csv_enrollment;
        document.getElementById("secondary_description").innerHTML =
            enrollment_description;
    } else {
        document.getElementById("secondary_description").innerHTML = "";
    }

    var country_data_parsed = [];
    d3.csv(current_csv).then(function (data) {
        if (current_country === "") {
            current_country = "Default";
        }

        var country_data_raw = findCountryData(current_country, data);
        delete country_data_raw["country_name"];
        Object.keys(country_data_raw).map((key) =>
            country_data_parsed.push({
                Year: key,
                Data: parseFloat(country_data_raw[key]),
            })
        );
        updateSVG(country_data_parsed);
    });
}

function updateSVG(data) {
    d3.selectAll("g").remove();

    var band = d3
        .scaleBand()
        .domain(data.map((d) => d.Year))
        .range([0, 2 * Math.PI])
        .align(0);

    var radial = d3
        .scaleRadial()
        .domain([
            0,
            d3.max(data, (d, _, data) => {
                let total = 0;
                for (let i = 1; i < columns.length; ++i)
                    total += d[columns[i]] = +d[columns[i]];
                return total;
            }),
        ])
        .range([innerRadius, outerRadius]);

    var ordinal = d3.scaleSequential(d3.interpolateBlues).domain([
        0,
        d3.max(data, (d, _, data) => {
            let total = 0;
            for (let i = 1; i < columns.length; ++i)
                total += d[columns[i]] = +d[columns[i]];
            return total;
        }),
    ]);

    var arc = d3
        .arc()
        .innerRadius((d) => radial(d[0]))
        .outerRadius((d) => radial(d[1]))
        .startAngle((d) => band(d.data.Year))
        .endAngle((d) => band(d.data.Year) + band.bandwidth())
        .padAngle(0.01)
        .padRadius(innerRadius);

    svg2.append("g")
        .selectAll("g")
        .data(d3.stack().keys(columns.slice(1))(data))
        .join("g")
        .selectAll("path")
        .data((d) => d)
        .join("path")
        .attr("fill", (d) => ordinal(d.key))
        .attr("d", arc)
        .attr("transform", "translate(" + w2 / 2 + "," + h2 / 2 + ")")
        .style("fill", function (d) {
            var value = 60000;
            if (current_country === "") {
                current_country = "Default";
            }
            var country_consumption_data = findCountryData(
                current_country,
                consumption_data
            );

            if (checkRange(country_consumption_data[d.data["Year"]], 0, 999)) {
                return "#FFB888";
            } else if (
                checkRange(country_consumption_data[d.data["Year"]], 1000, 1999)
            ) {
                return "#FF8C3F";
            } else if (
                checkRange(country_consumption_data[d.data["Year"]], 2000, 2999)
            ) {
                return "#E45C00";
            } else if (
                checkRange(country_consumption_data[d.data["Year"]], 3000, 3999)
            ) {
                return "#C0362C";
            }
        });

    var g = svg2
        .append("g")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(" + w2 / 2 + "," + h2 / 2 + ")")
        .selectAll("g")
        .data(data)
        .join("g")
        .attr(
            "transform",
            (
                d
            ) => `                                                                                                                                                                           
                    rotate(${
                        ((band(d.Year) + band.bandwidth() / 2) * 180) /
                            Math.PI -
                        90
                    })
                    translate(${innerRadius},0)
                `
        );

    g.append("line").attr("x2", -5).attr("stroke", "#000");

    g.append("text")
        .attr("transform", (d) =>
            (band(d.Year) + band.bandwidth() / 2 + Math.PI / 2) %
                (2 * Math.PI) <
            Math.PI
                ? "rotate(90)translate(0,16)"
                : "rotate(-90)translate(0,-9)"
        )
        .text((d) => d.Year);

    var g = svg2.append("g").attr("text-anchor", "middle");

    g.append("text")
        .attr("y", (d) => -radial(radial.ticks(5).pop()))
        .attr("dy", "-1em")
        .text("Population")
        .selectAll("g")
        .data(radial.ticks(5).slice(1))
        .join("g")
        .attr("fill", "none")
        .attr("transform", "translate(" + w2 / 2 + "," + h2 / 2 + ")");

    g.append("circle")
        .attr("stroke", "#000")
        .attr("stroke-opacity", 0.5)
        .attr("r", radial)
        .attr("transform", "translate(" + w2 / 2 + "," + h2 / 2 + ")");

    var y = d3
        .scaleRadial()
        .domain([
            0,
            d3.max(data, (d) =>
                current_country == "Default" ? 100 : d["Data"]
            ),
        ]) //Agregar caso Default
        .range([innerRadius, outerRadius]);

    var yAxis = (g) =>
        g
            .attr("text-anchor", "middle")
            .call((g) =>
                g
                    .append("text")
                    .attr("x", -6)
                    .attr("y", (d) => -y(y.ticks(4).pop()) - 15)
                    .attr("dy", "-1em")
                    .text(select_value)
            )
            .call((g) =>
                g
                    .selectAll("g")
                    .data(y.ticks(4).slice(1))
                    .join("g")
                    .attr("fill", "none")
                    .call((g) =>
                        g
                            .append("circle")
                            .attr("stroke", "#000")
                            .attr("stroke-opacity", 0.5)
                            .attr("r", y)
                    )
                    .call((g) =>
                        g
                            .append("text")
                            .attr("x", -6)
                            .attr("y", (d) => -y(d))
                            .attr("dy", "0.35em")
                            .attr("stroke", "#fff")
                            .attr("stroke-width", 5)
                            .text(y.tickFormat(10, "s"))
                            .clone(true)
                            .attr("fill", "#000")
                            .attr("stroke", "none")
                    )
            );

    svg2.append("g")
        .call(yAxis)
        .attr("transform", "translate(" + w2 / 2 + "," + h2 / 2 + ")");
}
