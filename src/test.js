"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var fs_1 = require("fs");
var t2m_1 = __importDefault(require("./t2m"));
console.log(t2m_1["default"](fs_1.readFileSync('../tests/archlinux-2021.05.01-x86_64.iso.torrent'), 'archlinux-2021.05.01-x86_64.iso'));
