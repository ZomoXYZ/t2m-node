import { readFileSync } from 'fs';
import t2m from '../';

let expected = 'magnet:?xt=urn:btih:eb6354d8d9b9427458af8bee90457101a4c1e8e3&xl=792014848&dn=archlinux-2021.05.01-x86_64.iso';
console.log(`Expected: ${expected}`);

let link = t2m(readFileSync('./tests/archlinux-2021.05.01-x86_64.iso.torrent'), 'archlinux-2021.05.01-x86_64.iso');
console.log(`Received: ${link}`);

if (expected !== link)
    throw `Error\nExpected: <${expected}>\nReceived: <${link}>`;