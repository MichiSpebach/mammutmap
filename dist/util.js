"use strict";
exports.__esModule = true;
exports.escapeForHtml = exports.readFileAndConvertToHtml = exports.readFile = exports.readdirSync = exports.stringify = exports.logError = exports.logWarning = exports.logInfo = void 0;
var dom = require("./domAdapter");
var fs = require("fs");
var fs_1 = require("fs");
function logInfo(message) {
    log('Info: ' + message, 'grey');
}
exports.logInfo = logInfo;
function logWarning(message) {
    log('WARNING: ' + message, 'orange');
}
exports.logWarning = logWarning;
function logError(message) {
    log('ERROR: ' + message, 'red');
}
exports.logError = logError;
function log(message, color) {
    console.log(message);
    var division = '<div style="color:' + color + '">' + escapeForHtml(message) + '</div>';
    dom.insertContentTo('log', division);
}
function stringify(object) {
    var stringifiedObject = object + ': ';
    for (var key in object) {
        //if(typeof rect[key] !== 'function') {
        stringifiedObject += key + '=' + object[key] + '; ';
        //}
    }
    return stringifiedObject;
}
exports.stringify = stringify;
function readdirSync(path) {
    return fs.readdirSync(path, { withFileTypes: true });
}
exports.readdirSync = readdirSync;
function readFile(path) {
    return fs_1.promises.readFile(path, 'utf-8');
}
exports.readFile = readFile;
function readFileAndConvertToHtml(path, callback) {
    fs.readFile(path, 'utf-8', function (err, data) {
        if (err) {
            logError('util::readFile, ' + path + ', ' + err.message);
        }
        else {
            callback(escapeForHtml(data));
        }
    });
}
exports.readFileAndConvertToHtml = readFileAndConvertToHtml;
function escapeForHtml(text) {
    var content = '';
    for (var i = 0; i < text.length - 1; i++) {
        // TODO this is maybe very inefficient
        content += escapeCharForHtml(text[i]);
    }
    return content;
}
exports.escapeForHtml = escapeForHtml;
function escapeCharForHtml(c) {
    switch (c) {
        case '\\':
            return '&#92;';
        case '\n':
            return '<br/>';
        case '\'':
            return '&#39;';
        case '"':
            return '&quot;';
        case '<':
            return '&lt;';
        case '>':
            return '&gt;';
        case '&':
            return '&amp';
        default:
            return c;
    }
}
//# sourceMappingURL=util.js.map