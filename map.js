function computeMergedDicts(data) {
    let regionCounts = {};

    data.forEach(function (d) {
        let region = d["region"];

        if (region == -1) {
            return;
        }

        if (regionCounts[region]) {
            regionCounts[region] += d["count"];
        } else {
            regionCounts[region] = d["count"];
        }
    });

    return regionCounts;
}

function getPercentMaps(uberData, lyftData) {
    let uberAvg = 0;
    let lyftAvg = 0;
    let uberPer = {};
    let lyftPer = {};

    let uberRegions = d3.keys(uberData);
    let lyftRegions = d3.keys(lyftData);

    uberAvg = d3.mean(uberRegions,(d) => uberData[d]);
    lyftAvg = d3.mean(lyftRegions, (d) => lyftData[d]);

    let uberDev = d3.deviation(uberRegions,(d) => uberData[d]);
    let lyftDev = d3.deviation(lyftRegions, (d) => lyftData[d]);

    for (let key in uberData) { uberPer[key] = (uberData[key] - uberAvg) / uberDev; }
    for (let key in lyftData) { lyftPer[key] = (lyftData[key] - lyftAvg) / lyftDev; }

    console.log(uberPer);

    return {
        uber: uberPer,
        lyft: lyftPer
    }
}

function initMap(taxiZones, boroughs, uberData, lyftData) {
    let height = 800;
    let width = 800;

    let heatMap = d3.select("#map")
        .append('svg')
        .attr('id', 'heat-map')
        .attr('width', width)
        .attr('height', height)
        .append('g');

    heatMap
        .append('g')
        .attr('id','map-legend')
        .attr("transform","translate(150,180)");

    let colorRange = ['#09091A','#4F4F5B','#96969C','#DDDDDD','#E097BE','#E3519F','#E70B81'];

    let maps = getPercentMaps(computeMergedDicts(uberData), 
        computeMergedDicts(lyftData));
    let uberMap = maps['uber'];
    let lyftMap = maps['lyft'];

    let zoneData = {}
    taxiZones.features.forEach(function (d) {
        let locID = d.properties.LocationID;
        if (lyftData) { // Lyft is not present in all taxi zones, uber is
            zoneData[locID] = lyftMap[locID]-uberMap[locID];
        } else {
            zoneData[locID] = NaN;
        }
    });

    let zoneRange = d3.extent(d3.values(zoneData));
    let max = zoneRange[1];
    let min = zoneRange[0];

    let colorScale = d3.scaleLinear()
        .range(colorRange)
        .domain([min,-1,-0.5,0,0.5,1,max]);

    let legend = d3.legendColor()
        .cells([-2,-1.5,-1,-0.5,0,0.5,1,1.5,2])
        .orient('vertical')
        .title("Difference in StDev")
        .titleWidth(100)
        .scale(colorScale);

    d3.select("#map-legend").call(legend);

    // inspired from
    // http://stackoverflow.com/questions/14492284/center-a-map-in-d3-given-a-geojson-object
    let projection = d3.geoAlbers()
        .scale(1)
        .translate([0, 0]);

    let path = d3.geoPath().projection(projection);

    let bounds = path.bounds(taxiZones),
        scale = .95 / Math.max((bounds[1][0] - bounds[0][0]) / width, 
            (bounds[1][1] - bounds[0][1]) / height),
        translate = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2, 
            (height - scale * (bounds[1][1] + bounds[0][1])) / 2];

    projection = d3.geoAlbers()
        .scale(scale)
        .translate(translate);

    path = path.projection(projection);

    heatMap.selectAll("path")
        .data(taxiZones.features)
        .enter()
        .append("path")
        .attr("class", "zone")
        .attr("id", function (d) {
            return "zone-" + d.properties.LocationID;
        })
        .style("fill", function(d) {
            let color = zoneData[d.properties.LocationID];
            if (color) { 
                return colorScale(color);
            } else {
                return "white"
            }  
        })
        .attr("d", path);

    heatMap.selectAll("path.boroughs")
        .data(boroughs.features)
        .enter()
        .append("path")
        .attr("class", "borough")
        .attr("fill-opacity","0")
        .attr("stroke","darkblue")
        .attr("id", function(d) {
            return "boro-" + d.properties.BoroCode;
        })
        .attr("stroke-width",1.2)
        .attr("d", path);

    d3.select("#map svg")
        .append('text')
        .text("LGA")
        .attr('x',660)
        .attr('y',440);

    d3.select("#map svg")
        .append('text')
        .text("QUEENS")
        .attr('x',640)
        .attr('y',200);

    d3.select("#map svg")
        .append('text')
        .text("THE BRONX")
        .attr('x',460)
        .attr('y',25);

    d3.select("#map svg")
        .append('text')
        .text("STATEN ISLAND")
        .attr('x',25)
        .attr('y',630);

    d3.select("#map svg")
        .append('text')
        .text("BROOKLYN")
        .attr('x',250)
        .attr('y',470);

    d3.select("#map svg")
        .append('text')
        .text("MANHATTAN")
        .attr('x',230)
        .attr('y',270);

    d3.select("#map svg")
        .append('text')
        .text("JFK")
        .attr('x',455)
        .attr('y',210);
}








