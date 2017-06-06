let height = 500;
let width = 1140;
let padding = 90;

let svg = d3.select("#plot")
    .append("svg")
    .attr("height", height)
    .attr("width", width);

function initHistogram(uberData, lyftData) {

    let timeScale = d3.scaleTime()
        .domain([new Date(2014, 7, 1), new Date(2014, 9, 1)])
        .range([padding, width - padding]);

    let rideCounter = d3.histogram()
        .thresholds(timeScale.ticks(61))
        .domain(timeScale.domain())
        .value(function (d) {
            return d.time;
        });

    let uberRides = countRides(uberData, rideCounter);
    let lyftRides = countRides(lyftData, rideCounter);

    let uberMax = d3.max(uberRides, function (day) {
        return day.count;
    });

    let lyftMax = d3.max(lyftRides, function (day) {
        return day.count;
    });

    let max = Math.max(uberMax, lyftMax);

    let xAxis = d3.axisBottom(timeScale)
        .ticks(61)
        .tickFormat((d, i) => {
            //ignore last day in range
            if (i == 61) {
                return "";
            }
            return d3.timeFormat("%a %b %d")(d)
        });

    svg.append("g")
        .attr("transform", "translate(" + (0) + ", " + (height - padding) + ")")
        .attr("class", "histogram")
        .call(xAxis)
        .selectAll("text")
        .attr("dy", "2px")
        .attr("dx", "-4px")
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "end");

    let xLabelCenter = {
        x: padding + (width - padding * 2) / 2,
        y: height - 10
    };

    svg.append("text")
        .attr("dx", xLabelCenter.x)
        .attr("dy", xLabelCenter.y)
        .style("text-anchor", "middle")
        .text("Day of Year");


    let yScale = d3.scaleLinear()
        .domain([0, max])
        .range([height - padding, padding]);

    let yAxis = d3.axisLeft(yScale);
    svg.append("g").call(yAxis).attr("transform", "translate(" + padding + " 0)");

    let yLabelCenter = {
        x: 25,
        y: (height - padding*2) / 2 + padding
    };

    svg.append("text")
        .attr("dx", yLabelCenter.x)
        .attr("dy", yLabelCenter.y)
        .style("text-anchor", "middle")
        .attr("transform", "rotate(-90," + yLabelCenter.x + "," + yLabelCenter.y + ")")
        .text("Time of Day");

    histogram(uberRides, svg, "#09091A", yScale);
    histogram(lyftRides, svg, "#E70B81", yScale);
}


function histogram(days, svg, color, yScale) {

    let xBands = d3.scaleBand()
        .domain(days.map(function (day) {
            return day.x0;
        }))
        .range([padding, width - padding]);

    days.forEach(function (day) {
        svg.append("rect")
            .attr("x", xBands(day.x0))
            .attr("y", yScale(day.count))
            .attr("width", xBands.bandwidth() - 2)
            .attr("height", yScale(0) - yScale(day.count))
            .style("fill", color);

        svg.append("text").attr("class", "label")
            .attr("x", xBands(day.x0) + xBands.bandwidth() / 2)
            .attr("y", yScale(0) + (padding / 2));
    });


}

function countRides(data, counter) {

    let rides = counter(data);

    rides = rides.map((day) => {
        return {
            x0: day.x0,
            x1: day.x1,
            count: day.reduce((accum, hour) => {
                return accum + hour.count;
            }, 0)
        }
    });

    return rides;
}