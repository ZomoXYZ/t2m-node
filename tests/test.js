"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var fs_1 = require("fs");
var __1 = __importDefault(require("../"));
var expected = 'magnet:?xt=urn:btih:eb6354d8d9b9427458af8bee90457101a4c1e8e3&xl=792014848&dn=archlinux-2021.05.01-x86_64.iso';
console.log("Expected: " + expected);
var link = __1["default"](fs_1.readFileSync('./tests/archlinux-2021.05.01-x86_64.iso.torrent'), 'archlinux-2021.05.01-x86_64.iso');
console.log("Received: " + link);
if (expected !== link)
    throw "Error\nExpected: <" + expected + ">\nReceived: <" + link + ">";
