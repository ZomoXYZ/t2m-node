"use strict";
var createHash = require('crypto').createHash, bencode = require('bencode'), UTF8 = {
    decode: function (s) { return decodeURIComponent(escape(s)); },
    encode: function (s) { return unescape(encodeURIComponent(s)); }
}, magnet_component_order_default = ['xt', 'xl', 'dn', 'tr'];
function b32encode(s) {
    /* encodes a string s to base32 and returns the encoded string */
    var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    var parts = [];
    var quanta = Math.floor((s.length / 5));
    var leftover = s.length % 5;
    if (leftover != 0) {
        for (var i = 0; i < (5 - leftover); i++) {
            s += '\x00';
        }
        quanta += 1;
    }
    for (i = 0; i < quanta; i++) {
        parts.push(alphabet.charAt(s.charCodeAt(i * 5) >> 3));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5) & 0x07) << 2)
            | (s.charCodeAt(i * 5 + 1) >> 6)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 1) & 0x3F) >> 1)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 1) & 0x01) << 4)
            | (s.charCodeAt(i * 5 + 2) >> 4)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 2) & 0x0F) << 1)
            | (s.charCodeAt(i * 5 + 3) >> 7)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 3) & 0x7F) >> 2)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 3) & 0x03) << 3)
            | (s.charCodeAt(i * 5 + 4) >> 5)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 4) & 0x1F))));
    }
    var replace = 0;
    if (leftover == 1)
        replace = 6;
    else if (leftover == 2)
        replace = 4;
    else if (leftover == 3)
        replace = 3;
    else if (leftover == 4)
        replace = 1;
    for (i = 0; i < replace; i++)
        parts.pop();
    for (i = 0; i < replace; i++)
        parts.push("=");
    return parts.join("");
}
function format_uri(array_values, encode_fcn) {
    if (array_values.length <= 1)
        return encode_fcn(array_values[0]);
    return array_values[0].replace(/\{([0-9]+)\}/, function (match) {
        return encode_fcn(array_values[parseInt(match[1], 10) + 1] || '');
    });
}
;
/**
    Convert URI components object into a magnet URI.
    This is used to format the same object multiple times without rehashing anything.

    @param link_components
        An object returned from convert_to_magnet with return_components=true
    @param torrent_name
        Can take one of the following values:
            null/undefined: name will remain the same as it originally was
            string: the custom name to give the magnet URI
    @param tracker_mode
        Can take one of the following values:
            null/undefined/false/number < 0: single tracker only (primary one)
            true: multiple trackers (without numbered suffix)
            number >= 0: multiple trackers (with numbered suffix starting at the specified number)
    @param uri_encode
        Can take one of the following values:
            null/undefined/true: encode components using encodeURIComponent
            false: no encoding; components are left as-is
            function: custom encoding function
    @param component_order
        A list containing the order URI components should appear in.
        Default is [ 'xt' , 'xl' , 'dn' , 'tr' ]
        null/undefined will use the default
    @return
        A formatted URI
*/
function components_to_magnet(link_components, torrent_name, tracker_mode, uri_encode, component_order) {
    // TODO link_components shouldnt be `any`
    uri_encode = !uri_encode ? function (s) { return s; } : (typeof (uri_encode) == 'function' ? uri_encode : encodeURIComponent);
    component_order = (component_order === null) ? magnet_component_order_default : component_order;
    // Setup
    link_components.dn.values = [[torrent_name]];
    link_components.tr.suffix = -1;
    if (typeof tracker_mode == 'number') {
        tracker_mode = Math.floor(tracker_mode);
        if (tracker_mode >= 0)
            link_components.tr.suffix = tracker_mode;
    }
    else if (tracker_mode === true) {
        link_components.tr.suffix = -2;
    }
    // Form into a URL
    var link = 'magnet:', val = 0; // number of components added
    for (var i = 0; i < component_order.length; i++) {
        if (!(component_order[i] in link_components))
            continue; // not valid
        var obj = link_components[component_order[i]], list1 = obj.values;
        for (var j = 0; j < list1.length; j++) {
            // Separator
            link += (val === 0 ? '?' : '&');
            ++val;
            // Key
            link += component_order[i];
            // Number
            if (obj.suffix >= 0 && list1.length > 1) {
                link += '.';
                link += obj.suffix;
                ++obj.suffix;
            }
            // Value
            link += '=';
            link += format_uri(list1[j], uri_encode);
            // Done
            if (obj.suffix == -1)
                break;
        }
    }
    // Done
    return link;
}
/**
    Convert the torrent data into a magnet link.

    @param torrent_content
        An ArrayBuffer
    @param custom_name
        Can take one of the following values:
            null/undefined: no custom name will be generated, but if the name field is absent, it will be assumed from the original file's name
            false: no custom name will be generated OR assumed from the original file name
            string: the custom name to give the magnet URI
    @param tracker_mode
        Can take one of the following values:
            null/undefined/false/number < 0: single tracker only (primary one)
            true: multiple trackers (without numbered suffix)
            number >= 0: multiple trackers (with numbered suffix starting at the specified number)
    @param uri_encode
        Can take one of the following values:
            null/undefined/true: encode components using encodeURIComponent
            false: no encoding; components are left as-is
            function: custom encoding function
    @param component_order
        A list containing the order URI components should appear in.
        Default is [ 'xt' , 'xl' , 'dn' , 'tr' ]
        null/undefined will use the default
    @param return_components
        If true, this returns the link components which can then be used with components_to_magnet
    @return
        A formatted URI if return_components is falsy, else an object containing the parts of the link
        Also can return null if insufficient data is found
*/
function convert_to_magnet(torrent_content, torrent_name, tracker_mode, uri_encode, component_order, return_components) {
    var info = bencode.decode(torrent_content).info, info_hash = createHash('SHA1').update(bencode.encode(info)).digest(), link_components = {}, // TODO link_components shouldnt be `any`
    link;
    info_hash = Buffer.from(info_hash).toString('hex');
    // Setup link
    for (var i = 0; i < magnet_component_order_default.length; i++) {
        link_components[magnet_component_order_default[i]] = {
            suffix: -1,
            values: []
        };
    }
    // Create
    link_components.xt.values.push(['urn:btih:{0}', info_hash]);
    if ('length' in info) {
        link_components.xl.values.push([info.length]);
    }
    var list1 = link_components.tr.values;
    if ('announce' in info) {
        list1.push([UTF8.decode(info.announce)]);
    }
    if ('announce-list' in info && Array.isArray(info['announce-list'])) {
        var list2 = info['announce-list'];
        // Add more trackers
        for (var i = 0; i < list2.length; i++) {
            if (!Array.isArray(list2[i]))
                continue; // bad data
            for (var j = 0; j < list2[i].length; j++) {
                var val = UTF8.decode(list2[i][j]);
                if (list1.indexOf(val) < 0)
                    list1.push([val]);
            }
        }
    }
    // Convert
    if (return_components)
        return link_components;
    link = components_to_magnet(link_components, torrent_name, tracker_mode, uri_encode, component_order);
    // Done
    return link;
}
function t2m(torrent_content, torrent_name) {
    return convert_to_magnet(torrent_content, torrent_name, false, true, null, false);
}
if (typeof process === 'undefined')
    require('domready')(function () {
        window.t2m = t2m;
    });
module.exports = t2m;
