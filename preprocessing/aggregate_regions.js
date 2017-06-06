var csv = require('csvtojson');
var fs = require('fs');
var async = require('async');

var inputFolder = "../data/processed_turf/";
var outputFolder = "../data/aggregated/regions/";
var files = ["uber-raw-data-aug14.csv", "uber-raw-data-sep14.csv", "other-Lyft_B02510.csv"];

var args = process.argv.slice(2);


var startTime = new Date();
processFiles(function () {
    let endTime = new Date();
    console.log("Finished in " + (endTime - startTime) / 1000 + "s");
});

function processFiles(callback) {
    console.log("Beginning processing");
    async.each(files, processData, function (err) {
        if (err) {
            console.log(err);
            return callback(err);
        }
        else {
            console.log("Finished");
            return callback();
        }
    });
}

function processData(inputfile, done) {
    inputPath = inputFolder + inputfile;
    outputPath = outputFolder + inputfile;
    console.log(inputPath);
    console.log(outputPath);
    var fileStream = fs.createReadStream(inputPath);
    var outputStream = fs.createWriteStream(outputPath);
    var regionCounts = new Map();

    outputStream.once("open", function (fd) {
        csv()
            .fromStream(fileStream)
            .on('json', (res) => {
                let region = res["Region"];
                if (regionCounts.has(region)) {
                    let count = regionCounts.get(region) + 1;
                    regionCounts.set(region,count);
                } else {
                    regionCounts.set(region,1);
                }
            })
            .on('done', (error) => {
                outputStream.write("Region,Count\n");
                for (var [region,count] of regionCounts) {
                    outputStream.write(region+","+count+"\n");
                }
                console.log("Finished for ", inputPath);
                //outputStream.done();
                done();
            })
    });
}
