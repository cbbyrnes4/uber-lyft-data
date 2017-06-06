let csv = require('csvtojson');
let fs = require('fs');
let async = require('async');
let moment = require('moment');

let inputFolder = "../data/processed_turf/";
let outputFolder = "../data/aggregated/time/";
let files = ["uber-raw-data-aug14.csv", "uber-raw-data-sep14.csv", "other-Lyft_B02510.csv"];

let args = process.argv.slice(2);


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
    let fileStream = fs.createReadStream(inputPath);
    let outputStream = fs.createWriteStream(outputPath);
    let timeCounts = new Map();

    outputStream.once("open", function (fd) {
        csv()
            .fromStream(fileStream)
            .on('json', (res) => {
                let region = res["Region"];
                if (region === "-1") {
                    return;
                }
                let datetime = new Date(res["Date/Time"]);
                datetime.setMinutes(0);
                datetime.setSeconds(0);
                datetime = moment(datetime).format("MM/DD/YYYY HH:mm");
                if (timeCounts.has(datetime)) {
                    let count = timeCounts.get(datetime) + 1;
                    timeCounts.set(datetime,count);
                } else {
                    timeCounts.set(datetime,1);
                }

            })
            .on('done', (error) => {
                outputStream.write("Date/Time,Count\n");
                for (var [datetime,count] of timeCounts) {
                    outputStream.write(datetime+","+count+"\n");
                }
                console.log("Finished for ", inputPath);
                //outputStream.done();
                done();
            })
    });
}
