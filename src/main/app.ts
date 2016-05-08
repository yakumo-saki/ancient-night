/// <reference path="./typings/bundle.d.ts" />

console.log('starting AncientNight');

var LogFromRenderer = require('./modules/LogFromRenderer');
var logHandler = new LogFromRenderer();

var AncientNight = require('./modules/AncientNight');
var an = new AncientNight();
