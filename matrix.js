function initMatrix(uberData, lyftData) {

    let chartPadding = {
        left: 80,
        right: 130,
        top: 20,
        bottom: 120
    };  //px

    let padding = 2; //px
    let cellLen = 15; //px
    let rows = 24; //hours
    let cols = 61; //days

    let height = chartPadding.top + chartPadding.bottom + (cellLen + padding) * rows + padding;
    let width = chartPadding.left + chartPadding.right + (cellLen + padding) * cols + padding;

    let svg = d3.select("#matrix")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    svg.append("rect")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "#f0f0f0");

    svg.append('g')
        .attr('id', 'matrix-legend')
        .attr("transform", "translate("+ (width-chartPadding.right + 30) + ","+ ((height-chartPadding.top-chartPadding.bottom)/2+chartPadding.top-50)+")");

    function getRectBounds(col, row, colScale, rowScale) {
        return {
            x: colScale(col), //- cellLen/2,
            y: rowScale(row) //- cellLen/2
        }
    }

    let colDayScale = d3.scaleLinear()
        .domain([0, cols])
        .range([chartPadding.left + padding, width - chartPadding.right]);

    let rowHourScale = d3.scaleLinear()
        .domain([0, rows])
        .range([height - chartPadding.bottom - padding, chartPadding.top]);

    let dayScale = d3.scaleTime()
        .domain([new Date(2014, 7, 1), new Date(2014, 9, 1)])
        .range([chartPadding.left + padding, width - chartPadding.right]);

    let dayCounter = d3.histogram()
        .thresholds(dayScale.ticks(61))
        .domain(dayScale.domain())
        .value(function (d) {
            return d.time;
        });

    let hourCounter = d3.histogram()
        .thresholds(rowHourScale.ticks(24))
        .domain(rowHourScale.domain())
        .value(function (d) {
            return d.time.getHours();
        });

    let bucketData = function (data) {
        return dayCounter(data).map((day) => {
            return hourCounter(day);
        })
    };

    let uberNorm = uberData.map(function (d, i) {
        return uberData[i].count;
    });
    let uberMean = d3.mean(uberNorm);
    let uberStd = d3.deviation(uberNorm);
    uberNorm = uberNorm.map(function (c) {
        return (c - uberMean) / uberStd;
    });

    let lyftNorm = lyftData.map(function (d, i) {
        return lyftData[i].count;
    });
    let lyftMean = d3.mean(lyftNorm);
    let lyftStd = d3.deviation(lyftNorm);
    lyftNorm = lyftNorm.map(function (c) {
        return (c - lyftMean) / lyftStd;
    });


    let diffArray = uberNorm.map(function (d, i) {
        return lyftNorm[i] - uberNorm[i];
    });
    let max = d3.max(diffArray);
    let min = d3.min(diffArray);
    let diffCounts = [];

    while (diffArray.length) diffCounts.push(diffArray.splice(0, 24));

    let colorScale = d3.scaleLinear()
        .domain([min, 0, max])
        .range(["#09091A", "#DDDDDD", "#E70B81"]);

    let legend = d3.legendColor()
        .cells([min, -3, -2, -1, 0, 1, 2, 3, max])
        .orient('vertical')
        .title("Difference in StDev")
        .titleWidth(100)
        .scale(colorScale);

    d3.select("#matrix-legend").call(legend);

    uberData = bucketData(uberData);
    lyftData = bucketData(lyftData);

    console.log("uber", uberData);

    /*---------------
     // y axis stuff
     ----------------*/
    let timeLabels = d3.timeHour
        .every(1)
        .range(new Date(2017, 1, 1), new Date(2017, 1, 2))
        .map((x) => d3.timeFormat("%I %p")(x));

    let rowHourAxis = d3.axisLeft(rowHourScale)
        .ticks(24)
        .tickFormat((d, i) => timeLabels[d]);

    svg.append("g")
        .attr("transform", "translate(" + chartPadding.left + ",0)")
        .attr("class", "matrix")
        .call(rowHourAxis)
        .selectAll(".tick text")
        .attr("dy", "9px")
        .attr("dx", "5px");

    let yLabelCenter = {
        x: 27,
        y: (height - chartPadding.top - chartPadding.bottom) / 2 + chartPadding.top
    };

    svg.append("text")
        .attr("dx", yLabelCenter.x)
        .attr("dy", yLabelCenter.y)
        .style("text-anchor", "middle")
        .attr("transform", "rotate(-90," + yLabelCenter.x + "," + yLabelCenter.y + ")")
        .text("Time of Day");

    /*---------------
     // x axis stuff
     ----------------*/

    let colDayAxis = d3.axisBottom(dayScale)
        .tickFormat((d, i) => {
            //ignore last day in range
            if (i == 61) {
                return "";
            }
            return d3.timeFormat("%a %b %d")(d)
        })
        .ticks(61);

    svg.append("g")
        .attr("transform", "translate(" + (0) + ", " + (height - chartPadding.bottom + 20) + ")")
        .attr("class", "matrix")
        .call(colDayAxis)
        .selectAll("text")
        .attr("dy", "2px")
        .attr("dx", "1px")
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "end");

    let xLabelCenter = {
        x: chartPadding.left + (width - chartPadding.left - chartPadding.right) / 2,
        y: height - 20
    };

    svg.append("text")
        .attr("dx", xLabelCenter.x)
        .attr("dy", xLabelCenter.y)
        .style("text-anchor", "middle")
        .text("Day of Year");

    uberData.forEach((c, ci) => {
        c.forEach((r, ri) => {
            let xy = getRectBounds(ci, ri, colDayScale, rowHourScale);
            svg.append("rect")
                .attr("rx", 2)
                .attr("ry", 2)
                .attr("x", xy.x)
                .attr("y", xy.y)
                .attr("width", cellLen)
                .attr("height", cellLen)
                //no data present for lyft on last hour of last day - ignore
                .style("fill", (ci == 60 && ri == 23) ? "white" : colorScale(diffCounts[ci][ri]));
        })
    })

}
