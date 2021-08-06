"use strict";
exports.__esModule = true;
var electron_1 = require("electron");
var util = require("../dist/util");
var applicationMenu = require("../dist/applicationMenu");
util.logInfo('hello world');
applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new electron_1.MenuItem({ label: 'Join on GitHub (coming soon)' }));
