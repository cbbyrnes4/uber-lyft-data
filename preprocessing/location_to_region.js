var jsonfile = require('jsonfile');
var gju = require('geojson-utils');
var csv = require('csvtojson');
var fs = require('fs');
var async = require('async');
var turfInside = require('turf-inside');

var inputFolder = "../data/";
var files = ["uber-raw-data-aug14.csv", "uber-raw-data-sep14.csv", "other-Lyft_B02510.csv"];
var topoFile = '../data/taxi_zones.geo.json';

var zoneFeatures = jsonfile.readFileSync(topoFile).features;


var args = process.argv.slice(2);

const USETURF = (args[0] === "turf");
var outputFolder =  USETURF ? "../data/processed_turf/" : "../data/processed_gju/";

if (USETURF) {
	console.log("Using turf-inside library to test points");
} else {
	console.log("Using Geojson-utils library to test points");
}



var startTime = new Date();
processFiles(function(){
	var endTime = new Date();
	console.log("Finished in " + (endTime-startTime)/1000 + "s");
});



//Uses the geojson-utils lib to test the point
function testPointGJU(point) {
	for (feature of zoneFeatures) {
    		var testFn;
    		if (feature.geometry.type === "Polygon") {
    			testFn = gju.pointInPolygon;
    		} else if (feature.geometry.type === "MultiPolygon") {
    			testFn = gju.pointInMultiPolygon;
    		}

    		if (testFn(point,feature.geometry)) {
    			return feature.properties.LocationID;
    		}
    }
    return -1;
}

//Uses the turf-inside lib to test the point
function testPointTurf(point) {
	for (feature of zoneFeatures) {
		if (turfInside(point,feature)) {
			return feature.properties.LocationID;
		}
	}
	return -1;
}

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

    outputStream.once("open", function(fd) {
    	csv()
    	.fromStream(fileStream)
    	.on('json',(res)=>{
    		const point = {"type":"Point","coordinates":[Number(res.Lon),Number(res.Lat)]}
    		//console.log(point);
    		var locationId;

    		if (USETURF) {
    			locationId = testPointTurf(point);
    		} else {
    			locationId = testPointGJU(point);
    		}
    		//console.log(locationId);
    	
    		outputStream.write(res["Date/Time"]+","+locationId + "\n");
		})
		.on('done',(error)=>{
		    console.log("Finished for ", inputPath);
        	//outputStream.done();
        	done();
		})
    });
}
