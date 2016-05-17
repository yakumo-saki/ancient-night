declare var process:NodeJS.Process;

if (process.env.npm_package_version == null) {
    console.log('Must use `npm start`. dont use `electron .`');
    process.exit(16);
}

console.log('starting AncientNight ver ' + process.env.npm_package_version);

var LogFromRenderer = require('./modules/LogFromRenderer');
var logHandler = new LogFromRenderer();

var AncientNight = require('./modules/AncientNight');
var an = new AncientNight();
