(function () {
	'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function getAugmentedNamespace(n) {
	  var f = n.default;
		if (typeof f == "function") {
			var a = function () {
				return f.apply(this, arguments);
			};
			a.prototype = f.prototype;
	  } else a = {};
	  Object.defineProperty(a, '__esModule', {value: true});
		Object.keys(n).forEach(function (k) {
			var d = Object.getOwnPropertyDescriptor(n, k);
			Object.defineProperty(a, k, d.get ? d : {
				enumerable: true,
				get: function () {
					return n[k];
				}
			});
		});
		return a;
	}

	var lib = {};

	//
	// Polyfills for legacy environments
	//
	/*
	 * Support Android 4.4.x
	 */
	if (!ArrayBuffer.isView) {
	    ArrayBuffer.isView = (a) => {
	        return a !== null && typeof (a) === 'object' && a.buffer instanceof ArrayBuffer;
	    };
	}
	// Define globalThis if not available.
	// https://github.com/colyseus/colyseus.js/issues/86
	if (typeof (globalThis) === "undefined" &&
	    typeof (window) !== "undefined") {
	    // @ts-ignore
	    window['globalThis'] = window;
	}

	var Client$1 = {};

	var ServerError = {};

	(function (exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.ServerError = exports.CloseCode = void 0;
		(function (CloseCode) {
		    CloseCode[CloseCode["CONSENTED"] = 4000] = "CONSENTED";
		    CloseCode[CloseCode["DEVMODE_RESTART"] = 4010] = "DEVMODE_RESTART";
		})(exports.CloseCode || (exports.CloseCode = {}));
		class ServerError extends Error {
		    constructor(code, message) {
		        super(message);
		        this.name = "ServerError";
		        this.code = code;
		    }
		}
		exports.ServerError = ServerError;
		
	} (ServerError));

	var Room$1 = {};

	var msgpack$1 = {};

	/**
	 * Copyright (c) 2014 Ion Drive Software Ltd.
	 * https://github.com/darrachequesne/notepack/
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in all
	 * copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	 * SOFTWARE.
	 */
	Object.defineProperty(msgpack$1, "__esModule", { value: true });
	msgpack$1.decode = msgpack$1.encode = void 0;
	/**
	 * Patch for Colyseus:
	 * -------------------
	 * notepack.io@3.0.1
	 *
	 * added `offset` on Decoder constructor, for messages arriving with a code
	 * before actual msgpack data
	 */
	//
	// DECODER
	//
	function Decoder(buffer, offset) {
	    this._offset = offset;
	    if (buffer instanceof ArrayBuffer) {
	        this._buffer = buffer;
	        this._view = new DataView(this._buffer);
	    }
	    else if (ArrayBuffer.isView(buffer)) {
	        this._buffer = buffer.buffer;
	        this._view = new DataView(this._buffer, buffer.byteOffset, buffer.byteLength);
	    }
	    else {
	        throw new Error('Invalid argument');
	    }
	}
	function utf8Read(view, offset, length) {
	    var string = '', chr = 0;
	    for (var i = offset, end = offset + length; i < end; i++) {
	        var byte = view.getUint8(i);
	        if ((byte & 0x80) === 0x00) {
	            string += String.fromCharCode(byte);
	            continue;
	        }
	        if ((byte & 0xe0) === 0xc0) {
	            string += String.fromCharCode(((byte & 0x1f) << 6) |
	                (view.getUint8(++i) & 0x3f));
	            continue;
	        }
	        if ((byte & 0xf0) === 0xe0) {
	            string += String.fromCharCode(((byte & 0x0f) << 12) |
	                ((view.getUint8(++i) & 0x3f) << 6) |
	                ((view.getUint8(++i) & 0x3f) << 0));
	            continue;
	        }
	        if ((byte & 0xf8) === 0xf0) {
	            chr = ((byte & 0x07) << 18) |
	                ((view.getUint8(++i) & 0x3f) << 12) |
	                ((view.getUint8(++i) & 0x3f) << 6) |
	                ((view.getUint8(++i) & 0x3f) << 0);
	            if (chr >= 0x010000) { // surrogate pair
	                chr -= 0x010000;
	                string += String.fromCharCode((chr >>> 10) + 0xD800, (chr & 0x3FF) + 0xDC00);
	            }
	            else {
	                string += String.fromCharCode(chr);
	            }
	            continue;
	        }
	        throw new Error('Invalid byte ' + byte.toString(16));
	    }
	    return string;
	}
	Decoder.prototype._array = function (length) {
	    var value = new Array(length);
	    for (var i = 0; i < length; i++) {
	        value[i] = this._parse();
	    }
	    return value;
	};
	Decoder.prototype._map = function (length) {
	    var key = '', value = {};
	    for (var i = 0; i < length; i++) {
	        key = this._parse();
	        value[key] = this._parse();
	    }
	    return value;
	};
	Decoder.prototype._str = function (length) {
	    var value = utf8Read(this._view, this._offset, length);
	    this._offset += length;
	    return value;
	};
	Decoder.prototype._bin = function (length) {
	    var value = this._buffer.slice(this._offset, this._offset + length);
	    this._offset += length;
	    return value;
	};
	Decoder.prototype._parse = function () {
	    var prefix = this._view.getUint8(this._offset++);
	    var value, length = 0, type = 0, hi = 0, lo = 0;
	    if (prefix < 0xc0) {
	        // positive fixint
	        if (prefix < 0x80) {
	            return prefix;
	        }
	        // fixmap
	        if (prefix < 0x90) {
	            return this._map(prefix & 0x0f);
	        }
	        // fixarray
	        if (prefix < 0xa0) {
	            return this._array(prefix & 0x0f);
	        }
	        // fixstr
	        return this._str(prefix & 0x1f);
	    }
	    // negative fixint
	    if (prefix > 0xdf) {
	        return (0xff - prefix + 1) * -1;
	    }
	    switch (prefix) {
	        // nil
	        case 0xc0:
	            return null;
	        // false
	        case 0xc2:
	            return false;
	        // true
	        case 0xc3:
	            return true;
	        // bin
	        case 0xc4:
	            length = this._view.getUint8(this._offset);
	            this._offset += 1;
	            return this._bin(length);
	        case 0xc5:
	            length = this._view.getUint16(this._offset);
	            this._offset += 2;
	            return this._bin(length);
	        case 0xc6:
	            length = this._view.getUint32(this._offset);
	            this._offset += 4;
	            return this._bin(length);
	        // ext
	        case 0xc7:
	            length = this._view.getUint8(this._offset);
	            type = this._view.getInt8(this._offset + 1);
	            this._offset += 2;
	            if (type === -1) {
	                // timestamp 96
	                var ns = this._view.getUint32(this._offset);
	                hi = this._view.getInt32(this._offset + 4);
	                lo = this._view.getUint32(this._offset + 8);
	                this._offset += 12;
	                return new Date((hi * 0x100000000 + lo) * 1e3 + ns / 1e6);
	            }
	            return [type, this._bin(length)];
	        case 0xc8:
	            length = this._view.getUint16(this._offset);
	            type = this._view.getInt8(this._offset + 2);
	            this._offset += 3;
	            return [type, this._bin(length)];
	        case 0xc9:
	            length = this._view.getUint32(this._offset);
	            type = this._view.getInt8(this._offset + 4);
	            this._offset += 5;
	            return [type, this._bin(length)];
	        // float
	        case 0xca:
	            value = this._view.getFloat32(this._offset);
	            this._offset += 4;
	            return value;
	        case 0xcb:
	            value = this._view.getFloat64(this._offset);
	            this._offset += 8;
	            return value;
	        // uint
	        case 0xcc:
	            value = this._view.getUint8(this._offset);
	            this._offset += 1;
	            return value;
	        case 0xcd:
	            value = this._view.getUint16(this._offset);
	            this._offset += 2;
	            return value;
	        case 0xce:
	            value = this._view.getUint32(this._offset);
	            this._offset += 4;
	            return value;
	        case 0xcf:
	            hi = this._view.getUint32(this._offset) * Math.pow(2, 32);
	            lo = this._view.getUint32(this._offset + 4);
	            this._offset += 8;
	            return hi + lo;
	        // int
	        case 0xd0:
	            value = this._view.getInt8(this._offset);
	            this._offset += 1;
	            return value;
	        case 0xd1:
	            value = this._view.getInt16(this._offset);
	            this._offset += 2;
	            return value;
	        case 0xd2:
	            value = this._view.getInt32(this._offset);
	            this._offset += 4;
	            return value;
	        case 0xd3:
	            hi = this._view.getInt32(this._offset) * Math.pow(2, 32);
	            lo = this._view.getUint32(this._offset + 4);
	            this._offset += 8;
	            return hi + lo;
	        // fixext
	        case 0xd4:
	            type = this._view.getInt8(this._offset);
	            this._offset += 1;
	            if (type === 0x00) {
	                // custom encoding for 'undefined' (kept for backward-compatibility)
	                this._offset += 1;
	                return void 0;
	            }
	            return [type, this._bin(1)];
	        case 0xd5:
	            type = this._view.getInt8(this._offset);
	            this._offset += 1;
	            return [type, this._bin(2)];
	        case 0xd6:
	            type = this._view.getInt8(this._offset);
	            this._offset += 1;
	            if (type === -1) {
	                // timestamp 32
	                value = this._view.getUint32(this._offset);
	                this._offset += 4;
	                return new Date(value * 1e3);
	            }
	            return [type, this._bin(4)];
	        case 0xd7:
	            type = this._view.getInt8(this._offset);
	            this._offset += 1;
	            if (type === 0x00) {
	                // custom date encoding (kept for backward-compatibility)
	                hi = this._view.getInt32(this._offset) * Math.pow(2, 32);
	                lo = this._view.getUint32(this._offset + 4);
	                this._offset += 8;
	                return new Date(hi + lo);
	            }
	            if (type === -1) {
	                // timestamp 64
	                hi = this._view.getUint32(this._offset);
	                lo = this._view.getUint32(this._offset + 4);
	                this._offset += 8;
	                var s = (hi & 0x3) * 0x100000000 + lo;
	                return new Date(s * 1e3 + (hi >>> 2) / 1e6);
	            }
	            return [type, this._bin(8)];
	        case 0xd8:
	            type = this._view.getInt8(this._offset);
	            this._offset += 1;
	            return [type, this._bin(16)];
	        // str
	        case 0xd9:
	            length = this._view.getUint8(this._offset);
	            this._offset += 1;
	            return this._str(length);
	        case 0xda:
	            length = this._view.getUint16(this._offset);
	            this._offset += 2;
	            return this._str(length);
	        case 0xdb:
	            length = this._view.getUint32(this._offset);
	            this._offset += 4;
	            return this._str(length);
	        // array
	        case 0xdc:
	            length = this._view.getUint16(this._offset);
	            this._offset += 2;
	            return this._array(length);
	        case 0xdd:
	            length = this._view.getUint32(this._offset);
	            this._offset += 4;
	            return this._array(length);
	        // map
	        case 0xde:
	            length = this._view.getUint16(this._offset);
	            this._offset += 2;
	            return this._map(length);
	        case 0xdf:
	            length = this._view.getUint32(this._offset);
	            this._offset += 4;
	            return this._map(length);
	    }
	    throw new Error('Could not parse');
	};
	function decode(buffer, offset = 0) {
	    var decoder = new Decoder(buffer, offset);
	    var value = decoder._parse();
	    if (decoder._offset !== buffer.byteLength) {
	        throw new Error((buffer.byteLength - decoder._offset) + ' trailing bytes');
	    }
	    return value;
	}
	msgpack$1.decode = decode;
	//
	// ENCODER
	//
	var TIMESTAMP32_MAX_SEC = 0x100000000 - 1; // 32-bit unsigned int
	var TIMESTAMP64_MAX_SEC = 0x400000000 - 1; // 34-bit unsigned int
	function utf8Write(view, offset, str) {
	    var c = 0;
	    for (var i = 0, l = str.length; i < l; i++) {
	        c = str.charCodeAt(i);
	        if (c < 0x80) {
	            view.setUint8(offset++, c);
	        }
	        else if (c < 0x800) {
	            view.setUint8(offset++, 0xc0 | (c >> 6));
	            view.setUint8(offset++, 0x80 | (c & 0x3f));
	        }
	        else if (c < 0xd800 || c >= 0xe000) {
	            view.setUint8(offset++, 0xe0 | (c >> 12));
	            view.setUint8(offset++, 0x80 | (c >> 6) & 0x3f);
	            view.setUint8(offset++, 0x80 | (c & 0x3f));
	        }
	        else {
	            i++;
	            c = 0x10000 + (((c & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
	            view.setUint8(offset++, 0xf0 | (c >> 18));
	            view.setUint8(offset++, 0x80 | (c >> 12) & 0x3f);
	            view.setUint8(offset++, 0x80 | (c >> 6) & 0x3f);
	            view.setUint8(offset++, 0x80 | (c & 0x3f));
	        }
	    }
	}
	function utf8Length(str) {
	    var c = 0, length = 0;
	    for (var i = 0, l = str.length; i < l; i++) {
	        c = str.charCodeAt(i);
	        if (c < 0x80) {
	            length += 1;
	        }
	        else if (c < 0x800) {
	            length += 2;
	        }
	        else if (c < 0xd800 || c >= 0xe000) {
	            length += 3;
	        }
	        else {
	            i++;
	            length += 4;
	        }
	    }
	    return length;
	}
	function _encode(bytes, defers, value) {
	    var type = typeof value, i = 0, l = 0, hi = 0, lo = 0, length = 0, size = 0;
	    if (type === 'string') {
	        length = utf8Length(value);
	        // fixstr
	        if (length < 0x20) {
	            bytes.push(length | 0xa0);
	            size = 1;
	        }
	        // str 8
	        else if (length < 0x100) {
	            bytes.push(0xd9, length);
	            size = 2;
	        }
	        // str 16
	        else if (length < 0x10000) {
	            bytes.push(0xda, length >> 8, length);
	            size = 3;
	        }
	        // str 32
	        else if (length < 0x100000000) {
	            bytes.push(0xdb, length >> 24, length >> 16, length >> 8, length);
	            size = 5;
	        }
	        else {
	            throw new Error('String too long');
	        }
	        defers.push({ _str: value, _length: length, _offset: bytes.length });
	        return size + length;
	    }
	    if (type === 'number') {
	        // TODO: encode to float 32?
	        // float 64
	        if (Math.floor(value) !== value || !isFinite(value)) {
	            bytes.push(0xcb);
	            defers.push({ _float: value, _length: 8, _offset: bytes.length });
	            return 9;
	        }
	        if (value >= 0) {
	            // positive fixnum
	            if (value < 0x80) {
	                bytes.push(value);
	                return 1;
	            }
	            // uint 8
	            if (value < 0x100) {
	                bytes.push(0xcc, value);
	                return 2;
	            }
	            // uint 16
	            if (value < 0x10000) {
	                bytes.push(0xcd, value >> 8, value);
	                return 3;
	            }
	            // uint 32
	            if (value < 0x100000000) {
	                bytes.push(0xce, value >> 24, value >> 16, value >> 8, value);
	                return 5;
	            }
	            // uint 64
	            hi = (value / Math.pow(2, 32)) >> 0;
	            lo = value >>> 0;
	            bytes.push(0xcf, hi >> 24, hi >> 16, hi >> 8, hi, lo >> 24, lo >> 16, lo >> 8, lo);
	            return 9;
	        }
	        else {
	            // negative fixnum
	            if (value >= -0x20) {
	                bytes.push(value);
	                return 1;
	            }
	            // int 8
	            if (value >= -0x80) {
	                bytes.push(0xd0, value);
	                return 2;
	            }
	            // int 16
	            if (value >= -0x8000) {
	                bytes.push(0xd1, value >> 8, value);
	                return 3;
	            }
	            // int 32
	            if (value >= -0x80000000) {
	                bytes.push(0xd2, value >> 24, value >> 16, value >> 8, value);
	                return 5;
	            }
	            // int 64
	            hi = Math.floor(value / Math.pow(2, 32));
	            lo = value >>> 0;
	            bytes.push(0xd3, hi >> 24, hi >> 16, hi >> 8, hi, lo >> 24, lo >> 16, lo >> 8, lo);
	            return 9;
	        }
	    }
	    if (type === 'object') {
	        // nil
	        if (value === null) {
	            bytes.push(0xc0);
	            return 1;
	        }
	        if (Array.isArray(value)) {
	            length = value.length;
	            // fixarray
	            if (length < 0x10) {
	                bytes.push(length | 0x90);
	                size = 1;
	            }
	            // array 16
	            else if (length < 0x10000) {
	                bytes.push(0xdc, length >> 8, length);
	                size = 3;
	            }
	            // array 32
	            else if (length < 0x100000000) {
	                bytes.push(0xdd, length >> 24, length >> 16, length >> 8, length);
	                size = 5;
	            }
	            else {
	                throw new Error('Array too large');
	            }
	            for (i = 0; i < length; i++) {
	                size += _encode(bytes, defers, value[i]);
	            }
	            return size;
	        }
	        if (value instanceof Date) {
	            var ms = value.getTime();
	            var s = Math.floor(ms / 1e3);
	            var ns = (ms - s * 1e3) * 1e6;
	            if (s >= 0 && ns >= 0 && s <= TIMESTAMP64_MAX_SEC) {
	                if (ns === 0 && s <= TIMESTAMP32_MAX_SEC) {
	                    // timestamp 32
	                    bytes.push(0xd6, 0xff, s >> 24, s >> 16, s >> 8, s);
	                    return 6;
	                }
	                else {
	                    // timestamp 64
	                    hi = s / 0x100000000;
	                    lo = s & 0xffffffff;
	                    bytes.push(0xd7, 0xff, ns >> 22, ns >> 14, ns >> 6, hi, lo >> 24, lo >> 16, lo >> 8, lo);
	                    return 10;
	                }
	            }
	            else {
	                // timestamp 96
	                hi = Math.floor(s / 0x100000000);
	                lo = s >>> 0;
	                bytes.push(0xc7, 0x0c, 0xff, ns >> 24, ns >> 16, ns >> 8, ns, hi >> 24, hi >> 16, hi >> 8, hi, lo >> 24, lo >> 16, lo >> 8, lo);
	                return 15;
	            }
	        }
	        if (value instanceof ArrayBuffer) {
	            length = value.byteLength;
	            // bin 8
	            if (length < 0x100) {
	                bytes.push(0xc4, length);
	                size = 2;
	            }
	            else 
	            // bin 16
	            if (length < 0x10000) {
	                bytes.push(0xc5, length >> 8, length);
	                size = 3;
	            }
	            else 
	            // bin 32
	            if (length < 0x100000000) {
	                bytes.push(0xc6, length >> 24, length >> 16, length >> 8, length);
	                size = 5;
	            }
	            else {
	                throw new Error('Buffer too large');
	            }
	            defers.push({ _bin: value, _length: length, _offset: bytes.length });
	            return size + length;
	        }
	        if (typeof value.toJSON === 'function') {
	            return _encode(bytes, defers, value.toJSON());
	        }
	        var keys = [], key = '';
	        var allKeys = Object.keys(value);
	        for (i = 0, l = allKeys.length; i < l; i++) {
	            key = allKeys[i];
	            if (value[key] !== undefined && typeof value[key] !== 'function') {
	                keys.push(key);
	            }
	        }
	        length = keys.length;
	        // fixmap
	        if (length < 0x10) {
	            bytes.push(length | 0x80);
	            size = 1;
	        }
	        // map 16
	        else if (length < 0x10000) {
	            bytes.push(0xde, length >> 8, length);
	            size = 3;
	        }
	        // map 32
	        else if (length < 0x100000000) {
	            bytes.push(0xdf, length >> 24, length >> 16, length >> 8, length);
	            size = 5;
	        }
	        else {
	            throw new Error('Object too large');
	        }
	        for (i = 0; i < length; i++) {
	            key = keys[i];
	            size += _encode(bytes, defers, key);
	            size += _encode(bytes, defers, value[key]);
	        }
	        return size;
	    }
	    // false/true
	    if (type === 'boolean') {
	        bytes.push(value ? 0xc3 : 0xc2);
	        return 1;
	    }
	    if (type === 'undefined') {
	        bytes.push(0xc0);
	        return 1;
	    }
	    // custom types like BigInt (typeof value === 'bigint')
	    if (typeof value.toJSON === 'function') {
	        return _encode(bytes, defers, value.toJSON());
	    }
	    throw new Error('Could not encode');
	}
	function encode(value) {
	    var bytes = [];
	    var defers = [];
	    var size = _encode(bytes, defers, value);
	    var buf = new ArrayBuffer(size);
	    var view = new DataView(buf);
	    var deferIndex = 0;
	    var deferWritten = 0;
	    var nextOffset = -1;
	    if (defers.length > 0) {
	        nextOffset = defers[0]._offset;
	    }
	    var defer, deferLength = 0, offset = 0;
	    for (var i = 0, l = bytes.length; i < l; i++) {
	        view.setUint8(deferWritten + i, bytes[i]);
	        if (i + 1 !== nextOffset) {
	            continue;
	        }
	        defer = defers[deferIndex];
	        deferLength = defer._length;
	        offset = deferWritten + nextOffset;
	        if (defer._bin) {
	            var bin = new Uint8Array(defer._bin);
	            for (var j = 0; j < deferLength; j++) {
	                view.setUint8(offset + j, bin[j]);
	            }
	        }
	        else if (defer._str) {
	            utf8Write(view, offset, defer._str);
	        }
	        else if (defer._float !== undefined) {
	            view.setFloat64(offset, defer._float);
	        }
	        deferIndex++;
	        deferWritten += deferLength;
	        if (defers[deferIndex]) {
	            nextOffset = defers[deferIndex]._offset;
	        }
	    }
	    return buf;
	}
	msgpack$1.encode = encode;

	var Connection$1 = {};

	var WebSocketTransport$1 = {};

	var browser = function () {
	  throw new Error(
	    'ws does not work in the browser. Browser clients must use the native ' +
	      'WebSocket object'
	  );
	};

	var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(WebSocketTransport$1, "__esModule", { value: true });
	WebSocketTransport$1.WebSocketTransport = void 0;
	const ws_1 = __importDefault(browser);
	const WebSocket = globalThis.WebSocket || ws_1.default;
	class WebSocketTransport {
	    constructor(events) {
	        this.events = events;
	    }
	    send(data) {
	        if (data instanceof ArrayBuffer) {
	            this.ws.send(data);
	        }
	        else if (Array.isArray(data)) {
	            this.ws.send((new Uint8Array(data)).buffer);
	        }
	    }
	    connect(url) {
	        this.ws = new WebSocket(url, this.protocols);
	        this.ws.binaryType = 'arraybuffer';
	        this.ws.onopen = this.events.onopen;
	        this.ws.onmessage = this.events.onmessage;
	        this.ws.onclose = this.events.onclose;
	        this.ws.onerror = this.events.onerror;
	    }
	    close(code, reason) {
	        this.ws.close(code, reason);
	    }
	    get isOpen() {
	        return this.ws.readyState === WebSocket.OPEN;
	    }
	}
	WebSocketTransport$1.WebSocketTransport = WebSocketTransport;

	Object.defineProperty(Connection$1, "__esModule", { value: true });
	Connection$1.Connection = void 0;
	const WebSocketTransport_1 = WebSocketTransport$1;
	class Connection {
	    constructor() {
	        this.events = {};
	        this.transport = new WebSocketTransport_1.WebSocketTransport(this.events);
	    }
	    send(data) {
	        this.transport.send(data);
	    }
	    connect(url) {
	        this.transport.connect(url);
	    }
	    close(code, reason) {
	        this.transport.close(code, reason);
	    }
	    get isOpen() {
	        return this.transport.isOpen;
	    }
	}
	Connection$1.Connection = Connection;

	var Protocol = {};

	(function (exports) {
		// Use codes between 0~127 for lesser throughput (1 byte)
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.utf8Length = exports.utf8Read = exports.ErrorCode = exports.Protocol = void 0;
		(function (Protocol) {
		    // Room-related (10~19)
		    Protocol[Protocol["HANDSHAKE"] = 9] = "HANDSHAKE";
		    Protocol[Protocol["JOIN_ROOM"] = 10] = "JOIN_ROOM";
		    Protocol[Protocol["ERROR"] = 11] = "ERROR";
		    Protocol[Protocol["LEAVE_ROOM"] = 12] = "LEAVE_ROOM";
		    Protocol[Protocol["ROOM_DATA"] = 13] = "ROOM_DATA";
		    Protocol[Protocol["ROOM_STATE"] = 14] = "ROOM_STATE";
		    Protocol[Protocol["ROOM_STATE_PATCH"] = 15] = "ROOM_STATE_PATCH";
		    Protocol[Protocol["ROOM_DATA_SCHEMA"] = 16] = "ROOM_DATA_SCHEMA";
		    Protocol[Protocol["ROOM_DATA_BYTES"] = 17] = "ROOM_DATA_BYTES";
		})(exports.Protocol || (exports.Protocol = {}));
		(function (ErrorCode) {
		    ErrorCode[ErrorCode["MATCHMAKE_NO_HANDLER"] = 4210] = "MATCHMAKE_NO_HANDLER";
		    ErrorCode[ErrorCode["MATCHMAKE_INVALID_CRITERIA"] = 4211] = "MATCHMAKE_INVALID_CRITERIA";
		    ErrorCode[ErrorCode["MATCHMAKE_INVALID_ROOM_ID"] = 4212] = "MATCHMAKE_INVALID_ROOM_ID";
		    ErrorCode[ErrorCode["MATCHMAKE_UNHANDLED"] = 4213] = "MATCHMAKE_UNHANDLED";
		    ErrorCode[ErrorCode["MATCHMAKE_EXPIRED"] = 4214] = "MATCHMAKE_EXPIRED";
		    ErrorCode[ErrorCode["AUTH_FAILED"] = 4215] = "AUTH_FAILED";
		    ErrorCode[ErrorCode["APPLICATION_ERROR"] = 4216] = "APPLICATION_ERROR";
		})(exports.ErrorCode || (exports.ErrorCode = {}));
		function utf8Read(view, offset) {
		    const length = view[offset++];
		    var string = '', chr = 0;
		    for (var i = offset, end = offset + length; i < end; i++) {
		        var byte = view[i];
		        if ((byte & 0x80) === 0x00) {
		            string += String.fromCharCode(byte);
		            continue;
		        }
		        if ((byte & 0xe0) === 0xc0) {
		            string += String.fromCharCode(((byte & 0x1f) << 6) |
		                (view[++i] & 0x3f));
		            continue;
		        }
		        if ((byte & 0xf0) === 0xe0) {
		            string += String.fromCharCode(((byte & 0x0f) << 12) |
		                ((view[++i] & 0x3f) << 6) |
		                ((view[++i] & 0x3f) << 0));
		            continue;
		        }
		        if ((byte & 0xf8) === 0xf0) {
		            chr = ((byte & 0x07) << 18) |
		                ((view[++i] & 0x3f) << 12) |
		                ((view[++i] & 0x3f) << 6) |
		                ((view[++i] & 0x3f) << 0);
		            if (chr >= 0x010000) { // surrogate pair
		                chr -= 0x010000;
		                string += String.fromCharCode((chr >>> 10) + 0xD800, (chr & 0x3FF) + 0xDC00);
		            }
		            else {
		                string += String.fromCharCode(chr);
		            }
		            continue;
		        }
		        throw new Error('Invalid byte ' + byte.toString(16));
		    }
		    return string;
		}
		exports.utf8Read = utf8Read;
		// Faster for short strings than Buffer.byteLength
		function utf8Length(str = '') {
		    let c = 0;
		    let length = 0;
		    for (let i = 0, l = str.length; i < l; i++) {
		        c = str.charCodeAt(i);
		        if (c < 0x80) {
		            length += 1;
		        }
		        else if (c < 0x800) {
		            length += 2;
		        }
		        else if (c < 0xd800 || c >= 0xe000) {
		            length += 3;
		        }
		        else {
		            i++;
		            length += 4;
		        }
		    }
		    return length + 1;
		}
		exports.utf8Length = utf8Length;
		
	} (Protocol));

	var Serializer = {};

	Object.defineProperty(Serializer, "__esModule", { value: true });
	Serializer.getSerializer = Serializer.registerSerializer = void 0;
	const serializers = {};
	function registerSerializer(id, serializer) {
	    serializers[id] = serializer;
	}
	Serializer.registerSerializer = registerSerializer;
	function getSerializer(id) {
	    const serializer = serializers[id];
	    if (!serializer) {
	        throw new Error("missing serializer: " + id);
	    }
	    return serializer;
	}
	Serializer.getSerializer = getSerializer;

	var nanoevents = {};

	/**
	 * The MIT License (MIT)
	 *
	 * Copyright 2016 Andrey Sitnik <andrey@sitnik.ru>
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy of
	 * this software and associated documentation files (the "Software"), to deal in
	 * the Software without restriction, including without limitation the rights to
	 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
	 * the Software, and to permit persons to whom the Software is furnished to do so,
	 * subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in all
	 * copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
	 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
	 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
	 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
	 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
	 */
	Object.defineProperty(nanoevents, "__esModule", { value: true });
	nanoevents.createNanoEvents = void 0;
	const createNanoEvents = () => ({
	    emit(event, ...args) {
	        let callbacks = this.events[event] || [];
	        for (let i = 0, length = callbacks.length; i < length; i++) {
	            callbacks[i](...args);
	        }
	    },
	    events: {},
	    on(event, cb) {
	        var _a;
	        ((_a = this.events[event]) === null || _a === void 0 ? void 0 : _a.push(cb)) || (this.events[event] = [cb]);
	        return () => {
	            var _a;
	            this.events[event] = (_a = this.events[event]) === null || _a === void 0 ? void 0 : _a.filter(i => cb !== i);
	        };
	    }
	});
	nanoevents.createNanoEvents = createNanoEvents;

	var signal = {};

	Object.defineProperty(signal, "__esModule", { value: true });
	signal.createSignal = signal.EventEmitter = void 0;
	class EventEmitter {
	    constructor() {
	        this.handlers = [];
	    }
	    register(cb, once = false) {
	        this.handlers.push(cb);
	        return this;
	    }
	    invoke(...args) {
	        this.handlers.forEach((handler) => handler.apply(this, args));
	    }
	    invokeAsync(...args) {
	        return Promise.all(this.handlers.map((handler) => handler.apply(this, args)));
	    }
	    remove(cb) {
	        const index = this.handlers.indexOf(cb);
	        this.handlers[index] = this.handlers[this.handlers.length - 1];
	        this.handlers.pop();
	    }
	    clear() {
	        this.handlers = [];
	    }
	}
	signal.EventEmitter = EventEmitter;
	function createSignal() {
	    const emitter = new EventEmitter();
	    function register(cb) {
	        return emitter.register(cb, this === null);
	    }
	    register.once = (cb) => {
	        const callback = function (...args) {
	            cb.apply(this, args);
	            emitter.remove(callback);
	        };
	        emitter.register(callback);
	    };
	    register.remove = (cb) => emitter.remove(cb);
	    register.invoke = (...args) => emitter.invoke(...args);
	    register.invokeAsync = (...args) => emitter.invokeAsync(...args);
	    register.clear = () => emitter.clear();
	    return register;
	}
	signal.createSignal = createSignal;

	var umd = {exports: {}};

	(function (module, exports) {
		(function (global, factory) {
		    factory(exports) ;
		})(commonjsGlobal, (function (exports) {
		    /******************************************************************************
		    Copyright (c) Microsoft Corporation.

		    Permission to use, copy, modify, and/or distribute this software for any
		    purpose with or without fee is hereby granted.

		    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
		    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
		    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
		    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
		    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
		    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
		    PERFORMANCE OF THIS SOFTWARE.
		    ***************************************************************************** */
		    /* global Reflect, Promise, SuppressedError, Symbol */

		    var extendStatics = function(d, b) {
		        extendStatics = Object.setPrototypeOf ||
		            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
		            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
		        return extendStatics(d, b);
		    };

		    function __extends(d, b) {
		        if (typeof b !== "function" && b !== null)
		            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
		        extendStatics(d, b);
		        function __() { this.constructor = d; }
		        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		    }

		    function __decorate(decorators, target, key, desc) {
		        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
		        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
		        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
		        return c > 3 && r && Object.defineProperty(target, key, r), r;
		    }

		    function __spreadArray(to, from, pack) {
		        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
		            if (ar || !(i in from)) {
		                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
		                ar[i] = from[i];
		            }
		        }
		        return to.concat(ar || Array.prototype.slice.call(from));
		    }

		    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
		        var e = new Error(message);
		        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
		    };

		    // export const SWITCH_TO_STRUCTURE = 193; (easily collides with DELETE_AND_ADD + fieldIndex = 2)
		    var SWITCH_TO_STRUCTURE = 255; // (decoding collides with DELETE_AND_ADD + fieldIndex = 63)
		    var TYPE_ID = 213;
		    /**
		     * Encoding Schema field operations.
		     */
		    exports.OPERATION = void 0;
		    (function (OPERATION) {
		        // add new structure/primitive
		        OPERATION[OPERATION["ADD"] = 128] = "ADD";
		        // replace structure/primitive
		        OPERATION[OPERATION["REPLACE"] = 0] = "REPLACE";
		        // delete field
		        OPERATION[OPERATION["DELETE"] = 64] = "DELETE";
		        // DELETE field, followed by an ADD
		        OPERATION[OPERATION["DELETE_AND_ADD"] = 192] = "DELETE_AND_ADD";
		        // TOUCH is used to determine hierarchy of nested Schema structures during serialization.
		        // touches are NOT encoded.
		        OPERATION[OPERATION["TOUCH"] = 1] = "TOUCH";
		        // MapSchema Operations
		        OPERATION[OPERATION["CLEAR"] = 10] = "CLEAR";
		    })(exports.OPERATION || (exports.OPERATION = {}));
		    // export enum OPERATION {
		    //     // add new structure/primitive
		    //     // (128)
		    //     ADD = 128, // 10000000,
		    //     // replace structure/primitive
		    //     REPLACE = 1,// 00000001
		    //     // delete field
		    //     DELETE = 192, // 11000000
		    //     // DELETE field, followed by an ADD
		    //     DELETE_AND_ADD = 224, // 11100000
		    //     // TOUCH is used to determine hierarchy of nested Schema structures during serialization.
		    //     // touches are NOT encoded.
		    //     TOUCH = 0, // 00000000
		    //     // MapSchema Operations
		    //     CLEAR = 10,
		    // }

		    var ChangeTree = /** @class */ (function () {
		        function ChangeTree(ref, parent, root) {
		            this.changed = false;
		            this.changes = new Map();
		            this.allChanges = new Set();
		            // cached indexes for filtering
		            this.caches = {};
		            this.currentCustomOperation = 0;
		            this.ref = ref;
		            this.setParent(parent, root);
		        }
		        ChangeTree.prototype.setParent = function (parent, root, parentIndex) {
		            var _this = this;
		            if (!this.indexes) {
		                this.indexes = (this.ref instanceof Schema)
		                    ? this.ref['_definition'].indexes
		                    : {};
		            }
		            this.parent = parent;
		            this.parentIndex = parentIndex;
		            // avoid setting parents with empty `root`
		            if (!root) {
		                return;
		            }
		            this.root = root;
		            //
		            // assign same parent on child structures
		            //
		            if (this.ref instanceof Schema) {
		                var definition = this.ref['_definition'];
		                for (var field in definition.schema) {
		                    var value = this.ref[field];
		                    if (value && value['$changes']) {
		                        var parentIndex_1 = definition.indexes[field];
		                        value['$changes'].setParent(this.ref, root, parentIndex_1);
		                    }
		                }
		            }
		            else if (typeof (this.ref) === "object") {
		                this.ref.forEach(function (value, key) {
		                    if (value instanceof Schema) {
		                        var changeTreee = value['$changes'];
		                        var parentIndex_2 = _this.ref['$changes'].indexes[key];
		                        changeTreee.setParent(_this.ref, _this.root, parentIndex_2);
		                    }
		                });
		            }
		        };
		        ChangeTree.prototype.operation = function (op) {
		            this.changes.set(--this.currentCustomOperation, op);
		        };
		        ChangeTree.prototype.change = function (fieldName, operation) {
		            if (operation === void 0) { operation = exports.OPERATION.ADD; }
		            var index = (typeof (fieldName) === "number")
		                ? fieldName
		                : this.indexes[fieldName];
		            this.assertValidIndex(index, fieldName);
		            var previousChange = this.changes.get(index);
		            if (!previousChange ||
		                previousChange.op === exports.OPERATION.DELETE ||
		                previousChange.op === exports.OPERATION.TOUCH // (mazmorra.io's BattleAction issue)
		            ) {
		                this.changes.set(index, {
		                    op: (!previousChange)
		                        ? operation
		                        : (previousChange.op === exports.OPERATION.DELETE)
		                            ? exports.OPERATION.DELETE_AND_ADD
		                            : operation,
		                    // : OPERATION.REPLACE,
		                    index: index
		                });
		            }
		            this.allChanges.add(index);
		            this.changed = true;
		            this.touchParents();
		        };
		        ChangeTree.prototype.touch = function (fieldName) {
		            var index = (typeof (fieldName) === "number")
		                ? fieldName
		                : this.indexes[fieldName];
		            this.assertValidIndex(index, fieldName);
		            if (!this.changes.has(index)) {
		                this.changes.set(index, { op: exports.OPERATION.TOUCH, index: index });
		            }
		            this.allChanges.add(index);
		            // ensure touch is placed until the $root is found.
		            this.touchParents();
		        };
		        ChangeTree.prototype.touchParents = function () {
		            if (this.parent) {
		                this.parent['$changes'].touch(this.parentIndex);
		            }
		        };
		        ChangeTree.prototype.getType = function (index) {
		            if (this.ref['_definition']) {
		                var definition = this.ref['_definition'];
		                return definition.schema[definition.fieldsByIndex[index]];
		            }
		            else {
		                var definition = this.parent['_definition'];
		                var parentType = definition.schema[definition.fieldsByIndex[this.parentIndex]];
		                //
		                // Get the child type from parent structure.
		                // - ["string"] => "string"
		                // - { map: "string" } => "string"
		                // - { set: "string" } => "string"
		                //
		                return Object.values(parentType)[0];
		            }
		        };
		        ChangeTree.prototype.getChildrenFilter = function () {
		            var childFilters = this.parent['_definition'].childFilters;
		            return childFilters && childFilters[this.parentIndex];
		        };
		        //
		        // used during `.encode()`
		        //
		        ChangeTree.prototype.getValue = function (index) {
		            return this.ref['getByIndex'](index);
		        };
		        ChangeTree.prototype.delete = function (fieldName) {
		            var index = (typeof (fieldName) === "number")
		                ? fieldName
		                : this.indexes[fieldName];
		            if (index === undefined) {
		                console.warn("@colyseus/schema ".concat(this.ref.constructor.name, ": trying to delete non-existing index: ").concat(fieldName, " (").concat(index, ")"));
		                return;
		            }
		            var previousValue = this.getValue(index);
		            // console.log("$changes.delete =>", { fieldName, index, previousValue });
		            this.changes.set(index, { op: exports.OPERATION.DELETE, index: index });
		            this.allChanges.delete(index);
		            // delete cache
		            delete this.caches[index];
		            // remove `root` reference
		            if (previousValue && previousValue['$changes']) {
		                previousValue['$changes'].parent = undefined;
		            }
		            this.changed = true;
		            this.touchParents();
		        };
		        ChangeTree.prototype.discard = function (changed, discardAll) {
		            var _this = this;
		            if (changed === void 0) { changed = false; }
		            if (discardAll === void 0) { discardAll = false; }
		            //
		            // Map, Array, etc:
		            // Remove cached key to ensure ADD operations is unsed instead of
		            // REPLACE in case same key is used on next patches.
		            //
		            // TODO: refactor this. this is not relevant for Collection and Set.
		            //
		            if (!(this.ref instanceof Schema)) {
		                this.changes.forEach(function (change) {
		                    if (change.op === exports.OPERATION.DELETE) {
		                        var index = _this.ref['getIndex'](change.index);
		                        delete _this.indexes[index];
		                    }
		                });
		            }
		            this.changes.clear();
		            this.changed = changed;
		            if (discardAll) {
		                this.allChanges.clear();
		            }
		            // re-set `currentCustomOperation`
		            this.currentCustomOperation = 0;
		        };
		        /**
		         * Recursively discard all changes from this, and child structures.
		         */
		        ChangeTree.prototype.discardAll = function () {
		            var _this = this;
		            this.changes.forEach(function (change) {
		                var value = _this.getValue(change.index);
		                if (value && value['$changes']) {
		                    value['$changes'].discardAll();
		                }
		            });
		            this.discard();
		        };
		        // cache(field: number, beginIndex: number, endIndex: number) {
		        ChangeTree.prototype.cache = function (field, cachedBytes) {
		            this.caches[field] = cachedBytes;
		        };
		        ChangeTree.prototype.clone = function () {
		            return new ChangeTree(this.ref, this.parent, this.root);
		        };
		        ChangeTree.prototype.ensureRefId = function () {
		            // skip if refId is already set.
		            if (this.refId !== undefined) {
		                return;
		            }
		            this.refId = this.root.getNextUniqueId();
		        };
		        ChangeTree.prototype.assertValidIndex = function (index, fieldName) {
		            if (index === undefined) {
		                throw new Error("ChangeTree: missing index for field \"".concat(fieldName, "\""));
		            }
		        };
		        return ChangeTree;
		    }());

		    function addCallback($callbacks, op, callback, existing) {
		        // initialize list of callbacks
		        if (!$callbacks[op]) {
		            $callbacks[op] = [];
		        }
		        $callbacks[op].push(callback);
		        //
		        // Trigger callback for existing elements
		        // - OPERATION.ADD
		        // - OPERATION.REPLACE
		        //
		        existing === null || existing === void 0 ? void 0 : existing.forEach(function (item, key) { return callback(item, key); });
		        return function () { return spliceOne($callbacks[op], $callbacks[op].indexOf(callback)); };
		    }
		    function removeChildRefs(changes) {
		        var _this = this;
		        var needRemoveRef = (typeof (this.$changes.getType()) !== "string");
		        this.$items.forEach(function (item, key) {
		            changes.push({
		                refId: _this.$changes.refId,
		                op: exports.OPERATION.DELETE,
		                field: key,
		                value: undefined,
		                previousValue: item
		            });
		            if (needRemoveRef) {
		                _this.$changes.root.removeRef(item['$changes'].refId);
		            }
		        });
		    }
		    function spliceOne(arr, index) {
		        // manually splice an array
		        if (index === -1 || index >= arr.length) {
		            return false;
		        }
		        var len = arr.length - 1;
		        for (var i = index; i < len; i++) {
		            arr[i] = arr[i + 1];
		        }
		        arr.length = len;
		        return true;
		    }

		    var DEFAULT_SORT = function (a, b) {
		        var A = a.toString();
		        var B = b.toString();
		        if (A < B)
		            return -1;
		        else if (A > B)
		            return 1;
		        else
		            return 0;
		    };
		    function getArrayProxy(value) {
		        value['$proxy'] = true;
		        //
		        // compatibility with @colyseus/schema 0.5.x
		        // - allow `map["key"]`
		        // - allow `map["key"] = "xxx"`
		        // - allow `delete map["key"]`
		        //
		        value = new Proxy(value, {
		            get: function (obj, prop) {
		                if (typeof (prop) !== "symbol" &&
		                    !isNaN(prop) // https://stackoverflow.com/a/175787/892698
		                ) {
		                    return obj.at(prop);
		                }
		                else {
		                    return obj[prop];
		                }
		            },
		            set: function (obj, prop, setValue) {
		                if (typeof (prop) !== "symbol" &&
		                    !isNaN(prop)) {
		                    var indexes = Array.from(obj['$items'].keys());
		                    var key = parseInt(indexes[prop] || prop);
		                    if (setValue === undefined || setValue === null) {
		                        obj.deleteAt(key);
		                    }
		                    else {
		                        obj.setAt(key, setValue);
		                    }
		                }
		                else {
		                    obj[prop] = setValue;
		                }
		                return true;
		            },
		            deleteProperty: function (obj, prop) {
		                if (typeof (prop) === "number") {
		                    obj.deleteAt(prop);
		                }
		                else {
		                    delete obj[prop];
		                }
		                return true;
		            },
		            has: function (obj, key) {
		                if (typeof (key) !== "symbol" &&
		                    !isNaN(Number(key))) {
		                    return obj['$items'].has(Number(key));
		                }
		                return Reflect.has(obj, key);
		            }
		        });
		        return value;
		    }
		    var ArraySchema = /** @class */ (function () {
		        function ArraySchema() {
		            var items = [];
		            for (var _i = 0; _i < arguments.length; _i++) {
		                items[_i] = arguments[_i];
		            }
		            this.$changes = new ChangeTree(this);
		            this.$items = new Map();
		            this.$indexes = new Map();
		            this.$refId = 0;
		            this.push.apply(this, items);
		        }
		        ArraySchema.prototype.onAdd = function (callback, triggerAll) {
		            if (triggerAll === void 0) { triggerAll = true; }
		            return addCallback((this.$callbacks || (this.$callbacks = {})), exports.OPERATION.ADD, callback, (triggerAll)
		                ? this.$items
		                : undefined);
		        };
		        ArraySchema.prototype.onRemove = function (callback) { return addCallback(this.$callbacks || (this.$callbacks = {}), exports.OPERATION.DELETE, callback); };
		        ArraySchema.prototype.onChange = function (callback) { return addCallback(this.$callbacks || (this.$callbacks = {}), exports.OPERATION.REPLACE, callback); };
		        ArraySchema.is = function (type) {
		            return (
		            // type format: ["string"]
		            Array.isArray(type) ||
		                // type format: { array: "string" }
		                (type['array'] !== undefined));
		        };
		        Object.defineProperty(ArraySchema.prototype, "length", {
		            get: function () {
		                return this.$items.size;
		            },
		            set: function (value) {
		                if (value === 0) {
		                    this.clear();
		                }
		                else {
		                    this.splice(value, this.length - value);
		                }
		            },
		            enumerable: false,
		            configurable: true
		        });
		        ArraySchema.prototype.push = function () {
		            var _this = this;
		            var values = [];
		            for (var _i = 0; _i < arguments.length; _i++) {
		                values[_i] = arguments[_i];
		            }
		            var lastIndex;
		            values.forEach(function (value) {
		                // set "index" for reference.
		                lastIndex = _this.$refId++;
		                _this.setAt(lastIndex, value);
		            });
		            return lastIndex;
		        };
		        /**
		         * Removes the last element from an array and returns it.
		         */
		        ArraySchema.prototype.pop = function () {
		            var key = Array.from(this.$indexes.values()).pop();
		            if (key === undefined) {
		                return undefined;
		            }
		            this.$changes.delete(key);
		            this.$indexes.delete(key);
		            var value = this.$items.get(key);
		            this.$items.delete(key);
		            return value;
		        };
		        ArraySchema.prototype.at = function (index) {
		            //
		            // FIXME: this should be O(1)
		            //
		            index = Math.trunc(index) || 0;
		            // Allow negative indexing from the end
		            if (index < 0)
		                index += this.length;
		            // OOB access is guaranteed to return undefined
		            if (index < 0 || index >= this.length)
		                return undefined;
		            var key = Array.from(this.$items.keys())[index];
		            return this.$items.get(key);
		        };
		        ArraySchema.prototype.setAt = function (index, value) {
		            var _a, _b;
		            if (value === undefined || value === null) {
		                console.error("ArraySchema items cannot be null nor undefined; Use `deleteAt(index)` instead.");
		                return;
		            }
		            // skip if the value is the same as cached.
		            if (this.$items.get(index) === value) {
		                return;
		            }
		            if (value['$changes'] !== undefined) {
		                value['$changes'].setParent(this, this.$changes.root, index);
		            }
		            var operation = (_b = (_a = this.$changes.indexes[index]) === null || _a === void 0 ? void 0 : _a.op) !== null && _b !== void 0 ? _b : exports.OPERATION.ADD;
		            this.$changes.indexes[index] = index;
		            this.$indexes.set(index, index);
		            this.$items.set(index, value);
		            this.$changes.change(index, operation);
		        };
		        ArraySchema.prototype.deleteAt = function (index) {
		            var key = Array.from(this.$items.keys())[index];
		            if (key === undefined) {
		                return false;
		            }
		            return this.$deleteAt(key);
		        };
		        ArraySchema.prototype.$deleteAt = function (index) {
		            // delete at internal index
		            this.$changes.delete(index);
		            this.$indexes.delete(index);
		            return this.$items.delete(index);
		        };
		        ArraySchema.prototype.clear = function (changes) {
		            // discard previous operations.
		            this.$changes.discard(true, true);
		            this.$changes.indexes = {};
		            // clear previous indexes
		            this.$indexes.clear();
		            //
		            // When decoding:
		            // - enqueue items for DELETE callback.
		            // - flag child items for garbage collection.
		            //
		            if (changes) {
		                removeChildRefs.call(this, changes);
		            }
		            // clear items
		            this.$items.clear();
		            this.$changes.operation({ index: 0, op: exports.OPERATION.CLEAR });
		            // touch all structures until reach root
		            this.$changes.touchParents();
		        };
		        /**
		         * Combines two or more arrays.
		         * @param items Additional items to add to the end of array1.
		         */
		        // @ts-ignore
		        ArraySchema.prototype.concat = function () {
		            var _a;
		            var items = [];
		            for (var _i = 0; _i < arguments.length; _i++) {
		                items[_i] = arguments[_i];
		            }
		            return new (ArraySchema.bind.apply(ArraySchema, __spreadArray([void 0], (_a = Array.from(this.$items.values())).concat.apply(_a, items), false)))();
		        };
		        /**
		         * Adds all the elements of an array separated by the specified separator string.
		         * @param separator A string used to separate one element of an array from the next in the resulting String. If omitted, the array elements are separated with a comma.
		         */
		        ArraySchema.prototype.join = function (separator) {
		            return Array.from(this.$items.values()).join(separator);
		        };
		        /**
		         * Reverses the elements in an Array.
		         */
		        // @ts-ignore
		        ArraySchema.prototype.reverse = function () {
		            var _this = this;
		            var indexes = Array.from(this.$items.keys());
		            var reversedItems = Array.from(this.$items.values()).reverse();
		            reversedItems.forEach(function (item, i) {
		                _this.setAt(indexes[i], item);
		            });
		            return this;
		        };
		        /**
		         * Removes the first element from an array and returns it.
		         */
		        ArraySchema.prototype.shift = function () {
		            var indexes = Array.from(this.$items.keys());
		            var shiftAt = indexes.shift();
		            if (shiftAt === undefined) {
		                return undefined;
		            }
		            var value = this.$items.get(shiftAt);
		            this.$deleteAt(shiftAt);
		            return value;
		        };
		        /**
		         * Returns a section of an array.
		         * @param start The beginning of the specified portion of the array.
		         * @param end The end of the specified portion of the array. This is exclusive of the element at the index 'end'.
		         */
		        ArraySchema.prototype.slice = function (start, end) {
		            var sliced = new ArraySchema();
		            sliced.push.apply(sliced, Array.from(this.$items.values()).slice(start, end));
		            return sliced;
		        };
		        /**
		         * Sorts an array.
		         * @param compareFn Function used to determine the order of the elements. It is expected to return
		         * a negative value if first argument is less than second argument, zero if they're equal and a positive
		         * value otherwise. If omitted, the elements are sorted in ascending, ASCII character order.
		         * ```ts
		         * [11,2,22,1].sort((a, b) => a - b)
		         * ```
		         */
		        ArraySchema.prototype.sort = function (compareFn) {
		            var _this = this;
		            if (compareFn === void 0) { compareFn = DEFAULT_SORT; }
		            var indexes = Array.from(this.$items.keys());
		            var sortedItems = Array.from(this.$items.values()).sort(compareFn);
		            sortedItems.forEach(function (item, i) {
		                _this.setAt(indexes[i], item);
		            });
		            return this;
		        };
		        /**
		         * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
		         * @param start The zero-based location in the array from which to start removing elements.
		         * @param deleteCount The number of elements to remove.
		         * @param items Elements to insert into the array in place of the deleted elements.
		         */
		        ArraySchema.prototype.splice = function (start, deleteCount) {
		            if (deleteCount === void 0) { deleteCount = this.length - start; }
		            var items = [];
		            for (var _i = 2; _i < arguments.length; _i++) {
		                items[_i - 2] = arguments[_i];
		            }
		            var indexes = Array.from(this.$items.keys());
		            var removedItems = [];
		            for (var i = start; i < start + deleteCount; i++) {
		                removedItems.push(this.$items.get(indexes[i]));
		                this.$deleteAt(indexes[i]);
		            }
		            for (var i = 0; i < items.length; i++) {
		                this.setAt(start + i, items[i]);
		            }
		            return removedItems;
		        };
		        /**
		         * Inserts new elements at the start of an array.
		         * @param items  Elements to insert at the start of the Array.
		         */
		        ArraySchema.prototype.unshift = function () {
		            var _this = this;
		            var items = [];
		            for (var _i = 0; _i < arguments.length; _i++) {
		                items[_i] = arguments[_i];
		            }
		            var length = this.length;
		            var addedLength = items.length;
		            // const indexes = Array.from(this.$items.keys());
		            var previousValues = Array.from(this.$items.values());
		            items.forEach(function (item, i) {
		                _this.setAt(i, item);
		            });
		            previousValues.forEach(function (previousValue, i) {
		                _this.setAt(addedLength + i, previousValue);
		            });
		            return length + addedLength;
		        };
		        /**
		         * Returns the index of the first occurrence of a value in an array.
		         * @param searchElement The value to locate in the array.
		         * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
		         */
		        ArraySchema.prototype.indexOf = function (searchElement, fromIndex) {
		            return Array.from(this.$items.values()).indexOf(searchElement, fromIndex);
		        };
		        /**
		         * Returns the index of the last occurrence of a specified value in an array.
		         * @param searchElement The value to locate in the array.
		         * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at the last index in the array.
		         */
		        ArraySchema.prototype.lastIndexOf = function (searchElement, fromIndex) {
		            if (fromIndex === void 0) { fromIndex = this.length - 1; }
		            return Array.from(this.$items.values()).lastIndexOf(searchElement, fromIndex);
		        };
		        /**
		         * Determines whether all the members of an array satisfy the specified test.
		         * @param callbackfn A function that accepts up to three arguments. The every method calls
		         * the callbackfn function for each element in the array until the callbackfn returns a value
		         * which is coercible to the Boolean value false, or until the end of the array.
		         * @param thisArg An object to which the this keyword can refer in the callbackfn function.
		         * If thisArg is omitted, undefined is used as the this value.
		         */
		        ArraySchema.prototype.every = function (callbackfn, thisArg) {
		            return Array.from(this.$items.values()).every(callbackfn, thisArg);
		        };
		        /**
		         * Determines whether the specified callback function returns true for any element of an array.
		         * @param callbackfn A function that accepts up to three arguments. The some method calls
		         * the callbackfn function for each element in the array until the callbackfn returns a value
		         * which is coercible to the Boolean value true, or until the end of the array.
		         * @param thisArg An object to which the this keyword can refer in the callbackfn function.
		         * If thisArg is omitted, undefined is used as the this value.
		         */
		        ArraySchema.prototype.some = function (callbackfn, thisArg) {
		            return Array.from(this.$items.values()).some(callbackfn, thisArg);
		        };
		        /**
		         * Performs the specified action for each element in an array.
		         * @param callbackfn  A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array.
		         * @param thisArg  An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
		         */
		        ArraySchema.prototype.forEach = function (callbackfn, thisArg) {
		            Array.from(this.$items.values()).forEach(callbackfn, thisArg);
		        };
		        /**
		         * Calls a defined callback function on each element of an array, and returns an array that contains the results.
		         * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
		         * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
		         */
		        ArraySchema.prototype.map = function (callbackfn, thisArg) {
		            return Array.from(this.$items.values()).map(callbackfn, thisArg);
		        };
		        ArraySchema.prototype.filter = function (callbackfn, thisArg) {
		            return Array.from(this.$items.values()).filter(callbackfn, thisArg);
		        };
		        /**
		         * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
		         * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
		         * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
		         */
		        ArraySchema.prototype.reduce = function (callbackfn, initialValue) {
		            return Array.prototype.reduce.apply(Array.from(this.$items.values()), arguments);
		        };
		        /**
		         * Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
		         * @param callbackfn A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array.
		         * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
		         */
		        ArraySchema.prototype.reduceRight = function (callbackfn, initialValue) {
		            return Array.prototype.reduceRight.apply(Array.from(this.$items.values()), arguments);
		        };
		        /**
		         * Returns the value of the first element in the array where predicate is true, and undefined
		         * otherwise.
		         * @param predicate find calls predicate once for each element of the array, in ascending
		         * order, until it finds one where predicate returns true. If such an element is found, find
		         * immediately returns that element value. Otherwise, find returns undefined.
		         * @param thisArg If provided, it will be used as the this value for each invocation of
		         * predicate. If it is not provided, undefined is used instead.
		         */
		        ArraySchema.prototype.find = function (predicate, thisArg) {
		            return Array.from(this.$items.values()).find(predicate, thisArg);
		        };
		        /**
		         * Returns the index of the first element in the array where predicate is true, and -1
		         * otherwise.
		         * @param predicate find calls predicate once for each element of the array, in ascending
		         * order, until it finds one where predicate returns true. If such an element is found,
		         * findIndex immediately returns that element index. Otherwise, findIndex returns -1.
		         * @param thisArg If provided, it will be used as the this value for each invocation of
		         * predicate. If it is not provided, undefined is used instead.
		         */
		        ArraySchema.prototype.findIndex = function (predicate, thisArg) {
		            return Array.from(this.$items.values()).findIndex(predicate, thisArg);
		        };
		        /**
		         * Returns the this object after filling the section identified by start and end with value
		         * @param value value to fill array section with
		         * @param start index to start filling the array at. If start is negative, it is treated as
		         * length+start where length is the length of the array.
		         * @param end index to stop filling the array at. If end is negative, it is treated as
		         * length+end.
		         */
		        ArraySchema.prototype.fill = function (value, start, end) {
		            //
		            // TODO
		            //
		            throw new Error("ArraySchema#fill() not implemented");
		        };
		        /**
		         * Returns the this object after copying a section of the array identified by start and end
		         * to the same array starting at position target
		         * @param target If target is negative, it is treated as length+target where length is the
		         * length of the array.
		         * @param start If start is negative, it is treated as length+start. If end is negative, it
		         * is treated as length+end.
		         * @param end If not specified, length of the this object is used as its default value.
		         */
		        ArraySchema.prototype.copyWithin = function (target, start, end) {
		            //
		            // TODO
		            //
		            throw new Error("ArraySchema#copyWithin() not implemented");
		        };
		        /**
		         * Returns a string representation of an array.
		         */
		        ArraySchema.prototype.toString = function () { return this.$items.toString(); };
		        /**
		         * Returns a string representation of an array. The elements are converted to string using their toLocalString methods.
		         */
		        ArraySchema.prototype.toLocaleString = function () { return this.$items.toLocaleString(); };
		        /** Iterator */
		        ArraySchema.prototype[Symbol.iterator] = function () {
		            return Array.from(this.$items.values())[Symbol.iterator]();
		        };
		        Object.defineProperty(ArraySchema, Symbol.species, {
		            get: function () {
		                return ArraySchema;
		            },
		            enumerable: false,
		            configurable: true
		        });
		        /**
		         * Returns an iterable of key, value pairs for every entry in the array
		         */
		        ArraySchema.prototype.entries = function () { return this.$items.entries(); };
		        /**
		         * Returns an iterable of keys in the array
		         */
		        ArraySchema.prototype.keys = function () { return this.$items.keys(); };
		        /**
		         * Returns an iterable of values in the array
		         */
		        ArraySchema.prototype.values = function () { return this.$items.values(); };
		        /**
		         * Determines whether an array includes a certain element, returning true or false as appropriate.
		         * @param searchElement The element to search for.
		         * @param fromIndex The position in this array at which to begin searching for searchElement.
		         */
		        ArraySchema.prototype.includes = function (searchElement, fromIndex) {
		            return Array.from(this.$items.values()).includes(searchElement, fromIndex);
		        };
		        //
		        // ES2022
		        //
		        /**
		         * Calls a defined callback function on each element of an array. Then, flattens the result into
		         * a new array.
		         * This is identical to a map followed by flat with depth 1.
		         *
		         * @param callback A function that accepts up to three arguments. The flatMap method calls the
		         * callback function one time for each element in the array.
		         * @param thisArg An object to which the this keyword can refer in the callback function. If
		         * thisArg is omitted, undefined is used as the this value.
		         */
		        // @ts-ignore
		        ArraySchema.prototype.flatMap = function (callback, thisArg) {
		            // @ts-ignore
		            throw new Error("ArraySchema#flatMap() is not supported.");
		        };
		        /**
		         * Returns a new array with all sub-array elements concatenated into it recursively up to the
		         * specified depth.
		         *
		         * @param depth The maximum recursion depth
		         */
		        // @ts-ignore
		        ArraySchema.prototype.flat = function (depth) {
		            throw new Error("ArraySchema#flat() is not supported.");
		        };
		        ArraySchema.prototype.findLast = function () {
		            var arr = Array.from(this.$items.values());
		            // @ts-ignore
		            return arr.findLast.apply(arr, arguments);
		        };
		        ArraySchema.prototype.findLastIndex = function () {
		            var arr = Array.from(this.$items.values());
		            // @ts-ignore
		            return arr.findLastIndex.apply(arr, arguments);
		        };
		        //
		        // ES2023
		        //
		        ArraySchema.prototype.with = function (index, value) {
		            var copy = Array.from(this.$items.values());
		            copy[index] = value;
		            return new (ArraySchema.bind.apply(ArraySchema, __spreadArray([void 0], copy, false)))();
		        };
		        ArraySchema.prototype.toReversed = function () {
		            return Array.from(this.$items.values()).reverse();
		        };
		        ArraySchema.prototype.toSorted = function (compareFn) {
		            return Array.from(this.$items.values()).sort(compareFn);
		        };
		        // @ts-ignore
		        ArraySchema.prototype.toSpliced = function (start, deleteCount) {
		            var copy = Array.from(this.$items.values());
		            // @ts-ignore
		            return copy.toSpliced.apply(copy, arguments);
		        };
		        ArraySchema.prototype.setIndex = function (index, key) {
		            this.$indexes.set(index, key);
		        };
		        ArraySchema.prototype.getIndex = function (index) {
		            return this.$indexes.get(index);
		        };
		        ArraySchema.prototype.getByIndex = function (index) {
		            return this.$items.get(this.$indexes.get(index));
		        };
		        ArraySchema.prototype.deleteByIndex = function (index) {
		            var key = this.$indexes.get(index);
		            this.$items.delete(key);
		            this.$indexes.delete(index);
		        };
		        ArraySchema.prototype.toArray = function () {
		            return Array.from(this.$items.values());
		        };
		        ArraySchema.prototype.toJSON = function () {
		            return this.toArray().map(function (value) {
		                return (typeof (value['toJSON']) === "function")
		                    ? value['toJSON']()
		                    : value;
		            });
		        };
		        //
		        // Decoding utilities
		        //
		        ArraySchema.prototype.clone = function (isDecoding) {
		            var cloned;
		            if (isDecoding) {
		                cloned = new (ArraySchema.bind.apply(ArraySchema, __spreadArray([void 0], Array.from(this.$items.values()), false)))();
		            }
		            else {
		                cloned = new (ArraySchema.bind.apply(ArraySchema, __spreadArray([void 0], this.map(function (item) { return ((item['$changes'])
		                    ? item.clone()
		                    : item); }), false)))();
		            }
		            return cloned;
		        };
		        return ArraySchema;
		    }());

		    function getMapProxy(value) {
		        value['$proxy'] = true;
		        value = new Proxy(value, {
		            get: function (obj, prop) {
		                if (typeof (prop) !== "symbol" && // accessing properties
		                    typeof (obj[prop]) === "undefined") {
		                    return obj.get(prop);
		                }
		                else {
		                    return obj[prop];
		                }
		            },
		            set: function (obj, prop, setValue) {
		                if (typeof (prop) !== "symbol" &&
		                    (prop.indexOf("$") === -1 &&
		                        prop !== "onAdd" &&
		                        prop !== "onRemove" &&
		                        prop !== "onChange")) {
		                    obj.set(prop, setValue);
		                }
		                else {
		                    obj[prop] = setValue;
		                }
		                return true;
		            },
		            deleteProperty: function (obj, prop) {
		                obj.delete(prop);
		                return true;
		            },
		        });
		        return value;
		    }
		    var MapSchema = /** @class */ (function () {
		        function MapSchema(initialValues) {
		            var _this = this;
		            this.$changes = new ChangeTree(this);
		            this.$items = new Map();
		            this.$indexes = new Map();
		            this.$refId = 0;
		            if (initialValues) {
		                if (initialValues instanceof Map ||
		                    initialValues instanceof MapSchema) {
		                    initialValues.forEach(function (v, k) { return _this.set(k, v); });
		                }
		                else {
		                    for (var k in initialValues) {
		                        this.set(k, initialValues[k]);
		                    }
		                }
		            }
		        }
		        MapSchema.prototype.onAdd = function (callback, triggerAll) {
		            if (triggerAll === void 0) { triggerAll = true; }
		            return addCallback((this.$callbacks || (this.$callbacks = {})), exports.OPERATION.ADD, callback, (triggerAll)
		                ? this.$items
		                : undefined);
		        };
		        MapSchema.prototype.onRemove = function (callback) { return addCallback(this.$callbacks || (this.$callbacks = {}), exports.OPERATION.DELETE, callback); };
		        MapSchema.prototype.onChange = function (callback) { return addCallback(this.$callbacks || (this.$callbacks = {}), exports.OPERATION.REPLACE, callback); };
		        MapSchema.is = function (type) {
		            return type['map'] !== undefined;
		        };
		        /** Iterator */
		        MapSchema.prototype[Symbol.iterator] = function () { return this.$items[Symbol.iterator](); };
		        Object.defineProperty(MapSchema.prototype, Symbol.toStringTag, {
		            get: function () { return this.$items[Symbol.toStringTag]; },
		            enumerable: false,
		            configurable: true
		        });
		        Object.defineProperty(MapSchema, Symbol.species, {
		            get: function () {
		                return MapSchema;
		            },
		            enumerable: false,
		            configurable: true
		        });
		        MapSchema.prototype.set = function (key, value) {
		            if (value === undefined || value === null) {
		                throw new Error("MapSchema#set('".concat(key, "', ").concat(value, "): trying to set ").concat(value, " value on '").concat(key, "'."));
		            }
		            // Force "key" as string
		            // See: https://github.com/colyseus/colyseus/issues/561#issuecomment-1646733468
		            key = key.toString();
		            // get "index" for this value.
		            var hasIndex = typeof (this.$changes.indexes[key]) !== "undefined";
		            var index = (hasIndex)
		                ? this.$changes.indexes[key]
		                : this.$refId++;
		            var operation = (hasIndex)
		                ? exports.OPERATION.REPLACE
		                : exports.OPERATION.ADD;
		            var isRef = (value['$changes']) !== undefined;
		            if (isRef) {
		                value['$changes'].setParent(this, this.$changes.root, index);
		            }
		            //
		            // (encoding)
		            // set a unique id to relate directly with this key/value.
		            //
		            if (!hasIndex) {
		                this.$changes.indexes[key] = index;
		                this.$indexes.set(index, key);
		            }
		            else if (!isRef &&
		                this.$items.get(key) === value) {
		                // if value is the same, avoid re-encoding it.
		                return;
		            }
		            else if (isRef && // if is schema, force ADD operation if value differ from previous one.
		                this.$items.get(key) !== value) {
		                operation = exports.OPERATION.ADD;
		            }
		            this.$items.set(key, value);
		            this.$changes.change(key, operation);
		            return this;
		        };
		        MapSchema.prototype.get = function (key) {
		            return this.$items.get(key);
		        };
		        MapSchema.prototype.delete = function (key) {
		            //
		            // TODO: add a "purge" method after .encode() runs, to cleanup removed `$indexes`
		            //
		            // We don't remove $indexes to allow setting the same key in the same patch
		            // (See "should allow to remove and set an item in the same place" test)
		            //
		            // // const index = this.$changes.indexes[key];
		            // // this.$indexes.delete(index);
		            this.$changes.delete(key.toString());
		            return this.$items.delete(key);
		        };
		        MapSchema.prototype.clear = function (changes) {
		            // discard previous operations.
		            this.$changes.discard(true, true);
		            this.$changes.indexes = {};
		            // clear previous indexes
		            this.$indexes.clear();
		            //
		            // When decoding:
		            // - enqueue items for DELETE callback.
		            // - flag child items for garbage collection.
		            //
		            if (changes) {
		                removeChildRefs.call(this, changes);
		            }
		            // clear items
		            this.$items.clear();
		            this.$changes.operation({ index: 0, op: exports.OPERATION.CLEAR });
		            // touch all structures until reach root
		            this.$changes.touchParents();
		        };
		        MapSchema.prototype.has = function (key) {
		            return this.$items.has(key);
		        };
		        MapSchema.prototype.forEach = function (callbackfn) {
		            this.$items.forEach(callbackfn);
		        };
		        MapSchema.prototype.entries = function () {
		            return this.$items.entries();
		        };
		        MapSchema.prototype.keys = function () {
		            return this.$items.keys();
		        };
		        MapSchema.prototype.values = function () {
		            return this.$items.values();
		        };
		        Object.defineProperty(MapSchema.prototype, "size", {
		            get: function () {
		                return this.$items.size;
		            },
		            enumerable: false,
		            configurable: true
		        });
		        MapSchema.prototype.setIndex = function (index, key) {
		            this.$indexes.set(index, key);
		        };
		        MapSchema.prototype.getIndex = function (index) {
		            return this.$indexes.get(index);
		        };
		        MapSchema.prototype.getByIndex = function (index) {
		            return this.$items.get(this.$indexes.get(index));
		        };
		        MapSchema.prototype.deleteByIndex = function (index) {
		            var key = this.$indexes.get(index);
		            this.$items.delete(key);
		            this.$indexes.delete(index);
		        };
		        MapSchema.prototype.toJSON = function () {
		            var map = {};
		            this.forEach(function (value, key) {
		                map[key] = (typeof (value['toJSON']) === "function")
		                    ? value['toJSON']()
		                    : value;
		            });
		            return map;
		        };
		        //
		        // Decoding utilities
		        //
		        MapSchema.prototype.clone = function (isDecoding) {
		            var cloned;
		            if (isDecoding) {
		                // client-side
		                cloned = Object.assign(new MapSchema(), this);
		            }
		            else {
		                // server-side
		                cloned = new MapSchema();
		                this.forEach(function (value, key) {
		                    if (value['$changes']) {
		                        cloned.set(key, value['clone']());
		                    }
		                    else {
		                        cloned.set(key, value);
		                    }
		                });
		            }
		            return cloned;
		        };
		        return MapSchema;
		    }());

		    var registeredTypes = {};
		    function registerType(identifier, definition) {
		        registeredTypes[identifier] = definition;
		    }
		    function getType(identifier) {
		        return registeredTypes[identifier];
		    }

		    var SchemaDefinition = /** @class */ (function () {
		        function SchemaDefinition() {
		            //
		            // TODO: use a "field" structure combining all these properties per-field.
		            //
		            this.indexes = {};
		            this.fieldsByIndex = {};
		            this.deprecated = {};
		            this.descriptors = {};
		        }
		        SchemaDefinition.create = function (parent) {
		            var definition = new SchemaDefinition();
		            // support inheritance
		            definition.schema = Object.assign({}, parent && parent.schema || {});
		            definition.indexes = Object.assign({}, parent && parent.indexes || {});
		            definition.fieldsByIndex = Object.assign({}, parent && parent.fieldsByIndex || {});
		            definition.descriptors = Object.assign({}, parent && parent.descriptors || {});
		            definition.deprecated = Object.assign({}, parent && parent.deprecated || {});
		            return definition;
		        };
		        SchemaDefinition.prototype.addField = function (field, type) {
		            var index = this.getNextFieldIndex();
		            this.fieldsByIndex[index] = field;
		            this.indexes[field] = index;
		            this.schema[field] = (Array.isArray(type))
		                ? { array: type[0] }
		                : type;
		        };
		        SchemaDefinition.prototype.hasField = function (field) {
		            return this.indexes[field] !== undefined;
		        };
		        SchemaDefinition.prototype.addFilter = function (field, cb) {
		            if (!this.filters) {
		                this.filters = {};
		                this.indexesWithFilters = [];
		            }
		            this.filters[this.indexes[field]] = cb;
		            this.indexesWithFilters.push(this.indexes[field]);
		            return true;
		        };
		        SchemaDefinition.prototype.addChildrenFilter = function (field, cb) {
		            var index = this.indexes[field];
		            var type = this.schema[field];
		            if (getType(Object.keys(type)[0])) {
		                if (!this.childFilters) {
		                    this.childFilters = {};
		                }
		                this.childFilters[index] = cb;
		                return true;
		            }
		            else {
		                console.warn("@filterChildren: field '".concat(field, "' can't have children. Ignoring filter."));
		            }
		        };
		        SchemaDefinition.prototype.getChildrenFilter = function (field) {
		            return this.childFilters && this.childFilters[this.indexes[field]];
		        };
		        SchemaDefinition.prototype.getNextFieldIndex = function () {
		            return Object.keys(this.schema || {}).length;
		        };
		        return SchemaDefinition;
		    }());
		    function hasFilter(klass) {
		        return klass._context && klass._context.useFilters;
		    }
		    var Context = /** @class */ (function () {
		        function Context() {
		            this.types = {};
		            this.schemas = new Map();
		            this.useFilters = false;
		        }
		        Context.prototype.has = function (schema) {
		            return this.schemas.has(schema);
		        };
		        Context.prototype.get = function (typeid) {
		            return this.types[typeid];
		        };
		        Context.prototype.add = function (schema, typeid) {
		            if (typeid === void 0) { typeid = this.schemas.size; }
		            // FIXME: move this to somewhere else?
		            // support inheritance
		            schema._definition = SchemaDefinition.create(schema._definition);
		            schema._typeid = typeid;
		            this.types[typeid] = schema;
		            this.schemas.set(schema, typeid);
		        };
		        Context.create = function (options) {
		            if (options === void 0) { options = {}; }
		            return function (definition) {
		                if (!options.context) {
		                    options.context = new Context();
		                }
		                return type(definition, options);
		            };
		        };
		        return Context;
		    }());
		    var globalContext = new Context();
		    /**
		     * [See documentation](https://docs.colyseus.io/state/schema/)
		     *
		     * Annotate a Schema property to be serializeable.
		     * \@type()'d fields are automatically flagged as "dirty" for the next patch.
		     *
		     * @example Standard usage, with automatic change tracking.
		     * ```
		     * \@type("string") propertyName: string;
		     * ```
		     *
		     * @example You can provide the "manual" option if you'd like to manually control your patches via .setDirty().
		     * ```
		     * \@type("string", { manual: true })
		     * ```
		     */
		    function type(type, options) {
		        if (options === void 0) { options = {}; }
		        return function (target, field) {
		            var context = options.context || globalContext;
		            var constructor = target.constructor;
		            constructor._context = context;
		            if (!type) {
		                throw new Error("".concat(constructor.name, ": @type() reference provided for \"").concat(field, "\" is undefined. Make sure you don't have any circular dependencies."));
		            }
		            /*
		             * static schema
		             */
		            if (!context.has(constructor)) {
		                context.add(constructor);
		            }
		            var definition = constructor._definition;
		            definition.addField(field, type);
		            /**
		             * skip if descriptor already exists for this field (`@deprecated()`)
		             */
		            if (definition.descriptors[field]) {
		                if (definition.deprecated[field]) {
		                    // do not create accessors for deprecated properties.
		                    return;
		                }
		                else {
		                    // trying to define same property multiple times across inheritance.
		                    // https://github.com/colyseus/colyseus-unity3d/issues/131#issuecomment-814308572
		                    try {
		                        throw new Error("@colyseus/schema: Duplicate '".concat(field, "' definition on '").concat(constructor.name, "'.\nCheck @type() annotation"));
		                    }
		                    catch (e) {
		                        var definitionAtLine = e.stack.split("\n")[4].trim();
		                        throw new Error("".concat(e.message, " ").concat(definitionAtLine));
		                    }
		                }
		            }
		            var isArray = ArraySchema.is(type);
		            var isMap = !isArray && MapSchema.is(type);
		            // TODO: refactor me.
		            // Allow abstract intermediary classes with no fields to be serialized
		            // (See "should support an inheritance with a Schema type without fields" test)
		            if (typeof (type) !== "string" && !Schema.is(type)) {
		                var childType = Object.values(type)[0];
		                if (typeof (childType) !== "string" && !context.has(childType)) {
		                    context.add(childType);
		                }
		            }
		            if (options.manual) {
		                // do not declare getter/setter descriptor
		                definition.descriptors[field] = {
		                    enumerable: true,
		                    configurable: true,
		                    writable: true,
		                };
		                return;
		            }
		            var fieldCached = "_".concat(field);
		            definition.descriptors[fieldCached] = {
		                enumerable: false,
		                configurable: false,
		                writable: true,
		            };
		            definition.descriptors[field] = {
		                get: function () {
		                    return this[fieldCached];
		                },
		                set: function (value) {
		                    /**
		                     * Create Proxy for array or map items
		                     */
		                    // skip if value is the same as cached.
		                    if (value === this[fieldCached]) {
		                        return;
		                    }
		                    if (value !== undefined &&
		                        value !== null) {
		                        // automaticallty transform Array into ArraySchema
		                        if (isArray && !(value instanceof ArraySchema)) {
		                            value = new (ArraySchema.bind.apply(ArraySchema, __spreadArray([void 0], value, false)))();
		                        }
		                        // automaticallty transform Map into MapSchema
		                        if (isMap && !(value instanceof MapSchema)) {
		                            value = new MapSchema(value);
		                        }
		                        // try to turn provided structure into a Proxy
		                        if (value['$proxy'] === undefined) {
		                            if (isMap) {
		                                value = getMapProxy(value);
		                            }
		                            else if (isArray) {
		                                value = getArrayProxy(value);
		                            }
		                        }
		                        // flag the change for encoding.
		                        this.$changes.change(field);
		                        //
		                        // call setParent() recursively for this and its child
		                        // structures.
		                        //
		                        if (value['$changes']) {
		                            value['$changes'].setParent(this, this.$changes.root, this._definition.indexes[field]);
		                        }
		                    }
		                    else if (this[fieldCached]) {
		                        //
		                        // Setting a field to `null` or `undefined` will delete it.
		                        //
		                        this.$changes.delete(field);
		                    }
		                    this[fieldCached] = value;
		                },
		                enumerable: true,
		                configurable: true
		            };
		        };
		    }
		    /**
		     * `@filter()` decorator for defining data filters per client
		     */
		    function filter(cb) {
		        return function (target, field) {
		            var constructor = target.constructor;
		            var definition = constructor._definition;
		            if (definition.addFilter(field, cb)) {
		                constructor._context.useFilters = true;
		            }
		        };
		    }
		    function filterChildren(cb) {
		        return function (target, field) {
		            var constructor = target.constructor;
		            var definition = constructor._definition;
		            if (definition.addChildrenFilter(field, cb)) {
		                constructor._context.useFilters = true;
		            }
		        };
		    }
		    /**
		     * `@deprecated()` flag a field as deprecated.
		     * The previous `@type()` annotation should remain along with this one.
		     */
		    function deprecated(throws) {
		        if (throws === void 0) { throws = true; }
		        return function (target, field) {
		            var constructor = target.constructor;
		            var definition = constructor._definition;
		            definition.deprecated[field] = true;
		            if (throws) {
		                definition.descriptors[field] = {
		                    get: function () { throw new Error("".concat(field, " is deprecated.")); },
		                    set: function (value) { },
		                    enumerable: false,
		                    configurable: true
		                };
		            }
		        };
		    }
		    function defineTypes(target, fields, options) {
		        if (options === void 0) { options = {}; }
		        if (!options.context) {
		            options.context = target._context || options.context || globalContext;
		        }
		        for (var field in fields) {
		            type(fields[field], options)(target.prototype, field);
		        }
		        return target;
		    }

		    /**
		     * Copyright (c) 2018 Endel Dreyer
		     * Copyright (c) 2014 Ion Drive Software Ltd.
		     *
		     * Permission is hereby granted, free of charge, to any person obtaining a copy
		     * of this software and associated documentation files (the "Software"), to deal
		     * in the Software without restriction, including without limitation the rights
		     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
		     * copies of the Software, and to permit persons to whom the Software is
		     * furnished to do so, subject to the following conditions:
		     *
		     * The above copyright notice and this permission notice shall be included in all
		     * copies or substantial portions of the Software.
		     *
		     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
		     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
		     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
		     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
		     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
		     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
		     * SOFTWARE
		     */
		    /**
		     * msgpack implementation highly based on notepack.io
		     * https://github.com/darrachequesne/notepack
		     */
		    function utf8Length(str) {
		        var c = 0, length = 0;
		        for (var i = 0, l = str.length; i < l; i++) {
		            c = str.charCodeAt(i);
		            if (c < 0x80) {
		                length += 1;
		            }
		            else if (c < 0x800) {
		                length += 2;
		            }
		            else if (c < 0xd800 || c >= 0xe000) {
		                length += 3;
		            }
		            else {
		                i++;
		                length += 4;
		            }
		        }
		        return length;
		    }
		    function utf8Write(view, offset, str) {
		        var c = 0;
		        for (var i = 0, l = str.length; i < l; i++) {
		            c = str.charCodeAt(i);
		            if (c < 0x80) {
		                view[offset++] = c;
		            }
		            else if (c < 0x800) {
		                view[offset++] = 0xc0 | (c >> 6);
		                view[offset++] = 0x80 | (c & 0x3f);
		            }
		            else if (c < 0xd800 || c >= 0xe000) {
		                view[offset++] = 0xe0 | (c >> 12);
		                view[offset++] = 0x80 | (c >> 6 & 0x3f);
		                view[offset++] = 0x80 | (c & 0x3f);
		            }
		            else {
		                i++;
		                c = 0x10000 + (((c & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
		                view[offset++] = 0xf0 | (c >> 18);
		                view[offset++] = 0x80 | (c >> 12 & 0x3f);
		                view[offset++] = 0x80 | (c >> 6 & 0x3f);
		                view[offset++] = 0x80 | (c & 0x3f);
		            }
		        }
		    }
		    function int8$1(bytes, value) {
		        bytes.push(value & 255);
		    }
		    function uint8$1(bytes, value) {
		        bytes.push(value & 255);
		    }
		    function int16$1(bytes, value) {
		        bytes.push(value & 255);
		        bytes.push((value >> 8) & 255);
		    }
		    function uint16$1(bytes, value) {
		        bytes.push(value & 255);
		        bytes.push((value >> 8) & 255);
		    }
		    function int32$1(bytes, value) {
		        bytes.push(value & 255);
		        bytes.push((value >> 8) & 255);
		        bytes.push((value >> 16) & 255);
		        bytes.push((value >> 24) & 255);
		    }
		    function uint32$1(bytes, value) {
		        var b4 = value >> 24;
		        var b3 = value >> 16;
		        var b2 = value >> 8;
		        var b1 = value;
		        bytes.push(b1 & 255);
		        bytes.push(b2 & 255);
		        bytes.push(b3 & 255);
		        bytes.push(b4 & 255);
		    }
		    function int64$1(bytes, value) {
		        var high = Math.floor(value / Math.pow(2, 32));
		        var low = value >>> 0;
		        uint32$1(bytes, low);
		        uint32$1(bytes, high);
		    }
		    function uint64$1(bytes, value) {
		        var high = (value / Math.pow(2, 32)) >> 0;
		        var low = value >>> 0;
		        uint32$1(bytes, low);
		        uint32$1(bytes, high);
		    }
		    function float32$1(bytes, value) {
		        writeFloat32(bytes, value);
		    }
		    function float64$1(bytes, value) {
		        writeFloat64(bytes, value);
		    }
		    var _int32$1 = new Int32Array(2);
		    var _float32$1 = new Float32Array(_int32$1.buffer);
		    var _float64$1 = new Float64Array(_int32$1.buffer);
		    function writeFloat32(bytes, value) {
		        _float32$1[0] = value;
		        int32$1(bytes, _int32$1[0]);
		    }
		    function writeFloat64(bytes, value) {
		        _float64$1[0] = value;
		        int32$1(bytes, _int32$1[0 ]);
		        int32$1(bytes, _int32$1[1 ]);
		    }
		    function boolean$1(bytes, value) {
		        return uint8$1(bytes, value ? 1 : 0);
		    }
		    function string$1(bytes, value) {
		        // encode `null` strings as empty.
		        if (!value) {
		            value = "";
		        }
		        var length = utf8Length(value);
		        var size = 0;
		        // fixstr
		        if (length < 0x20) {
		            bytes.push(length | 0xa0);
		            size = 1;
		        }
		        // str 8
		        else if (length < 0x100) {
		            bytes.push(0xd9);
		            uint8$1(bytes, length);
		            size = 2;
		        }
		        // str 16
		        else if (length < 0x10000) {
		            bytes.push(0xda);
		            uint16$1(bytes, length);
		            size = 3;
		        }
		        // str 32
		        else if (length < 0x100000000) {
		            bytes.push(0xdb);
		            uint32$1(bytes, length);
		            size = 5;
		        }
		        else {
		            throw new Error('String too long');
		        }
		        utf8Write(bytes, bytes.length, value);
		        return size + length;
		    }
		    function number$1(bytes, value) {
		        if (isNaN(value)) {
		            return number$1(bytes, 0);
		        }
		        else if (!isFinite(value)) {
		            return number$1(bytes, (value > 0) ? Number.MAX_SAFE_INTEGER : -Number.MAX_SAFE_INTEGER);
		        }
		        else if (value !== (value | 0)) {
		            bytes.push(0xcb);
		            writeFloat64(bytes, value);
		            return 9;
		            // TODO: encode float 32?
		            // is it possible to differentiate between float32 / float64 here?
		            // // float 32
		            // bytes.push(0xca);
		            // writeFloat32(bytes, value);
		            // return 5;
		        }
		        if (value >= 0) {
		            // positive fixnum
		            if (value < 0x80) {
		                uint8$1(bytes, value);
		                return 1;
		            }
		            // uint 8
		            if (value < 0x100) {
		                bytes.push(0xcc);
		                uint8$1(bytes, value);
		                return 2;
		            }
		            // uint 16
		            if (value < 0x10000) {
		                bytes.push(0xcd);
		                uint16$1(bytes, value);
		                return 3;
		            }
		            // uint 32
		            if (value < 0x100000000) {
		                bytes.push(0xce);
		                uint32$1(bytes, value);
		                return 5;
		            }
		            // uint 64
		            bytes.push(0xcf);
		            uint64$1(bytes, value);
		            return 9;
		        }
		        else {
		            // negative fixnum
		            if (value >= -0x20) {
		                bytes.push(0xe0 | (value + 0x20));
		                return 1;
		            }
		            // int 8
		            if (value >= -0x80) {
		                bytes.push(0xd0);
		                int8$1(bytes, value);
		                return 2;
		            }
		            // int 16
		            if (value >= -0x8000) {
		                bytes.push(0xd1);
		                int16$1(bytes, value);
		                return 3;
		            }
		            // int 32
		            if (value >= -0x80000000) {
		                bytes.push(0xd2);
		                int32$1(bytes, value);
		                return 5;
		            }
		            // int 64
		            bytes.push(0xd3);
		            int64$1(bytes, value);
		            return 9;
		        }
		    }

		    var encode = /*#__PURE__*/Object.freeze({
		        __proto__: null,
		        boolean: boolean$1,
		        float32: float32$1,
		        float64: float64$1,
		        int16: int16$1,
		        int32: int32$1,
		        int64: int64$1,
		        int8: int8$1,
		        number: number$1,
		        string: string$1,
		        uint16: uint16$1,
		        uint32: uint32$1,
		        uint64: uint64$1,
		        uint8: uint8$1,
		        utf8Write: utf8Write,
		        writeFloat32: writeFloat32,
		        writeFloat64: writeFloat64
		    });

		    /**
		     * Copyright (c) 2018 Endel Dreyer
		     * Copyright (c) 2014 Ion Drive Software Ltd.
		     *
		     * Permission is hereby granted, free of charge, to any person obtaining a copy
		     * of this software and associated documentation files (the "Software"), to deal
		     * in the Software without restriction, including without limitation the rights
		     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
		     * copies of the Software, and to permit persons to whom the Software is
		     * furnished to do so, subject to the following conditions:
		     *
		     * The above copyright notice and this permission notice shall be included in all
		     * copies or substantial portions of the Software.
		     *
		     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
		     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
		     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
		     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
		     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
		     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
		     * SOFTWARE
		     */
		    function utf8Read(bytes, offset, length) {
		        var string = '', chr = 0;
		        for (var i = offset, end = offset + length; i < end; i++) {
		            var byte = bytes[i];
		            if ((byte & 0x80) === 0x00) {
		                string += String.fromCharCode(byte);
		                continue;
		            }
		            if ((byte & 0xe0) === 0xc0) {
		                string += String.fromCharCode(((byte & 0x1f) << 6) |
		                    (bytes[++i] & 0x3f));
		                continue;
		            }
		            if ((byte & 0xf0) === 0xe0) {
		                string += String.fromCharCode(((byte & 0x0f) << 12) |
		                    ((bytes[++i] & 0x3f) << 6) |
		                    ((bytes[++i] & 0x3f) << 0));
		                continue;
		            }
		            if ((byte & 0xf8) === 0xf0) {
		                chr = ((byte & 0x07) << 18) |
		                    ((bytes[++i] & 0x3f) << 12) |
		                    ((bytes[++i] & 0x3f) << 6) |
		                    ((bytes[++i] & 0x3f) << 0);
		                if (chr >= 0x010000) { // surrogate pair
		                    chr -= 0x010000;
		                    string += String.fromCharCode((chr >>> 10) + 0xD800, (chr & 0x3FF) + 0xDC00);
		                }
		                else {
		                    string += String.fromCharCode(chr);
		                }
		                continue;
		            }
		            console.error('Invalid byte ' + byte.toString(16));
		            // (do not throw error to avoid server/client from crashing due to hack attemps)
		            // throw new Error('Invalid byte ' + byte.toString(16));
		        }
		        return string;
		    }
		    function int8(bytes, it) {
		        return uint8(bytes, it) << 24 >> 24;
		    }
		    function uint8(bytes, it) {
		        return bytes[it.offset++];
		    }
		    function int16(bytes, it) {
		        return uint16(bytes, it) << 16 >> 16;
		    }
		    function uint16(bytes, it) {
		        return bytes[it.offset++] | bytes[it.offset++] << 8;
		    }
		    function int32(bytes, it) {
		        return bytes[it.offset++] | bytes[it.offset++] << 8 | bytes[it.offset++] << 16 | bytes[it.offset++] << 24;
		    }
		    function uint32(bytes, it) {
		        return int32(bytes, it) >>> 0;
		    }
		    function float32(bytes, it) {
		        return readFloat32(bytes, it);
		    }
		    function float64(bytes, it) {
		        return readFloat64(bytes, it);
		    }
		    function int64(bytes, it) {
		        var low = uint32(bytes, it);
		        var high = int32(bytes, it) * Math.pow(2, 32);
		        return high + low;
		    }
		    function uint64(bytes, it) {
		        var low = uint32(bytes, it);
		        var high = uint32(bytes, it) * Math.pow(2, 32);
		        return high + low;
		    }
		    var _int32 = new Int32Array(2);
		    var _float32 = new Float32Array(_int32.buffer);
		    var _float64 = new Float64Array(_int32.buffer);
		    function readFloat32(bytes, it) {
		        _int32[0] = int32(bytes, it);
		        return _float32[0];
		    }
		    function readFloat64(bytes, it) {
		        _int32[0 ] = int32(bytes, it);
		        _int32[1 ] = int32(bytes, it);
		        return _float64[0];
		    }
		    function boolean(bytes, it) {
		        return uint8(bytes, it) > 0;
		    }
		    function string(bytes, it) {
		        var prefix = bytes[it.offset++];
		        var length;
		        if (prefix < 0xc0) {
		            // fixstr
		            length = prefix & 0x1f;
		        }
		        else if (prefix === 0xd9) {
		            length = uint8(bytes, it);
		        }
		        else if (prefix === 0xda) {
		            length = uint16(bytes, it);
		        }
		        else if (prefix === 0xdb) {
		            length = uint32(bytes, it);
		        }
		        var value = utf8Read(bytes, it.offset, length);
		        it.offset += length;
		        return value;
		    }
		    function stringCheck(bytes, it) {
		        var prefix = bytes[it.offset];
		        return (
		        // fixstr
		        (prefix < 0xc0 && prefix > 0xa0) ||
		            // str 8
		            prefix === 0xd9 ||
		            // str 16
		            prefix === 0xda ||
		            // str 32
		            prefix === 0xdb);
		    }
		    function number(bytes, it) {
		        var prefix = bytes[it.offset++];
		        if (prefix < 0x80) {
		            // positive fixint
		            return prefix;
		        }
		        else if (prefix === 0xca) {
		            // float 32
		            return readFloat32(bytes, it);
		        }
		        else if (prefix === 0xcb) {
		            // float 64
		            return readFloat64(bytes, it);
		        }
		        else if (prefix === 0xcc) {
		            // uint 8
		            return uint8(bytes, it);
		        }
		        else if (prefix === 0xcd) {
		            // uint 16
		            return uint16(bytes, it);
		        }
		        else if (prefix === 0xce) {
		            // uint 32
		            return uint32(bytes, it);
		        }
		        else if (prefix === 0xcf) {
		            // uint 64
		            return uint64(bytes, it);
		        }
		        else if (prefix === 0xd0) {
		            // int 8
		            return int8(bytes, it);
		        }
		        else if (prefix === 0xd1) {
		            // int 16
		            return int16(bytes, it);
		        }
		        else if (prefix === 0xd2) {
		            // int 32
		            return int32(bytes, it);
		        }
		        else if (prefix === 0xd3) {
		            // int 64
		            return int64(bytes, it);
		        }
		        else if (prefix > 0xdf) {
		            // negative fixint
		            return (0xff - prefix + 1) * -1;
		        }
		    }
		    function numberCheck(bytes, it) {
		        var prefix = bytes[it.offset];
		        // positive fixint - 0x00 - 0x7f
		        // float 32        - 0xca
		        // float 64        - 0xcb
		        // uint 8          - 0xcc
		        // uint 16         - 0xcd
		        // uint 32         - 0xce
		        // uint 64         - 0xcf
		        // int 8           - 0xd0
		        // int 16          - 0xd1
		        // int 32          - 0xd2
		        // int 64          - 0xd3
		        return (prefix < 0x80 ||
		            (prefix >= 0xca && prefix <= 0xd3));
		    }
		    function arrayCheck(bytes, it) {
		        return bytes[it.offset] < 0xa0;
		        // const prefix = bytes[it.offset] ;
		        // if (prefix < 0xa0) {
		        //   return prefix;
		        // // array
		        // } else if (prefix === 0xdc) {
		        //   it.offset += 2;
		        // } else if (0xdd) {
		        //   it.offset += 4;
		        // }
		        // return prefix;
		    }
		    function switchStructureCheck(bytes, it) {
		        return (
		        // previous byte should be `SWITCH_TO_STRUCTURE`
		        bytes[it.offset - 1] === SWITCH_TO_STRUCTURE &&
		            // next byte should be a number
		            (bytes[it.offset] < 0x80 || (bytes[it.offset] >= 0xca && bytes[it.offset] <= 0xd3)));
		    }

		    var decode = /*#__PURE__*/Object.freeze({
		        __proto__: null,
		        arrayCheck: arrayCheck,
		        boolean: boolean,
		        float32: float32,
		        float64: float64,
		        int16: int16,
		        int32: int32,
		        int64: int64,
		        int8: int8,
		        number: number,
		        numberCheck: numberCheck,
		        readFloat32: readFloat32,
		        readFloat64: readFloat64,
		        string: string,
		        stringCheck: stringCheck,
		        switchStructureCheck: switchStructureCheck,
		        uint16: uint16,
		        uint32: uint32,
		        uint64: uint64,
		        uint8: uint8
		    });

		    var CollectionSchema = /** @class */ (function () {
		        function CollectionSchema(initialValues) {
		            var _this = this;
		            this.$changes = new ChangeTree(this);
		            this.$items = new Map();
		            this.$indexes = new Map();
		            this.$refId = 0;
		            if (initialValues) {
		                initialValues.forEach(function (v) { return _this.add(v); });
		            }
		        }
		        CollectionSchema.prototype.onAdd = function (callback, triggerAll) {
		            if (triggerAll === void 0) { triggerAll = true; }
		            return addCallback((this.$callbacks || (this.$callbacks = [])), exports.OPERATION.ADD, callback, (triggerAll)
		                ? this.$items
		                : undefined);
		        };
		        CollectionSchema.prototype.onRemove = function (callback) { return addCallback(this.$callbacks || (this.$callbacks = []), exports.OPERATION.DELETE, callback); };
		        CollectionSchema.prototype.onChange = function (callback) { return addCallback(this.$callbacks || (this.$callbacks = []), exports.OPERATION.REPLACE, callback); };
		        CollectionSchema.is = function (type) {
		            return type['collection'] !== undefined;
		        };
		        CollectionSchema.prototype.add = function (value) {
		            // set "index" for reference.
		            var index = this.$refId++;
		            var isRef = (value['$changes']) !== undefined;
		            if (isRef) {
		                value['$changes'].setParent(this, this.$changes.root, index);
		            }
		            this.$changes.indexes[index] = index;
		            this.$indexes.set(index, index);
		            this.$items.set(index, value);
		            this.$changes.change(index);
		            return index;
		        };
		        CollectionSchema.prototype.at = function (index) {
		            var key = Array.from(this.$items.keys())[index];
		            return this.$items.get(key);
		        };
		        CollectionSchema.prototype.entries = function () {
		            return this.$items.entries();
		        };
		        CollectionSchema.prototype.delete = function (item) {
		            var entries = this.$items.entries();
		            var index;
		            var entry;
		            while (entry = entries.next()) {
		                if (entry.done) {
		                    break;
		                }
		                if (item === entry.value[1]) {
		                    index = entry.value[0];
		                    break;
		                }
		            }
		            if (index === undefined) {
		                return false;
		            }
		            this.$changes.delete(index);
		            this.$indexes.delete(index);
		            return this.$items.delete(index);
		        };
		        CollectionSchema.prototype.clear = function (changes) {
		            // discard previous operations.
		            this.$changes.discard(true, true);
		            this.$changes.indexes = {};
		            // clear previous indexes
		            this.$indexes.clear();
		            //
		            // When decoding:
		            // - enqueue items for DELETE callback.
		            // - flag child items for garbage collection.
		            //
		            if (changes) {
		                removeChildRefs.call(this, changes);
		            }
		            // clear items
		            this.$items.clear();
		            this.$changes.operation({ index: 0, op: exports.OPERATION.CLEAR });
		            // touch all structures until reach root
		            this.$changes.touchParents();
		        };
		        CollectionSchema.prototype.has = function (value) {
		            return Array.from(this.$items.values()).some(function (v) { return v === value; });
		        };
		        CollectionSchema.prototype.forEach = function (callbackfn) {
		            var _this = this;
		            this.$items.forEach(function (value, key, _) { return callbackfn(value, key, _this); });
		        };
		        CollectionSchema.prototype.values = function () {
		            return this.$items.values();
		        };
		        Object.defineProperty(CollectionSchema.prototype, "size", {
		            get: function () {
		                return this.$items.size;
		            },
		            enumerable: false,
		            configurable: true
		        });
		        CollectionSchema.prototype.setIndex = function (index, key) {
		            this.$indexes.set(index, key);
		        };
		        CollectionSchema.prototype.getIndex = function (index) {
		            return this.$indexes.get(index);
		        };
		        CollectionSchema.prototype.getByIndex = function (index) {
		            return this.$items.get(this.$indexes.get(index));
		        };
		        CollectionSchema.prototype.deleteByIndex = function (index) {
		            var key = this.$indexes.get(index);
		            this.$items.delete(key);
		            this.$indexes.delete(index);
		        };
		        CollectionSchema.prototype.toArray = function () {
		            return Array.from(this.$items.values());
		        };
		        CollectionSchema.prototype.toJSON = function () {
		            var values = [];
		            this.forEach(function (value, key) {
		                values.push((typeof (value['toJSON']) === "function")
		                    ? value['toJSON']()
		                    : value);
		            });
		            return values;
		        };
		        //
		        // Decoding utilities
		        //
		        CollectionSchema.prototype.clone = function (isDecoding) {
		            var cloned;
		            if (isDecoding) {
		                // client-side
		                cloned = Object.assign(new CollectionSchema(), this);
		            }
		            else {
		                // server-side
		                cloned = new CollectionSchema();
		                this.forEach(function (value) {
		                    if (value['$changes']) {
		                        cloned.add(value['clone']());
		                    }
		                    else {
		                        cloned.add(value);
		                    }
		                });
		            }
		            return cloned;
		        };
		        return CollectionSchema;
		    }());

		    var SetSchema = /** @class */ (function () {
		        function SetSchema(initialValues) {
		            var _this = this;
		            this.$changes = new ChangeTree(this);
		            this.$items = new Map();
		            this.$indexes = new Map();
		            this.$refId = 0;
		            if (initialValues) {
		                initialValues.forEach(function (v) { return _this.add(v); });
		            }
		        }
		        SetSchema.prototype.onAdd = function (callback, triggerAll) {
		            if (triggerAll === void 0) { triggerAll = true; }
		            return addCallback((this.$callbacks || (this.$callbacks = [])), exports.OPERATION.ADD, callback, (triggerAll)
		                ? this.$items
		                : undefined);
		        };
		        SetSchema.prototype.onRemove = function (callback) { return addCallback(this.$callbacks || (this.$callbacks = []), exports.OPERATION.DELETE, callback); };
		        SetSchema.prototype.onChange = function (callback) { return addCallback(this.$callbacks || (this.$callbacks = []), exports.OPERATION.REPLACE, callback); };
		        SetSchema.is = function (type) {
		            return type['set'] !== undefined;
		        };
		        SetSchema.prototype.add = function (value) {
		            var _a, _b;
		            // immediatelly return false if value already added.
		            if (this.has(value)) {
		                return false;
		            }
		            // set "index" for reference.
		            var index = this.$refId++;
		            if ((value['$changes']) !== undefined) {
		                value['$changes'].setParent(this, this.$changes.root, index);
		            }
		            var operation = (_b = (_a = this.$changes.indexes[index]) === null || _a === void 0 ? void 0 : _a.op) !== null && _b !== void 0 ? _b : exports.OPERATION.ADD;
		            this.$changes.indexes[index] = index;
		            this.$indexes.set(index, index);
		            this.$items.set(index, value);
		            this.$changes.change(index, operation);
		            return index;
		        };
		        SetSchema.prototype.entries = function () {
		            return this.$items.entries();
		        };
		        SetSchema.prototype.delete = function (item) {
		            var entries = this.$items.entries();
		            var index;
		            var entry;
		            while (entry = entries.next()) {
		                if (entry.done) {
		                    break;
		                }
		                if (item === entry.value[1]) {
		                    index = entry.value[0];
		                    break;
		                }
		            }
		            if (index === undefined) {
		                return false;
		            }
		            this.$changes.delete(index);
		            this.$indexes.delete(index);
		            return this.$items.delete(index);
		        };
		        SetSchema.prototype.clear = function (changes) {
		            // discard previous operations.
		            this.$changes.discard(true, true);
		            this.$changes.indexes = {};
		            // clear previous indexes
		            this.$indexes.clear();
		            //
		            // When decoding:
		            // - enqueue items for DELETE callback.
		            // - flag child items for garbage collection.
		            //
		            if (changes) {
		                removeChildRefs.call(this, changes);
		            }
		            // clear items
		            this.$items.clear();
		            this.$changes.operation({ index: 0, op: exports.OPERATION.CLEAR });
		            // touch all structures until reach root
		            this.$changes.touchParents();
		        };
		        SetSchema.prototype.has = function (value) {
		            var values = this.$items.values();
		            var has = false;
		            var entry;
		            while (entry = values.next()) {
		                if (entry.done) {
		                    break;
		                }
		                if (value === entry.value) {
		                    has = true;
		                    break;
		                }
		            }
		            return has;
		        };
		        SetSchema.prototype.forEach = function (callbackfn) {
		            var _this = this;
		            this.$items.forEach(function (value, key, _) { return callbackfn(value, key, _this); });
		        };
		        SetSchema.prototype.values = function () {
		            return this.$items.values();
		        };
		        Object.defineProperty(SetSchema.prototype, "size", {
		            get: function () {
		                return this.$items.size;
		            },
		            enumerable: false,
		            configurable: true
		        });
		        SetSchema.prototype.setIndex = function (index, key) {
		            this.$indexes.set(index, key);
		        };
		        SetSchema.prototype.getIndex = function (index) {
		            return this.$indexes.get(index);
		        };
		        SetSchema.prototype.getByIndex = function (index) {
		            return this.$items.get(this.$indexes.get(index));
		        };
		        SetSchema.prototype.deleteByIndex = function (index) {
		            var key = this.$indexes.get(index);
		            this.$items.delete(key);
		            this.$indexes.delete(index);
		        };
		        SetSchema.prototype.toArray = function () {
		            return Array.from(this.$items.values());
		        };
		        SetSchema.prototype.toJSON = function () {
		            var values = [];
		            this.forEach(function (value, key) {
		                values.push((typeof (value['toJSON']) === "function")
		                    ? value['toJSON']()
		                    : value);
		            });
		            return values;
		        };
		        //
		        // Decoding utilities
		        //
		        SetSchema.prototype.clone = function (isDecoding) {
		            var cloned;
		            if (isDecoding) {
		                // client-side
		                cloned = Object.assign(new SetSchema(), this);
		            }
		            else {
		                // server-side
		                cloned = new SetSchema();
		                this.forEach(function (value) {
		                    if (value['$changes']) {
		                        cloned.add(value['clone']());
		                    }
		                    else {
		                        cloned.add(value);
		                    }
		                });
		            }
		            return cloned;
		        };
		        return SetSchema;
		    }());

		    var ClientState = /** @class */ (function () {
		        function ClientState() {
		            this.refIds = new WeakSet();
		            this.containerIndexes = new WeakMap();
		        }
		        // containerIndexes = new Map<ChangeTree, Set<number>>();
		        ClientState.prototype.addRefId = function (changeTree) {
		            if (!this.refIds.has(changeTree)) {
		                this.refIds.add(changeTree);
		                this.containerIndexes.set(changeTree, new Set());
		            }
		        };
		        ClientState.get = function (client) {
		            if (client.$filterState === undefined) {
		                client.$filterState = new ClientState();
		            }
		            return client.$filterState;
		        };
		        return ClientState;
		    }());

		    var ReferenceTracker = /** @class */ (function () {
		        function ReferenceTracker() {
		            //
		            // Relation of refId => Schema structure
		            // For direct access of structures during decoding time.
		            //
		            this.refs = new Map();
		            this.refCounts = {};
		            this.deletedRefs = new Set();
		            this.nextUniqueId = 0;
		        }
		        ReferenceTracker.prototype.getNextUniqueId = function () {
		            return this.nextUniqueId++;
		        };
		        // for decoding
		        ReferenceTracker.prototype.addRef = function (refId, ref, incrementCount) {
		            if (incrementCount === void 0) { incrementCount = true; }
		            this.refs.set(refId, ref);
		            if (incrementCount) {
		                this.refCounts[refId] = (this.refCounts[refId] || 0) + 1;
		            }
		        };
		        // for decoding
		        ReferenceTracker.prototype.removeRef = function (refId) {
		            var refCount = this.refCounts[refId];
		            if (refCount === undefined) {
		                console.warn("trying to remove reference ".concat(refId, " that doesn't exist"));
		                return;
		            }
		            if (refCount === 0) {
		                console.warn("trying to remove reference ".concat(refId, " with 0 refCount"));
		                return;
		            }
		            this.refCounts[refId] = refCount - 1;
		            this.deletedRefs.add(refId);
		        };
		        ReferenceTracker.prototype.clearRefs = function () {
		            this.refs.clear();
		            this.deletedRefs.clear();
		            this.refCounts = {};
		        };
		        // for decoding
		        ReferenceTracker.prototype.garbageCollectDeletedRefs = function () {
		            var _this = this;
		            this.deletedRefs.forEach(function (refId) {
		                //
		                // Skip active references.
		                //
		                if (_this.refCounts[refId] > 0) {
		                    return;
		                }
		                var ref = _this.refs.get(refId);
		                //
		                // Ensure child schema instances have their references removed as well.
		                //
		                if (ref instanceof Schema) {
		                    for (var fieldName in ref['_definition'].schema) {
		                        if (typeof (ref['_definition'].schema[fieldName]) !== "string" &&
		                            ref[fieldName] &&
		                            ref[fieldName]['$changes']) {
		                            _this.removeRef(ref[fieldName]['$changes'].refId);
		                        }
		                    }
		                }
		                else {
		                    var definition = ref['$changes'].parent._definition;
		                    var type = definition.schema[definition.fieldsByIndex[ref['$changes'].parentIndex]];
		                    if (typeof (Object.values(type)[0]) === "function") {
		                        Array.from(ref.values())
		                            .forEach(function (child) { return _this.removeRef(child['$changes'].refId); });
		                    }
		                }
		                _this.refs.delete(refId);
		                delete _this.refCounts[refId];
		            });
		            // clear deleted refs.
		            this.deletedRefs.clear();
		        };
		        return ReferenceTracker;
		    }());

		    var EncodeSchemaError = /** @class */ (function (_super) {
		        __extends(EncodeSchemaError, _super);
		        function EncodeSchemaError() {
		            return _super !== null && _super.apply(this, arguments) || this;
		        }
		        return EncodeSchemaError;
		    }(Error));
		    function assertType(value, type, klass, field) {
		        var typeofTarget;
		        var allowNull = false;
		        switch (type) {
		            case "number":
		            case "int8":
		            case "uint8":
		            case "int16":
		            case "uint16":
		            case "int32":
		            case "uint32":
		            case "int64":
		            case "uint64":
		            case "float32":
		            case "float64":
		                typeofTarget = "number";
		                if (isNaN(value)) {
		                    console.log("trying to encode \"NaN\" in ".concat(klass.constructor.name, "#").concat(field));
		                }
		                break;
		            case "string":
		                typeofTarget = "string";
		                allowNull = true;
		                break;
		            case "boolean":
		                // boolean is always encoded as true/false based on truthiness
		                return;
		        }
		        if (typeof (value) !== typeofTarget && (!allowNull || (allowNull && value !== null))) {
		            var foundValue = "'".concat(JSON.stringify(value), "'").concat((value && value.constructor && " (".concat(value.constructor.name, ")")) || '');
		            throw new EncodeSchemaError("a '".concat(typeofTarget, "' was expected, but ").concat(foundValue, " was provided in ").concat(klass.constructor.name, "#").concat(field));
		        }
		    }
		    function assertInstanceType(value, type, klass, field) {
		        if (!(value instanceof type)) {
		            throw new EncodeSchemaError("a '".concat(type.name, "' was expected, but '").concat(value.constructor.name, "' was provided in ").concat(klass.constructor.name, "#").concat(field));
		        }
		    }
		    function encodePrimitiveType(type, bytes, value, klass, field) {
		        assertType(value, type, klass, field);
		        var encodeFunc = encode[type];
		        if (encodeFunc) {
		            encodeFunc(bytes, value);
		        }
		        else {
		            throw new EncodeSchemaError("a '".concat(type, "' was expected, but ").concat(value, " was provided in ").concat(klass.constructor.name, "#").concat(field));
		        }
		    }
		    function decodePrimitiveType(type, bytes, it) {
		        return decode[type](bytes, it);
		    }
		    /**
		     * Schema encoder / decoder
		     */
		    var Schema = /** @class */ (function () {
		        // allow inherited classes to have a constructor
		        function Schema() {
		            var args = [];
		            for (var _i = 0; _i < arguments.length; _i++) {
		                args[_i] = arguments[_i];
		            }
		            // fix enumerability of fields for end-user
		            Object.defineProperties(this, {
		                $changes: {
		                    value: new ChangeTree(this, undefined, new ReferenceTracker()),
		                    enumerable: false,
		                    writable: true
		                },
		                // $listeners: {
		                //     value: undefined,
		                //     enumerable: false,
		                //     writable: true
		                // },
		                $callbacks: {
		                    value: undefined,
		                    enumerable: false,
		                    writable: true
		                },
		            });
		            var descriptors = this._definition.descriptors;
		            if (descriptors) {
		                Object.defineProperties(this, descriptors);
		            }
		            //
		            // Assign initial values
		            //
		            if (args[0]) {
		                this.assign(args[0]);
		            }
		        }
		        Schema.onError = function (e) {
		            console.error(e);
		        };
		        Schema.is = function (type) {
		            return (type['_definition'] &&
		                type['_definition'].schema !== undefined);
		        };
		        Schema.prototype.onChange = function (callback) {
		            return addCallback((this.$callbacks || (this.$callbacks = {})), exports.OPERATION.REPLACE, callback);
		        };
		        Schema.prototype.onRemove = function (callback) {
		            return addCallback((this.$callbacks || (this.$callbacks = {})), exports.OPERATION.DELETE, callback);
		        };
		        Schema.prototype.assign = function (props) {
		            Object.assign(this, props);
		            return this;
		        };
		        Object.defineProperty(Schema.prototype, "_definition", {
		            get: function () { return this.constructor._definition; },
		            enumerable: false,
		            configurable: true
		        });
		        /**
		         * (Server-side): Flag a property to be encoded for the next patch.
		         * @param instance Schema instance
		         * @param property string representing the property name, or number representing the index of the property.
		         * @param operation OPERATION to perform (detected automatically)
		         */
		        Schema.prototype.setDirty = function (property, operation) {
		            this.$changes.change(property, operation);
		        };
		        /**
		         * Client-side: listen for changes on property.
		         * @param prop the property name
		         * @param callback callback to be triggered on property change
		         * @param immediate trigger immediatelly if property has been already set.
		         */
		        Schema.prototype.listen = function (prop, callback, immediate) {
		            var _this = this;
		            if (immediate === void 0) { immediate = true; }
		            if (!this.$callbacks) {
		                this.$callbacks = {};
		            }
		            if (!this.$callbacks[prop]) {
		                this.$callbacks[prop] = [];
		            }
		            this.$callbacks[prop].push(callback);
		            if (immediate && this[prop] !== undefined) {
		                callback(this[prop], undefined);
		            }
		            // return un-register callback.
		            return function () { return spliceOne(_this.$callbacks[prop], _this.$callbacks[prop].indexOf(callback)); };
		        };
		        Schema.prototype.decode = function (bytes, it, ref) {
		            if (it === void 0) { it = { offset: 0 }; }
		            if (ref === void 0) { ref = this; }
		            var allChanges = [];
		            var $root = this.$changes.root;
		            var totalBytes = bytes.length;
		            var refId = 0;
		            $root.refs.set(refId, this);
		            while (it.offset < totalBytes) {
		                var byte = bytes[it.offset++];
		                if (byte == SWITCH_TO_STRUCTURE) {
		                    refId = number(bytes, it);
		                    var nextRef = $root.refs.get(refId);
		                    //
		                    // Trying to access a reference that haven't been decoded yet.
		                    //
		                    if (!nextRef) {
		                        throw new Error("\"refId\" not found: ".concat(refId));
		                    }
		                    ref = nextRef;
		                    continue;
		                }
		                var changeTree = ref['$changes'];
		                var isSchema = (ref['_definition'] !== undefined);
		                var operation = (isSchema)
		                    ? (byte >> 6) << 6 // "compressed" index + operation
		                    : byte; // "uncompressed" index + operation (array/map items)
		                if (operation === exports.OPERATION.CLEAR) {
		                    //
		                    // TODO: refactor me!
		                    // The `.clear()` method is calling `$root.removeRef(refId)` for
		                    // each item inside this collection
		                    //
		                    ref.clear(allChanges);
		                    continue;
		                }
		                var fieldIndex = (isSchema)
		                    ? byte % (operation || 255) // if "REPLACE" operation (0), use 255
		                    : number(bytes, it);
		                var fieldName = (isSchema)
		                    ? (ref['_definition'].fieldsByIndex[fieldIndex])
		                    : "";
		                var type = changeTree.getType(fieldIndex);
		                var value = void 0;
		                var previousValue = void 0;
		                var dynamicIndex = void 0;
		                if (!isSchema) {
		                    previousValue = ref['getByIndex'](fieldIndex);
		                    if ((operation & exports.OPERATION.ADD) === exports.OPERATION.ADD) { // ADD or DELETE_AND_ADD
		                        dynamicIndex = (ref instanceof MapSchema)
		                            ? string(bytes, it)
		                            : fieldIndex;
		                        ref['setIndex'](fieldIndex, dynamicIndex);
		                    }
		                    else {
		                        // here
		                        dynamicIndex = ref['getIndex'](fieldIndex);
		                    }
		                }
		                else {
		                    previousValue = ref["_".concat(fieldName)];
		                }
		                //
		                // Delete operations
		                //
		                if ((operation & exports.OPERATION.DELETE) === exports.OPERATION.DELETE) {
		                    if (operation !== exports.OPERATION.DELETE_AND_ADD) {
		                        ref['deleteByIndex'](fieldIndex);
		                    }
		                    // Flag `refId` for garbage collection.
		                    if (previousValue && previousValue['$changes']) {
		                        $root.removeRef(previousValue['$changes'].refId);
		                    }
		                    value = null;
		                }
		                if (fieldName === undefined) {
		                    console.warn("@colyseus/schema: definition mismatch");
		                    //
		                    // keep skipping next bytes until reaches a known structure
		                    // by local decoder.
		                    //
		                    var nextIterator = { offset: it.offset };
		                    while (it.offset < totalBytes) {
		                        if (switchStructureCheck(bytes, it)) {
		                            nextIterator.offset = it.offset + 1;
		                            if ($root.refs.has(number(bytes, nextIterator))) {
		                                break;
		                            }
		                        }
		                        it.offset++;
		                    }
		                    continue;
		                }
		                else if (operation === exports.OPERATION.DELETE) ;
		                else if (Schema.is(type)) {
		                    var refId_1 = number(bytes, it);
		                    value = $root.refs.get(refId_1);
		                    if (operation !== exports.OPERATION.REPLACE) {
		                        var childType = this.getSchemaType(bytes, it, type);
		                        if (!value) {
		                            value = this.createTypeInstance(childType);
		                            value.$changes.refId = refId_1;
		                            if (previousValue) {
		                                value.$callbacks = previousValue.$callbacks;
		                                // value.$listeners = previousValue.$listeners;
		                                if (previousValue['$changes'].refId &&
		                                    refId_1 !== previousValue['$changes'].refId) {
		                                    $root.removeRef(previousValue['$changes'].refId);
		                                }
		                            }
		                        }
		                        $root.addRef(refId_1, value, (value !== previousValue));
		                    }
		                }
		                else if (typeof (type) === "string") {
		                    //
		                    // primitive value (number, string, boolean, etc)
		                    //
		                    value = decodePrimitiveType(type, bytes, it);
		                }
		                else {
		                    var typeDef = getType(Object.keys(type)[0]);
		                    var refId_2 = number(bytes, it);
		                    var valueRef = ($root.refs.has(refId_2))
		                        ? previousValue || $root.refs.get(refId_2)
		                        : new typeDef.constructor();
		                    value = valueRef.clone(true);
		                    value.$changes.refId = refId_2;
		                    // preserve schema callbacks
		                    if (previousValue) {
		                        value['$callbacks'] = previousValue['$callbacks'];
		                        if (previousValue['$changes'].refId &&
		                            refId_2 !== previousValue['$changes'].refId) {
		                            $root.removeRef(previousValue['$changes'].refId);
		                            //
		                            // Trigger onRemove if structure has been replaced.
		                            //
		                            var entries = previousValue.entries();
		                            var iter = void 0;
		                            while ((iter = entries.next()) && !iter.done) {
		                                var _a = iter.value, key = _a[0], value_1 = _a[1];
		                                allChanges.push({
		                                    refId: refId_2,
		                                    op: exports.OPERATION.DELETE,
		                                    field: key,
		                                    value: undefined,
		                                    previousValue: value_1,
		                                });
		                            }
		                        }
		                    }
		                    $root.addRef(refId_2, value, (valueRef !== previousValue));
		                }
		                if (value !== null &&
		                    value !== undefined) {
		                    if (value['$changes']) {
		                        value['$changes'].setParent(changeTree.ref, changeTree.root, fieldIndex);
		                    }
		                    if (ref instanceof Schema) {
		                        ref[fieldName] = value;
		                        // ref[`_${fieldName}`] = value;
		                    }
		                    else if (ref instanceof MapSchema) {
		                        // const key = ref['$indexes'].get(field);
		                        var key = dynamicIndex;
		                        // ref.set(key, value);
		                        ref['$items'].set(key, value);
		                        ref['$changes'].allChanges.add(fieldIndex);
		                    }
		                    else if (ref instanceof ArraySchema) {
		                        // const key = ref['$indexes'][field];
		                        // console.log("SETTING FOR ArraySchema =>", { field, key, value });
		                        // ref[key] = value;
		                        ref.setAt(fieldIndex, value);
		                    }
		                    else if (ref instanceof CollectionSchema) {
		                        var index = ref.add(value);
		                        ref['setIndex'](fieldIndex, index);
		                    }
		                    else if (ref instanceof SetSchema) {
		                        var index = ref.add(value);
		                        if (index !== false) {
		                            ref['setIndex'](fieldIndex, index);
		                        }
		                    }
		                }
		                if (previousValue !== value) {
		                    allChanges.push({
		                        refId: refId,
		                        op: operation,
		                        field: fieldName,
		                        dynamicIndex: dynamicIndex,
		                        value: value,
		                        previousValue: previousValue,
		                    });
		                }
		            }
		            this._triggerChanges(allChanges);
		            // drop references of unused schemas
		            $root.garbageCollectDeletedRefs();
		            return allChanges;
		        };
		        Schema.prototype.encode = function (encodeAll, bytes, useFilters) {
		            if (encodeAll === void 0) { encodeAll = false; }
		            if (bytes === void 0) { bytes = []; }
		            if (useFilters === void 0) { useFilters = false; }
		            var rootChangeTree = this.$changes;
		            var refIdsVisited = new WeakSet();
		            var changeTrees = [rootChangeTree];
		            var numChangeTrees = 1;
		            for (var i = 0; i < numChangeTrees; i++) {
		                var changeTree = changeTrees[i];
		                var ref = changeTree.ref;
		                var isSchema = (ref instanceof Schema);
		                // Generate unique refId for the ChangeTree.
		                changeTree.ensureRefId();
		                // mark this ChangeTree as visited.
		                refIdsVisited.add(changeTree);
		                // root `refId` is skipped.
		                if (changeTree !== rootChangeTree &&
		                    (changeTree.changed || encodeAll)) {
		                    uint8$1(bytes, SWITCH_TO_STRUCTURE);
		                    number$1(bytes, changeTree.refId);
		                }
		                var changes = (encodeAll)
		                    ? Array.from(changeTree.allChanges)
		                    : Array.from(changeTree.changes.values());
		                for (var j = 0, cl = changes.length; j < cl; j++) {
		                    var operation = (encodeAll)
		                        ? { op: exports.OPERATION.ADD, index: changes[j] }
		                        : changes[j];
		                    var fieldIndex = operation.index;
		                    var field = (isSchema)
		                        ? ref['_definition'].fieldsByIndex && ref['_definition'].fieldsByIndex[fieldIndex]
		                        : fieldIndex;
		                    // cache begin index if `useFilters`
		                    var beginIndex = bytes.length;
		                    // encode field index + operation
		                    if (operation.op !== exports.OPERATION.TOUCH) {
		                        if (isSchema) {
		                            //
		                            // Compress `fieldIndex` + `operation` into a single byte.
		                            // This adds a limitaion of 64 fields per Schema structure
		                            //
		                            uint8$1(bytes, (fieldIndex | operation.op));
		                        }
		                        else {
		                            uint8$1(bytes, operation.op);
		                            // custom operations
		                            if (operation.op === exports.OPERATION.CLEAR) {
		                                continue;
		                            }
		                            // indexed operations
		                            number$1(bytes, fieldIndex);
		                        }
		                    }
		                    //
		                    // encode "alias" for dynamic fields (maps)
		                    //
		                    if (!isSchema &&
		                        (operation.op & exports.OPERATION.ADD) == exports.OPERATION.ADD // ADD or DELETE_AND_ADD
		                    ) {
		                        if (ref instanceof MapSchema) {
		                            //
		                            // MapSchema dynamic key
		                            //
		                            var dynamicIndex = changeTree.ref['$indexes'].get(fieldIndex);
		                            string$1(bytes, dynamicIndex);
		                        }
		                    }
		                    if (operation.op === exports.OPERATION.DELETE) {
		                        //
		                        // TODO: delete from filter cache data.
		                        //
		                        // if (useFilters) {
		                        //     delete changeTree.caches[fieldIndex];
		                        // }
		                        continue;
		                    }
		                    // const type = changeTree.childType || ref._schema[field];
		                    var type = changeTree.getType(fieldIndex);
		                    // const type = changeTree.getType(fieldIndex);
		                    var value = changeTree.getValue(fieldIndex);
		                    // Enqueue ChangeTree to be visited
		                    if (value &&
		                        value['$changes'] &&
		                        !refIdsVisited.has(value['$changes'])) {
		                        changeTrees.push(value['$changes']);
		                        value['$changes'].ensureRefId();
		                        numChangeTrees++;
		                    }
		                    if (operation.op === exports.OPERATION.TOUCH) {
		                        continue;
		                    }
		                    if (Schema.is(type)) {
		                        assertInstanceType(value, type, ref, field);
		                        //
		                        // Encode refId for this instance.
		                        // The actual instance is going to be encoded on next `changeTree` iteration.
		                        //
		                        number$1(bytes, value.$changes.refId);
		                        // Try to encode inherited TYPE_ID if it's an ADD operation.
		                        if ((operation.op & exports.OPERATION.ADD) === exports.OPERATION.ADD) {
		                            this.tryEncodeTypeId(bytes, type, value.constructor);
		                        }
		                    }
		                    else if (typeof (type) === "string") {
		                        //
		                        // Primitive values
		                        //
		                        encodePrimitiveType(type, bytes, value, ref, field);
		                    }
		                    else {
		                        //
		                        // Custom type (MapSchema, ArraySchema, etc)
		                        //
		                        var definition = getType(Object.keys(type)[0]);
		                        //
		                        // ensure a ArraySchema has been provided
		                        //
		                        assertInstanceType(ref["_".concat(field)], definition.constructor, ref, field);
		                        //
		                        // Encode refId for this instance.
		                        // The actual instance is going to be encoded on next `changeTree` iteration.
		                        //
		                        number$1(bytes, value.$changes.refId);
		                    }
		                    if (useFilters) {
		                        // cache begin / end index
		                        changeTree.cache(fieldIndex, bytes.slice(beginIndex));
		                    }
		                }
		                if (!encodeAll && !useFilters) {
		                    changeTree.discard();
		                }
		            }
		            return bytes;
		        };
		        Schema.prototype.encodeAll = function (useFilters) {
		            return this.encode(true, [], useFilters);
		        };
		        Schema.prototype.applyFilters = function (client, encodeAll) {
		            var _a, _b;
		            if (encodeAll === void 0) { encodeAll = false; }
		            var root = this;
		            var refIdsDissallowed = new Set();
		            var $filterState = ClientState.get(client);
		            var changeTrees = [this.$changes];
		            var numChangeTrees = 1;
		            var filteredBytes = [];
		            var _loop_1 = function (i) {
		                var changeTree = changeTrees[i];
		                if (refIdsDissallowed.has(changeTree.refId)) {
		                    return "continue";
		                }
		                var ref = changeTree.ref;
		                var isSchema = ref instanceof Schema;
		                uint8$1(filteredBytes, SWITCH_TO_STRUCTURE);
		                number$1(filteredBytes, changeTree.refId);
		                var clientHasRefId = $filterState.refIds.has(changeTree);
		                var isEncodeAll = (encodeAll || !clientHasRefId);
		                // console.log("REF:", ref.constructor.name);
		                // console.log("Encode all?", isEncodeAll);
		                //
		                // include `changeTree` on list of known refIds by this client.
		                //
		                $filterState.addRefId(changeTree);
		                var containerIndexes = $filterState.containerIndexes.get(changeTree);
		                var changes = (isEncodeAll)
		                    ? Array.from(changeTree.allChanges)
		                    : Array.from(changeTree.changes.values());
		                //
		                // WORKAROUND: tries to re-evaluate previously not included @filter() attributes
		                // - see "DELETE a field of Schema" test case.
		                //
		                if (!encodeAll &&
		                    isSchema &&
		                    ref._definition.indexesWithFilters) {
		                    var indexesWithFilters = ref._definition.indexesWithFilters;
		                    indexesWithFilters.forEach(function (indexWithFilter) {
		                        if (!containerIndexes.has(indexWithFilter) &&
		                            changeTree.allChanges.has(indexWithFilter)) {
		                            if (isEncodeAll) {
		                                changes.push(indexWithFilter);
		                            }
		                            else {
		                                changes.push({ op: exports.OPERATION.ADD, index: indexWithFilter, });
		                            }
		                        }
		                    });
		                }
		                for (var j = 0, cl = changes.length; j < cl; j++) {
		                    var change = (isEncodeAll)
		                        ? { op: exports.OPERATION.ADD, index: changes[j] }
		                        : changes[j];
		                    // custom operations
		                    if (change.op === exports.OPERATION.CLEAR) {
		                        uint8$1(filteredBytes, change.op);
		                        continue;
		                    }
		                    var fieldIndex = change.index;
		                    //
		                    // Deleting fields: encode the operation + field index
		                    //
		                    if (change.op === exports.OPERATION.DELETE) {
		                        //
		                        // DELETE operations also need to go through filtering.
		                        //
		                        // TODO: cache the previous value so we can access the value (primitive or `refId`)
		                        // (check against `$filterState.refIds`)
		                        //
		                        if (isSchema) {
		                            uint8$1(filteredBytes, change.op | fieldIndex);
		                        }
		                        else {
		                            uint8$1(filteredBytes, change.op);
		                            number$1(filteredBytes, fieldIndex);
		                        }
		                        continue;
		                    }
		                    // indexed operation
		                    var value = changeTree.getValue(fieldIndex);
		                    var type = changeTree.getType(fieldIndex);
		                    if (isSchema) {
		                        // Is a Schema!
		                        var filter = (ref._definition.filters &&
		                            ref._definition.filters[fieldIndex]);
		                        if (filter && !filter.call(ref, client, value, root)) {
		                            if (value && value['$changes']) {
		                                refIdsDissallowed.add(value['$changes'].refId);
		                            }
		                            continue;
		                        }
		                    }
		                    else {
		                        // Is a collection! (map, array, etc.)
		                        var parent = changeTree.parent;
		                        var filter = changeTree.getChildrenFilter();
		                        if (filter && !filter.call(parent, client, ref['$indexes'].get(fieldIndex), value, root)) {
		                            if (value && value['$changes']) {
		                                refIdsDissallowed.add(value['$changes'].refId);
		                            }
		                            continue;
		                        }
		                    }
		                    // visit child ChangeTree on further iteration.
		                    if (value['$changes']) {
		                        changeTrees.push(value['$changes']);
		                        numChangeTrees++;
		                    }
		                    //
		                    // Copy cached bytes
		                    //
		                    if (change.op !== exports.OPERATION.TOUCH) {
		                        //
		                        // TODO: refactor me!
		                        //
		                        if (change.op === exports.OPERATION.ADD || isSchema) {
		                            //
		                            // use cached bytes directly if is from Schema type.
		                            //
		                            filteredBytes.push.apply(filteredBytes, (_a = changeTree.caches[fieldIndex]) !== null && _a !== void 0 ? _a : []);
		                            containerIndexes.add(fieldIndex);
		                        }
		                        else {
		                            if (containerIndexes.has(fieldIndex)) {
		                                //
		                                // use cached bytes if already has the field
		                                //
		                                filteredBytes.push.apply(filteredBytes, (_b = changeTree.caches[fieldIndex]) !== null && _b !== void 0 ? _b : []);
		                            }
		                            else {
		                                //
		                                // force ADD operation if field is not known by this client.
		                                //
		                                containerIndexes.add(fieldIndex);
		                                uint8$1(filteredBytes, exports.OPERATION.ADD);
		                                number$1(filteredBytes, fieldIndex);
		                                if (ref instanceof MapSchema) {
		                                    //
		                                    // MapSchema dynamic key
		                                    //
		                                    var dynamicIndex = changeTree.ref['$indexes'].get(fieldIndex);
		                                    string$1(filteredBytes, dynamicIndex);
		                                }
		                                if (value['$changes']) {
		                                    number$1(filteredBytes, value['$changes'].refId);
		                                }
		                                else {
		                                    // "encodePrimitiveType" without type checking.
		                                    // the type checking has been done on the first .encode() call.
		                                    encode[type](filteredBytes, value);
		                                }
		                            }
		                        }
		                    }
		                    else if (value['$changes'] && !isSchema) {
		                        //
		                        // TODO:
		                        // - track ADD/REPLACE/DELETE instances on `$filterState`
		                        // - do NOT always encode dynamicIndex for MapSchema.
		                        //   (If client already has that key, only the first index is necessary.)
		                        //
		                        uint8$1(filteredBytes, exports.OPERATION.ADD);
		                        number$1(filteredBytes, fieldIndex);
		                        if (ref instanceof MapSchema) {
		                            //
		                            // MapSchema dynamic key
		                            //
		                            var dynamicIndex = changeTree.ref['$indexes'].get(fieldIndex);
		                            string$1(filteredBytes, dynamicIndex);
		                        }
		                        number$1(filteredBytes, value['$changes'].refId);
		                    }
		                }
		            };
		            for (var i = 0; i < numChangeTrees; i++) {
		                _loop_1(i);
		            }
		            return filteredBytes;
		        };
		        Schema.prototype.clone = function () {
		            var _a;
		            var cloned = new (this.constructor);
		            var schema = this._definition.schema;
		            for (var field in schema) {
		                if (typeof (this[field]) === "object" &&
		                    typeof ((_a = this[field]) === null || _a === void 0 ? void 0 : _a.clone) === "function") {
		                    // deep clone
		                    cloned[field] = this[field].clone();
		                }
		                else {
		                    // primitive values
		                    cloned[field] = this[field];
		                }
		            }
		            return cloned;
		        };
		        Schema.prototype.toJSON = function () {
		            var schema = this._definition.schema;
		            var deprecated = this._definition.deprecated;
		            var obj = {};
		            for (var field in schema) {
		                if (!deprecated[field] && this[field] !== null && typeof (this[field]) !== "undefined") {
		                    obj[field] = (typeof (this[field]['toJSON']) === "function")
		                        ? this[field]['toJSON']()
		                        : this["_".concat(field)];
		                }
		            }
		            return obj;
		        };
		        Schema.prototype.discardAllChanges = function () {
		            this.$changes.discardAll();
		        };
		        Schema.prototype.getByIndex = function (index) {
		            return this[this._definition.fieldsByIndex[index]];
		        };
		        Schema.prototype.deleteByIndex = function (index) {
		            this[this._definition.fieldsByIndex[index]] = undefined;
		        };
		        Schema.prototype.tryEncodeTypeId = function (bytes, type, targetType) {
		            if (type._typeid !== targetType._typeid) {
		                uint8$1(bytes, TYPE_ID);
		                number$1(bytes, targetType._typeid);
		            }
		        };
		        Schema.prototype.getSchemaType = function (bytes, it, defaultType) {
		            var type;
		            if (bytes[it.offset] === TYPE_ID) {
		                it.offset++;
		                type = this.constructor._context.get(number(bytes, it));
		            }
		            return type || defaultType;
		        };
		        Schema.prototype.createTypeInstance = function (type) {
		            var instance = new type();
		            // assign root on $changes
		            instance.$changes.root = this.$changes.root;
		            return instance;
		        };
		        Schema.prototype._triggerChanges = function (changes) {
		            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
		            var uniqueRefIds = new Set();
		            var $refs = this.$changes.root.refs;
		            var _loop_2 = function (i) {
		                var change = changes[i];
		                var refId = change.refId;
		                var ref = $refs.get(refId);
		                var $callbacks = ref['$callbacks'];
		                //
		                // trigger onRemove on child structure.
		                //
		                if ((change.op & exports.OPERATION.DELETE) === exports.OPERATION.DELETE &&
		                    change.previousValue instanceof Schema) {
		                    (_b = (_a = change.previousValue['$callbacks']) === null || _a === void 0 ? void 0 : _a[exports.OPERATION.DELETE]) === null || _b === void 0 ? void 0 : _b.forEach(function (callback) { return callback(); });
		                }
		                // no callbacks defined, skip this structure!
		                if (!$callbacks) {
		                    return "continue";
		                }
		                if (ref instanceof Schema) {
		                    if (!uniqueRefIds.has(refId)) {
		                        try {
		                            // trigger onChange
		                            (_c = $callbacks === null || $callbacks === void 0 ? void 0 : $callbacks[exports.OPERATION.REPLACE]) === null || _c === void 0 ? void 0 : _c.forEach(function (callback) {
		                                return callback();
		                            });
		                        }
		                        catch (e) {
		                            Schema.onError(e);
		                        }
		                    }
		                    try {
		                        if ($callbacks.hasOwnProperty(change.field)) {
		                            (_d = $callbacks[change.field]) === null || _d === void 0 ? void 0 : _d.forEach(function (callback) {
		                                return callback(change.value, change.previousValue);
		                            });
		                        }
		                    }
		                    catch (e) {
		                        Schema.onError(e);
		                    }
		                }
		                else {
		                    // is a collection of items
		                    if (change.op === exports.OPERATION.ADD && change.previousValue === undefined) {
		                        // triger onAdd
		                        (_e = $callbacks[exports.OPERATION.ADD]) === null || _e === void 0 ? void 0 : _e.forEach(function (callback) { var _a; return callback(change.value, (_a = change.dynamicIndex) !== null && _a !== void 0 ? _a : change.field); });
		                    }
		                    else if (change.op === exports.OPERATION.DELETE) {
		                        //
		                        // FIXME: `previousValue` should always be available.
		                        // ADD + DELETE operations are still encoding DELETE operation.
		                        //
		                        if (change.previousValue !== undefined) {
		                            // triger onRemove
		                            (_f = $callbacks[exports.OPERATION.DELETE]) === null || _f === void 0 ? void 0 : _f.forEach(function (callback) { var _a; return callback(change.previousValue, (_a = change.dynamicIndex) !== null && _a !== void 0 ? _a : change.field); });
		                        }
		                    }
		                    else if (change.op === exports.OPERATION.DELETE_AND_ADD) {
		                        // triger onRemove
		                        if (change.previousValue !== undefined) {
		                            (_g = $callbacks[exports.OPERATION.DELETE]) === null || _g === void 0 ? void 0 : _g.forEach(function (callback) { var _a; return callback(change.previousValue, (_a = change.dynamicIndex) !== null && _a !== void 0 ? _a : change.field); });
		                        }
		                        // triger onAdd
		                        (_h = $callbacks[exports.OPERATION.ADD]) === null || _h === void 0 ? void 0 : _h.forEach(function (callback) { var _a; return callback(change.value, (_a = change.dynamicIndex) !== null && _a !== void 0 ? _a : change.field); });
		                    }
		                    // trigger onChange
		                    if (change.value !== change.previousValue) {
		                        (_j = $callbacks[exports.OPERATION.REPLACE]) === null || _j === void 0 ? void 0 : _j.forEach(function (callback) { var _a; return callback(change.value, (_a = change.dynamicIndex) !== null && _a !== void 0 ? _a : change.field); });
		                    }
		                }
		                uniqueRefIds.add(refId);
		            };
		            for (var i = 0; i < changes.length; i++) {
		                _loop_2(i);
		            }
		        };
		        Schema._definition = SchemaDefinition.create();
		        return Schema;
		    }());

		    function dumpChanges(schema) {
		        var changeTrees = [schema['$changes']];
		        var numChangeTrees = 1;
		        var dump = {};
		        var currentStructure = dump;
		        var _loop_1 = function (i) {
		            var changeTree = changeTrees[i];
		            changeTree.changes.forEach(function (change) {
		                var ref = changeTree.ref;
		                var fieldIndex = change.index;
		                var field = (ref['_definition'])
		                    ? ref['_definition'].fieldsByIndex[fieldIndex]
		                    : ref['$indexes'].get(fieldIndex);
		                currentStructure[field] = changeTree.getValue(fieldIndex);
		            });
		        };
		        for (var i = 0; i < numChangeTrees; i++) {
		            _loop_1(i);
		        }
		        return dump;
		    }

		    var reflectionContext = { context: new Context() };
		    /**
		     * Reflection
		     */
		    var ReflectionField = /** @class */ (function (_super) {
		        __extends(ReflectionField, _super);
		        function ReflectionField() {
		            return _super !== null && _super.apply(this, arguments) || this;
		        }
		        __decorate([
		            type("string", reflectionContext)
		        ], ReflectionField.prototype, "name", void 0);
		        __decorate([
		            type("string", reflectionContext)
		        ], ReflectionField.prototype, "type", void 0);
		        __decorate([
		            type("number", reflectionContext)
		        ], ReflectionField.prototype, "referencedType", void 0);
		        return ReflectionField;
		    }(Schema));
		    var ReflectionType = /** @class */ (function (_super) {
		        __extends(ReflectionType, _super);
		        function ReflectionType() {
		            var _this = _super !== null && _super.apply(this, arguments) || this;
		            _this.fields = new ArraySchema();
		            return _this;
		        }
		        __decorate([
		            type("number", reflectionContext)
		        ], ReflectionType.prototype, "id", void 0);
		        __decorate([
		            type([ReflectionField], reflectionContext)
		        ], ReflectionType.prototype, "fields", void 0);
		        return ReflectionType;
		    }(Schema));
		    var Reflection = /** @class */ (function (_super) {
		        __extends(Reflection, _super);
		        function Reflection() {
		            var _this = _super !== null && _super.apply(this, arguments) || this;
		            _this.types = new ArraySchema();
		            return _this;
		        }
		        Reflection.encode = function (instance) {
		            var _a;
		            var rootSchemaType = instance.constructor;
		            var reflection = new Reflection();
		            reflection.rootType = rootSchemaType._typeid;
		            var buildType = function (currentType, schema) {
		                for (var fieldName in schema) {
		                    var field = new ReflectionField();
		                    field.name = fieldName;
		                    var fieldType = void 0;
		                    if (typeof (schema[fieldName]) === "string") {
		                        fieldType = schema[fieldName];
		                    }
		                    else {
		                        var type_1 = schema[fieldName];
		                        var childTypeSchema = void 0;
		                        //
		                        // TODO: refactor below.
		                        //
		                        if (Schema.is(type_1)) {
		                            fieldType = "ref";
		                            childTypeSchema = schema[fieldName];
		                        }
		                        else {
		                            fieldType = Object.keys(type_1)[0];
		                            if (typeof (type_1[fieldType]) === "string") {
		                                fieldType += ":" + type_1[fieldType]; // array:string
		                            }
		                            else {
		                                childTypeSchema = type_1[fieldType];
		                            }
		                        }
		                        field.referencedType = (childTypeSchema)
		                            ? childTypeSchema._typeid
		                            : -1;
		                    }
		                    field.type = fieldType;
		                    currentType.fields.push(field);
		                }
		                reflection.types.push(currentType);
		            };
		            var types = (_a = rootSchemaType._context) === null || _a === void 0 ? void 0 : _a.types;
		            for (var typeid in types) {
		                var type_2 = new ReflectionType();
		                type_2.id = Number(typeid);
		                buildType(type_2, types[typeid]._definition.schema);
		            }
		            return reflection.encodeAll();
		        };
		        Reflection.decode = function (bytes, it) {
		            var context = new Context();
		            var reflection = new Reflection();
		            reflection.decode(bytes, it);
		            var schemaTypes = reflection.types.reduce(function (types, reflectionType) {
		                var schema = /** @class */ (function (_super) {
		                    __extends(_, _super);
		                    function _() {
		                        return _super !== null && _super.apply(this, arguments) || this;
		                    }
		                    return _;
		                }(Schema));
		                var typeid = reflectionType.id;
		                types[typeid] = schema;
		                context.add(schema, typeid);
		                return types;
		            }, {});
		            reflection.types.forEach(function (reflectionType) {
		                var schemaType = schemaTypes[reflectionType.id];
		                reflectionType.fields.forEach(function (field) {
		                    var _a;
		                    if (field.referencedType !== undefined) {
		                        var fieldType = field.type;
		                        var refType = schemaTypes[field.referencedType];
		                        // map or array of primitive type (-1)
		                        if (!refType) {
		                            var typeInfo = field.type.split(":");
		                            fieldType = typeInfo[0];
		                            refType = typeInfo[1];
		                        }
		                        if (fieldType === "ref") {
		                            type(refType, { context: context })(schemaType.prototype, field.name);
		                        }
		                        else {
		                            type((_a = {}, _a[fieldType] = refType, _a), { context: context })(schemaType.prototype, field.name);
		                        }
		                    }
		                    else {
		                        type(field.type, { context: context })(schemaType.prototype, field.name);
		                    }
		                });
		            });
		            var rootType = schemaTypes[reflection.rootType];
		            var rootInstance = new rootType();
		            /**
		             * auto-initialize referenced types on root type
		             * to allow registering listeners immediatelly on client-side
		             */
		            for (var fieldName in rootType._definition.schema) {
		                var fieldType = rootType._definition.schema[fieldName];
		                if (typeof (fieldType) !== "string") {
		                    rootInstance[fieldName] = (typeof (fieldType) === "function")
		                        ? new fieldType() // is a schema reference
		                        : new (getType(Object.keys(fieldType)[0])).constructor(); // is a "collection"
		                }
		            }
		            return rootInstance;
		        };
		        __decorate([
		            type([ReflectionType], reflectionContext)
		        ], Reflection.prototype, "types", void 0);
		        __decorate([
		            type("number", reflectionContext)
		        ], Reflection.prototype, "rootType", void 0);
		        return Reflection;
		    }(Schema));

		    registerType("map", { constructor: MapSchema });
		    registerType("array", { constructor: ArraySchema });
		    registerType("set", { constructor: SetSchema });
		    registerType("collection", { constructor: CollectionSchema, });

		    exports.ArraySchema = ArraySchema;
		    exports.CollectionSchema = CollectionSchema;
		    exports.Context = Context;
		    exports.MapSchema = MapSchema;
		    exports.Reflection = Reflection;
		    exports.ReflectionField = ReflectionField;
		    exports.ReflectionType = ReflectionType;
		    exports.Schema = Schema;
		    exports.SchemaDefinition = SchemaDefinition;
		    exports.SetSchema = SetSchema;
		    exports.decode = decode;
		    exports.defineTypes = defineTypes;
		    exports.deprecated = deprecated;
		    exports.dumpChanges = dumpChanges;
		    exports.encode = encode;
		    exports.filter = filter;
		    exports.filterChildren = filterChildren;
		    exports.hasFilter = hasFilter;
		    exports.registerType = registerType;
		    exports.type = type;

		}));
	} (umd, umd.exports));

	var __createBinding$1 = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault$1 = (commonjsGlobal && commonjsGlobal.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar$1 = (commonjsGlobal && commonjsGlobal.__importStar) || function (mod) {
	    if (mod && mod.__esModule) return mod;
	    var result = {};
	    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding$1(result, mod, k);
	    __setModuleDefault$1(result, mod);
	    return result;
	};
	Object.defineProperty(Room$1, "__esModule", { value: true });
	Room$1.Room = void 0;
	const msgpack = __importStar$1(msgpack$1);
	const Connection_1 = Connection$1;
	const Protocol_1 = Protocol;
	const Serializer_1 = Serializer;
	// The unused imports here are important for better `.d.ts` file generation
	// (Later merged with `dts-bundle-generator`)
	const nanoevents_1$1 = nanoevents;
	const signal_1 = signal;
	const schema_1$1 = umd.exports;
	const ServerError_1$2 = ServerError;
	class Room {
	    constructor(name, rootSchema) {
	        // Public signals
	        this.onStateChange = (0, signal_1.createSignal)();
	        this.onError = (0, signal_1.createSignal)();
	        this.onLeave = (0, signal_1.createSignal)();
	        this.onJoin = (0, signal_1.createSignal)();
	        this.hasJoined = false;
	        this.onMessageHandlers = (0, nanoevents_1$1.createNanoEvents)();
	        this.roomId = null;
	        this.name = name;
	        if (rootSchema) {
	            this.serializer = new ((0, Serializer_1.getSerializer)("schema"));
	            this.rootSchema = rootSchema;
	            this.serializer.state = new rootSchema();
	        }
	        this.onError((code, message) => { var _a; return (_a = console.warn) === null || _a === void 0 ? void 0 : _a.call(console, `colyseus.js - onError => (${code}) ${message}`); });
	        this.onLeave(() => this.removeAllListeners());
	    }
	    // TODO: deprecate me on version 1.0
	    get id() { return this.roomId; }
	    connect(endpoint, devModeCloseCallback, room = this // when reconnecting on devMode, re-use previous room intance for handling events.
	    ) {
	        const connection = new Connection_1.Connection();
	        room.connection = connection;
	        connection.events.onmessage = Room.prototype.onMessageCallback.bind(room);
	        connection.events.onclose = function (e) {
	            var _a;
	            if (!room.hasJoined) {
	                (_a = console.warn) === null || _a === void 0 ? void 0 : _a.call(console, `Room connection was closed unexpectedly (${e.code}): ${e.reason}`);
	                room.onError.invoke(e.code, e.reason);
	                return;
	            }
	            if (e.code === ServerError_1$2.CloseCode.DEVMODE_RESTART && devModeCloseCallback) {
	                devModeCloseCallback();
	            }
	            else {
	                room.onLeave.invoke(e.code);
	                room.destroy();
	            }
	        };
	        connection.events.onerror = function (e) {
	            var _a;
	            (_a = console.warn) === null || _a === void 0 ? void 0 : _a.call(console, `Room, onError (${e.code}): ${e.reason}`);
	            room.onError.invoke(e.code, e.reason);
	        };
	        connection.connect(endpoint);
	    }
	    leave(consented = true) {
	        return new Promise((resolve) => {
	            this.onLeave((code) => resolve(code));
	            if (this.connection) {
	                if (consented) {
	                    this.connection.send([Protocol_1.Protocol.LEAVE_ROOM]);
	                }
	                else {
	                    this.connection.close();
	                }
	            }
	            else {
	                this.onLeave.invoke(ServerError_1$2.CloseCode.CONSENTED);
	            }
	        });
	    }
	    onMessage(type, callback) {
	        return this.onMessageHandlers.on(this.getMessageHandlerKey(type), callback);
	    }
	    send(type, message) {
	        const initialBytes = [Protocol_1.Protocol.ROOM_DATA];
	        if (typeof (type) === "string") {
	            schema_1$1.encode.string(initialBytes, type);
	        }
	        else {
	            schema_1$1.encode.number(initialBytes, type);
	        }
	        let arr;
	        if (message !== undefined) {
	            const encoded = msgpack.encode(message);
	            arr = new Uint8Array(initialBytes.length + encoded.byteLength);
	            arr.set(new Uint8Array(initialBytes), 0);
	            arr.set(new Uint8Array(encoded), initialBytes.length);
	        }
	        else {
	            arr = new Uint8Array(initialBytes);
	        }
	        this.connection.send(arr.buffer);
	    }
	    sendBytes(type, bytes) {
	        const initialBytes = [Protocol_1.Protocol.ROOM_DATA_BYTES];
	        if (typeof (type) === "string") {
	            schema_1$1.encode.string(initialBytes, type);
	        }
	        else {
	            schema_1$1.encode.number(initialBytes, type);
	        }
	        let arr;
	        arr = new Uint8Array(initialBytes.length + (bytes.byteLength || bytes.length));
	        arr.set(new Uint8Array(initialBytes), 0);
	        arr.set(new Uint8Array(bytes), initialBytes.length);
	        this.connection.send(arr.buffer);
	    }
	    get state() {
	        return this.serializer.getState();
	    }
	    removeAllListeners() {
	        this.onJoin.clear();
	        this.onStateChange.clear();
	        this.onError.clear();
	        this.onLeave.clear();
	        this.onMessageHandlers.events = {};
	    }
	    onMessageCallback(event) {
	        const bytes = Array.from(new Uint8Array(event.data));
	        const code = bytes[0];
	        if (code === Protocol_1.Protocol.JOIN_ROOM) {
	            let offset = 1;
	            const reconnectionToken = (0, Protocol_1.utf8Read)(bytes, offset);
	            offset += (0, Protocol_1.utf8Length)(reconnectionToken);
	            this.serializerId = (0, Protocol_1.utf8Read)(bytes, offset);
	            offset += (0, Protocol_1.utf8Length)(this.serializerId);
	            // Instantiate serializer if not locally available.
	            if (!this.serializer) {
	                const serializer = (0, Serializer_1.getSerializer)(this.serializerId);
	                this.serializer = new serializer();
	            }
	            if (bytes.length > offset && this.serializer.handshake) {
	                this.serializer.handshake(bytes, { offset });
	            }
	            this.reconnectionToken = `${this.roomId}:${reconnectionToken}`;
	            this.hasJoined = true;
	            this.onJoin.invoke();
	            // acknowledge successfull JOIN_ROOM
	            this.connection.send([Protocol_1.Protocol.JOIN_ROOM]);
	        }
	        else if (code === Protocol_1.Protocol.ERROR) {
	            const it = { offset: 1 };
	            const code = schema_1$1.decode.number(bytes, it);
	            const message = schema_1$1.decode.string(bytes, it);
	            this.onError.invoke(code, message);
	        }
	        else if (code === Protocol_1.Protocol.LEAVE_ROOM) {
	            this.leave();
	        }
	        else if (code === Protocol_1.Protocol.ROOM_DATA_SCHEMA) {
	            const it = { offset: 1 };
	            const context = this.serializer.getState().constructor._context;
	            const type = context.get(schema_1$1.decode.number(bytes, it));
	            const message = new type();
	            message.decode(bytes, it);
	            this.dispatchMessage(type, message);
	        }
	        else if (code === Protocol_1.Protocol.ROOM_STATE) {
	            bytes.shift(); // drop `code` byte
	            this.setState(bytes);
	        }
	        else if (code === Protocol_1.Protocol.ROOM_STATE_PATCH) {
	            bytes.shift(); // drop `code` byte
	            this.patch(bytes);
	        }
	        else if (code === Protocol_1.Protocol.ROOM_DATA) {
	            const it = { offset: 1 };
	            const type = (schema_1$1.decode.stringCheck(bytes, it))
	                ? schema_1$1.decode.string(bytes, it)
	                : schema_1$1.decode.number(bytes, it);
	            const message = (bytes.length > it.offset)
	                ? msgpack.decode(event.data, it.offset)
	                : undefined;
	            this.dispatchMessage(type, message);
	        }
	        else if (code === Protocol_1.Protocol.ROOM_DATA_BYTES) {
	            const it = { offset: 1 };
	            const type = (schema_1$1.decode.stringCheck(bytes, it))
	                ? schema_1$1.decode.string(bytes, it)
	                : schema_1$1.decode.number(bytes, it);
	            this.dispatchMessage(type, new Uint8Array(bytes.slice(it.offset)));
	        }
	    }
	    setState(encodedState) {
	        this.serializer.setState(encodedState);
	        this.onStateChange.invoke(this.serializer.getState());
	    }
	    patch(binaryPatch) {
	        this.serializer.patch(binaryPatch);
	        this.onStateChange.invoke(this.serializer.getState());
	    }
	    dispatchMessage(type, message) {
	        var _a;
	        const messageType = this.getMessageHandlerKey(type);
	        if (this.onMessageHandlers.events[messageType]) {
	            this.onMessageHandlers.emit(messageType, message);
	        }
	        else if (this.onMessageHandlers.events['*']) {
	            this.onMessageHandlers.emit('*', type, message);
	        }
	        else {
	            (_a = console.warn) === null || _a === void 0 ? void 0 : _a.call(console, `colyseus.js: onMessage() not registered for type '${type}'.`);
	        }
	    }
	    destroy() {
	        if (this.serializer) {
	            this.serializer.teardown();
	        }
	    }
	    getMessageHandlerKey(type) {
	        switch (typeof (type)) {
	            // typeof Schema
	            case "function": return `$${type._typeid}`;
	            // string
	            case "string": return type;
	            // number
	            case "number": return `i${type}`;
	            default: throw new Error("invalid message type.");
	        }
	    }
	}
	Room$1.Room = Room;

	var HTTP$1 = {};

	function apply(src, tar) {
		tar.headers = src.headers || {};
		tar.statusMessage = src.statusText;
		tar.statusCode = src.status;
		tar.data = src.response;
	}

	function send(method, uri, opts) {
		return new Promise(function (res, rej) {
			opts = opts || {};
			var req = new XMLHttpRequest;
			var k, tmp, arr, str=opts.body;
			var headers = opts.headers || {};

			// IE compatible
			if (opts.timeout) req.timeout = opts.timeout;
			req.ontimeout = req.onerror = function (err) {
				err.timeout = err.type == 'timeout';
				rej(err);
			};

			req.open(method, uri.href || uri);

			req.onload = function () {
				arr = req.getAllResponseHeaders().trim().split(/[\r\n]+/);
				apply(req, req); //=> req.headers

				while (tmp = arr.shift()) {
					tmp = tmp.split(': ');
					req.headers[tmp.shift().toLowerCase()] = tmp.join(': ');
				}

				tmp = req.headers['content-type'];
				if (tmp && !!~tmp.indexOf('application/json')) {
					try {
						req.data = JSON.parse(req.data, opts.reviver);
					} catch (err) {
						apply(req, err);
						return rej(err);
					}
				}

				(req.status >= 400 ? rej : res)(req);
			};

			if (typeof FormData < 'u' && str instanceof FormData) ; else if (str && typeof str == 'object') {
				headers['content-type'] = 'application/json';
				str = JSON.stringify(str);
			}

			req.withCredentials = !!opts.withCredentials;

			for (k in headers) {
				req.setRequestHeader(k, headers[k]);
			}

			req.send(str);
		});
	}

	var get = /*#__PURE__*/ send.bind(send, 'GET');
	var post = /*#__PURE__*/ send.bind(send, 'POST');
	var patch = /*#__PURE__*/ send.bind(send, 'PATCH');
	var del = /*#__PURE__*/ send.bind(send, 'DELETE');
	var put = /*#__PURE__*/ send.bind(send, 'PUT');

	var xhr = /*#__PURE__*/Object.freeze({
		__proto__: null,
		send: send,
		get: get,
		post: post,
		patch: patch,
		del: del,
		put: put
	});

	var require$$1 = /*@__PURE__*/getAugmentedNamespace(xhr);

	var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (commonjsGlobal && commonjsGlobal.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (commonjsGlobal && commonjsGlobal.__importStar) || function (mod) {
	    if (mod && mod.__esModule) return mod;
	    var result = {};
	    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
	    __setModuleDefault(result, mod);
	    return result;
	};
	Object.defineProperty(HTTP$1, "__esModule", { value: true });
	HTTP$1.HTTP = void 0;
	const ServerError_1$1 = ServerError;
	const httpie = __importStar(require$$1);
	class HTTP {
	    constructor(client) {
	        this.client = client;
	    }
	    get(path, options = {}) {
	        return this.request("get", path, options);
	    }
	    post(path, options = {}) {
	        return this.request("post", path, options);
	    }
	    del(path, options = {}) {
	        return this.request("del", path, options);
	    }
	    put(path, options = {}) {
	        return this.request("put", path, options);
	    }
	    request(method, path, options = {}) {
	        return httpie[method](this.client['getHttpEndpoint'](path), this.getOptions(options)).catch((e) => {
	            var _a;
	            const status = e.statusCode; //  || -1
	            const message = ((_a = e.data) === null || _a === void 0 ? void 0 : _a.error) || e.statusMessage || e.message; //  || "offline"
	            if (!status && !message) {
	                throw e;
	            }
	            throw new ServerError_1$1.ServerError(status, message);
	        });
	    }
	    getOptions(options) {
	        if (this.authToken) {
	            if (!options.headers) {
	                options.headers = {};
	            }
	            options.headers['Authorization'] = `Bearer ${this.authToken}`;
	        }
	        if (typeof (cc) !== 'undefined' && cc.sys && cc.sys.isNative) ;
	        else {
	            // always include credentials
	            options.withCredentials = true;
	        }
	        return options;
	    }
	}
	HTTP$1.HTTP = HTTP;

	var Auth$1 = {};

	var Storage = {};

	/// <reference path="../typings/cocos-creator.d.ts" />
	Object.defineProperty(Storage, "__esModule", { value: true });
	Storage.getItem = Storage.removeItem = Storage.setItem = void 0;
	/**
	 * We do not assign 'storage' to window.localStorage immediatelly for React
	 * Native compatibility. window.localStorage is not present when this module is
	 * loaded.
	 */
	let storage;
	function getStorage() {
	    if (!storage) {
	        try {
	            storage = (typeof (cc) !== 'undefined' && cc.sys && cc.sys.localStorage)
	                ? cc.sys.localStorage // compatibility with cocos creator
	                : window.localStorage; // RN does have window object at this point, but localStorage is not defined
	        }
	        catch (e) {
	            // ignore error
	        }
	    }
	    if (!storage) {
	        // mock localStorage if not available (Node.js or RN environment)
	        storage = {
	            cache: {},
	            setItem: function (key, value) { this.cache[key] = value; },
	            getItem: function (key) { this.cache[key]; },
	            removeItem: function (key) { delete this.cache[key]; },
	        };
	    }
	    return storage;
	}
	function setItem(key, value) {
	    getStorage().setItem(key, value);
	}
	Storage.setItem = setItem;
	function removeItem(key) {
	    getStorage().removeItem(key);
	}
	Storage.removeItem = removeItem;
	function getItem(key, callback) {
	    const value = getStorage().getItem(key);
	    if (typeof (Promise) === 'undefined' || // old browsers
	        !(value instanceof Promise)) {
	        // browser has synchronous return
	        callback(value);
	    }
	    else {
	        // react-native is asynchronous
	        value.then((id) => callback(id));
	    }
	}
	Storage.getItem = getItem;

	var __awaiter$1 = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	var __classPrivateFieldGet = (commonjsGlobal && commonjsGlobal.__classPrivateFieldGet) || function (receiver, state, kind, f) {
	    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
	    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
	    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
	};
	var __classPrivateFieldSet = (commonjsGlobal && commonjsGlobal.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
	    if (kind === "m") throw new TypeError("Private method is not writable");
	    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
	    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
	    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
	};
	var _Auth__initialized, _Auth__initializationPromise, _Auth__signInWindow, _Auth__events;
	Object.defineProperty(Auth$1, "__esModule", { value: true });
	Auth$1.Auth = void 0;
	const Storage_1 = Storage;
	const nanoevents_1 = nanoevents;
	class Auth {
	    constructor(http) {
	        this.http = http;
	        this.settings = {
	            path: "/auth",
	            key: "colyseus-auth-token",
	        };
	        _Auth__initialized.set(this, false);
	        _Auth__initializationPromise.set(this, void 0);
	        _Auth__signInWindow.set(this, undefined);
	        _Auth__events.set(this, (0, nanoevents_1.createNanoEvents)());
	        (0, Storage_1.getItem)(this.settings.key, (token) => this.token = token);
	    }
	    set token(token) {
	        this.http.authToken = token;
	    }
	    get token() {
	        return this.http.authToken;
	    }
	    onChange(callback) {
	        const unbindChange = __classPrivateFieldGet(this, _Auth__events, "f").on("change", callback);
	        if (!__classPrivateFieldGet(this, _Auth__initialized, "f")) {
	            __classPrivateFieldSet(this, _Auth__initializationPromise, new Promise((resolve, reject) => {
	                this.getUserData().then((userData) => {
	                    this.emitChange(Object.assign(Object.assign({}, userData), { token: this.token }));
	                }).catch((e) => {
	                    // user is not logged in, or service is down
	                    this.emitChange({ user: null, token: undefined });
	                }).finally(() => {
	                    resolve();
	                });
	            }), "f");
	        }
	        __classPrivateFieldSet(this, _Auth__initialized, true, "f");
	        return unbindChange;
	    }
	    getUserData() {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            if (this.token) {
	                return (yield this.http.get(`${this.settings.path}/userdata`)).data;
	            }
	            else {
	                throw new Error("missing auth.token");
	            }
	        });
	    }
	    registerWithEmailAndPassword(email, password, options) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            const data = (yield this.http.post(`${this.settings.path}/register`, {
	                body: { email, password, options, },
	            })).data;
	            this.emitChange(data);
	            return data;
	        });
	    }
	    signInWithEmailAndPassword(email, password) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            const data = (yield this.http.post(`${this.settings.path}/login`, {
	                body: { email, password, },
	            })).data;
	            this.emitChange(data);
	            return data;
	        });
	    }
	    signInAnonymously(options) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            const data = (yield this.http.post(`${this.settings.path}/anonymous`, {
	                body: { options, }
	            })).data;
	            this.emitChange(data);
	            return data;
	        });
	    }
	    sendPasswordResetEmail(email) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            return (yield this.http.post(`${this.settings.path}/forgot-password`, {
	                body: { email, }
	            })).data;
	        });
	    }
	    signInWithProvider(providerName, settings = {}) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            return new Promise((resolve, reject) => {
	                const w = settings.width || 480;
	                const h = settings.height || 768;
	                // forward existing token for upgrading
	                const upgradingToken = this.token ? `?token=${this.token}` : "";
	                // Capitalize first letter of providerName
	                const title = `Login with ${(providerName[0].toUpperCase() + providerName.substring(1))}`;
	                const url = this.http['client']['getHttpEndpoint'](`${(settings.prefix || `${this.settings.path}/provider`)}/${providerName}${upgradingToken}`);
	                const left = (screen.width / 2) - (w / 2);
	                const top = (screen.height / 2) - (h / 2);
	                __classPrivateFieldSet(this, _Auth__signInWindow, window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left), "f");
	                const onMessage = (event) => {
	                    // TODO: it is a good idea to check if event.origin can be trusted!
	                    // if (event.origin.indexOf(window.location.hostname) === -1) { return; }
	                    // require 'user' and 'token' inside received data.
	                    if (event.data.user === undefined && event.data.token === undefined) {
	                        return;
	                    }
	                    clearInterval(rejectionChecker);
	                    __classPrivateFieldGet(this, _Auth__signInWindow, "f").close();
	                    __classPrivateFieldSet(this, _Auth__signInWindow, undefined, "f");
	                    window.removeEventListener("message", onMessage);
	                    if (event.data.error !== undefined) {
	                        reject(event.data.error);
	                    }
	                    else {
	                        resolve(event.data);
	                        this.emitChange(event.data);
	                    }
	                };
	                const rejectionChecker = setInterval(() => {
	                    if (!__classPrivateFieldGet(this, _Auth__signInWindow, "f") || __classPrivateFieldGet(this, _Auth__signInWindow, "f").closed) {
	                        __classPrivateFieldSet(this, _Auth__signInWindow, undefined, "f");
	                        reject("cancelled");
	                        window.removeEventListener("message", onMessage);
	                    }
	                }, 200);
	                window.addEventListener("message", onMessage);
	            });
	        });
	    }
	    signOut() {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            this.emitChange({ user: null, token: null });
	        });
	    }
	    emitChange(authData) {
	        if (authData.token !== undefined) {
	            this.token = authData.token;
	            if (authData.token === null) {
	                (0, Storage_1.removeItem)(this.settings.key);
	            }
	            else {
	                // store key in localStorage
	                (0, Storage_1.setItem)(this.settings.key, authData.token);
	            }
	        }
	        __classPrivateFieldGet(this, _Auth__events, "f").emit("change", authData);
	    }
	}
	Auth$1.Auth = Auth;
	_Auth__initialized = new WeakMap(), _Auth__initializationPromise = new WeakMap(), _Auth__signInWindow = new WeakMap(), _Auth__events = new WeakMap();

	var discord = {};

	Object.defineProperty(discord, "__esModule", { value: true });
	discord.discordURLBuilder = void 0;
	/**
	 * Discord Embedded App SDK
	 * https://github.com/colyseus/colyseus/issues/707
	 *
	 * All URLs must go through the local proxy from
	 * https://<app_id>.discordsays.com/<backend>/...
	 *
	 * You must configure your URL Mappings with:
	 * - /colyseus/{subdomain} -> {subdomain}.colyseus.cloud
	 *
	 * Example:
	 *  const client = new Client("https://xxxx.colyseus.cloud");
	 *
	 */
	function discordURLBuilder(url) {
	    var _a;
	    const localHostname = ((_a = window === null || window === void 0 ? void 0 : window.location) === null || _a === void 0 ? void 0 : _a.hostname) || "localhost";
	    const remoteHostnameSplitted = url.hostname.split('.');
	    const subdomain = (remoteHostnameSplitted.length > 2)
	        ? `/${remoteHostnameSplitted[0]}`
	        : '';
	    return `${url.protocol}//${localHostname}/colyseus${subdomain}${url.pathname}${url.search}`;
	}
	discord.discordURLBuilder = discordURLBuilder;

	var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	var _a;
	Object.defineProperty(Client$1, "__esModule", { value: true });
	Client$1.Client = Client$1.MatchMakeError = void 0;
	const ServerError_1 = ServerError;
	const Room_1 = Room$1;
	const HTTP_1 = HTTP$1;
	const Auth_1 = Auth$1;
	const discord_1 = discord;
	class MatchMakeError extends Error {
	    constructor(message, code) {
	        super(message);
	        this.code = code;
	        Object.setPrototypeOf(this, MatchMakeError.prototype);
	    }
	}
	Client$1.MatchMakeError = MatchMakeError;
	// - React Native does not provide `window.location`
	// - Cocos Creator (Native) does not provide `window.location.hostname`
	const DEFAULT_ENDPOINT = (typeof (window) !== "undefined" && typeof ((_a = window === null || window === void 0 ? void 0 : window.location) === null || _a === void 0 ? void 0 : _a.hostname) !== "undefined")
	    ? `${window.location.protocol.replace("http", "ws")}//${window.location.hostname}${(window.location.port && `:${window.location.port}`)}`
	    : "ws://127.0.0.1:2567";
	class Client {
	    constructor(settings = DEFAULT_ENDPOINT, customURLBuilder) {
	        var _a, _b;
	        if (typeof (settings) === "string") {
	            //
	            // endpoint by url
	            //
	            const url = (settings.startsWith("/"))
	                ? new URL(settings, DEFAULT_ENDPOINT)
	                : new URL(settings);
	            const secure = (url.protocol === "https:" || url.protocol === "wss:");
	            const port = Number(url.port || (secure ? 443 : 80));
	            this.settings = {
	                hostname: url.hostname,
	                pathname: url.pathname,
	                port,
	                secure
	            };
	        }
	        else {
	            //
	            // endpoint by settings
	            //
	            if (settings.port === undefined) {
	                settings.port = (settings.secure) ? 443 : 80;
	            }
	            if (settings.pathname === undefined) {
	                settings.pathname = "";
	            }
	            this.settings = settings;
	        }
	        // make sure pathname does not end with "/"
	        if (this.settings.pathname.endsWith("/")) {
	            this.settings.pathname = this.settings.pathname.slice(0, -1);
	        }
	        this.http = new HTTP_1.HTTP(this);
	        this.auth = new Auth_1.Auth(this.http);
	        this.urlBuilder = customURLBuilder;
	        //
	        // Discord Embedded SDK requires a custom URL builder
	        //
	        if (!this.urlBuilder &&
	            typeof (window) !== "undefined" &&
	            ((_b = (_a = window === null || window === void 0 ? void 0 : window.location) === null || _a === void 0 ? void 0 : _a.hostname) === null || _b === void 0 ? void 0 : _b.includes("discordsays.com"))) {
	            this.urlBuilder = discord_1.discordURLBuilder;
	            console.log("Colyseus SDK: Discord Embedded SDK detected. Using custom URL builder.");
	        }
	    }
	    joinOrCreate(roomName, options = {}, rootSchema) {
	        return __awaiter(this, void 0, void 0, function* () {
	            return yield this.createMatchMakeRequest('joinOrCreate', roomName, options, rootSchema);
	        });
	    }
	    create(roomName, options = {}, rootSchema) {
	        return __awaiter(this, void 0, void 0, function* () {
	            return yield this.createMatchMakeRequest('create', roomName, options, rootSchema);
	        });
	    }
	    join(roomName, options = {}, rootSchema) {
	        return __awaiter(this, void 0, void 0, function* () {
	            return yield this.createMatchMakeRequest('join', roomName, options, rootSchema);
	        });
	    }
	    joinById(roomId, options = {}, rootSchema) {
	        return __awaiter(this, void 0, void 0, function* () {
	            return yield this.createMatchMakeRequest('joinById', roomId, options, rootSchema);
	        });
	    }
	    /**
	     * Re-establish connection with a room this client was previously connected to.
	     *
	     * @param reconnectionToken The `room.reconnectionToken` from previously connected room.
	     * @param rootSchema (optional) Concrete root schema definition
	     * @returns Promise<Room>
	     */
	    reconnect(reconnectionToken, rootSchema) {
	        return __awaiter(this, void 0, void 0, function* () {
	            if (typeof (reconnectionToken) === "string" && typeof (rootSchema) === "string") {
	                throw new Error("DEPRECATED: .reconnect() now only accepts 'reconnectionToken' as argument.\nYou can get this token from previously connected `room.reconnectionToken`");
	            }
	            const [roomId, token] = reconnectionToken.split(":");
	            if (!roomId || !token) {
	                throw new Error("Invalid reconnection token format.\nThe format should be roomId:reconnectionToken");
	            }
	            return yield this.createMatchMakeRequest('reconnect', roomId, { reconnectionToken: token }, rootSchema);
	        });
	    }
	    getAvailableRooms(roomName = "") {
	        return __awaiter(this, void 0, void 0, function* () {
	            return (yield this.http.get(`matchmake/${roomName}`, {
	                headers: {
	                    'Accept': 'application/json'
	                }
	            })).data;
	        });
	    }
	    consumeSeatReservation(response, rootSchema, reuseRoomInstance // used in devMode
	    ) {
	        return __awaiter(this, void 0, void 0, function* () {
	            const room = this.createRoom(response.room.name, rootSchema);
	            room.roomId = response.room.roomId;
	            room.sessionId = response.sessionId;
	            const options = { sessionId: room.sessionId };
	            // forward "reconnection token" in case of reconnection.
	            if (response.reconnectionToken) {
	                options.reconnectionToken = response.reconnectionToken;
	            }
	            const targetRoom = reuseRoomInstance || room;
	            room.connect(this.buildEndpoint(response.room, options), response.devMode && (() => __awaiter(this, void 0, void 0, function* () {
	                console.info(`[Colyseus devMode]: ${String.fromCodePoint(0x1F504)} Re-establishing connection with room id '${room.roomId}'...`); // 🔄
	                let retryCount = 0;
	                let retryMaxRetries = 8;
	                const retryReconnection = () => __awaiter(this, void 0, void 0, function* () {
	                    retryCount++;
	                    try {
	                        yield this.consumeSeatReservation(response, rootSchema, targetRoom);
	                        console.info(`[Colyseus devMode]: ${String.fromCodePoint(0x2705)} Successfully re-established connection with room '${room.roomId}'`); // ✅
	                    }
	                    catch (e) {
	                        if (retryCount < retryMaxRetries) {
	                            console.info(`[Colyseus devMode]: ${String.fromCodePoint(0x1F504)} retrying... (${retryCount} out of ${retryMaxRetries})`); // 🔄
	                            setTimeout(retryReconnection, 2000);
	                        }
	                        else {
	                            console.info(`[Colyseus devMode]: ${String.fromCodePoint(0x274C)} Failed to reconnect. Is your server running? Please check server logs.`); // ❌
	                        }
	                    }
	                });
	                setTimeout(retryReconnection, 2000);
	            })), targetRoom);
	            return new Promise((resolve, reject) => {
	                const onError = (code, message) => reject(new ServerError_1.ServerError(code, message));
	                targetRoom.onError.once(onError);
	                targetRoom['onJoin'].once(() => {
	                    targetRoom.onError.remove(onError);
	                    resolve(targetRoom);
	                });
	            });
	        });
	    }
	    createMatchMakeRequest(method, roomName, options = {}, rootSchema, reuseRoomInstance) {
	        return __awaiter(this, void 0, void 0, function* () {
	            const response = (yield this.http.post(`matchmake/${method}/${roomName}`, {
	                headers: {
	                    'Accept': 'application/json',
	                    'Content-Type': 'application/json'
	                },
	                body: JSON.stringify(options)
	            })).data;
	            // FIXME: HTTP class is already handling this as ServerError.
	            if (response.error) {
	                throw new MatchMakeError(response.error, response.code);
	            }
	            // forward reconnection token during "reconnect" methods.
	            if (method === "reconnect") {
	                response.reconnectionToken = options.reconnectionToken;
	            }
	            return yield this.consumeSeatReservation(response, rootSchema, reuseRoomInstance);
	        });
	    }
	    createRoom(roomName, rootSchema) {
	        return new Room_1.Room(roomName, rootSchema);
	    }
	    buildEndpoint(room, options = {}) {
	        const params = [];
	        // append provided options
	        for (const name in options) {
	            if (!options.hasOwnProperty(name)) {
	                continue;
	            }
	            params.push(`${name}=${options[name]}`);
	        }
	        let endpoint = (this.settings.secure)
	            ? "wss://"
	            : "ws://";
	        if (room.publicAddress) {
	            endpoint += `${room.publicAddress}`;
	        }
	        else {
	            endpoint += `${this.settings.hostname}${this.getEndpointPort()}${this.settings.pathname}`;
	        }
	        const endpointURL = `${endpoint}/${room.processId}/${room.roomId}?${params.join('&')}`;
	        return (this.urlBuilder)
	            ? this.urlBuilder(new URL(endpointURL))
	            : endpointURL;
	    }
	    getHttpEndpoint(segments = '') {
	        const path = segments.startsWith("/") ? segments : `/${segments}`;
	        const endpointURL = `${(this.settings.secure) ? "https" : "http"}://${this.settings.hostname}${this.getEndpointPort()}${this.settings.pathname}${path}`;
	        return (this.urlBuilder)
	            ? this.urlBuilder(new URL(endpointURL))
	            : endpointURL;
	    }
	    getEndpointPort() {
	        return (this.settings.port !== 80 && this.settings.port !== 443)
	            ? `:${this.settings.port}`
	            : "";
	    }
	}
	Client$1.Client = Client;

	var SchemaSerializer$1 = {};

	Object.defineProperty(SchemaSerializer$1, "__esModule", { value: true });
	SchemaSerializer$1.SchemaSerializer = void 0;
	const schema_1 = umd.exports;
	class SchemaSerializer {
	    setState(rawState) {
	        return this.state.decode(rawState);
	    }
	    getState() {
	        return this.state;
	    }
	    patch(patches) {
	        return this.state.decode(patches);
	    }
	    teardown() {
	        var _a, _b;
	        (_b = (_a = this.state) === null || _a === void 0 ? void 0 : _a['$changes']) === null || _b === void 0 ? void 0 : _b.root.clearRefs();
	    }
	    handshake(bytes, it) {
	        if (this.state) {
	            // TODO: validate client/server definitinos
	            const reflection = new schema_1.Reflection();
	            reflection.decode(bytes, it);
	        }
	        else {
	            // initialize reflected state from server
	            this.state = schema_1.Reflection.decode(bytes, it);
	        }
	    }
	}
	SchemaSerializer$1.SchemaSerializer = SchemaSerializer;

	var NoneSerializer$1 = {};

	Object.defineProperty(NoneSerializer$1, "__esModule", { value: true });
	NoneSerializer$1.NoneSerializer = void 0;
	class NoneSerializer {
	    setState(rawState) { }
	    getState() { return null; }
	    patch(patches) { }
	    teardown() { }
	    handshake(bytes) { }
	}
	NoneSerializer$1.NoneSerializer = NoneSerializer;

	(function (exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.SchemaSerializer = exports.registerSerializer = exports.Auth = exports.Room = exports.ErrorCode = exports.Protocol = exports.Client = void 0;

		var Client_1 = Client$1;
		Object.defineProperty(exports, "Client", { enumerable: true, get: function () { return Client_1.Client; } });
		var Protocol_1 = Protocol;
		Object.defineProperty(exports, "Protocol", { enumerable: true, get: function () { return Protocol_1.Protocol; } });
		Object.defineProperty(exports, "ErrorCode", { enumerable: true, get: function () { return Protocol_1.ErrorCode; } });
		var Room_1 = Room$1;
		Object.defineProperty(exports, "Room", { enumerable: true, get: function () { return Room_1.Room; } });
		var Auth_1 = Auth$1;
		Object.defineProperty(exports, "Auth", { enumerable: true, get: function () { return Auth_1.Auth; } });
		/*
		 * Serializers
		 */
		const SchemaSerializer_1 = SchemaSerializer$1;
		Object.defineProperty(exports, "SchemaSerializer", { enumerable: true, get: function () { return SchemaSerializer_1.SchemaSerializer; } });
		const NoneSerializer_1 = NoneSerializer$1;
		const Serializer_1 = Serializer;
		Object.defineProperty(exports, "registerSerializer", { enumerable: true, get: function () { return Serializer_1.registerSerializer; } });
		(0, Serializer_1.registerSerializer)('schema', SchemaSerializer_1.SchemaSerializer);
		(0, Serializer_1.registerSerializer)('none', NoneSerializer_1.NoneSerializer);
		
	} (lib));

	// LittleJS - MIT License - Copyright 2021 Frank Force

	/** 
	 * LittleJS Debug System
	 * - Press Esc to show debug overlay with mouse pick
	 * - Number keys toggle debug functions
	 * - +/- apply time scale
	 * - Debug primitive rendering
	 * - Save a 2d canvas as a png image
	 * @namespace Debug
	 */



	/** True if debug is enabled
	 *  @type {Boolean}
	 *  @default
	 *  @memberof Debug */
	const debug = true;

	/** Size to render debug points by default
	 *  @type {Number}
	 *  @default
	 *  @memberof Debug */
	const debugPointSize = .5;

	/** True if watermark with FPS should be shown, false in release builds
	 *  @type {Boolean}
	 *  @default
	 *  @memberof Debug */
	let showWatermark = true;

	/** Key code used to toggle debug mode, Esc by default
	 *  @type {String}
	 *  @default
	 *  @memberof Debug */
	let debugKey = 'Escape';

	/** True if the debug overlay is active, always false in release builds
	 *  @type {Boolean}
	 *  @default
	 *  @memberof Debug */
	let debugOverlay = false;

	// Engine internal variables not exposed to documentation
	let debugPrimitives = [], debugPhysics = false, debugRaycast = false, debugParticles = false, debugGamepads = false, debugTakeScreenshot, downloadLink;

	///////////////////////////////////////////////////////////////////////////////
	// Debug helper functions

	/** Asserts if the expression is false, does not do anything in release builds
	 *  @param {Boolean} assert
	 *  @param {Object} [output]
	 *  @memberof Debug */
	function ASSERT(assert, output) 
	{
	    output ? console.assert(assert, output) : console.assert(assert);
	}

	/** Draw a debug rectangle in world space
	 *  @param {Vector2} pos
	 *  @param {Vector2} [size=Vector2()]
	 *  @param {String}  [color]
	 *  @param {Number}  [time]
	 *  @param {Number}  [angle]
	 *  @param {Boolean} [fill]
	 *  @memberof Debug */
	function debugRect(pos, size=vec2(), color='#fff', time=0, angle=0, fill=false)
	{
	    ASSERT(typeof color == 'string', 'pass in css color strings'); 
	    debugPrimitives.push({pos, size:vec2(size), color, time:new Timer(time), angle, fill});
	}

	/** Draw a debug circle in world space
	 *  @param {Vector2} pos
	 *  @param {Number}  [radius]
	 *  @param {String}  [color]
	 *  @param {Number}  [time]
	 *  @param {Boolean} [fill]
	 *  @memberof Debug */
	function debugCircle(pos, radius=0, color='#fff', time=0, fill=false)
	{
	    ASSERT(typeof color == 'string', 'pass in css color strings');
	    debugPrimitives.push({pos, size:radius, color, time:new Timer(time), angle:0, fill});
	}

	/** Draw a debug point in world space
	 *  @param {Vector2} pos
	 *  @param {String}  [color]
	 *  @param {Number}  [time]
	 *  @param {Number}  [angle]
	 *  @memberof Debug */
	function debugPoint(pos, color, time, angle) {debugRect(pos, undefined, color, time, angle);}

	/** Draw a debug line in world space
	 *  @param {Vector2} posA
	 *  @param {Vector2} posB
	 *  @param {String}  [color]
	 *  @param {Number}  [thickness]
	 *  @param {Number}  [time]
	 *  @memberof Debug */
	function debugLine(posA, posB, color, thickness=.1, time)
	{
	    const halfDelta = vec2((posB.x - posA.x)/2, (posB.y - posA.y)/2);
	    const size = vec2(thickness, halfDelta.length()*2);
	    debugRect(posA.add(halfDelta), size, color, time, halfDelta.angle(), true);
	}

	/** Draw a debug axis aligned bounding box in world space
	 *  @param {Vector2} pA - position A
	 *  @param {Vector2} sA - size A
	 *  @param {Vector2} pB - position B
	 *  @param {Vector2} sB - size B
	 *  @param {String}  [color]
	 *  @memberof Debug */
	function debugAABB(pA, sA, pB, sB, color)
	{
	    const minPos = vec2(min(pA.x - sA.x/2, pB.x - sB.x/2), min(pA.y - sA.y/2, pB.y - sB.y/2));
	    const maxPos = vec2(max(pA.x + sA.x/2, pB.x + sB.x/2), max(pA.y + sA.y/2, pB.y + sB.y/2));
	    debugRect(minPos.lerp(maxPos,.5), maxPos.subtract(minPos), color);
	}

	/** Draw a debug axis aligned bounding box in world space
	 *  @param {String}  text
	 *  @param {Vector2} pos
	 *  @param {Number}  [size]
	 *  @param {String}  [color]
	 *  @param {Number}  [time]
	 *  @param {Number}  [angle]
	 *  @param {String}  [font]
	 *  @memberof Debug */
	function debugText(text, pos, size=1, color='#fff', time=0, angle=0, font='monospace')
	{
	    ASSERT(typeof color == 'string', 'pass in css color strings');
	    debugPrimitives.push({text, pos, size, color, time:new Timer(time), angle, font});
	}

	/** Clear all debug primitives in the list
	 *  @memberof Debug */
	function debugClear() { debugPrimitives = []; }

	/** Save a canvas to disk 
	 *  @param {HTMLCanvasElement} canvas
	 *  @param {String}            [filename]
	 *  @param {String}            [type]
	 *  @memberof Debug */
	function debugSaveCanvas(canvas, filename=engineName, type='image/png')
	{ debugSaveDataURL(canvas.toDataURL(type), filename); }

	/** Save a data url to disk 
	 *  @param {String}     dataURL
	 *  @param {String}     filename
	 *  @memberof Debug */
	function debugSaveDataURL(dataURL, filename)
	{
	    downloadLink.download = filename;
	    downloadLink.href = dataURL;
	    downloadLink.click();
	}

	///////////////////////////////////////////////////////////////////////////////
	// Engine debug function (called automatically)

	function debugInit()
	{
	    // create link for saving screenshots
	    document.body.appendChild(downloadLink = document.createElement('a'));
	    downloadLink.style.display = 'none';
	}

	function debugUpdate()
	{

	    if (keyWasPressed(debugKey)) // Esc
	        debugOverlay = !debugOverlay;
	    if (debugOverlay)
	    {
	        if (keyWasPressed('Digit0'))
	            showWatermark = !showWatermark;
	        if (keyWasPressed('Digit1'))
	            debugPhysics = !debugPhysics, debugParticles = false;
	        if (keyWasPressed('Digit2'))
	            debugParticles = !debugParticles, debugPhysics = false;
	        if (keyWasPressed('Digit3'))
	            debugGamepads = !debugGamepads;
	        if (keyWasPressed('Digit4'))
	            debugRaycast = !debugRaycast;
	        if (keyWasPressed('Digit5'))
	            debugTakeScreenshot = 1;
	    }
	}

	function debugRender()
	{
	    glCopyToContext(mainContext);

	    if (debugTakeScreenshot)
	    {
	        // composite canvas
	        glCopyToContext(mainContext, true);
	        mainContext.drawImage(overlayCanvas, 0, 0);
	        overlayCanvas.width |= 0;

	        // remove alpha and save
	        const w = mainCanvas.width, h = mainCanvas.height;
	        overlayContext.fillRect(0,0,w,h);
	        overlayContext.drawImage(mainCanvas, 0, 0);
	        debugSaveCanvas(overlayCanvas);
	        debugTakeScreenshot = 0;
	    }

	    if (debugGamepads && gamepadsEnable && navigator.getGamepads)
	    {
	        // gamepad debug display
	        const gamepads = navigator.getGamepads();
	        for (let i = gamepads.length; i--;)
	        {
	            const gamepad = gamepads[i];
	            if (gamepad)
	            {
	                const stickScale = 1;
	                const buttonScale = .2;
	                const centerPos = cameraPos;
	                const sticks = stickData[i];
	                for (let j = sticks.length; j--;)
	                {
	                    const drawPos = centerPos.add(vec2(j*stickScale*2, i*stickScale*3));
	                    const stickPos = drawPos.add(sticks[j].scale(stickScale));
	                    debugCircle(drawPos, stickScale, '#fff7',0,true);
	                    debugLine(drawPos, stickPos, '#f00');
	                    debugPoint(stickPos, '#f00');
	                }
	                for (let j = gamepad.buttons.length; j--;)
	                {
	                    const drawPos = centerPos.add(vec2(j*buttonScale*2, i*stickScale*3-stickScale-buttonScale));
	                    const pressed = gamepad.buttons[j].pressed;
	                    debugCircle(drawPos, buttonScale, pressed ? '#f00' : '#fff7', 0, true);
	                    debugText(''+j, drawPos, .2);
	                }
	            }
	        }
	    }

	    if (debugOverlay)
	    {
	        const saveContext = mainContext;
	        mainContext = overlayContext;
	        
	        // draw red rectangle around screen
	        const cameraSize = getCameraSize();
	        debugRect(cameraPos, cameraSize.subtract(vec2(.1)), '#f008');

	        // mouse pick
	        let bestDistance = Infinity, bestObject;
	        for (const o of engineObjects)
	        {
	            if (o.canvas || o.destroyed)
	                continue;
	            if (!o.size.x || !o.size.y)
	                continue;

	            const distance = mousePos.distanceSquared(o.pos);
	            if (distance < bestDistance)
	            {
	                bestDistance = distance;
	                bestObject = o;
	            }

	            // show object info
	            const size = vec2(max(o.size.x, .2), max(o.size.y, .2));
	            const color1 = new Color(o.collideTiles?1:0, o.collideSolidObjects?1:0, o.isSolid?1:0, o.parent?.2:.5);
	            const color2 = o.parent ? new Color(1,1,1,.5) : new Color(0,0,0,.8);
	            drawRect(o.pos, size, color1, o.angle, false);
	            drawRect(o.pos, size.scale(.8), color2, o.angle, false);
	            o.parent && drawLine(o.pos, o.parent.pos, .1, new Color(0,0,1,.5), false);
	        }
	        
	        if (bestObject)
	        {
	            const raycastHitPos = tileCollisionRaycast(bestObject.pos, mousePos);
	            raycastHitPos && drawRect(raycastHitPos.floor().add(vec2(.5)), vec2(1), new Color(0,1,1,.3));
	            drawRect(mousePos.floor().add(vec2(.5)), vec2(1), new Color(0,0,1,.5), 0, false);
	            drawLine(mousePos, bestObject.pos, .1, raycastHitPos ? new Color(1,0,0,.5) : new Color(0,1,0,.5), false);

	            const debugText = 'mouse pos = ' + mousePos + 
	                '\nmouse collision = ' + getTileCollisionData(mousePos) + 
	                '\n\n--- object info ---\n' +
	                bestObject.toString();
	            drawTextScreen(debugText, mousePosScreen, 24, new Color, .05, undefined, 'center', 'monospace');
	        }

	        glCopyToContext(mainContext = saveContext);
	    }

	    {
	        // draw debug primitives
	        overlayContext.lineWidth = 2;
	        const pointSize = debugPointSize * cameraScale;
	        debugPrimitives.forEach(p=>
	        {
	            overlayContext.save();

	            // create canvas transform from world space to screen space
	            const pos = worldToScreen(p.pos);
	            overlayContext.translate(pos.x|0, pos.y|0);
	            overlayContext.rotate(p.angle);
	            overlayContext.fillStyle = overlayContext.strokeStyle = p.color;

	            if (p.text != undefined)
	            {
	                overlayContext.font = p.size*cameraScale + 'px '+ p.font;
	                overlayContext.textAlign = 'center';
	                overlayContext.textBaseline = 'middle';
	                overlayContext.fillText(p.text, 0, 0);
	            }
	            else if (p.size == 0 || p.size.x === 0 && p.size.y === 0 )
	            {
	                // point
	                overlayContext.fillRect(-pointSize/2, -1, pointSize, 3);
	                overlayContext.fillRect(-1, -pointSize/2, 3, pointSize);
	            }
	            else if (p.size.x != undefined)
	            {
	                // rect
	                const w = p.size.x*cameraScale|0, h = p.size.y*cameraScale|0;
	                p.fill && overlayContext.fillRect(-w/2|0, -h/2|0, w, h);
	                overlayContext.strokeRect(-w/2|0, -h/2|0, w, h);
	            }
	            else
	            {
	                // circle
	                overlayContext.beginPath();
	                overlayContext.arc(0, 0, p.size*cameraScale, 0, 9);
	                p.fill && overlayContext.fill();
	                overlayContext.stroke();
	            }
	            
	            overlayContext.restore();
	        });

	        // remove expired primitives
	        debugPrimitives = debugPrimitives.filter(r=>r.time<0);
	    }

	    {
	        // draw debug overlay
	        overlayContext.save();
	        overlayContext.fillStyle = '#fff';
	        overlayContext.textAlign = 'left';
	        overlayContext.textBaseline = 'top';
	        overlayContext.font = '28px monospace';
	        overlayContext.shadowColor = '#000';
	        overlayContext.shadowBlur = 9;

	        let x = 9, y = -20, h = 30;
	        if (debugOverlay)
	        {
	            overlayContext.fillText(engineName, x, y += h);
	            overlayContext.fillText('Objects: ' + engineObjects.length, x, y += h);
	            overlayContext.fillText('Time: ' + formatTime(time), x, y += h);
	            overlayContext.fillText('---------', x, y += h);
	            overlayContext.fillStyle = '#f00';
	            overlayContext.fillText('ESC: Debug Overlay', x, y += h);
	            overlayContext.fillStyle = debugPhysics ? '#f00' : '#fff';
	            overlayContext.fillText('1: Debug Physics', x, y += h);
	            overlayContext.fillStyle = debugParticles ? '#f00' : '#fff';
	            overlayContext.fillText('2: Debug Particles', x, y += h);
	            overlayContext.fillStyle = debugGamepads ? '#f00' : '#fff';
	            overlayContext.fillText('3: Debug Gamepads', x, y += h);
	            overlayContext.fillStyle = debugRaycast ? '#f00' : '#fff';
	            overlayContext.fillText('4: Debug Raycasts', x, y += h);
	            overlayContext.fillStyle = '#fff';
	            overlayContext.fillText('5: Save Screenshot', x, y += h);

	            let keysPressed = '';
	            for(const i in inputData[0])
	            {
	                if (keyIsDown(i, 0))
	                    keysPressed += i + ' ' ;
	            }
	            keysPressed && overlayContext.fillText('Keys Down: ' + keysPressed, x, y += h);

	            let buttonsPressed = '';
	            if (inputData[1])
	            for(const i in inputData[1])
	            {
	                if (keyIsDown(i, 1))
	                    buttonsPressed += i + ' ' ;
	            }
	            buttonsPressed && overlayContext.fillText('Gamepad: ' + buttonsPressed, x, y += h);
	        }
	        else
	        {
	            overlayContext.fillText(debugPhysics ? 'Debug Physics' : '', x, y += h);
	            overlayContext.fillText(debugParticles ? 'Debug Particles' : '', x, y += h);
	            overlayContext.fillText(debugRaycast ? 'Debug Raycasts' : '', x, y += h);
	            overlayContext.fillText(debugGamepads ? 'Debug Gamepads' : '', x, y += h);
	        }
	    
	        overlayContext.restore();
	    }
	}
	/**
	 * LittleJS Utility Classes and Functions
	 * - General purpose math library
	 * - Vector2 - fast, simple, easy 2D vector class
	 * - Color - holds a rgba color with some math functions
	 * - Timer - tracks time automatically
	 * - RandomGenerator - seeded random number generator
	 * @namespace Utilities
	 */



	/** A shortcut to get Math.PI
	 *  @type {Number}
	 *  @default Math.PI
	 *  @memberof Utilities */
	const PI = Math.PI;

	/** Returns absoulte value of value passed in
	 *  @param {Number} value
	 *  @return {Number}
	 *  @memberof Utilities */
	function abs(value) { return Math.abs(value); }

	/** Returns lowest of two values passed in
	 *  @param {Number} valueA
	 *  @param {Number} valueB
	 *  @return {Number}
	 *  @memberof Utilities */
	function min(valueA, valueB) { return Math.min(valueA, valueB); }

	/** Returns highest of two values passed in
	 *  @param {Number} valueA
	 *  @param {Number} valueB
	 *  @return {Number}
	 *  @memberof Utilities */
	function max(valueA, valueB) { return Math.max(valueA, valueB); }

	/** Returns the sign of value passed in
	 *  @param {Number} value
	 *  @return {Number}
	 *  @memberof Utilities */
	function sign(value) { return Math.sign(value); }

	/** Returns first parm modulo the second param, but adjusted so negative numbers work as expected
	 *  @param {Number} dividend
	 *  @param {Number} [divisor]
	 *  @return {Number}
	 *  @memberof Utilities */
	function mod(dividend, divisor=1) { return ((dividend % divisor) + divisor) % divisor; }

	/** Clamps the value beween max and min
	 *  @param {Number} value
	 *  @param {Number} [min]
	 *  @param {Number} [max]
	 *  @return {Number}
	 *  @memberof Utilities */
	function clamp(value, min=0, max=1) { return value < min ? min : value > max ? max : value; }

	/** Returns what percentage the value is between valueA and valueB
	 *  @param {Number} value
	 *  @param {Number} valueA
	 *  @param {Number} valueB
	 *  @return {Number}
	 *  @memberof Utilities */
	function percent(value, valueA, valueB)
	{ return valueB-valueA ? clamp((value-valueA) / (valueB-valueA)) : 0; }

	/** Linearly interpolates between values passed in using percent
	 *  @param {Number} percent
	 *  @param {Number} valueA
	 *  @param {Number} valueB
	 *  @return {Number}
	 *  @memberof Utilities */
	function lerp(percent, valueA, valueB) { return valueA + clamp(percent) * (valueB-valueA); }

	/** Returns signed wrapped distance between the two values passed in
	 *  @param {Number} valueA
	 *  @param {Number} valueB
	 *  @param {Number} [wrapSize]
	 *  @returns {Number}
	 *  @memberof Utilities */
	function distanceWrap(valueA, valueB, wrapSize=1)
	{ const d = (valueA - valueB) % wrapSize; return d*2 % wrapSize - d; }

	/** Linearly interpolates between values passed in with wrapping
	 *  @param {Number} percent
	 *  @param {Number} valueA
	 *  @param {Number} valueB
	 *  @param {Number} [wrapSize]
	 *  @returns {Number}
	 *  @memberof Utilities */
	function lerpWrap(percent, valueA, valueB, wrapSize=1)
	{ return valueB + clamp(percent) * distanceWrap(valueA, valueB, wrapSize); }

	/** Returns signed wrapped distance between the two angles passed in
	 *  @param {Number} angleA
	 *  @param {Number} angleB
	 *  @returns {Number}
	 *  @memberof Utilities */
	function distanceAngle(angleA, angleB) { return distanceWrap(angleA, angleB, 2*PI); }

	/** Linearly interpolates between the angles passed in with wrapping
	 *  @param {Number} percent
	 *  @param {Number} angleA
	 *  @param {Number} angleB
	 *  @returns {Number}
	 *  @memberof Utilities */
	function lerpAngle(percent, angleA, angleB) { return lerpWrap(percent, angleA, angleB, 2*PI); }

	/** Applies smoothstep function to the percentage value
	 *  @param {Number} percent
	 *  @return {Number}
	 *  @memberof Utilities */
	function smoothStep(percent) { return percent * percent * (3 - 2 * percent); }

	/** Returns the nearest power of two not less then the value
	 *  @param {Number} value
	 *  @return {Number}
	 *  @memberof Utilities */
	function nearestPowerOfTwo(value) { return 2**Math.ceil(Math.log2(value)); }

	/** Returns true if two axis aligned bounding boxes are overlapping 
	 *  @param {Vector2} posA          - Center of box A
	 *  @param {Vector2} sizeA         - Size of box A
	 *  @param {Vector2} posB          - Center of box B
	 *  @param {Vector2} [sizeB=(0,0)] - Size of box B, a point if undefined
	 *  @return {Boolean}              - True if overlapping
	 *  @memberof Utilities */
	function isOverlapping(posA, sizeA, posB, sizeB=vec2())
	{ 
	    return abs(posA.x - posB.x)*2 < sizeA.x + sizeB.x 
	        && abs(posA.y - posB.y)*2 < sizeA.y + sizeB.y;
	}

	/** Returns an oscillating wave between 0 and amplitude with frequency of 1 Hz by default
	 *  @param {Number} [frequency] - Frequency of the wave in Hz
	 *  @param {Number} [amplitude] - Amplitude (max height) of the wave
	 *  @param {Number} [t=time]    - Value to use for time of the wave
	 *  @return {Number}            - Value waving between 0 and amplitude
	 *  @memberof Utilities */
	function wave(frequency=1, amplitude=1, t=time)
	{ return amplitude/2 * (1 - Math.cos(t*frequency*2*PI)); }

	/** Formats seconds to mm:ss style for display purposes 
	 *  @param {Number} t - time in seconds
	 *  @return {String}
	 *  @memberof Utilities */
	function formatTime(t) { return (t/60|0) + ':' + (t%60<10?'0':'') + (t%60|0); }

	///////////////////////////////////////////////////////////////////////////////

	/** Random global functions
	 *  @namespace Random */

	/** Returns a random value between the two values passed in
	 *  @param {Number} [valueA]
	 *  @param {Number} [valueB]
	 *  @return {Number}
	 *  @memberof Random */
	function rand(valueA=1, valueB=0) { return valueB + Math.random() * (valueA-valueB); }

	/** Returns a floored random value the two values passed in
	 *  @param {Number} valueA
	 *  @param {Number} [valueB]
	 *  @return {Number}
	 *  @memberof Random */
	function randInt(valueA, valueB=0) { return Math.floor(rand(valueA,valueB)); }

	/** Randomly returns either -1 or 1
	 *  @return {Number}
	 *  @memberof Random */
	function randSign() { return randInt(2) * 2 - 1; }

	/** Returns a random Vector2 with the passed in length
	 *  @param {Number} [length]
	 *  @return {Vector2}
	 *  @memberof Random */
	function randVector(length=1) { return new Vector2().setAngle(rand(2*PI), length); }

	/** Returns a random Vector2 within a circular shape
	 *  @param {Number} [radius]
	 *  @param {Number} [minRadius]
	 *  @return {Vector2}
	 *  @memberof Random */
	function randInCircle(radius=1, minRadius=0)
	{ return radius > 0 ? randVector(radius * rand(minRadius / radius, 1)**.5) : new Vector2; }

	/** Returns a random color between the two passed in colors, combine components if linear
	 *  @param {Color}   [colorA=(1,1,1,1)]
	 *  @param {Color}   [colorB=(0,0,0,1)]
	 *  @param {Boolean} [linear]
	 *  @return {Color}
	 *  @memberof Random */
	function randColor(colorA=new Color, colorB=new Color(0,0,0,1), linear=false)
	{
	    return linear ? colorA.lerp(colorB, rand()) : 
	        new Color(rand(colorA.r,colorB.r), rand(colorA.g,colorB.g), rand(colorA.b,colorB.b), rand(colorA.a,colorB.a));
	}

	///////////////////////////////////////////////////////////////////////////////

	/** 
	 * Seeded random number generator
	 * - Can be used to create a deterministic random number sequence
	 * @example
	 * let r = new RandomGenerator(123); // random number generator with seed 123
	 * let a = r.float();                // random value between 0 and 1
	 * let b = r.int(10);                // random integer between 0 and 9
	 * r.seed = 123;                     // reset the seed
	 * let c = r.float();                // the same value as a
	 */
	class RandomGenerator
	{
	    /** Create a random number generator with the seed passed in
	     *  @param {Number} seed - Starting seed */
	    constructor(seed)
	    {
	        /** @property {Number} - random seed */
	        this.seed = seed;
	    }

	    /** Returns a seeded random value between the two values passed in
	    *  @param {Number} [valueA]
	    *  @param {Number} [valueB]
	    *  @return {Number} */
	    float(valueA=1, valueB=0)
	    {
	        // xorshift algorithm
	        this.seed ^= this.seed << 13; 
	        this.seed ^= this.seed >>> 17; 
	        this.seed ^= this.seed << 5;
	        return valueB + (valueA - valueB) * abs(this.seed % 1e9) / 1e9;
	    }

	    /** Returns a floored seeded random value the two values passed in
	    *  @param {Number} valueA
	    *  @param {Number} [valueB]
	    *  @return {Number} */
	    int(valueA, valueB=0) { return Math.floor(this.float(valueA, valueB)); }

	    /** Randomly returns either -1 or 1 deterministically
	    *  @return {Number} */
	    sign() { return this.int(2) * 2 - 1; }
	}

	///////////////////////////////////////////////////////////////////////////////

	/** 
	 * Create a 2d vector, can take another Vector2 to copy, 2 scalars, or 1 scalar
	 * @param {(Number|Vector2)} [x]
	 * @param {Number} [y]
	 * @return {Vector2}
	 * @example
	 * let a = vec2(0, 1); // vector with coordinates (0, 1)
	 * let b = vec2(a);    // copy a into b
	 * a = vec2(5);        // set a to (5, 5)
	 * b = vec2();         // set b to (0, 0)
	 * @memberof Utilities
	 */
	function vec2(x=0, y)
	{
	    return typeof x === 'number' ? 
	        new Vector2(x, y == undefined? x : y) : 
	        new Vector2(x.x, x.y);
	}

	/** 
	 * Check if object is a valid Vector2
	 * @param {any} v
	 * @return {Boolean}
	 * @memberof Utilities
	 */
	function isVector2(v) { return v instanceof Vector2; }

	/** 
	 * 2D Vector object with vector math library
	 * - Functions do not change this so they can be chained together
	 * @example
	 * let a = new Vector2(2, 3); // vector with coordinates (2, 3)
	 * let b = new Vector2;       // vector with coordinates (0, 0)
	 * let c = vec2(4, 2);        // use the vec2 function to make a Vector2
	 * let d = a.add(b).scale(5); // operators can be chained
	 */
	class Vector2
	{
	    /** Create a 2D vector with the x and y passed in, can also be created with vec2()
	     *  @param {Number} [x] - X axis location
	     *  @param {Number} [y] - Y axis location */
	    constructor(x=0, y=0)
	    {
	        /** @property {Number} - X axis location */
	        this.x = x;
	        /** @property {Number} - Y axis location */
	        this.y = y;
	    }

	    /** Returns a new vector that is a copy of this
	     *  @return {Vector2} */
	    copy() { return new Vector2(this.x, this.y); }

	    /** Returns a copy of this vector plus the vector passed in
	     *  @param {Vector2} v - other vector
	     *  @return {Vector2} */
	    add(v)
	    {
	        ASSERT(isVector2(v));
	        return new Vector2(this.x + v.x, this.y + v.y);
	    }

	    /** Returns a copy of this vector minus the vector passed in
	     *  @param {Vector2} v - other vector
	     *  @return {Vector2} */
	    subtract(v)
	    {
	        ASSERT(isVector2(v));
	        return new Vector2(this.x - v.x, this.y - v.y);
	    }

	    /** Returns a copy of this vector times the vector passed in
	     *  @param {Vector2} v - other vector
	     *  @return {Vector2} */
	    multiply(v)
	    {
	        ASSERT(isVector2(v));
	        return new Vector2(this.x * v.x, this.y * v.y);
	    }

	    /** Returns a copy of this vector divided by the vector passed in
	     *  @param {Vector2} v - other vector
	     *  @return {Vector2} */
	    divide(v)
	    {
	        ASSERT(isVector2(v));
	        return new Vector2(this.x / v.x, this.y / v.y);
	    }

	    /** Returns a copy of this vector scaled by the vector passed in
	     *  @param {Number} s - scale
	     *  @return {Vector2} */
	    scale(s)
	    {
	        ASSERT(!isVector2(s));
	        return new Vector2(this.x * s, this.y * s);
	    }

	    /** Returns the length of this vector
	     * @return {Number} */
	    length() { return this.lengthSquared()**.5; }

	    /** Returns the length of this vector squared
	     * @return {Number} */
	    lengthSquared() { return this.x**2 + this.y**2; }

	    /** Returns the distance from this vector to vector passed in
	     * @param {Vector2} v - other vector
	     * @return {Number} */
	    distance(v)
	    {
	        ASSERT(isVector2(v));
	        return this.distanceSquared(v)**.5;
	    }

	    /** Returns the distance squared from this vector to vector passed in
	     * @param {Vector2} v - other vector
	     * @return {Number} */
	    distanceSquared(v)
	    {
	        ASSERT(isVector2(v));
	        return (this.x - v.x)**2 + (this.y - v.y)**2;
	    }

	    /** Returns a new vector in same direction as this one with the length passed in
	     * @param {Number} [length]
	     * @return {Vector2} */
	    normalize(length=1)
	    {
	        const l = this.length();
	        return l ? this.scale(length/l) : new Vector2(0, length);
	    }

	    /** Returns a new vector clamped to length passed in
	     * @param {Number} [length]
	     * @return {Vector2} */
	    clampLength(length=1)
	    {
	        const l = this.length();
	        return l > length ? this.scale(length/l) : this;
	    }

	    /** Returns the dot product of this and the vector passed in
	     * @param {Vector2} v - other vector
	     * @return {Number} */
	    dot(v)
	    {
	        ASSERT(isVector2(v));
	        return this.x*v.x + this.y*v.y;
	    }

	    /** Returns the cross product of this and the vector passed in
	     * @param {Vector2} v - other vector
	     * @return {Number} */
	    cross(v)
	    {
	        ASSERT(isVector2(v));
	        return this.x*v.y - this.y*v.x;
	    }

	    /** Returns the angle of this vector, up is angle 0
	     * @return {Number} */
	    angle() { return Math.atan2(this.x, this.y); }

	    /** Sets this vector with angle and length passed in
	     * @param {Number} [angle]
	     * @param {Number} [length]
	     * @return {Vector2} */
	    setAngle(angle=0, length=1) 
	    {
	        this.x = length*Math.sin(angle);
	        this.y = length*Math.cos(angle);
	        return this;
	    }

	    /** Returns copy of this vector rotated by the angle passed in
	     * @param {Number} angle
	     * @return {Vector2} */
	    rotate(angle)
	    { 
	        const c = Math.cos(angle), s = Math.sin(angle); 
	        return new Vector2(this.x*c - this.y*s, this.x*s + this.y*c);
	    }

	    /** Set the integer direction of this vector, corrosponding to multiples of 90 degree rotation (0-3)
	     * @param {Number} [direction]
	     * @param {Number} [length] */
	    setDirection(direction, length=1)
	    {
	        ASSERT(direction==0 || direction==1 || direction==2 || direction==3);
	        return vec2(direction%2 ? direction-1 ? -length : length : 0, 
	            direction%2 ? 0 : direction ? -length : length);
	    }

	    /** Returns the integer direction of this vector, corrosponding to multiples of 90 degree rotation (0-3)
	     * @return {Number} */
	    direction()
	    { return abs(this.x) > abs(this.y) ? this.x < 0 ? 3 : 1 : this.y < 0 ? 2 : 0; }

	    /** Returns a copy of this vector that has been inverted
	     * @return {Vector2} */
	    invert() { return new Vector2(this.y, -this.x); }

	    /** Returns a copy of this vector with each axis floored
	     * @return {Vector2} */
	    floor() { return new Vector2(Math.floor(this.x), Math.floor(this.y)); }

	    /** Returns the area this vector covers as a rectangle
	     * @return {Number} */
	    area() { return abs(this.x * this.y); }

	    /** Returns a new vector that is p percent between this and the vector passed in
	     * @param {Vector2} v - other vector
	     * @param {Number}  percent
	     * @return {Vector2} */
	    lerp(v, percent)
	    {
	        ASSERT(isVector2(v));
	        return this.add(v.subtract(this).scale(clamp(percent)));
	    }

	    /** Returns true if this vector is within the bounds of an array size passed in
	     * @param {Vector2} arraySize
	     * @return {Boolean} */
	    arrayCheck(arraySize)
	    {
	        ASSERT(isVector2(arraySize));
	        return this.x >= 0 && this.y >= 0 && this.x < arraySize.x && this.y < arraySize.y;
	    }

	    /** Returns this vector expressed as a string
	     * @param {Number} digits - precision to display
	     * @return {String} */
	    toString(digits=3) 
	    {
	        return `(${(this.x<0?'':' ') + this.x.toFixed(digits)},${(this.y<0?'':' ') + this.y.toFixed(digits)} )`;
	    }
	}

	///////////////////////////////////////////////////////////////////////////////

	/** 
	 * Create a color object with RGBA values, white by default
	 * @param {Number} [r=1] - red
	 * @param {Number} [g=1] - green
	 * @param {Number} [b=1] - blue
	 * @param {Number} [a=1] - alpha
	 * @return {Color}
	 * @memberof Utilities
	 */
	function rgb(r, g, b, a) { return new Color(r, g, b, a); }

	/** 
	 * Create a color object with HSLA values, white by default
	 * @param {Number} [h=0] - hue
	 * @param {Number} [s=0] - saturation
	 * @param {Number} [l=1] - lightness
	 * @param {Number} [a=1] - alpha
	 * @return {Color}
	 * @memberof Utilities
	 */
	function hsl(h, s, l, a) { return new Color().setHSLA(h, s, l, a); }

	/** 
	 * Check if object is a valid Color
	 * @param {any} c
	 * @return {Boolean}
	 * @memberof Utilities
	 */
	function isColor(c) { return c instanceof Color; }

	/** 
	 * Color object (red, green, blue, alpha) with some helpful functions
	 * @example
	 * let a = new Color;              // white
	 * let b = new Color(1, 0, 0);     // red
	 * let c = new Color(0, 0, 0, 0);  // transparent black
	 * let d = rgb(0, 0, 1);           // blue using rgb color
	 * let e = hsl(.3, 1, .5);         // green using hsl color
	 */
	class Color
	{
	    /** Create a color with the rgba components passed in, white by default
	     *  @param {Number} [r] - red
	     *  @param {Number} [g] - green
	     *  @param {Number} [b] - blue
	     *  @param {Number} [a] - alpha*/
	    constructor(r=1, g=1, b=1, a=1)
	    {
	        /** @property {Number} - Red */
	        this.r = r;
	        /** @property {Number} - Green */
	        this.g = g;
	        /** @property {Number} - Blue */
	        this.b = b;
	        /** @property {Number} - Alpha */
	        this.a = a;
	    }

	    /** Returns a new color that is a copy of this
	     * @return {Color} */
	    copy() { return new Color(this.r, this.g, this.b, this.a); }

	    /** Returns a copy of this color plus the color passed in
	     * @param {Color} c - other color
	     * @return {Color} */
	    add(c)
	    {
	        ASSERT(isColor(c));
	        return new Color(this.r+c.r, this.g+c.g, this.b+c.b, this.a+c.a);
	    }

	    /** Returns a copy of this color minus the color passed in
	     * @param {Color} c - other color
	     * @return {Color} */
	    subtract(c)
	    {
	        ASSERT(isColor(c));
	        return new Color(this.r-c.r, this.g-c.g, this.b-c.b, this.a-c.a);
	    }

	    /** Returns a copy of this color times the color passed in
	     * @param {Color} c - other color
	     * @return {Color} */
	    multiply(c)
	    {
	        ASSERT(isColor(c));
	        return new Color(this.r*c.r, this.g*c.g, this.b*c.b, this.a*c.a);
	    }

	    /** Returns a copy of this color divided by the color passed in
	     * @param {Color} c - other color
	     * @return {Color} */
	    divide(c)
	    {
	        ASSERT(isColor(c));
	        return new Color(this.r/c.r, this.g/c.g, this.b/c.b, this.a/c.a);
	    }

	    /** Returns a copy of this color scaled by the value passed in, alpha can be scaled separately
	     * @param {Number} scale
	     * @param {Number} [alphaScale=scale]
	     * @return {Color} */
	    scale(scale, alphaScale=scale) 
	    { return new Color(this.r*scale, this.g*scale, this.b*scale, this.a*alphaScale); }

	    /** Returns a copy of this color clamped to the valid range between 0 and 1
	     * @return {Color} */
	    clamp() { return new Color(clamp(this.r), clamp(this.g), clamp(this.b), clamp(this.a)); }

	    /** Returns a new color that is p percent between this and the color passed in
	     * @param {Color}  c - other color
	     * @param {Number} percent
	     * @return {Color} */
	    lerp(c, percent)
	    {
	        ASSERT(isColor(c));
	        return this.add(c.subtract(this).scale(clamp(percent)));
	    }

	    /** Sets this color given a hue, saturation, lightness, and alpha
	     * @param {Number} [h] - hue
	     * @param {Number} [s] - saturation
	     * @param {Number} [l] - lightness
	     * @param {Number} [a] - alpha
	     * @return {Color} */
	    setHSLA(h=0, s=0, l=1, a=1)
	    {
	        const q = l < .5 ? l*(1+s) : l+s-l*s, p = 2*l-q,
	            f = (p, q, t)=>
	                (t = ((t%1)+1)%1) < 1/6 ? p+(q-p)*6*t :
	                t < 1/2 ? q :
	                t < 2/3 ? p+(q-p)*(2/3-t)*6 : p;
	                
	        this.r = f(p, q, h + 1/3);
	        this.g = f(p, q, h);
	        this.b = f(p, q, h - 1/3);
	        this.a = a;
	        return this;
	    }

	    /** Returns this color expressed in hsla format
	     * @return {Array} */
	    HSLA()
	    {
	        const r = clamp(this.r);
	        const g = clamp(this.g);
	        const b = clamp(this.b);
	        const a = clamp(this.a);
	        const max = Math.max(r, g, b);
	        const min = Math.min(r, g, b);
	        const l = (max + min) / 2;
	        
	        let h = 0, s = 0;
	        if (max != min)
	        {
	            let d = max - min;
	            s = l > .5 ? d / (2 - max - min) : d / (max + min);
	            if (r == max)
	                h = (g - b) / d + (g < b ? 6 : 0);
	            else if (g == max)
	                h = (b - r) / d + 2;
	            else if (b == max)
	                h =  (r - g) / d + 4;
	        }

	        return [h / 6, s, l, a];
	    }

	    /** Returns a new color that has each component randomly adjusted
	     * @param {Number} [amount]
	     * @param {Number} [alphaAmount]
	     * @return {Color} */
	    mutate(amount=.05, alphaAmount=0) 
	    {
	        return new Color
	        (
	            this.r + rand(amount, -amount),
	            this.g + rand(amount, -amount),
	            this.b + rand(amount, -amount),
	            this.a + rand(alphaAmount, -alphaAmount)
	        ).clamp();
	    }

	    /** Returns this color expressed as a hex color code
	     * @param {Boolean} [useAlpha] - if alpha should be included in result
	     * @return {String} */
	    toString(useAlpha = true)      
	    { 
	        const toHex = (c)=> ((c=c*255|0)<16 ? '0' : '') + c.toString(16);
	        return '#' + toHex(this.r) + toHex(this.g) + toHex(this.b) + (useAlpha ? toHex(this.a) : '');
	    }

	    /** Set this color from a hex code
	     * @param {String} hex - html hex code
	     * @return {Color} */
	    setHex(hex)
	    {
	        const fromHex = (c)=> clamp(parseInt(hex.slice(c,c+2),16)/255);
	        this.r = fromHex(1);
	        this.g = fromHex(3),
	        this.b = fromHex(5);
	        this.a = hex.length > 7 ? fromHex(7) : 1;
	        return this;
	    }
	    
	    /** Returns this color expressed as 32 bit RGBA value
	     * @return {Number} */
	    rgbaInt()  
	    {
	        const r = clamp(this.r)*255|0;
	        const g = clamp(this.g)*255<<8;
	        const b = clamp(this.b)*255<<16;
	        const a = clamp(this.a)*255<<24;
	        return r + g + b + a;
	    }
	}

	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Timer object tracks how long has passed since it was set
	 * @example
	 * let a = new Timer;    // creates a timer that is not set
	 * a.set(3);             // sets the timer to 3 seconds
	 *
	 * let b = new Timer(1); // creates a timer with 1 second left
	 * b.unset();            // unsets the timer
	 */
	class Timer
	{
	    /** Create a timer object set time passed in
	     *  @param {Number} [timeLeft] - How much time left before the timer elapses in seconds */
	    constructor(timeLeft) { this.time = timeLeft == undefined ? undefined : time + timeLeft; this.setTime = timeLeft; }

	    /** Set the timer with seconds passed in
	     *  @param {Number} [timeLeft] - How much time left before the timer is elapsed in seconds */
	    set(timeLeft=0) { this.time = time + timeLeft; this.setTime = timeLeft; }

	    /** Unset the timer */
	    unset() { this.time = undefined; }

	    /** Returns true if set
	     * @return {Boolean} */
	    isSet() { return this.time != undefined; }

	    /** Returns true if set and has not elapsed
	     * @return {Boolean} */
	    active() { return time <= this.time; }

	    /** Returns true if set and elapsed
	     * @return {Boolean} */
	    elapsed() { return time > this.time; }

	    /** Get how long since elapsed, returns 0 if not set (returns negative if currently active)
	     * @return {Number} */
	    get() { return this.isSet()? time - this.time : 0; }

	    /** Get percentage elapsed based on time it was set to, returns 0 if not set
	     * @return {Number} */
	    getPercent() { return this.isSet()? percent(this.time - time, this.setTime, 0) : 0; }
	    
	    /** Returns this timer expressed as a string
	     * @return {String} */
	    toString() { { return this.isSet() ? Math.abs(this.get()) + ' seconds ' + (this.get()<0 ? 'before' : 'after' ) : 'unset'; }}
	    
	    /** Get how long since elapsed, returns 0 if not set (returns negative if currently active)
	     * @return {Number} */
	    valueOf()               { return this.get(); }
	}
	/**
	 * LittleJS Engine Settings
	 * - All settings for the engine are here
	 * @namespace Settings
	 */



	///////////////////////////////////////////////////////////////////////////////
	// Camera settings

	/** Position of camera in world space
	 *  @type {Vector2}
	 *  @default Vector2()
	 *  @memberof Settings */
	let cameraPos = vec2();

	/** Scale of camera in world space
	 *  @type {Number}
	 *  @default
	 *  @memberof Settings */
	let cameraScale = 32;

	///////////////////////////////////////////////////////////////////////////////
	// Display settings

	/** The max size of the canvas, centered if window is larger
	 *  @type {Vector2}
	 *  @default Vector2(1920,1200)
	 *  @memberof Settings */
	let canvasMaxSize = vec2(1920, 1200);

	/** Fixed size of the canvas, if enabled canvas size never changes
	 * - you may also need to set mainCanvasSize if using screen space coords in startup
	 *  @type {Vector2}
	 *  @default Vector2()
	 *  @memberof Settings */
	let canvasFixedSize = vec2();

	/** Disables filtering for crisper pixel art if true
	 *  @type {Boolean}
	 *  @default
	 *  @memberof Settings */
	let canvasPixelated = true;

	/** Default font used for text rendering
	 *  @type {String}
	 *  @default
	 *  @memberof Settings */
	let fontDefault = 'arial';

	/** Enable to show the LittleJS splash screen be shown on startup
	 *  @type {Boolean}
	 *  @default
	 *  @memberof Settings */
	let showSplashScreen = false;

	///////////////////////////////////////////////////////////////////////////////
	// WebGL settings

	/** Enable webgl rendering, webgl can be disabled and removed from build (with some features disabled)
	 *  @type {Boolean}
	 *  @default
	 *  @memberof Settings */
	let glEnable = true;

	/** Fixes slow rendering in some browsers by not compositing the WebGL canvas
	 *  @type {Boolean}
	 *  @default
	 *  @memberof Settings */
	let glOverlay = true;

	///////////////////////////////////////////////////////////////////////////////
	// Tile sheet settings

	/** Default size of tiles in pixels
	 *  @type {Vector2}
	 *  @default Vector2(16,16)
	 *  @memberof Settings */
	let tileSizeDefault = vec2(16);

	/** How many pixels smaller to draw tiles to prevent bleeding from neighbors
	 *  @type {Number}
	 *  @default
	 *  @memberof Settings */
	let tileFixBleedScale = .1;

	///////////////////////////////////////////////////////////////////////////////
	// Object settings

	/** Enable physics solver for collisions between objects
	 *  @type {Boolean}
	 *  @default
	 *  @memberof Settings */
	let enablePhysicsSolver = true;

	/** Default object mass for collision calcuations (how heavy objects are)
	 *  @type {Number}
	 *  @default
	 *  @memberof Settings */
	let objectDefaultMass = 1;

	/** How much to slow velocity by each frame (0-1)
	 *  @type {Number}
	 *  @default
	 *  @memberof Settings */
	let objectDefaultDamping = 1;

	/** How much to slow angular velocity each frame (0-1)
	 *  @type {Number}
	 *  @default
	 *  @memberof Settings */
	let objectDefaultAngleDamping = 1;

	/** How much to bounce when a collision occurs (0-1)
	 *  @type {Number}
	 *  @default
	 *  @memberof Settings */
	let objectDefaultElasticity = 0;

	/** How much to slow when touching (0-1)
	 *  @type {Number}
	 *  @default
	 *  @memberof Settings */
	let objectDefaultFriction = .8;

	/** Clamp max speed to avoid fast objects missing collisions
	 *  @type {Number}
	 *  @default
	 *  @memberof Settings */
	let objectMaxSpeed = 1;

	/** How much gravity to apply to objects along the Y axis, negative is down
	 *  @type {Number}
	 *  @default
	 *  @memberof Settings */
	let gravity = 0;

	/** Scales emit rate of particles, useful for low graphics mode (0 disables particle emitters)
	 *  @type {Number}
	 *  @default
	 *  @memberof Settings */
	let particleEmitRateScale = 1;

	///////////////////////////////////////////////////////////////////////////////
	// Input settings

	/** Should gamepads be allowed
	 *  @type {Boolean}
	 *  @default
	 *  @memberof Settings */
	let gamepadsEnable = true;

	/** If true, the dpad input is also routed to the left analog stick (for better accessability)
	 *  @type {Boolean}
	 *  @default
	 *  @memberof Settings */
	let gamepadDirectionEmulateStick = true;

	/** If true the WASD keys are also routed to the direction keys (for better accessability)
	 *  @type {Boolean}
	 *  @default
	 *  @memberof Settings */
	let inputWASDEmulateDirection = true;

	/** True if touch gamepad should appear on mobile devices
	 *  - Supports left analog stick, 4 face buttons and start button (button 9)
	 *  - Must be set by end of gameInit to be activated
	 *  @type {Boolean}
	 *  @default
	 *  @memberof Settings */
	let touchGamepadEnable = false;

	/** True if touch gamepad should be analog stick or false to use if 8 way dpad
	 *  @type {Boolean}
	 *  @default
	 *  @memberof Settings */
	let touchGamepadAnalog = true;

	/** Size of virtual gamepad for touch devices in pixels
	 *  @type {Number}
	 *  @default
	 *  @memberof Settings */
	let touchGamepadSize = 99;

	/** Transparency of touch gamepad overlay
	 *  @type {Number}
	 *  @default
	 *  @memberof Settings */
	let touchGamepadAlpha = .3;

	/** Allow vibration hardware if it exists
	 *  @type {Boolean}
	 *  @default
	 *  @memberof Settings */
	let vibrateEnable = true;

	///////////////////////////////////////////////////////////////////////////////
	// Audio settings

	/** All audio code can be disabled and removed from build
	 *  @type {Boolean}
	 *  @default
	 *  @memberof Settings */
	let soundEnable = true;

	/** Volume scale to apply to all sound, music and speech
	 *  @type {Number}
	 *  @default
	 *  @memberof Settings */
	let soundVolume = .5;

	/** Default range where sound no longer plays
	 *  @type {Number}
	 *  @default
	 *  @memberof Settings */
	let soundDefaultRange = 40;

	/** Default range percent to start tapering off sound (0-1)
	 *  @type {Number}
	 *  @default
	 *  @memberof Settings */
	let soundDefaultTaper = .7;

	///////////////////////////////////////////////////////////////////////////////
	// Medals settings

	/** How long to show medals for in seconds
	 *  @type {Number}
	 *  @default
	 *  @memberof Settings */
	let medalDisplayTime = 5;

	/** How quickly to slide on/off medals in seconds
	 *  @type {Number}
	 *  @default
	 *  @memberof Settings */
	let medalDisplaySlideTime = .5;

	/** Size of medal display
	 *  @type {Vector2}
	 *  @default Vector2(640,80)
	 *  @memberof Settings */
	let medalDisplaySize = vec2(640, 80);

	/** Size of icon in medal display
	 *  @type {Number}
	 *  @default
	 *  @memberof Settings */
	let medalDisplayIconSize = 50;

	/** Set to stop medals from being unlockable (like if cheats are enabled)
	 *  @type {Boolean}
	 *  @default
	 *  @memberof Settings */
	let medalsPreventUnlock = false;

	///////////////////////////////////////////////////////////////////////////////
	// Setters for global variables

	/** Set position of camera in world space
	 *  @param {Vector2} pos
	 *  @memberof Settings */
	function setCameraPos(pos) { cameraPos = pos; }

	/** Set scale of camera in world space
	 *  @param {Number} scale
	 *  @memberof Settings */
	function setCameraScale(scale) { cameraScale = scale; }

	/** Set max size of the canvas
	 *  @param {Vector2} size
	 *  @memberof Settings */
	function setCanvasMaxSize(size) { canvasMaxSize = size; }

	/** Set fixed size of the canvas
	 *  @param {Vector2} size
	 *  @memberof Settings */
	function setCanvasFixedSize(size) { canvasFixedSize = size; }

	/** Disables anti aliasing for pixel art if true
	 *  @param {Boolean} pixelated
	 *  @memberof Settings */
	function setCanvasPixelated(pixelated) { canvasPixelated = pixelated; }

	/** Set default font used for text rendering
	 *  @param {String} font
	 *  @memberof Settings */
	function setFontDefault(font) { fontDefault = font; }

	/** Set if the LittleJS splash screen be shown on startup
	 *  @param {Boolean} show
	 *  @memberof Settings */
	function setShowSplashScreen(show) { showSplashScreen = show; }

	/** Set if webgl rendering is enabled
	 *  @param {Boolean} enable
	 *  @memberof Settings */
	function setGlEnable(enable) { glEnable = enable; }

	/** Set to not composite the WebGL canvas
	 *  @param {Boolean} overlay
	 *  @memberof Settings */
	function setGlOverlay(overlay) { glOverlay = overlay; }

	/** Set default size of tiles in pixels
	 *  @param {Vector2} size
	 *  @memberof Settings */
	function setTileSizeDefault(size) { tileSizeDefault = size; }

	/** Set to prevent tile bleeding from neighbors in pixels
	 *  @param {Number} scale
	 *  @memberof Settings */
	function setTileFixBleedScale(scale) { tileFixBleedScale = scale; }

	/** Set if collisions between objects are enabled
	 *  @param {Boolean} enable
	 *  @memberof Settings */
	function setEnablePhysicsSolver(enable) { enablePhysicsSolver = enable; }

	/** Set default object mass for collison calcuations
	 *  @param {Number} mass
	 *  @memberof Settings */
	function setObjectDefaultMass(mass) { objectDefaultMass = mass; }

	/** Set how much to slow velocity by each frame
	 *  @param {Number} damp
	 *  @memberof Settings */
	function setObjectDefaultDamping(damp) { objectDefaultDamping = damp; }

	/** Set how much to slow angular velocity each frame
	 *  @param {Number} damp
	 *  @memberof Settings */
	function setObjectDefaultAngleDamping(damp) { objectDefaultAngleDamping = damp; }

	/** Set how much to bounce when a collision occur
	 *  @param {Number} elasticity
	 *  @memberof Settings */
	function setObjectDefaultElasticity(elasticity) { objectDefaultElasticity = elasticity; }

	/** Set how much to slow when touching
	 *  @param {Number} friction
	 *  @memberof Settings */
	function setObjectDefaultFriction(friction) { objectDefaultFriction = friction; }

	/** Set max speed to avoid fast objects missing collisions
	 *  @param {Number} speed
	 *  @memberof Settings */
	function setObjectMaxSpeed(speed) { objectMaxSpeed = speed; }

	/** Set how much gravity to apply to objects along the Y axis
	 *  @param {Number} newGravity
	 *  @memberof Settings */
	function setGravity(newGravity) { gravity = newGravity; }

	/** Set to scales emit rate of particles
	 *  @param {Number} scale
	 *  @memberof Settings */
	function setParticleEmitRateScale(scale) { particleEmitRateScale = scale; }

	/** Set if gamepads are enabled
	 *  @param {Boolean} enable
	 *  @memberof Settings */
	function setGamepadsEnable(enable) { gamepadsEnable = enable; }

	/** Set if the dpad input is also routed to the left analog stick
	 *  @param {Boolean} enable
	 *  @memberof Settings */
	function setGamepadDirectionEmulateStick(enable) { gamepadDirectionEmulateStick = enable; }

	/** Set if true the WASD keys are also routed to the direction keys
	 *  @param {Boolean} enable
	 *  @memberof Settings */
	function setInputWASDEmulateDirection(enable) { inputWASDEmulateDirection = enable; }

	/** Set if touch gamepad should appear on mobile devices
	 *  @param {Boolean} enable
	 *  @memberof Settings */
	function setTouchGamepadEnable(enable) { touchGamepadEnable = enable; }

	/** Set if touch gamepad should be analog stick or 8 way dpad
	 *  @param {Boolean} analog
	 *  @memberof Settings */
	function setTouchGamepadAnalog(analog) { touchGamepadAnalog = analog; }

	/** Set size of virutal gamepad for touch devices in pixels
	 *  @param {Number} size
	 *  @memberof Settings */
	function setTouchGamepadSize(size) { touchGamepadSize = size; }

	/** Set transparency of touch gamepad overlay
	 *  @param {Number} alpha
	 *  @memberof Settings */
	function setTouchGamepadAlpha(alpha) { touchGamepadAlpha = alpha; }

	/** Set to allow vibration hardware if it exists
	 *  @param {Boolean} enable
	 *  @memberof Settings */
	function setVibrateEnable(enable) { vibrateEnable = enable; }

	/** Set to disable all audio code
	 *  @param {Boolean} enable
	 *  @memberof Settings */
	function setSoundEnable(enable) { soundEnable = enable; }

	/** Set volume scale to apply to all sound, music and speech
	 *  @param {Number} volume
	 *  @memberof Settings */
	function setSoundVolume(volume) { soundVolume = volume; }

	/** Set default range where sound no longer plays
	 *  @param {Number} range
	 *  @memberof Settings */
	function setSoundDefaultRange(range) { soundDefaultRange = range; }

	/** Set default range percent to start tapering off sound
	 *  @param {Number} taper
	 *  @memberof Settings */
	function setSoundDefaultTaper(taper) { soundDefaultTaper = taper; }

	/** Set how long to show medals for in seconds
	 *  @param {Number} time
	 *  @memberof Settings */
	function setMedalDisplayTime(time) { medalDisplayTime = time; }

	/** Set how quickly to slide on/off medals in seconds
	 *  @param {Number} time
	 *  @memberof Settings */
	function setMedalDisplaySlideTime(time) { medalDisplaySlideTime = time; }

	/** Set size of medal display
	 *  @param {Vector2} size
	 *  @memberof Settings */
	function setMedalDisplaySize(size) { medalDisplaySize = size; }

	/** Set size of icon in medal display
	 *  @param {Number} size
	 *  @memberof Settings */
	function setMedalDisplayIconSize(size) { medalDisplayIconSize = size; }

	/** Set to stop medals from being unlockable
	 *  @param {Boolean} preventUnlock
	 *  @memberof Settings */
	function setMedalsPreventUnlock(preventUnlock) { medalsPreventUnlock = preventUnlock; }

	/** Set if watermark with FPS should be shown
	 *  @param {Boolean} show
	 *  @memberof Debug */
	function setShowWatermark(show) { showWatermark = show; }

	/** Set key code used to toggle debug mode, Esc by default
	 *  @param {String} key
	 *  @memberof Debug */
	function setDebugKey(key) { debugKey = key; }
	/** 
	 * LittleJS Object System
	 */



	/** 
	 * LittleJS Object Base Object Class
	 * - Top level object class used by the engine
	 * - Automatically adds self to object list
	 * - Will be updated and rendered each frame
	 * - Renders as a sprite from a tilesheet by default
	 * - Can have color and additive color applied
	 * - 2D Physics and collision system
	 * - Sorted by renderOrder
	 * - Objects can have children attached
	 * - Parents are updated before children, and set child transform
	 * - Call destroy() to get rid of objects
	 *
	 * The physics system used by objects is simple and fast with some caveats...
	 * - Collision uses the axis aligned size, the object's rotation angle is only for rendering
	 * - Objects are guaranteed to not intersect tile collision from physics
	 * - If an object starts or is moved inside tile collision, it will not collide with that tile
	 * - Collision for objects can be set to be solid to block other objects
	 * - Objects may get pushed into overlapping other solid objects, if so they will push away
	 * - Solid objects are more performance intensive and should be used sparingly
	 * @example
	 * // create an engine object, normally you would first extend the class with your own
	 * const pos = vec2(2,3);
	 * const object = new EngineObject(pos); 
	 */
	class EngineObject
	{
	    /** Create an engine object and adds it to the list of objects
	     *  @param {Vector2}  [pos=(0,0)]       - World space position of the object
	     *  @param {Vector2}  [size=(1,1)]      - World space size of the object
	     *  @param {TileInfo} [tileInfo]        - Tile info to render object (undefined is untextured)
	     *  @param {Number}   [angle]           - Angle the object is rotated by
	     *  @param {Color}    [color=(1,1,1,1)] - Color to apply to tile when rendered
	     *  @param {Number}   [renderOrder]     - Objects sorted by renderOrder before being rendered
	     */
	    constructor(pos=vec2(), size=vec2(1), tileInfo, angle=0, color, renderOrder=0)
	    {
	        // set passed in params
	        ASSERT(isVector2(pos) && isVector2(size), 'ensure pos and size are vec2s');
	        ASSERT(typeof tileInfo !== 'number' || !tileInfo, 'old style tile setup');

	        /** @property {Vector2} - World space position of the object */
	        this.pos = pos.copy();
	        /** @property {Vector2} - World space width and height of the object */
	        this.size = size;
	        /** @property {Vector2} - Size of object used for drawing, uses size if not set */
	        this.drawSize = undefined;
	        /** @property {TileInfo} - Tile info to render object (undefined is untextured) */
	        this.tileInfo = tileInfo;
	        /** @property {Number}  - Angle to rotate the object */
	        this.angle = angle;
	        /** @property {Color}   - Color to apply when rendered */
	        this.color = color;
	        /** @property {Color}   - Additive color to apply when rendered */
	        this.additiveColor = undefined;
	        /** @property {Boolean} - Should it flip along y axis when rendered */
	        this.mirror = false;

	        // physical properties
	        /** @property {Number} [mass=objectDefaultMass]                 - How heavy the object is, static if 0 */
	        this.mass         = objectDefaultMass;
	        /** @property {Number} [damping=objectDefaultDamping]           - How much to slow down velocity each frame (0-1) */
	        this.damping      = objectDefaultDamping;
	        /** @property {Number} [angleDamping=objectDefaultAngleDamping] - How much to slow down rotation each frame (0-1) */
	        this.angleDamping = objectDefaultAngleDamping;
	        /** @property {Number} [elasticity=objectDefaultElasticity]     - How bouncy the object is when colliding (0-1) */
	        this.elasticity   = objectDefaultElasticity;
	        /** @property {Number} [friction=objectDefaultFriction]         - How much friction to apply when sliding (0-1) */
	        this.friction     = objectDefaultFriction;
	        /** @property {Number}  - How much to scale gravity by for this object */
	        this.gravityScale = 1;
	        /** @property {Number}  - Objects are sorted by render order */
	        this.renderOrder = renderOrder;
	        /** @property {Vector2} - Velocity of the object */
	        this.velocity = vec2();
	        /** @property {Number}  - Angular velocity of the object */
	        this.angleVelocity = 0;
	        /** @property {Number}  - Track when object was created  */
	        this.spawnTime = time;
	        /** @property {Array}   - List of children of this object */
	        this.children = [];

	        // parent child system
	        /** @property {EngineObject} - Parent of object if in local space  */
	        this.parent = undefined;
	        /** @property {Vector2}      - Local position if child */
	        this.localPos = vec2();
	        /** @property {Number}       - Local angle if child  */
	        this.localAngle = 0;

	        // collision flags
	        /** @property {Boolean} - Object collides with the tile collision */
	        this.collideTiles = false;
	        /** @property {Boolean} - Object collides with solid objects */
	        this.collideSolidObjects = false;
	        /** @property {Boolean} - Object collides with and blocks other objects */
	        this.isSolid = false;
	        /** @property {Boolean} - Object collides with raycasts */
	        this.collideRaycast = false;

	        // add to list of objects
	        engineObjects.push(this);
	    }
	    
	    /** Update the object transform and physics, called automatically by engine once each frame */
	    update()
	    {
	        const parent = this.parent;
	        if (parent)
	        {
	            // copy parent pos/angle
	            this.pos = this.localPos.multiply(vec2(parent.getMirrorSign(),1)).rotate(-parent.angle).add(parent.pos);
	            this.angle = parent.getMirrorSign()*this.localAngle + parent.angle;
	            return;
	        }

	        // limit max speed to prevent missing collisions
	        this.velocity.x = clamp(this.velocity.x, -objectMaxSpeed, objectMaxSpeed);
	        this.velocity.y = clamp(this.velocity.y, -objectMaxSpeed, objectMaxSpeed);

	        // apply physics
	        const oldPos = this.pos.copy();
	        this.velocity.y += gravity * this.gravityScale;
	        this.pos.x += this.velocity.x *= this.damping;
	        this.pos.y += this.velocity.y *= this.damping;
	        this.angle += this.angleVelocity *= this.angleDamping;

	        // physics sanity checks
	        ASSERT(this.angleDamping >= 0 && this.angleDamping <= 1);
	        ASSERT(this.damping >= 0 && this.damping <= 1);

	        if (!enablePhysicsSolver || !this.mass) // do not update collision for fixed objects
	            return;

	        const wasMovingDown = this.velocity.y < 0;
	        if (this.groundObject)
	        {
	            // apply friction in local space of ground object
	            const groundSpeed = this.groundObject.velocity ? this.groundObject.velocity.x : 0;
	            this.velocity.x = groundSpeed + (this.velocity.x - groundSpeed) * this.friction;
	            this.groundObject = 0;
	            //debugOverlay && debugPhysics && debugPoint(this.pos.subtract(vec2(0,this.size.y/2)), '#0f0');
	        }

	        if (this.collideSolidObjects)
	        {
	            // check collisions against solid objects
	            const epsilon = .001; // necessary to push slightly outside of the collision
	            for (const o of engineObjectsCollide)
	            {
	                // non solid objects don't collide with eachother
	                if (!this.isSolid && !o.isSolid || o.destroyed || o.parent || o == this)
	                    continue;

	                // check collision
	                if (!isOverlapping(this.pos, this.size, o.pos, o.size))
	                    continue;

	                // notify objects of collision and check if should be resolved
	                const collide1 = this.collideWithObject(o);
	                const collide2 = o.collideWithObject(this);
	                if (!collide1 || !collide2)
	                    continue;

	                if (isOverlapping(oldPos, this.size, o.pos, o.size))
	                {
	                    // if already was touching, try to push away
	                    const deltaPos = oldPos.subtract(o.pos);
	                    const length = deltaPos.length();
	                    const pushAwayAccel = .001; // push away if already overlapping
	                    const velocity = length < .01 ? randVector(pushAwayAccel) : deltaPos.scale(pushAwayAccel/length);
	                    this.velocity = this.velocity.add(velocity);
	                    if (o.mass) // push away if not fixed
	                        o.velocity = o.velocity.subtract(velocity);
	                        
	                    debugOverlay && debugPhysics && debugAABB(this.pos, this.size, o.pos, o.size, '#f00');
	                    continue;
	                }

	                // check for collision
	                const sizeBoth = this.size.add(o.size);
	                const smallStepUp = (oldPos.y - o.pos.y)*2 > sizeBoth.y + gravity; // prefer to push up if small delta
	                const isBlockedX = abs(oldPos.y - o.pos.y)*2 < sizeBoth.y;
	                const isBlockedY = abs(oldPos.x - o.pos.x)*2 < sizeBoth.x;
	                const elasticity = max(this.elasticity, o.elasticity);
	                
	                if (smallStepUp || isBlockedY || !isBlockedX) // resolve y collision
	                {
	                    // push outside object collision
	                    this.pos.y = o.pos.y + (sizeBoth.y/2 + epsilon) * sign(oldPos.y - o.pos.y);
	                    if (o.groundObject && wasMovingDown || !o.mass)
	                    {
	                        // set ground object if landed on something
	                        if (wasMovingDown)
	                            this.groundObject = o;

	                        // bounce if other object is fixed or grounded
	                        this.velocity.y *= -elasticity;
	                    }
	                    else if (o.mass)
	                    {
	                        // inelastic collision
	                        const inelastic = (this.mass * this.velocity.y + o.mass * o.velocity.y) / (this.mass + o.mass);

	                        // elastic collision
	                        const elastic0 = this.velocity.y * (this.mass - o.mass) / (this.mass + o.mass)
	                            + o.velocity.y * 2 * o.mass / (this.mass + o.mass);
	                        const elastic1 = o.velocity.y * (o.mass - this.mass) / (this.mass + o.mass)
	                            + this.velocity.y * 2 * this.mass / (this.mass + o.mass);

	                        // lerp betwen elastic or inelastic based on elasticity
	                        this.velocity.y = lerp(elasticity, inelastic, elastic0);
	                        o.velocity.y = lerp(elasticity, inelastic, elastic1);
	                    }
	                }
	                if (!smallStepUp && isBlockedX) // resolve x collision
	                {
	                    // push outside collision
	                    this.pos.x = o.pos.x + (sizeBoth.x/2 + epsilon) * sign(oldPos.x - o.pos.x);
	                    if (o.mass)
	                    {
	                        // inelastic collision
	                        const inelastic = (this.mass * this.velocity.x + o.mass * o.velocity.x) / (this.mass + o.mass);

	                        // elastic collision
	                        const elastic0 = this.velocity.x * (this.mass - o.mass) / (this.mass + o.mass)
	                            + o.velocity.x * 2 * o.mass / (this.mass + o.mass);
	                        const elastic1 = o.velocity.x * (o.mass - this.mass) / (this.mass + o.mass)
	                            + this.velocity.x * 2 * this.mass / (this.mass + o.mass);

	                        // lerp betwen elastic or inelastic based on elasticity
	                        this.velocity.x = lerp(elasticity, inelastic, elastic0);
	                        o.velocity.x = lerp(elasticity, inelastic, elastic1);
	                    }
	                    else // bounce if other object is fixed
	                        this.velocity.x *= -elasticity;
	                }
	                debugOverlay && debugPhysics && debugAABB(this.pos, this.size, o.pos, o.size, '#f0f');
	            }
	        }
	        if (this.collideTiles)
	        {
	            // check collision against tiles
	            if (tileCollisionTest(this.pos, this.size, this))
	            {
	                // if already was stuck in collision, don't do anything
	                // this should not happen unless something starts in collision
	                if (!tileCollisionTest(oldPos, this.size, this))
	                {
	                    // test which side we bounced off (or both if a corner)
	                    const isBlockedY = tileCollisionTest(vec2(oldPos.x, this.pos.y), this.size, this);
	                    const isBlockedX = tileCollisionTest(vec2(this.pos.x, oldPos.y), this.size, this);
	                    if (isBlockedY || !isBlockedX)
	                    {
	                        // set if landed on ground
	                        this.groundObject = wasMovingDown;

	                        // bounce velocity
	                        this.velocity.y *= -this.elasticity;

	                        // adjust next velocity to settle on ground
	                        const o = (oldPos.y - this.size.y/2|0) - (oldPos.y - this.size.y/2);
	                        if (o < 0 && o > this.damping * this.velocity.y + gravity * this.gravityScale) 
	                            this.velocity.y = this.damping ? (o - gravity * this.gravityScale) / this.damping : 0;

	                        // move to previous position
	                        this.pos.y = oldPos.y;
	                    }
	                    if (isBlockedX)
	                    {
	                        // move to previous position and bounce
	                        this.pos.x = oldPos.x;
	                        this.velocity.x *= -this.elasticity;
	                    }
	                }
	            }
	        }
	    }
	       
	    /** Render the object, draws a tile by default, automatically called each frame, sorted by renderOrder */
	    render()
	    {
	        // default object render
	        drawTile(this.pos, this.drawSize || this.size, this.tileInfo, this.color, this.angle, this.mirror, this.additiveColor);
	    }
	    
	    /** Destroy this object, destroy it's children, detach it's parent, and mark it for removal */
	    destroy()
	    { 
	        if (this.destroyed)
	            return;
	        
	        // disconnect from parent and destroy chidren
	        this.destroyed = 1;
	        this.parent && this.parent.removeChild(this);
	        for (const child of this.children)
	            child.destroy(child.parent = 0);
	    }
	    
	    /** Called to check if a tile collision should be resolved
	     *  @param {Number}  tileData - the value of the tile at the position
	     *  @param {Vector2} pos      - tile where the collision occured
	     *  @return {Boolean}         - true if the collision should be resolved */
	    collideWithTile(tileData, pos)    { return tileData > 0; }

	    /** Called to check if a object collision should be resolved
	     *  @param {EngineObject} object - the object to test against
	     *  @return {Boolean}            - true if the collision should be resolved
	     */
	    collideWithObject(object)         { return true; }

	    /** How long since the object was created
	     *  @return {Number} */
	    getAliveTime()                    { return time - this.spawnTime; }

	    /** Apply acceleration to this object (adjust velocity, not affected by mass)
	     *  @param {Vector2} acceleration */
	    applyAcceleration(acceleration)   { if (this.mass) this.velocity = this.velocity.add(acceleration); }

	    /** Apply force to this object (adjust velocity, affected by mass)
	     *  @param {Vector2} force */
	    applyForce(force)	              { this.applyAcceleration(force.scale(1/this.mass)); }
	    
	    /** Get the direction of the mirror
	     *  @return {Number} -1 if this.mirror is true, or 1 if not mirrored */
	    getMirrorSign() { return this.mirror ? -1 : 1; }

	    /** Attaches a child to this with a given local transform
	     *  @param {EngineObject} child
	     *  @param {Vector2}      [localPos=(0,0)]
	     *  @param {Number}       [localAngle] */
	    addChild(child, localPos=vec2(), localAngle=0)
	    {
	        ASSERT(!child.parent && !this.children.includes(child));
	        this.children.push(child);
	        child.parent = this;
	        child.localPos = localPos.copy();
	        child.localAngle = localAngle;
	    }

	    /** Removes a child from this one
	     *  @param {EngineObject} child */
	    removeChild(child)
	    {
	        ASSERT(child.parent == this && this.children.includes(child));
	        this.children.splice(this.children.indexOf(child), 1);
	        child.parent = 0;
	    }

	    /** Set how this object collides
	     *  @param {Boolean} [collideSolidObjects] - Does it collide with solid objects?
	     *  @param {Boolean} [isSolid]             - Does it collide with and block other objects? (expensive in large numbers)
	     *  @param {Boolean} [collideTiles]        - Does it collide with the tile collision?
	     *  @param {Boolean} [collideRaycast]      - Does it collide with raycasts? */
	    setCollision(collideSolidObjects=true, isSolid=true, collideTiles=true, collideRaycast=true)
	    {
	        ASSERT(collideSolidObjects || !isSolid, 'solid objects must be set to collide');

	        this.collideSolidObjects = collideSolidObjects;
	        this.isSolid = isSolid;
	        this.collideTiles = collideTiles;
	        this.collideRaycast = collideRaycast;
	    }

	    /** Returns string containg info about this object for debugging
	     *  @return {String} */
	    toString()
	    {
	        {
	            let text = 'type = ' + this.constructor.name;
	            if (this.pos.x || this.pos.y)
	                text += '\npos = ' + this.pos;
	            if (this.velocity.x || this.velocity.y)
	                text += '\nvelocity = ' + this.velocity;
	            if (this.size.x || this.size.y)
	                text += '\nsize = ' + this.size;
	            if (this.angle)
	                text += '\nangle = ' + this.angle.toFixed(3);
	            if (this.color)
	                text += '\ncolor = ' + this.color;
	            return text;
	        }
	    }
	}
	/** 
	 * LittleJS Drawing System
	 * - Hybrid system with both Canvas2D and WebGL available
	 * - Super fast tile sheet rendering with WebGL
	 * - Can apply rotation, mirror, color and additive color
	 * - Font rendering system with built in engine font
	 * - Many useful utility functions
	 * 
	 * LittleJS uses a hybrid rendering solution with the best of both Canvas2D and WebGL.
	 * There are 3 canvas/contexts available to draw to...
	 * mainCanvas - 2D background canvas, non WebGL stuff like tile layers are drawn here.
	 * glCanvas - Used by the accelerated WebGL batch rendering system.
	 * overlayCanvas - Another 2D canvas that appears on top of the other 2 canvases.
	 * 
	 * The WebGL rendering system is very fast with some caveats...
	 * - Switching blend modes (additive) or textures causes another draw call which is expensive in excess
	 * - Group additive rendering together using renderOrder to mitigate this issue
	 * 
	 * The LittleJS rendering solution is intentionally simple, feel free to adjust it for your needs!
	 * @namespace Draw
	 */



	/** The primary 2D canvas visible to the user
	 *  @type {HTMLCanvasElement}
	 *  @memberof Draw */
	let mainCanvas;

	/** 2d context for mainCanvas
	 *  @type {CanvasRenderingContext2D}
	 *  @memberof Draw */
	let mainContext;

	/** A canvas that appears on top of everything the same size as mainCanvas
	 *  @type {HTMLCanvasElement}
	 *  @memberof Draw */
	let overlayCanvas;

	/** 2d context for overlayCanvas
	 *  @type {CanvasRenderingContext2D}
	 *  @memberof Draw */
	let overlayContext;

	/** The size of the main canvas (and other secondary canvases) 
	 *  @type {Vector2}
	 *  @memberof Draw */
	let mainCanvasSize = vec2();

	/** Array containing texture info for batch rendering system
	 *  @type {Array}
	 *  @memberof Draw */
	let textureInfos = [];

	// Keep track of how many draw calls there were each frame for debugging
	let drawCount;

	///////////////////////////////////////////////////////////////////////////////

	/** 
	 * Create a tile info object
	 * - This can take vecs or floats for easier use and conversion
	 * - If an index is passed in, the tile size and index will determine the position
	 * @param {(Number|Vector2)} [pos=(0,0)]            - Top left corner of tile in pixels or index
	 * @param {(Number|Vector2)} [size=tileSizeDefault] - Size of tile in pixels
	 * @param {Number} [textureIndex]                   - Texture index to use
	 * @return {TileInfo}
	 * @example
	 * tile(2)                       // a tile at index 2 using the default tile size of 16
	 * tile(5, 8)                    // a tile at index 5 using a tile size of 8
	 * tile(1, 16, 3)                // a tile at index 1 of size 16 on texture 3
	 * tile(vec2(4,8), vec2(30,10))  // a tile at pixel location (4,8) with a size of (30,10)
	 * @memberof Draw
	 */
	function tile(pos=vec2(), size=tileSizeDefault, textureIndex=0)
	{
	    // if size is a number, make it a vector
	    if (typeof size === 'number')
	    {
	        ASSERT(size > 0);
	        size = vec2(size);
	    }

	    // if pos is a number, use it as a tile index
	    if (typeof pos === 'number')
	    {
	        const textureInfo = textureInfos[textureIndex];
	        ASSERT(textureInfo, 'Texture not loaded');
	        const cols = textureInfo.size.x / size.x |0;
	        pos = vec2((pos%cols)*size.x, (pos/cols|0)*size.y);
	    }

	    // return a tile info object
	    return new TileInfo(pos, size, textureIndex); 
	}

	/** 
	 * Tile Info - Stores info about how to draw a tile
	 */
	class TileInfo
	{
	    /** Create a tile info object
	     *  @param {Vector2} [pos=(0,0)]            - Top left corner of tile in pixels
	     *  @param {Vector2} [size=tileSizeDefault] - Size of tile in pixels
	     *  @param {Number}  [textureIndex]         - Texture index to use
	     */
	    constructor(pos=vec2(), size=tileSizeDefault, textureIndex=0)
	    {
	        /** @property {Vector2} - Top left corner of tile in pixels */
	        this.pos = pos;
	        /** @property {Vector2} - Size of tile in pixels */
	        this.size = size;
	        /** @property {Number} - Texture index to use */
	        this.textureIndex = textureIndex;
	    }

	    /** Returns a copy of this tile offset by a vector
	    *  @param {Vector2} offset - Offset to apply in pixels
	    *  @return {TileInfo}
	    */
	    offset(offset)
	    { return new TileInfo(this.pos.add(offset), this.size, this.textureIndex); }

	    /** Returns a copy of this tile offset by a number of animation frames
	    *  @param {Number} frame - Offset to apply in animation frames
	    *  @return {TileInfo}
	    */
	    frame(frame)
	    {
	        ASSERT(typeof frame == 'number');
	        return this.offset(vec2(frame*this.size.x, 0));
	    }

	    /** Returns the texture info for this tile
	    *  @return {TextureInfo}
	    */
	    getTextureInfo()
	    { return textureInfos[this.textureIndex]; }
	}

	/** Texture Info - Stores info about each texture */
	class TextureInfo
	{
	    /**
	     * Create a TextureInfo, called automatically by the engine
	     * @param {HTMLImageElement} image
	     */
	    constructor(image)
	    {
	        /** @property {HTMLImageElement} - image source */
	        this.image = image;
	        /** @property {Vector2} - size of the image */
	        this.size = vec2(image.width, image.height);
	        /** @property {WebGLTexture} - webgl texture */
	        this.glTexture = glEnable && glCreateTexture(image);
	        /** @property {Vector2} - size to adjust tile to fix bleeding */
	        this.fixBleedSize = vec2(tileFixBleedScale).divide(this.size);
	    }
	}

	///////////////////////////////////////////////////////////////////////////////

	/** Convert from screen to world space coordinates
	 *  @param {Vector2} screenPos
	 *  @return {Vector2}
	 *  @memberof Draw */
	function screenToWorld(screenPos)
	{
	    return new Vector2
	    (
	        (screenPos.x - mainCanvasSize.x/2 + .5) /  cameraScale + cameraPos.x,
	        (screenPos.y - mainCanvasSize.y/2 + .5) / -cameraScale + cameraPos.y
	    );
	}

	/** Convert from world to screen space coordinates
	 *  @param {Vector2} worldPos
	 *  @return {Vector2}
	 *  @memberof Draw */
	function worldToScreen(worldPos)
	{
	    return new Vector2
	    (
	        (worldPos.x - cameraPos.x) *  cameraScale + mainCanvasSize.x/2 - .5,
	        (worldPos.y - cameraPos.y) * -cameraScale + mainCanvasSize.y/2 - .5
	    );
	}

	/** Get the camera's visible area in world space
	 *  @return {Vector2}
	 *  @memberof Draw */
	function getCameraSize() { return mainCanvasSize.scale(1/cameraScale); }

	/** Draw textured tile centered in world space, with color applied if using WebGL
	 *  @param {Vector2} pos                        - Center of the tile in world space
	 *  @param {Vector2} [size=(1,1)]               - Size of the tile in world space
	 *  @param {TileInfo}[tileInfo]                 - Tile info to use, untextured if undefined
	 *  @param {Color}   [color=(1,1,1,1)]          - Color to modulate with
	 *  @param {Number}  [angle]                    - Angle to rotate by
	 *  @param {Boolean} [mirror]                   - If true image is flipped along the Y axis
	 *  @param {Color}   [additiveColor=(0,0,0,0)]  - Additive color to be applied
	 *  @param {Boolean} [useWebGL=glEnable]        - Use accelerated WebGL rendering
	 *  @param {Boolean} [screenSpace=false]        - If true the pos and size are in screen space
	 *  @param {CanvasRenderingContext2D} [context] - Canvas 2D context to draw to
	 *  @memberof Draw */
	function drawTile(pos, size=vec2(1), tileInfo, color=new Color,
	    angle=0, mirror, additiveColor=new Color(0,0,0,0), useWebGL=glEnable, screenSpace, context)
	{
	    ASSERT(!context || !useWebGL, 'context only supported in canvas 2D mode'); 
	    ASSERT(typeof tileInfo !== 'number' || !tileInfo, 
	        'this is an old style calls, to fix replace it with tile(tileIndex, tileSize)');

	    const textureInfo = tileInfo && tileInfo.getTextureInfo();
	    if (useWebGL)
	    {
	        if (screenSpace)
	        {
	            // convert to world space
	            pos = screenToWorld(pos);
	            size = size.scale(1/cameraScale);
	        }
	        
	        if (textureInfo)
	        {
	            // calculate uvs and render
	            const x = tileInfo.pos.x / textureInfo.size.x;
	            const y = tileInfo.pos.y / textureInfo.size.y;
	            const w = tileInfo.size.x / textureInfo.size.x;
	            const h = tileInfo.size.y / textureInfo.size.y;
	            const tileImageFixBleed = textureInfo.fixBleedSize;
	            glSetTexture(textureInfo.glTexture);
	            glDraw(pos.x, pos.y, mirror ? -size.x : size.x, size.y, angle, 
	                x + tileImageFixBleed.x,     y + tileImageFixBleed.y, 
	                x - tileImageFixBleed.x + w, y - tileImageFixBleed.y + h, 
	                color.rgbaInt(), additiveColor.rgbaInt()); 
	        }
	        else
	        {
	            // if no tile info, force untextured
	            glDraw(pos.x, pos.y, size.x, size.y, angle, 0, 0, 0, 0, 0, color.rgbaInt()); 
	        }
	    }
	    else
	    {
	        // normal canvas 2D rendering method (slower)
	        showWatermark && ++drawCount;
	        drawCanvas2D(pos, size, angle, mirror, (context)=>
	        {
	            if (textureInfo)
	            {
	                // calculate uvs and render
	                const x = tileInfo.pos.x + tileFixBleedScale;
	                const y = tileInfo.pos.y + tileFixBleedScale;
	                const w = tileInfo.size.x - 2*tileFixBleedScale;
	                const h = tileInfo.size.y - 2*tileFixBleedScale;
	                context.globalAlpha = color.a; // only alpha is supported
	                context.drawImage(textureInfo.image, x, y, w, h, -.5, -.5, 1, 1);
	                context.globalAlpha = 1; // set back to full alpha
	            }
	            else
	            {
	                // if no tile info, force untextured
	                context.fillStyle = color;
	                context.fillRect(-.5, -.5, 1, 1);
	            }
	        }, screenSpace, context);
	    }
	}

	/** Draw colored rect centered on pos
	 *  @param {Vector2} pos
	 *  @param {Vector2} [size=(1,1)]
	 *  @param {Color}   [color=(1,1,1,1)]
	 *  @param {Number}  [angle]
	 *  @param {Boolean} [useWebGL=glEnable]
	 *  @param {Boolean} [screenSpace=false]
	 *  @param {CanvasRenderingContext2D} [context]
	 *  @memberof Draw */
	function drawRect(pos, size, color, angle, useWebGL, screenSpace, context)
	{ 
	    drawTile(pos, size, undefined, color, angle, false, undefined, useWebGL, screenSpace, context); 
	}

	/** Draw colored line between two points
	 *  @param {Vector2} posA
	 *  @param {Vector2} posB
	 *  @param {Number}  [thickness]
	 *  @param {Color}   [color=(1,1,1,1)]
	 *  @param {Boolean} [useWebGL=glEnable]
	 *  @param {Boolean} [screenSpace=false]
	 *  @param {CanvasRenderingContext2D} [context]
	 *  @memberof Draw */
	function drawLine(posA, posB, thickness=.1, color, useWebGL, screenSpace, context)
	{
	    const halfDelta = vec2((posB.x - posA.x)/2, (posB.y - posA.y)/2);
	    const size = vec2(thickness, halfDelta.length()*2);
	    drawRect(posA.add(halfDelta), size, color, halfDelta.angle(), useWebGL, screenSpace, context);
	}

	/** Draw directly to a 2d canvas context in world space
	 *  @param {Vector2}  pos
	 *  @param {Vector2}  size
	 *  @param {Number}   angle
	 *  @param {Boolean}  mirror
	 *  @param {Function} drawFunction
	 *  @param {Boolean} [screenSpace=false]
	 *  @param {CanvasRenderingContext2D} [context=mainContext]
	 *  @memberof Draw */
	function drawCanvas2D(pos, size, angle, mirror, drawFunction, screenSpace, context=mainContext)
	{
	    if (!screenSpace)
	    {
	        // transform from world space to screen space
	        pos = worldToScreen(pos);
	        size = size.scale(cameraScale);
	    }
	    context.save();
	    context.translate(pos.x+.5, pos.y+.5);
	    context.rotate(angle);
	    context.scale(mirror ? -size.x : size.x, size.y);
	    drawFunction(context);
	    context.restore();
	}

	/** Enable normal or additive blend mode
	 *  @param {Boolean} [additive]
	 *  @param {Boolean} [useWebGL=glEnable]
	 *  @param {CanvasRenderingContext2D} [context=mainContext]
	 *  @memberof Draw */
	function setBlendMode(additive, useWebGL=glEnable, context)
	{
	    ASSERT(!context || !useWebGL, 'context only supported in canvas 2D mode');
	    if (useWebGL)
	        glAdditive = additive;
	    else
	    {
	        if (!context)
	            context = mainContext;
	        context.globalCompositeOperation = additive ? 'lighter' : 'source-over';
	    }
	}

	/** Draw text on overlay canvas in world space
	 *  Automatically splits new lines into rows
	 *  @param {String}  text
	 *  @param {Vector2} pos
	 *  @param {Number}  [size]
	 *  @param {Color}   [color=(1,1,1,1)]
	 *  @param {Number}  [lineWidth]
	 *  @param {Color}   [lineColor=(0,0,0,1)]
	 *  @param {CanvasTextAlign}  [textAlign='center']
	 *  @param {String}  [font=fontDefault]
	 *  @param {CanvasRenderingContext2D} [context=overlayContext]
	 *  @memberof Draw */
	function drawText(text, pos, size=1, color, lineWidth=0, lineColor, textAlign, font, context)
	{
	    drawTextScreen(text, worldToScreen(pos), size*cameraScale, color, lineWidth*cameraScale, lineColor, textAlign, font, context);
	}

	/** Draw text on overlay canvas in screen space
	 *  Automatically splits new lines into rows
	 *  @param {String}  text
	 *  @param {Vector2} pos
	 *  @param {Number}  [size]
	 *  @param {Color}   [color=(1,1,1,1)]
	 *  @param {Number}  [lineWidth]
	 *  @param {Color}   [lineColor=(0,0,0,1)]
	 *  @param {CanvasTextAlign}  [textAlign]
	 *  @param {String}  [font=fontDefault]
	 *  @param {CanvasRenderingContext2D} [context=overlayContext]
	 *  @memberof Draw */
	function drawTextScreen(text, pos, size=1, color=new Color, lineWidth=0, lineColor=new Color(0,0,0), textAlign='center', font=fontDefault, context=overlayContext)
	{
	    context.fillStyle = color.toString();
	    context.lineWidth = lineWidth;
	    context.strokeStyle = lineColor.toString();
	    context.textAlign = textAlign;
	    context.font = size + 'px '+ font;
	    context.textBaseline = 'middle';
	    context.lineJoin = 'round';

	    pos = pos.copy();
	    (text+'').split('\n').forEach(line=>
	    {
	        lineWidth && context.strokeText(line, pos.x, pos.y);
	        context.fillText(line, pos.x, pos.y);
	        pos.y += size;
	    });
	}

	///////////////////////////////////////////////////////////////////////////////

	let engineFontImage;

	/** 
	 * Font Image Object - Draw text on a 2D canvas by using characters in an image
	 * - 96 characters (from space to tilde) are stored in an image
	 * - Uses a default 8x8 font if none is supplied
	 * - You can also use fonts from the main tile sheet
	 * @example
	 * // use built in font
	 * const font = new ImageFont;
	 * 
	 * // draw text
	 * font.drawTextScreen("LittleJS\nHello World!", vec2(200, 50));
	 */
	class FontImage
	{
	    /** Create an image font
	     *  @param {HTMLImageElement} [image]    - Image for the font, if undefined default font is used
	     *  @param {Vector2} [tileSize=(8,8)]    - Size of the font source tiles
	     *  @param {Vector2} [paddingSize=(0,1)] - How much extra space to add between characters
	     *  @param {CanvasRenderingContext2D} [context=overlayContext] - context to draw to
	     */
	    constructor(image, tileSize=vec2(8), paddingSize=vec2(0,1), context=overlayContext)
	    {
	        // load default font image
	        if (!engineFontImage)
	            (engineFontImage = new Image).src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAAYAQAAAAA9+x6JAAAAAnRSTlMAAHaTzTgAAAGiSURBVHjaZZABhxxBEIUf6ECLBdFY+Q0PMNgf0yCgsSAGZcT9sgIPtBWwIA5wgAPEoHUyJeeSlW+gjK+fegWwtROWpVQEyWh2npdpBmTUFVhb29RINgLIukoXr5LIAvYQ5ve+1FqWEMqNKTX3FAJHyQDRZvmKWubAACcv5z5Gtg2oyCWE+Yk/8JZQX1jTTCpKAFGIgza+dJCNBF2UskRlsgwitHbSV0QLgt9sTPtsRlvJjEr8C/FARWA2bJ/TtJ7lko34dNDn6usJUMzuErP89UUBJbWeozrwLLncXczd508deAjLWipLO4Q5XGPcJvPu92cNDaN0P5G1FL0nSOzddZOrJ6rNhbXGmeDvO3TF7DeJWl4bvaYQTNHCTeuqKZmbjHaSOFes+IX/+IhHrnAkXOAsfn24EM68XieIECoccD4KZLk/odiwzeo2rovYdhvb2HYFgyznJyDpYJdYOmfXgVdJTaUi4xA2uWYNYec9BLeqdl9EsoTw582mSFDX2DxVLbNt9U3YYoeatBad1c2Tj8t2akrjaIGJNywKB/7h75/gN3vCMSaadIUTAAAAAElFTkSuQmCC';

	        this.image = image || engineFontImage;
	        this.tileSize = tileSize;
	        this.paddingSize = paddingSize;
	        this.context = context;
	    }

	    /** Draw text in world space using the image font
	     *  @param {String}  text
	     *  @param {Vector2} pos
	     *  @param {Number}  [scale=.25]
	     *  @param {Boolean} [center]
	     */
	    drawText(text, pos, scale=1, center)
	    {
	        this.drawTextScreen(text, worldToScreen(pos).floor(), scale*cameraScale|0, center);
	    }

	    /** Draw text in screen space using the image font
	     *  @param {String}  text
	     *  @param {Vector2} pos
	     *  @param {Number}  [scale]
	     *  @param {Boolean} [center]
	     */
	    drawTextScreen(text, pos, scale=4, center)
	    {
	        const context = this.context;
	        context.save();
	        context.imageSmoothingEnabled = !canvasPixelated;

	        const size = this.tileSize;
	        const drawSize = size.add(this.paddingSize).scale(scale);
	        const cols = this.image.width / this.tileSize.x |0;
	        (text+'').split('\n').forEach((line, i)=>
	        {
	            const centerOffset = center ? line.length * size.x * scale / 2 |0 : 0;
	            for(let j=line.length; j--;)
	            {
	                // draw each character
	                let charCode = line[j].charCodeAt(0);
	                if (charCode < 32 || charCode > 127)
	                    charCode = 127; // unknown character

	                // get the character source location and draw it
	                const tile = charCode - 32;
	                const x = tile % cols;
	                const y = tile / cols |0;
	                const drawPos = pos.add(vec2(j,i).multiply(drawSize));
	                context.drawImage(this.image, x * size.x, y * size.y, size.x, size.y, 
	                    drawPos.x - centerOffset, drawPos.y, size.x * scale, size.y * scale);
	            }
	        });

	        context.restore();
	    }
	}

	///////////////////////////////////////////////////////////////////////////////
	// Fullscreen mode

	/** Returns true if fullscreen mode is active
	 *  @return {Boolean}
	 *  @memberof Draw */
	function isFullscreen() { return !!document.fullscreenElement; }

	/** Toggle fullsceen mode
	 *  @memberof Draw */
	function toggleFullscreen()
	{
	    if (isFullscreen())
	    {
	        if (document.exitFullscreen)
	            document.exitFullscreen();
	    }
	    else if (document.body.requestFullscreen)
	            document.body.requestFullscreen();
	}
	/** 
	 * LittleJS Input System
	 * - Tracks keyboard down, pressed, and released
	 * - Tracks mouse buttons, position, and wheel
	 * - Tracks multiple analog gamepads
	 * - Virtual gamepad for touch devices
	 * @namespace Input
	 */



	/** Returns true if device key is down
	 *  @param {String|Number} key
	 *  @param {Number} [device]
	 *  @return {Boolean}
	 *  @memberof Input */
	function keyIsDown(key, device=0)
	{ 
	    ASSERT(device > 0 || typeof key !== 'number' || key < 3, 'use code string for keyboard');
	    return inputData[device] && !!(inputData[device][key] & 1); 
	}

	/** Returns true if device key was pressed this frame
	 *  @param {String|Number} key
	 *  @param {Number} [device]
	 *  @return {Boolean}
	 *  @memberof Input */
	function keyWasPressed(key, device=0)
	{ 
	    ASSERT(device > 0 || typeof key !== 'number' || key < 3, 'use code string for keyboard');
	    return inputData[device] && !!(inputData[device][key] & 2); 
	}

	/** Returns true if device key was released this frame
	 *  @param {String|Number} key
	 *  @param {Number} [device]
	 *  @return {Boolean}
	 *  @memberof Input */
	function keyWasReleased(key, device=0)
	{ 
	    ASSERT(device > 0 || typeof key !== 'number' || key < 3, 'use code string for keyboard');
	    return inputData[device] && !!(inputData[device][key] & 4);
	}

	/** Clears all input
	 *  @memberof Input */
	function clearInput() { inputData = [[]]; }

	/** Returns true if mouse button is down
	 *  @function
	 *  @param {Number} button
	 *  @return {Boolean}
	 *  @memberof Input */
	const mouseIsDown = keyIsDown;

	/** Returns true if mouse button was pressed
	 *  @function
	 *  @param {Number} button
	 *  @return {Boolean}
	 *  @memberof Input */
	const mouseWasPressed = keyWasPressed;

	/** Returns true if mouse button was released
	 *  @function
	 *  @param {Number} button
	 *  @return {Boolean}
	 *  @memberof Input */
	const mouseWasReleased = keyWasReleased;

	/** Mouse pos in world space
	 *  @type {Vector2}
	 *  @memberof Input */
	let mousePos = vec2();

	/** Mouse pos in screen space
	 *  @type {Vector2}
	 *  @memberof Input */
	let mousePosScreen = vec2();

	/** Mouse wheel delta this frame
	 *  @type {Number}
	 *  @memberof Input */
	let mouseWheel = 0;

	/** Returns true if user is using gamepad (has more recently pressed a gamepad button)
	 *  @type {Boolean}
	 *  @memberof Input */
	let isUsingGamepad = false;

	/** Prevents input continuing to the default browser handling (false by default)
	 *  @type {Boolean}
	 *  @memberof Input */
	let preventDefaultInput = false;

	/** Returns true if gamepad button is down
	 *  @param {Number} button
	 *  @param {Number} [gamepad]
	 *  @return {Boolean}
	 *  @memberof Input */
	function gamepadIsDown(button, gamepad=0)
	{ return keyIsDown(button, gamepad+1); }

	/** Returns true if gamepad button was pressed
	 *  @param {Number} button
	 *  @param {Number} [gamepad]
	 *  @return {Boolean}
	 *  @memberof Input */
	function gamepadWasPressed(button, gamepad=0)
	{ return keyWasPressed(button, gamepad+1); }

	/** Returns true if gamepad button was released
	 *  @param {Number} button
	 *  @param {Number} [gamepad]
	 *  @return {Boolean}
	 *  @memberof Input */
	function gamepadWasReleased(button, gamepad=0)
	{ return keyWasReleased(button, gamepad+1); }

	/** Returns gamepad stick value
	 *  @param {Number} stick
	 *  @param {Number} [gamepad]
	 *  @return {Vector2}
	 *  @memberof Input */
	function gamepadStick(stick,  gamepad=0)
	{ return stickData[gamepad] ? stickData[gamepad][stick] || vec2() : vec2(); }

	///////////////////////////////////////////////////////////////////////////////
	// Input update called by engine

	// store input as a bit field for each key: 1 = isDown, 2 = wasPressed, 4 = wasReleased
	// mouse and keyboard are stored together in device 0, gamepads are in devices > 0
	let inputData = [[]];

	function inputUpdate()
	{
	    // clear input when lost focus (prevent stuck keys)
	    isTouchDevice || document.hasFocus() || clearInput();

	    // update mouse world space position
	    mousePos = screenToWorld(mousePosScreen);

	    // update gamepads if enabled
	    gamepadsUpdate();
	}

	function inputUpdatePost()
	{
	    // clear input to prepare for next frame
	    for (const deviceInputData of inputData)
	    for (const i in deviceInputData)
	        deviceInputData[i] &= 1;
	    mouseWheel = 0;
	}

	///////////////////////////////////////////////////////////////////////////////
	// Keyboard event handlers

	{
	    onkeydown = (e)=>
	    {
	        if (e.target != document.body) return;
	        if (!e.repeat)
	        {
	            isUsingGamepad = false;
	            inputData[0][e.code] = 3;
	            if (inputWASDEmulateDirection)
	                inputData[0][remapKey(e.code)] = 3;
	        }
	    };

	    onkeyup = (e)=>
	    {
	        if (e.target != document.body) return;
	        inputData[0][e.code] = 4;
	        if (inputWASDEmulateDirection)
	            inputData[0][remapKey(e.code)] = 4;
	    };

	    // handle remapping wasd keys to directions
	    function remapKey(c)
	    {
	        return inputWASDEmulateDirection ? 
	            c == 'KeyW' ? 'ArrowUp' : 
	            c == 'KeyS' ? 'ArrowDown' : 
	            c == 'KeyA' ? 'ArrowLeft' : 
	            c == 'KeyD' ? 'ArrowRight' : c : c;
	    }
	}

	///////////////////////////////////////////////////////////////////////////////
	// Mouse event handlers

	onmousedown = (e)=> {isUsingGamepad = false; inputData[0][e.button] = 3; mousePosScreen = mouseToScreen(e); e.button && e.preventDefault();};
	onmouseup   = (e)=> inputData[0][e.button] = inputData[0][e.button] & 2 | 4;
	onmousemove = (e)=> mousePosScreen = mouseToScreen(e);
	onwheel     = (e)=> mouseWheel = e.ctrlKey ? 0 : sign(e.deltaY);
	oncontextmenu = (e)=> false; // prevent right click menu

	// convert a mouse or touch event position to screen space
	function mouseToScreen(mousePos)
	{
	    if (!mainCanvas)
	        return vec2(); // fix bug that can occur if user clicks before page loads

	    const rect = mainCanvas.getBoundingClientRect();
	    return vec2(mainCanvas.width, mainCanvas.height).multiply(
	        vec2(percent(mousePos.x, rect.left, rect.right), percent(mousePos.y, rect.top, rect.bottom)));
	}

	///////////////////////////////////////////////////////////////////////////////
	// Gamepad input

	// gamepad internal variables
	const stickData = [];

	// gamepads are updated by engine every frame automatically
	function gamepadsUpdate()
	{
	    const applyDeadZones = (v)=>
	    {
	        const min=.3, max=.8;
	        const deadZone = (v)=> 
	            v >  min ?  percent( v, min, max) : 
	            v < -min ? -percent(-v, min, max) : 0;
	        return vec2(deadZone(v.x), deadZone(-v.y)).clampLength();
	    };

	    // update touch gamepad if enabled
	    if (touchGamepadEnable && isTouchDevice)
	    {
	        // create the touch gamepad if it doesn't exist
	        if (!touchGamepadButtons)
	            createTouchGamepad();

	        if (touchGamepadTimer.isSet())
	        {
	            // read virtual analog stick
	            const sticks = stickData[0] || (stickData[0] = []);
	            sticks[0] = vec2();
	            if (touchGamepadAnalog)
	                sticks[0] = applyDeadZones(touchGamepadStick);
	            else if (touchGamepadStick.lengthSquared() > .3)
	            {
	                // convert to 8 way dpad
	                sticks[0].x = Math.round(touchGamepadStick.x);
	                sticks[0].y = -Math.round(touchGamepadStick.y);
	                sticks[0] = sticks[0].clampLength();
	            }

	            // read virtual gamepad buttons
	            const data = inputData[1] || (inputData[1] = []);
	            for (let i=10; i--;)
	            {
	                const j = i == 3 ? 2 : i == 2 ? 3 : i; // fix button locations
	                data[j] = touchGamepadButtons[i] ? gamepadIsDown(j,0) ? 1 : 3 : gamepadIsDown(j,0) ? 4 : 0;
	            }
	        }
	    }

	    // return if gamepads are disabled or not supported
	    if (!gamepadsEnable || !navigator || !navigator.getGamepads)
	        return;

	    // poll gamepads
	    const gamepads = navigator.getGamepads();
	    for (let i = gamepads.length; i--;)
	    {
	        // get or create gamepad data
	        const gamepad = gamepads[i];
	        const data = inputData[i+1] || (inputData[i+1] = []);
	        const sticks = stickData[i] || (stickData[i] = []);

	        if (gamepad)
	        {
	            // read analog sticks
	            for (let j = 0; j < gamepad.axes.length-1; j+=2)
	                sticks[j>>1] = applyDeadZones(vec2(gamepad.axes[j],gamepad.axes[j+1]));
	            
	            // read buttons
	            for (let j = gamepad.buttons.length; j--;)
	            {
	                const button = gamepad.buttons[j];
	                const wasDown = gamepadIsDown(j,i);
	                data[j] = button.pressed ? wasDown ? 1 : 3 : wasDown ? 4 : 0;
	                isUsingGamepad ||= !i && button.pressed;
	            }

	            if (gamepadDirectionEmulateStick)
	            {
	                // copy dpad to left analog stick when pressed
	                const dpad = vec2(
	                    (gamepadIsDown(15,i)&&1) - (gamepadIsDown(14,i)&&1), 
	                    (gamepadIsDown(12,i)&&1) - (gamepadIsDown(13,i)&&1));
	                if (dpad.lengthSquared())
	                    sticks[0] = dpad.clampLength();
	            }

	            // disable touch gamepad if using real gamepad
	            touchGamepadEnable && isUsingGamepad && touchGamepadTimer.unset(); 
	        }
	    }
	}

	///////////////////////////////////////////////////////////////////////////////

	/** Pulse the vibration hardware if it exists
	 *  @param {Number|Array} [pattern] - single value in ms or vibration interval array
	 *  @memberof Input */
	function vibrate(pattern=100)
	{ vibrateEnable && navigator && navigator.vibrate && navigator.vibrate(pattern); }

	/** Cancel any ongoing vibration
	 *  @memberof Input */
	function vibrateStop() { vibrate(0); }

	///////////////////////////////////////////////////////////////////////////////
	// Touch input

	/** True if a touch device has been detected
	 *  @memberof Input */
	const isTouchDevice = window.ontouchstart !== undefined;

	// try to enable touch mouse
	if (isTouchDevice)
	{
	    // override mouse events
	    let wasTouching;
	    onmousedown = onmouseup = ()=> 0;

	    // handle all touch events the same way
	    ontouchstart = ontouchmove = ontouchend = (e)=>
	    {
	        // fix stalled audio requiring user interaction
	        if (soundEnable && audioContext && audioContext.state != 'running')
	            zzfx(0);

	        // check if touching and pass to mouse events
	        const touching = e.touches.length;
	        const button = 0; // all touches are left mouse button
	        if (touching)
	        {
	            // set event pos and pass it along
	            const p = vec2(e.touches[0].clientX, e.touches[0].clientY);
	            mousePosScreen = mouseToScreen(p);
	            wasTouching ? isUsingGamepad = false : inputData[0][button] = 3;
	        }
	        else if (wasTouching)
	            inputData[0][button] = inputData[0][button] & 2 | 4;

	        // set was touching
	        wasTouching = touching;

	        // prevent default handling like copy and magnifier lens
	        if (document.hasFocus()) // allow document to get focus
	            e.preventDefault();
	        
	        // must return true so the document will get focus
	        return true;
	    };
	}

	///////////////////////////////////////////////////////////////////////////////
	// touch gamepad, virtual on screen gamepad emulator for touch devices

	// touch input internal variables
	let touchGamepadTimer = new Timer, touchGamepadButtons, touchGamepadStick;

	// create the touch gamepad, called automatically by the engine
	function createTouchGamepad()
	{
	    // touch input internal variables
	    touchGamepadButtons = [];
	    touchGamepadStick = vec2();

	    const touchHandler = ontouchstart;
	    ontouchstart = ontouchmove = ontouchend = (e)=>
	    {
	        // clear touch gamepad input
	        touchGamepadStick = vec2();
	        touchGamepadButtons = [];
	            
	        const touching = e.touches.length;
	        if (touching)
	        {
	            touchGamepadTimer.set();
	            if (paused)
	            {
	                // touch anywhere to press start when paused
	                touchGamepadButtons[9] = 1;
	                return;
	            }
	        }

	        // get center of left and right sides
	        const stickCenter = vec2(touchGamepadSize, mainCanvasSize.y-touchGamepadSize);
	        const buttonCenter = mainCanvasSize.subtract(vec2(touchGamepadSize, touchGamepadSize));
	        const startCenter = mainCanvasSize.scale(.5);

	        // check each touch point
	        for (const touch of e.touches)
	        {
	            const touchPos = mouseToScreen(vec2(touch.clientX, touch.clientY));
	            if (touchPos.distance(stickCenter) < touchGamepadSize)
	            {
	                // virtual analog stick
	                touchGamepadStick = touchPos.subtract(stickCenter).scale(2/touchGamepadSize).clampLength();
	            }
	            else if (touchPos.distance(buttonCenter) < touchGamepadSize)
	            {
	                // virtual face buttons
	                const button = touchPos.subtract(buttonCenter).direction();
	                touchGamepadButtons[button] = 1;
	            }
	            else if (touchPos.distance(startCenter) < touchGamepadSize)
	            {
	                // virtual start button in center
	                touchGamepadButtons[9] = 1;
	            }
	        }

	        // call default touch handler and set to using gamepad
	        touchHandler.bind(window)(e);
	        isUsingGamepad = true;
	        
	        // must return true so the document will get focus
	        return true;
	    };
	}

	// render the touch gamepad, called automatically by the engine
	function touchGamepadRender()
	{
	    if (!touchGamepadEnable || !touchGamepadTimer.isSet())
	        return;
	    
	    // fade off when not touching or paused
	    const alpha = percent(touchGamepadTimer.get(), 4, 3);
	    if (!alpha || paused)
	        return;

	    // setup the canvas
	    overlayContext.save();
	    overlayContext.globalAlpha = alpha*touchGamepadAlpha;
	    overlayContext.strokeStyle = '#fff';
	    overlayContext.lineWidth = 3;

	    // draw left analog stick
	    overlayContext.fillStyle = touchGamepadStick.lengthSquared() > 0 ? '#fff' : '#000';
	    overlayContext.beginPath();

	    const leftCenter = vec2(touchGamepadSize, mainCanvasSize.y-touchGamepadSize);
	    if (touchGamepadAnalog) // draw circle shaped gamepad
	    {
	        overlayContext.arc(leftCenter.x, leftCenter.y, touchGamepadSize/2, 0, 9);
	        overlayContext.fill();
	        overlayContext.stroke();
	    }
	    else // draw cross shaped gamepad
	    {
	        for(let i=10; i--;)
	        {
	            const angle = i*PI/4;
	            overlayContext.arc(leftCenter.x, leftCenter.y,touchGamepadSize*.6, angle + PI/8, angle + PI/8);
	            i%2 && overlayContext.arc(leftCenter.x, leftCenter.y, touchGamepadSize*.33, angle, angle);
	            i==1 && overlayContext.fill();
	        }
	        overlayContext.stroke();
	    }
	    
	    // draw right face buttons
	    const rightCenter = vec2(mainCanvasSize.x-touchGamepadSize, mainCanvasSize.y-touchGamepadSize);
	    for (let i=4; i--;)
	    {
	        const pos = rightCenter.add(vec2().setDirection(i, touchGamepadSize/2));
	        overlayContext.fillStyle = touchGamepadButtons[i] ? '#fff' : '#000';
	        overlayContext.beginPath();
	        overlayContext.arc(pos.x, pos.y, touchGamepadSize/4, 0,9);
	        overlayContext.fill();
	        overlayContext.stroke();
	    }

	    // set canvas back to normal
	    overlayContext.restore();
	}
	/** 
	 * LittleJS Audio System
	 * - <a href=https://killedbyapixel.github.io/ZzFX/>ZzFX Sound Effects</a> - ZzFX Sound Effect Generator
	 * - <a href=https://keithclark.github.io/ZzFXM/>ZzFXM Music</a> - ZzFXM Music System
	 * - Caches sounds and music for fast playback
	 * - Can attenuate and apply stereo panning to sounds
	 * - Ability to play mp3, ogg, and wave files
	 * - Speech synthesis functions
	 * @namespace Audio
	 */



	/** 
	 * Sound Object - Stores a sound for later use and can be played positionally
	 * 
	 * <a href=https://killedbyapixel.github.io/ZzFX/>Create sounds using the ZzFX Sound Designer.</a>
	 * @example
	 * // create a sound
	 * const sound_example = new Sound([.5,.5]);
	 * 
	 * // play the sound
	 * sound_example.play();
	 */
	class Sound
	{
	    /** Create a sound object and cache the zzfx samples for later use
	     *  @param {Array}  zzfxSound - Array of zzfx parameters, ex. [.5,.5]
	     *  @param {Number} [range=soundDefaultRange] - World space max range of sound, will not play if camera is farther away
	     *  @param {Number} [taper=soundDefaultTaper] - At what percentage of range should it start tapering
	     */
	    constructor(zzfxSound, range=soundDefaultRange, taper=soundDefaultTaper)
	    {
	        if (!soundEnable) return;

	        /** @property {Number} - World space max range of sound, will not play if camera is farther away */
	        this.range = range;

	        /** @property {Number} - At what percentage of range should it start tapering off */
	        this.taper = taper;

	        /** @property {Number} - How much to randomize frequency each time sound plays */
	        this.randomness = 0;

	        if (zzfxSound)
	        {
	            // generate zzfx sound now for fast playback
	            this.randomness = zzfxSound[1] || 0;
	            zzfxSound[1] = 0; // generate without randomness
	            this.sampleChannels = [zzfxG(...zzfxSound)];
	            this.sampleRate = zzfxR;
	        }
	    }

	    /** Play the sound
	     *  @param {Vector2} [pos] - World space position to play the sound, sound is not attenuated if null
	     *  @param {Number}  [volume] - How much to scale volume by (in addition to range fade)
	     *  @param {Number}  [pitch] - How much to scale pitch by (also adjusted by this.randomness)
	     *  @param {Number}  [randomnessScale] - How much to scale randomness
	     *  @param {Boolean} [loop] - Should the sound loop
	     *  @return {AudioBufferSourceNode} - The audio source node
	     */
	    play(pos, volume=1, pitch=1, randomnessScale=1, loop=false)
	    {
	        if (!soundEnable || !this.sampleChannels) return;

	        let pan;
	        if (pos)
	        {
	            const range = this.range;
	            if (range)
	            {
	                // apply range based fade
	                const lengthSquared = cameraPos.distanceSquared(pos);
	                if (lengthSquared > range*range)
	                    return; // out of range

	                // attenuate volume by distance
	                volume *= percent(lengthSquared**.5, range, range*this.taper);
	            }

	            // get pan from screen space coords
	            pan = worldToScreen(pos).x * 2/mainCanvas.width - 1;
	        }

	        // play the sound
	        const playbackRate = pitch + pitch * this.randomness*randomnessScale*rand(-1,1);
	        return this.source = playSamples(this.sampleChannels, volume, playbackRate, pan, loop, this.sampleRate);
	    }

	    /** Stop the last instance of this sound that was played */
	    stop()
	    {
	        if (this.source)
	            this.source.stop();
	        this.source = undefined;
	    }
	    
	    /** Get source of most recent instance of this sound that was played
	     *  @return {AudioBufferSourceNode}
	     */
	    getSource() { return this.source; }

	    /** Play the sound as a note with a semitone offset
	     *  @param {Number}  semitoneOffset - How many semitones to offset pitch
	     *  @param {Vector2} [pos] - World space position to play the sound, sound is not attenuated if null
	     *  @param {Number}  [volume=1] - How much to scale volume by (in addition to range fade)
	     *  @return {AudioBufferSourceNode} - The audio source node
	     */
	    playNote(semitoneOffset, pos, volume)
	    { return this.play(pos, volume, 2**(semitoneOffset/12), 0); }

	    /** Get how long this sound is in seconds
	     *  @return {Number} - How long the sound is in seconds (undefined if loading)
	     */
	    getDuration() 
	    { return this.sampleChannels && this.sampleChannels[0].length / this.sampleRate; }
	    
	    /** Check if sound is loading, for sounds fetched from a url
	     *  @return {Boolean} - True if sound is loading and not ready to play
	     */
	    isLoading() { return !this.sampleChannels; }
	}

	/** 
	 * Sound Wave Object - Stores a wave sound for later use and can be played positionally
	 * - this can be used to play wave, mp3, and ogg files
	 * @example
	 * // create a sound
	 * const sound_example = new SoundWave('sound.mp3');
	 * 
	 * // play the sound
	 * sound_example.play();
	 */
	class SoundWave extends Sound
	{
	    /** Create a sound object and cache the wave file for later use
	     *  @param {String} filename - Filename of audio file to load
	     *  @param {Number} [randomness] - How much to randomize frequency each time sound plays
	     *  @param {Number} [range=soundDefaultRange] - World space max range of sound, will not play if camera is farther away
	     *  @param {Number} [taper=soundDefaultTaper] - At what percentage of range should it start tapering off
	     */
	    constructor(filename, randomness=0, range, taper)
	    {
	        super(undefined, range, taper);
	        this.randomness = randomness;

	        if (!soundEnable) return;

	        fetch(filename)
	        .then(response => response.arrayBuffer())
	        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
	        .then(audioBuffer => 
	        {
	            this.sampleChannels = [];
	            for (let i = audioBuffer.numberOfChannels; i--;)
	                this.sampleChannels[i] = Array.from(audioBuffer.getChannelData(i));
	            this.sampleRate = audioBuffer.sampleRate;
	        });
	    }
	}

	/**
	 * Music Object - Stores a zzfx music track for later use
	 * 
	 * <a href=https://keithclark.github.io/ZzFXM/>Create music with the ZzFXM tracker.</a>
	 * @example
	 * // create some music
	 * const music_example = new Music(
	 * [
	 *     [                         // instruments
	 *       [,0,400]                // simple note
	 *     ], 
	 *     [                         // patterns
	 *         [                     // pattern 1
	 *             [                 // channel 0
	 *                 0, -1,        // instrument 0, left speaker
	 *                 1, 0, 9, 1    // channel notes
	 *             ], 
	 *             [                 // channel 1
	 *                 0, 1,         // instrument 0, right speaker
	 *                 0, 12, 17, -1 // channel notes
	 *             ]
	 *         ],
	 *     ],
	 *     [0, 0, 0, 0], // sequence, play pattern 0 four times
	 *     90            // BPM
	 * ]);
	 * 
	 * // play the music
	 * music_example.play();
	 */
	class Music extends Sound
	{
	    /** Create a music object and cache the zzfx music samples for later use
	     *  @param {[Array, Array, Array, Number]} zzfxMusic - Array of zzfx music parameters
	     */
	    constructor(zzfxMusic)
	    {
	        super(undefined);

	        if (!soundEnable) return;
	        this.randomness = 0;
	        this.sampleChannels = zzfxM(...zzfxMusic);
	        this.sampleRate = zzfxR;
	    }

	    /** Play the music
	     *  @param {Number}  [volume=1] - How much to scale volume by
	     *  @param {Boolean} [loop] - True if the music should loop
	     *  @return {AudioBufferSourceNode} - The audio source node
	     */
	    playMusic(volume, loop=false)
	    { return super.play(undefined, volume, 1, 1, loop); }
	}

	/** Play an mp3, ogg, or wav audio from a local file or url
	 *  @param {String}  filename - Location of sound file to play
	 *  @param {Number}  [volume] - How much to scale volume by
	 *  @param {Boolean} [loop] - True if the music should loop
	 *  @return {HTMLAudioElement} - The audio element for this sound
	 *  @memberof Audio */
	function playAudioFile(filename, volume=1, loop=false)
	{
	    if (!soundEnable) return;

	    const audio = new Audio(filename);
	    audio.volume = soundVolume * volume;
	    audio.loop = loop;
	    audio.play();
	    return audio;
	}

	/** Speak text with passed in settings
	 *  @param {String} text - The text to speak
	 *  @param {String} [language] - The language/accent to use (examples: en, it, ru, ja, zh)
	 *  @param {Number} [volume] - How much to scale volume by
	 *  @param {Number} [rate] - How quickly to speak
	 *  @param {Number} [pitch] - How much to change the pitch by
	 *  @return {SpeechSynthesisUtterance} - The utterance that was spoken
	 *  @memberof Audio */
	function speak(text, language='', volume=1, rate=1, pitch=1)
	{
	    if (!soundEnable || !speechSynthesis) return;

	    // common languages (not supported by all browsers)
	    // en - english,  it - italian, fr - french,  de - german, es - spanish
	    // ja - japanese, ru - russian, zh - chinese, hi - hindi,  ko - korean

	    // build utterance and speak
	    const utterance = new SpeechSynthesisUtterance(text);
	    utterance.lang = language;
	    utterance.volume = 2*volume*soundVolume;
	    utterance.rate = rate;
	    utterance.pitch = pitch;
	    speechSynthesis.speak(utterance);
	    return utterance;
	}

	/** Stop all queued speech
	 *  @memberof Audio */
	function speakStop() {speechSynthesis && speechSynthesis.cancel();}

	/** Get frequency of a note on a musical scale
	 *  @param {Number} semitoneOffset - How many semitones away from the root note
	 *  @param {Number} [rootFrequency=220] - Frequency at semitone offset 0
	 *  @return {Number} - The frequency of the note
	 *  @memberof Audio */
	function getNoteFrequency(semitoneOffset, rootFrequency=220)
	{ return rootFrequency * 2**(semitoneOffset/12); }

	///////////////////////////////////////////////////////////////////////////////

	/** Audio context used by the engine
	 *  @type {AudioContext}
	 *  @memberof Audio */
	let audioContext = new AudioContext;

	/** Keep track if audio was suspended when last sound was played
	 *  @type {Boolean}
	 *  @memberof Audio */
	let audioSuspended = false;

	/** Play cached audio samples with given settings
	 *  @param {Array}   sampleChannels - Array of arrays of samples to play (for stereo playback)
	 *  @param {Number}  [volume] - How much to scale volume by
	 *  @param {Number}  [rate] - The playback rate to use
	 *  @param {Number}  [pan] - How much to apply stereo panning
	 *  @param {Boolean} [loop] - True if the sound should loop when it reaches the end
	 *  @param {Number}  [sampleRate=44100] - Sample rate for the sound
	 *  @return {AudioBufferSourceNode} - The audio node of the sound played
	 *  @memberof Audio */
	function playSamples(sampleChannels, volume=1, rate=1, pan=0, loop=false, sampleRate=zzfxR) 
	{
	    if (!soundEnable) return;

	    // prevent sounds from building up if they can't be played
	    const audioWasSuspended = audioSuspended;
	    if (audioSuspended = audioContext.state != 'running')
	    {
	        // fix stalled audio
	        audioContext.resume();

	        // prevent suspended sounds from building up
	        if (audioWasSuspended)
	            return;
	    }

	    // create buffer and source
	    const buffer = audioContext.createBuffer(sampleChannels.length, sampleChannels[0].length, sampleRate), 
	        source = audioContext.createBufferSource();

	    // copy samples to buffer and setup source
	    sampleChannels.forEach((c,i)=> buffer.getChannelData(i).set(c));
	    source.buffer = buffer;
	    source.playbackRate.value = rate;
	    source.loop = loop;

	    // create and connect gain node (createGain is more widely spported then GainNode construtor)
	    const gainNode = audioContext.createGain();
	    gainNode.gain.value = soundVolume*volume;
	    gainNode.connect(audioContext.destination);

	    // connect source to stereo panner and gain
	    source.connect(new StereoPannerNode(audioContext, {'pan':clamp(pan, -1, 1)})).connect(gainNode);

	    // play and return sound
	    source.start();
	    return source;
	}

	///////////////////////////////////////////////////////////////////////////////
	// ZzFXMicro - Zuper Zmall Zound Zynth - v1.3.1 by Frank Force

	/** Generate and play a ZzFX sound
	 *  
	 *  <a href=https://killedbyapixel.github.io/ZzFX/>Create sounds using the ZzFX Sound Designer.</a>
	 *  @param {Array} zzfxSound - Array of ZzFX parameters, ex. [.5,.5]
	 *  @return {AudioBufferSourceNode} - The audio node of the sound played
	 *  @memberof Audio */
	function zzfx(...zzfxSound) { return playSamples([zzfxG(...zzfxSound)]); }

	/** Sample rate used for all ZzFX sounds
	 *  @default 44100
	 *  @memberof Audio */
	const zzfxR = 44100; 

	/** Generate samples for a ZzFX sound
	 *  @param {Number}  [volume] - Volume scale (percent)
	 *  @param {Number}  [randomness] - How much to randomize frequency (percent Hz)
	 *  @param {Number}  [frequency] - Frequency of sound (Hz)
	 *  @param {Number}  [attack] - Attack time, how fast sound starts (seconds)
	 *  @param {Number}  [sustain] - Sustain time, how long sound holds (seconds)
	 *  @param {Number}  [release] - Release time, how fast sound fades out (seconds)
	 *  @param {Number}  [shape] - Shape of the sound wave
	 *  @param {Number}  [shapeCurve] - Squarenes of wave (0=square, 1=normal, 2=pointy)
	 *  @param {Number}  [slide] - How much to slide frequency (kHz/s)
	 *  @param {Number}  [deltaSlide] - How much to change slide (kHz/s/s)
	 *  @param {Number}  [pitchJump] - Frequency of pitch jump (Hz)
	 *  @param {Number}  [pitchJumpTime] - Time of pitch jump (seconds)
	 *  @param {Number}  [repeatTime] - Resets some parameters periodically (seconds)
	 *  @param {Number}  [noise] - How much random noise to add (percent)
	 *  @param {Number}  [modulation] - Frequency of modulation wave, negative flips phase (Hz)
	 *  @param {Number}  [bitCrush] - Resamples at a lower frequency in (samples*100)
	 *  @param {Number}  [delay] - Overlap sound with itself for reverb and flanger effects (seconds)
	 *  @param {Number}  [sustainVolume] - Volume level for sustain (percent)
	 *  @param {Number}  [decay] - Decay time, how long to reach sustain after attack (seconds)
	 *  @param {Number}  [tremolo] - Trembling effect, rate controlled by repeat time (precent)
	 *  @param {Number}  [filter] - Filter cutoff frequency, positive for HPF, negative for LPF (Hz)
	 *  @return {Array} - Array of audio samples
	 *  @memberof Audio
	 */
	function zzfxG
	(
	    // parameters
	    volume = 1, randomness = .05, frequency = 220, attack = 0, sustain = 0,
	    release = .1, shape = 0, shapeCurve = 1, slide = 0, deltaSlide = 0,
	    pitchJump = 0, pitchJumpTime = 0, repeatTime = 0, noise = 0, modulation = 0,
	    bitCrush = 0, delay = 0, sustainVolume = 1, decay = 0, tremolo = 0, filter = 0
	)
	{
	    // init parameters
	    let PI2 = PI*2, sampleRate = zzfxR,
	        startSlide = slide *= 500 * PI2 / sampleRate / sampleRate,
	        startFrequency = frequency *= 
	            rand(1 + randomness, 1-randomness) * PI2 / sampleRate,
	        b = [], t = 0, tm = 0, i = 0, j = 1, r = 0, c = 0, s = 0, f, length,

	        // biquad LP/HP filter
	        quality = 2, w = PI2 * abs(filter) * 2 / sampleRate,
	        cos = Math.cos(w), alpha = Math.sin(w) / 2 / quality,
	        a0 = 1 + alpha, a1 = -2*cos / a0, a2 = (1 - alpha) / a0,
	        b0 = (1 + sign(filter) * cos) / 2 / a0, 
	        b1 = -(sign(filter) + cos) / a0, b2 = b0,
	        x2 = 0, x1 = 0, y2 = 0, y1 = 0;

	    // scale by sample rate
	    attack = attack * sampleRate + 9; // minimum attack to prevent pop
	    decay *= sampleRate;
	    sustain *= sampleRate;
	    release *= sampleRate;
	    delay *= sampleRate;
	    deltaSlide *= 500 * PI2 / sampleRate**3;
	    modulation *= PI2 / sampleRate;
	    pitchJump *= PI2 / sampleRate;
	    pitchJumpTime *= sampleRate;
	    repeatTime = repeatTime * sampleRate | 0;
	    volume *= soundVolume;

	    // generate waveform
	    for(length = attack + decay + sustain + release + delay | 0;
	        i < length; b[i++] = s * volume)               // sample
	    {
	        if (!(++c%(bitCrush*100|0)))                   // bit crush
	        {
	            s = shape? shape>1? shape>2? shape>3?      // wave shape
	                Math.sin(t**3) :                       // 4 noise
	                clamp(Math.tan(t),1,-1):               // 3 tan
	                1-(2*t/PI2%2+2)%2:                     // 2 saw
	                1-4*abs(Math.round(t/PI2)-t/PI2):      // 1 triangle
	                Math.sin(t);                           // 0 sin

	            s = (repeatTime ?
	                    1 - tremolo + tremolo*Math.sin(PI2*i/repeatTime) // tremolo
	                    : 1) *
	                sign(s)*(abs(s)**shapeCurve) *           // curve
	                (i < attack ? i/attack :                 // attack
	                i < attack + decay ?                     // decay
	                1-((i-attack)/decay)*(1-sustainVolume) : // decay falloff
	                i < attack  + decay + sustain ?          // sustain
	                sustainVolume :                          // sustain volume
	                i < length - delay ?                     // release
	                (length - i - delay)/release *           // release falloff
	                sustainVolume :                          // release volume
	                0);                                      // post release

	            s = delay ? s/2 + (delay > i ? 0 :           // delay
	                (i<length-delay? 1 : (length-i)/delay) * // release delay 
	                b[i-delay|0]/2/volume) : s;              // sample delay

	            if (filter)                                   // apply filter
	                s = y1 = b2*x2 + b1*(x2=x1) + b0*(x1=s) - a2*y2 - a1*(y2=y1);
	        }

	        f = (frequency += slide += deltaSlide) *// frequency
	            Math.cos(modulation*tm++);          // modulation
	        t += f + f*noise*Math.sin(i**5);        // noise

	        if (j && ++j > pitchJumpTime)           // pitch jump
	        { 
	            frequency += pitchJump;             // apply pitch jump
	            startFrequency += pitchJump;        // also apply to start
	            j = 0;                              // stop pitch jump time
	        } 

	        if (repeatTime && !(++r % repeatTime))  // repeat
	        { 
	            frequency = startFrequency;         // reset frequency
	            slide = startSlide;                 // reset slide
	            j = j || 1;                         // reset pitch jump time
	        }
	    }

	    return b;
	}

	///////////////////////////////////////////////////////////////////////////////
	// ZzFX Music Renderer v2.0.3 by Keith Clark and Frank Force

	/** Generate samples for a ZzFM song with given parameters
	 *  @param {Array} instruments - Array of ZzFX sound paramaters
	 *  @param {Array} patterns - Array of pattern data
	 *  @param {Array} sequence - Array of pattern indexes
	 *  @param {Number} [BPM] - Playback speed of the song in BPM
	 *  @return {Array} - Left and right channel sample data
	 *  @memberof Audio */
	function zzfxM(instruments, patterns, sequence, BPM = 125) 
	{
	  let i, j, k;
	  let instrumentParameters;
	  let note;
	  let sample;
	  let patternChannel;
	  let notFirstBeat;
	  let stop;
	  let instrument;
	  let attenuation;
	  let outSampleOffset;
	  let isSequenceEnd;
	  let sampleOffset = 0;
	  let nextSampleOffset;
	  let sampleBuffer = [];
	  let leftChannelBuffer = [];
	  let rightChannelBuffer = [];
	  let channelIndex = 0;
	  let panning = 0;
	  let hasMore = 1;
	  let sampleCache = {};
	  let beatLength = zzfxR / BPM * 60 >> 2;

	  // for each channel in order until there are no more
	  for (; hasMore; channelIndex++) {

	    // reset current values
	    sampleBuffer = [hasMore = notFirstBeat = outSampleOffset = 0];

	    // for each pattern in sequence
	    sequence.forEach((patternIndex, sequenceIndex) => {
	      // get pattern for current channel, use empty 1 note pattern if none found
	      patternChannel = patterns[patternIndex][channelIndex] || [0, 0, 0];

	      // check if there are more channels
	      hasMore |= patterns[patternIndex][channelIndex]&&1;

	      // get next offset, use the length of first channel
	      nextSampleOffset = outSampleOffset + (patterns[patternIndex][0].length - 2 - (notFirstBeat?0:1)) * beatLength;
	      // for each beat in pattern, plus one extra if end of sequence
	      isSequenceEnd = sequenceIndex == sequence.length - 1;
	      for (i = 2, k = outSampleOffset; i < patternChannel.length + isSequenceEnd; notFirstBeat = ++i) {

	        // <channel-note>
	        note = patternChannel[i];

	        // stop if end, different instrument or new note
	        stop = i == patternChannel.length + isSequenceEnd - 1 && isSequenceEnd ||
	            instrument != (patternChannel[0] || 0) || note | 0;

	        // fill buffer with samples for previous beat, most cpu intensive part
	        for (j = 0; j < beatLength && notFirstBeat;

	            // fade off attenuation at end of beat if stopping note, prevents clicking
	            j++ > beatLength - 99 && stop && attenuation < 1? attenuation += 1 / 99 : 0
	        ) {
	          // copy sample to stereo buffers with panning
	          sample = (1 - attenuation) * sampleBuffer[sampleOffset++] / 2 || 0;
	          leftChannelBuffer[k] = (leftChannelBuffer[k] || 0) - sample * panning + sample;
	          rightChannelBuffer[k] = (rightChannelBuffer[k++] || 0) + sample * panning + sample;
	        }

	        // set up for next note
	        if (note) {
	          // set attenuation
	          attenuation = note % 1;
	          panning = patternChannel[1] || 0;
	          if (note |= 0) {
	            // get cached sample
	            sampleBuffer = sampleCache[
	              [
	                instrument = patternChannel[sampleOffset = 0] || 0,
	                note
	              ]
	            ] = sampleCache[[instrument, note]] || (
	                // add sample to cache
	                instrumentParameters = [...instruments[instrument]],
	                instrumentParameters[2] *= 2 ** ((note - 12) / 12),

	                // allow negative values to stop notes
	                note > 0 ? zzfxG(...instrumentParameters) : []
	            );
	          }
	        }
	      }

	      // update the sample offset
	      outSampleOffset = nextSampleOffset;
	    });
	  }

	  return [leftChannelBuffer, rightChannelBuffer];
	}
	/** 
	 * LittleJS Tile Layer System
	 * - Caches arrays of tiles to off screen canvas for fast rendering
	 * - Unlimited numbers of layers, allocates canvases as needed
	 * - Interfaces with EngineObject for collision
	 * - Collision layer is separate from visible layers
	 * - It is recommended to have a visible layer that matches the collision
	 * - Tile layers can be drawn to using their context with canvas2d
	 * - Drawn directly to the main canvas without using WebGL
	 * @namespace TileCollision
	 */



	/** The tile collision layer array, use setTileCollisionData and getTileCollisionData to access
	 *  @type {Array} 
	 *  @memberof TileCollision */
	let tileCollision = [];

	/** Size of the tile collision layer
	 *  @type {Vector2} 
	 *  @memberof TileCollision */
	let tileCollisionSize = vec2();

	/** Clear and initialize tile collision
	 *  @param {Vector2} size
	 *  @memberof TileCollision */
	function initTileCollision(size)
	{
	    tileCollisionSize = size;
	    tileCollision = [];
	    for (let i=tileCollision.length = tileCollisionSize.area(); i--;)
	        tileCollision[i] = 0;
	}

	/** Set tile collision data
	 *  @param {Vector2} pos
	 *  @param {Number}  [data]
	 *  @memberof TileCollision */
	function setTileCollisionData(pos, data=0)
	{
	    pos.arrayCheck(tileCollisionSize) && (tileCollision[(pos.y|0)*tileCollisionSize.x+pos.x|0] = data);
	}

	/** Get tile collision data
	 *  @param {Vector2} pos
	 *  @return {Number}
	 *  @memberof TileCollision */
	function getTileCollisionData(pos)
	{
	    return pos.arrayCheck(tileCollisionSize) ? tileCollision[(pos.y|0)*tileCollisionSize.x+pos.x|0] : 0;
	}

	/** Check if collision with another object should occur
	 *  @param {Vector2}      pos
	 *  @param {Vector2}      [size=(0,0)]
	 *  @param {EngineObject} [object]
	 *  @return {Boolean}
	 *  @memberof TileCollision */
	function tileCollisionTest(pos, size=vec2(), object)
	{
	    const minX = max(pos.x - size.x/2|0, 0);
	    const minY = max(pos.y - size.y/2|0, 0);
	    const maxX = min(pos.x + size.x/2, tileCollisionSize.x);
	    const maxY = min(pos.y + size.y/2, tileCollisionSize.y);
	    for (let y = minY; y < maxY; ++y)
	    for (let x = minX; x < maxX; ++x)
	    {
	        const tileData = tileCollision[y*tileCollisionSize.x+x];
	        if (tileData && (!object || object.collideWithTile(tileData, vec2(x, y))))
	            return true;
	    }
	}

	/** Return the center of first tile hit (does not return the exact intersection)
	 *  @param {Vector2}      posStart
	 *  @param {Vector2}      posEnd
	 *  @param {EngineObject} [object]
	 *  @return {Vector2}
	 *  @memberof TileCollision */
	function tileCollisionRaycast(posStart, posEnd, object)
	{
	    // test if a ray collides with tiles from start to end
	    // todo: a way to get the exact hit point, it must still be inside the hit tile
	    const delta = posEnd.subtract(posStart);
	    const totalLength = delta.length();
	    const normalizedDelta = delta.normalize();
	    const unit = vec2(abs(1/normalizedDelta.x), abs(1/normalizedDelta.y));
	    const flooredPosStart = posStart.floor();

	    // setup iteration variables
	    let pos = flooredPosStart;
	    let xi = unit.x * (delta.x < 0 ? posStart.x - pos.x : pos.x - posStart.x + 1);
	    let yi = unit.y * (delta.y < 0 ? posStart.y - pos.y : pos.y - posStart.y + 1);

	    while (1)
	    {
	        // check for tile collision
	        const tileData = getTileCollisionData(pos);
	        if (tileData && (!object || object.collideWithTile(tileData, pos)))
	        {
	            debugRaycast && debugLine(posStart, posEnd, '#f00', .02);
	            debugRaycast && debugPoint(pos.add(vec2(.5)), '#ff0');
	            return pos.add(vec2(.5));
	        }

	        // check if past the end
	        if (xi > totalLength && yi > totalLength)
	            break;

	        // get coordinates of the next tile to check
	        if (xi > yi)
	            pos.y += sign(delta.y), yi += unit.y;
	        else
	            pos.x += sign(delta.x), xi += unit.x;
	    }

	    debugRaycast && debugLine(posStart, posEnd, '#00f', .02);
	}

	///////////////////////////////////////////////////////////////////////////////
	// Tile Layer Rendering System

	/**
	 * Tile layer data object stores info about how to render a tile
	 * @example
	 * // create tile layer data with tile index 0 and random orientation and color
	 * const tileIndex = 0;
	 * const direction = randInt(4)
	 * const mirror = randInt(2);
	 * const color = randColor();
	 * const data = new TileLayerData(tileIndex, direction, mirror, color);
	 */
	class TileLayerData
	{
	    /** Create a tile layer data object, one for each tile in a TileLayer
	     *  @param {Number}  [tile]      - The tile to use, untextured if undefined
	     *  @param {Number}  [direction] - Integer direction of tile, in 90 degree increments
	     *  @param {Boolean} [mirror]    - If the tile should be mirrored along the x axis
	     *  @param {Color}   [color]     - Color of the tile */
	    constructor(tile, direction=0, mirror=false, color=new Color)
	    {
	        /** @property {Number}  - The tile to use, untextured if undefined */
	        this.tile      = tile;
	        /** @property {Number}  - Integer direction of tile, in 90 degree increments */
	        this.direction = direction;
	        /** @property {Boolean} - If the tile should be mirrored along the x axis */
	        this.mirror    = mirror;
	        /** @property {Color}   - Color of the tile */
	        this.color     = color;
	    }

	    /** Set this tile to clear, it will not be rendered */
	    clear() { this.tile = this.direction = 0; this.mirror = false; this.color = new Color; }
	}

	/**
	 * Tile Layer - cached rendering system for tile layers
	 * - Each Tile layer is rendered to an off screen canvas
	 * - To allow dynamic modifications, layers are rendered using canvas 2d
	 * - Some devices like mobile phones are limited to 4k texture resolution
	 * - So with 16x16 tiles this limits layers to 256x256 on mobile devices
	 * @extends EngineObject
	 * @example
	 * // create tile collision and visible tile layer
	 * initTileCollision(vec2(200,100));
	 * const tileLayer = new TileLayer();
	 */
	class TileLayer extends EngineObject
	{
	    /** Create a tile layer object
	    *  @param {Vector2}  [position=(0,0)]     - World space position
	    *  @param {Vector2}  [size=tileCollisionSize] - World space size
	    *  @param {TileInfo} [tileInfo]    - Tile info for layer
	    *  @param {Vector2}  [scale=(1,1)] - How much to scale this layer when rendered
	    *  @param {Number}   [renderOrder] - Objects are sorted by renderOrder
	    */
	    constructor(position, size=tileCollisionSize, tileInfo=tile(), scale=vec2(1), renderOrder=0)
	    {
	        super(position, size, tileInfo, 0, undefined, renderOrder);

	        /** @property {HTMLCanvasElement} - The canvas used by this tile layer */
	        this.canvas = document.createElement('canvas');
	        /** @property {CanvasRenderingContext2D} - The 2D canvas context used by this tile layer */
	        this.context = this.canvas.getContext('2d');
	        /** @property {Vector2} - How much to scale this layer when rendered */
	        this.scale = scale;
	        /** @property {Boolean} - If true this layer will render to overlay canvas and appear above all objects */
	        this.isOverlay = false;

	        // init tile data
	        this.data = [];
	        for (let j = this.size.area(); j--;)
	            this.data.push(new TileLayerData);
	    }
	    
	    /** Set data at a given position in the array 
	     *  @param {Vector2}       layerPos - Local position in array
	     *  @param {TileLayerData} data     - Data to set
	     *  @param {Boolean}       [redraw] - Force the tile to redraw if true */
	    setData(layerPos, data, redraw=false)
	    {
	        if (layerPos.arrayCheck(this.size))
	        {
	            this.data[(layerPos.y|0)*this.size.x+layerPos.x|0] = data;
	            redraw && this.drawTileData(layerPos);
	        }
	    }
	    
	    /** Get data at a given position in the array 
	     *  @param {Vector2} layerPos - Local position in array
	     *  @return {TileLayerData} */
	    getData(layerPos)
	    { return layerPos.arrayCheck(this.size) && this.data[(layerPos.y|0)*this.size.x+layerPos.x|0]; }
	    
	    // Tile layers are not updated
	    update() {}

	    // Render the tile layer, called automatically by the engine
	    render()
	    {
	        ASSERT(mainContext != this.context, 'must call redrawEnd() after drawing tiles');

	        // flush and copy gl canvas because tile canvas does not use webgl
	        glEnable && !glOverlay && !this.isOverlay && glCopyToContext(mainContext);
	        
	        // draw the entire cached level onto the canvas
	        const pos = worldToScreen(this.pos.add(vec2(0,this.size.y*this.scale.y)));
	        (this.isOverlay ? overlayContext : mainContext).drawImage
	        (
	            this.canvas, pos.x, pos.y,
	            cameraScale*this.size.x*this.scale.x, cameraScale*this.size.y*this.scale.y
	        );
	    }

	    /** Draw all the tile data to an offscreen canvas 
	     *  - This may be slow in some browsers but only needs to be done once */
	    redraw()
	    {
	        this.redrawStart(true);
	        for (let x = this.size.x; x--;)
	        for (let y = this.size.y; y--;)
	            this.drawTileData(vec2(x,y), false);
	        this.redrawEnd();
	    }

	    /** Call to start the redraw process
	     *  - This can be used to manually update small parts of the level
	     *  @param {Boolean} [clear] - Should it clear the canvas before drawing */
	    redrawStart(clear=false)
	    {
	        // save current render settings
	        /** @type {[HTMLCanvasElement, CanvasRenderingContext2D, Vector2, Vector2, number]} */
	        this.savedRenderSettings = [mainCanvas, mainContext, mainCanvasSize, cameraPos, cameraScale];

	        // use webgl rendering system to render the tiles if enabled
	        // this works by temporally taking control of the rendering system
	        mainCanvas = this.canvas;
	        mainContext = this.context;
	        mainCanvasSize = this.size.multiply(this.tileInfo.size);
	        cameraPos = this.size.scale(.5);
	        cameraScale = this.tileInfo.size.x;

	        if (clear)
	        {
	            // clear and set size
	            mainCanvas.width  = mainCanvasSize.x;
	            mainCanvas.height = mainCanvasSize.y;
	        }

	        // disable smoothing for pixel art
	        this.context.imageSmoothingEnabled = !canvasPixelated;

	        // setup gl rendering if enabled
	        glEnable && glPreRender();
	    }

	    /** Call to end the redraw process */
	    redrawEnd()
	    {
	        ASSERT(mainContext == this.context, 'must call redrawStart() before drawing tiles');
	        glEnable && glCopyToContext(mainContext, true);
	        //debugSaveCanvas(this.canvas);

	        // set stuff back to normal
	        [mainCanvas, mainContext, mainCanvasSize, cameraPos, cameraScale] = this.savedRenderSettings;
	    }

	    /** Draw the tile at a given position in the tile grid
	     *  This can be used to clear out tiles when they are destroyed
	     *  Tiles can also be redrawn if isinde a redrawStart/End block
	     *  @param {Vector2} layerPos 
	     *  @param {Boolean} [clear] - should the old tile be cleared out
	     */
	    drawTileData(layerPos, clear=true)
	    {
	        // clear out where the tile was, for full opaque tiles this can be skipped
	        const s = this.tileInfo.size;
	        if (clear)
	        {
	            const pos = layerPos.multiply(s);
	            this.context.clearRect(pos.x, this.canvas.height-pos.y, s.x, -s.y);
	        }

	        // draw the tile if not undefined
	        const d = this.getData(layerPos);
	        if (d.tile != undefined)
	        {
	            const pos = this.pos.add(layerPos).add(vec2(.5));
	            ASSERT(mainContext == this.context, 'must call redrawStart() before drawing tiles');
	            const tileInfo = tile(d.tile, s, this.tileInfo.textureIndex);
	            drawTile(pos, vec2(1), tileInfo, d.color, d.direction*PI/2, d.mirror);
	        }
	    }

	    /** Draw directly to the 2D canvas in world space (bipass webgl)
	     *  @param {Vector2}  pos
	     *  @param {Vector2}  size
	     *  @param {Number}   angle
	     *  @param {Boolean}  mirror
	     *  @param {Function} drawFunction */
	    drawCanvas2D(pos, size, angle, mirror, drawFunction)
	    {
	        const context = this.context;
	        context.save();
	        pos = pos.subtract(this.pos).multiply(this.tileInfo.size);
	        size = size.multiply(this.tileInfo.size);
	        context.translate(pos.x, this.canvas.height - pos.y);
	        context.rotate(angle);
	        context.scale(mirror ? -size.x : size.x, size.y);
	        drawFunction(context);
	        context.restore();
	    }

	    /** Draw a tile directly onto the layer canvas in world space
	     *  @param {Vector2}  pos
	     *  @param {Vector2}  [size=(1,1)]
	     *  @param {TileInfo} [tileInfo]
	     *  @param {Color}    [color=(1,1,1,1)]
	     *  @param {Number}   [angle=0]
	     *  @param {Boolean}  [mirror=0] */
	    drawTile(pos, size=vec2(1), tileInfo, color=new Color, angle, mirror)
	    {
	        this.drawCanvas2D(pos, size, angle, mirror, (context)=>
	        {
	            const textureInfo = tileInfo && tileInfo.getTextureInfo();
	            if (textureInfo)
	            {
	                context.globalAlpha = color.a; // only alpha is supported
	                context.drawImage(textureInfo.image, 
	                    tileInfo.pos.x,  tileInfo.pos.y, 
	                    tileInfo.size.x, tileInfo.size.y, -.5, -.5, 1, 1);
	                context.globalAlpha = 1;
	            }
	            else
	            {
	                // untextured
	                context.fillStyle = color;
	                context.fillRect(-.5, -.5, 1, 1);
	            }
	        });
	    }

	    /** Draw a rectangle directly onto the layer canvas in world space
	     *  @param {Vector2} pos
	     *  @param {Vector2} [size=(1,1)]
	     *  @param {Color}   [color=(1,1,1,1)]
	     *  @param {Number}  [angle=0] */
	    drawRect(pos, size, color, angle) 
	    { this.drawTile(pos, size, undefined, color, angle); }
	}
	/** 
	 * LittleJS Particle System
	 */



	/**
	 * Particle Emitter - Spawns particles with the given settings
	 * @extends EngineObject
	 * @example
	 * // create a particle emitter
	 * let pos = vec2(2,3);
	 * let particleEmitter = new ParticleEmitter
	 * (
	 *     pos, 0, 1, 0, 500, PI,      // pos, angle, emitSize, emitTime, emitRate, emiteCone
	 *     tile(0, 16),                // tileInfo
	 *     rgb(1,1,1),   rgb(0,0,0),   // colorStartA, colorStartB
	 *     rgb(1,1,1,0), rgb(0,0,0,0), // colorEndA, colorEndB
	 *     2, .2, .2, .1, .05,  // particleTime, sizeStart, sizeEnd, particleSpeed, particleAngleSpeed
	 *     .99, 1, 1, PI, .05,  // damping, angleDamping, gravityScale, particleCone, fadeRate, 
	 *     .5, 1                // randomness, collide, additive, randomColorLinear, renderOrder
	 * );
	 */
	class ParticleEmitter extends EngineObject
	{
	    /** Create a particle system with the given settings
	     *  @param {Vector2} position - World space position of the emitter
	     *  @param {Number} [angle] - Angle to emit the particles
	     *  @param {Number|Vector2}  [emitSize] - World space size of the emitter (float for circle diameter, vec2 for rect)
	     *  @param {Number} [emitTime] - How long to stay alive (0 is forever)
	     *  @param {Number} [emitRate] - How many particles per second to spawn, does not emit if 0
	     *  @param {Number} [emitConeAngle=PI] - Local angle to apply velocity to particles from emitter
	     *  @param {TileInfo} [tileInfo] - Tile info to render particles (undefined is untextured)
	     *  @param {Color} [colorStartA=(1,1,1,1)] - Color at start of life 1, randomized between start colors
	     *  @param {Color} [colorStartB=(1,1,1,1)] - Color at start of life 2, randomized between start colors
	     *  @param {Color} [colorEndA=(1,1,1,0)] - Color at end of life 1, randomized between end colors
	     *  @param {Color} [colorEndB=(1,1,1,0)] - Color at end of life 2, randomized between end colors
	     *  @param {Number} [particleTime]      - How long particles live
	     *  @param {Number} [sizeStart]         - How big are particles at start
	     *  @param {Number} [sizeEnd]           - How big are particles at end
	     *  @param {Number} [speed]             - How fast are particles when spawned
	     *  @param {Number} [angleSpeed]        - How fast are particles rotating
	     *  @param {Number} [damping]           - How much to dampen particle speed
	     *  @param {Number} [angleDamping]      - How much to dampen particle angular speed
	     *  @param {Number} [gravityScale]      - How much gravity effect particles
	     *  @param {Number} [particleConeAngle] - Cone for start particle angle
	     *  @param {Number} [fadeRate]          - How quick to fade particles at start/end in percent of life
	     *  @param {Number} [randomness]    - Apply extra randomness percent
	     *  @param {Boolean} [collideTiles] - Do particles collide against tiles
	     *  @param {Boolean} [additive]     - Should particles use addtive blend
	     *  @param {Boolean} [randomColorLinear] - Should color be randomized linearly or across each component
	     *  @param {Number} [renderOrder] - Render order for particles (additive is above other stuff by default)
	     *  @param {Boolean}  [localSpace] - Should it be in local space of emitter (world space is default)
	     */
	    constructor
	    ( 
	        position,
	        angle,
	        emitSize = 0,
	        emitTime = 0,
	        emitRate = 100,
	        emitConeAngle = PI,
	        tileInfo,
	        colorStartA = new Color,
	        colorStartB = new Color,
	        colorEndA = new Color(1,1,1,0),
	        colorEndB = new Color(1,1,1,0),
	        particleTime = .5,
	        sizeStart = .1,
	        sizeEnd = 1,
	        speed = .1,
	        angleSpeed = .05,
	        damping = 1,
	        angleDamping = 1,
	        gravityScale = 0,
	        particleConeAngle = PI,
	        fadeRate = .1,
	        randomness = .2, 
	        collideTiles = false,
	        additive = false,
	        randomColorLinear = true,
	        renderOrder = additive ? 1e9 : 0,
	        localSpace = false
	    )
	    {
	        super(position, vec2(), tileInfo, angle, undefined, renderOrder);

	        // emitter settings
	        /** @property {Number|Vector2} - World space size of the emitter (float for circle diameter, vec2 for rect) */
	        this.emitSize = emitSize;
	        /** @property {Number} - How long to stay alive (0 is forever) */
	        this.emitTime = emitTime;
	        /** @property {Number} - How many particles per second to spawn, does not emit if 0 */
	        this.emitRate = emitRate;
	        /** @property {Number} - Local angle to apply velocity to particles from emitter */
	        this.emitConeAngle = emitConeAngle;

	        // color settings
	        /** @property {Color} - Color at start of life 1, randomized between start colors */
	        this.colorStartA = colorStartA;
	        /** @property {Color} - Color at start of life 2, randomized between start colors */
	        this.colorStartB = colorStartB;
	        /** @property {Color} - Color at end of life 1, randomized between end colors */
	        this.colorEndA   = colorEndA;
	        /** @property {Color} - Color at end of life 2, randomized between end colors */
	        this.colorEndB   = colorEndB;
	        /** @property {Boolean} - Should color be randomized linearly or across each component */
	        this.randomColorLinear = randomColorLinear;

	        // particle settings
	        /** @property {Number} - How long particles live */
	        this.particleTime      = particleTime;
	        /** @property {Number} - How big are particles at start */
	        this.sizeStart         = sizeStart;
	        /** @property {Number} - How big are particles at end */
	        this.sizeEnd           = sizeEnd;
	        /** @property {Number} - How fast are particles when spawned */
	        this.speed             = speed;
	        /** @property {Number} - How fast are particles rotating */
	        this.angleSpeed        = angleSpeed;
	        /** @property {Number} - How much to dampen particle speed */
	        this.damping           = damping;
	        /** @property {Number} - How much to dampen particle angular speed */
	        this.angleDamping      = angleDamping;
	        /** @property {Number} - How much does gravity effect particles */
	        this.gravityScale      = gravityScale;
	        /** @property {Number} - Cone for start particle angle */
	        this.particleConeAngle = particleConeAngle;
	        /** @property {Number} - How quick to fade in particles at start/end in percent of life */
	        this.fadeRate          = fadeRate;
	        /** @property {Number} - Apply extra randomness percent */
	        this.randomness        = randomness;
	        /** @property {Boolean} - Do particles collide against tiles */
	        this.collideTiles      = collideTiles;
	        /** @property {Boolean} - Should particles use addtive blend */
	        this.additive          = additive;
	        /** @property {Boolean} - Should it be in local space of emitter */
	        this.localSpace        = localSpace;
	        /** @property {Number} - If non zero the partile is drawn as a trail, stretched in the drection of velocity */
	        this.trailScale        = 0;
	        /** @property {Function}   - Callback when particle is destroyed */
	        this.particleDestroyCallback = undefined;
	        /** @property {Function}   - Callback when particle is created */
	        this.particleCreateCallback = undefined;
	        /** @property {Number} - Track particle emit time */
	        this.emitTimeBuffer    = 0;
	    }
	    
	    /** Update the emitter to spawn particles, called automatically by engine once each frame */
	    update()
	    {
	        // only do default update to apply parent transforms
	        this.parent && super.update();

	        // update emitter
	        if (!this.emitTime || this.getAliveTime() <= this.emitTime)
	        {
	            // emit particles
	            if (this.emitRate * particleEmitRateScale)
	            {
	                const rate = 1/this.emitRate/particleEmitRateScale;
	                for (this.emitTimeBuffer += timeDelta; this.emitTimeBuffer > 0; this.emitTimeBuffer -= rate)
	                    this.emitParticle();
	            }
	        }
	        else
	            this.destroy();

	        debugParticles && debugRect(this.pos, vec2(this.emitSize), '#0f0', 0, this.angle);
	    }

	    /** Spawn one particle
	     *  @return {Particle} */
	    emitParticle()
	    {
	        // spawn a particle
	        let pos = typeof this.emitSize === 'number' ? // check if number was used
	            randInCircle(this.emitSize/2)              // circle emitter
	            : vec2(rand(-.5,.5), rand(-.5,.5))         // box emitter
	                .multiply(this.emitSize).rotate(this.angle);
	        let angle = rand(this.particleConeAngle, -this.particleConeAngle);
	        if (!this.localSpace)
	        {
	            pos = this.pos.add(pos);
	            angle += this.angle;
	        }

	        // randomness scales each paremeter by a percentage
	        const randomness = this.randomness;
	        const randomizeScale = (v)=> v + v*rand(randomness, -randomness);

	        // randomize particle settings
	        const particleTime  = randomizeScale(this.particleTime);
	        const sizeStart     = randomizeScale(this.sizeStart);
	        const sizeEnd       = randomizeScale(this.sizeEnd);
	        const speed         = randomizeScale(this.speed);
	        const angleSpeed    = randomizeScale(this.angleSpeed) * randSign();
	        const coneAngle     = rand(this.emitConeAngle, -this.emitConeAngle);
	        const colorStart    = randColor(this.colorStartA, this.colorStartB, this.randomColorLinear);
	        const colorEnd      = randColor(this.colorEndA,   this.colorEndB, this.randomColorLinear);
	        const velocityAngle = this.localSpace ? coneAngle : this.angle + coneAngle;
	        
	        // build particle
	        const particle = new Particle(pos, this.tileInfo, angle, colorStart, colorEnd, particleTime, sizeStart, sizeEnd, this.fadeRate, this.additive,  this.trailScale, this.localSpace && this, this.particleDestroyCallback);
	        particle.velocity      = vec2().setAngle(velocityAngle, speed);
	        particle.angleVelocity = angleSpeed;
	        particle.fadeRate      = this.fadeRate;
	        particle.damping       = this.damping;
	        particle.angleDamping  = this.angleDamping;
	        particle.elasticity    = this.elasticity;
	        particle.friction      = this.friction;
	        particle.gravityScale  = this.gravityScale;
	        particle.collideTiles  = this.collideTiles;
	        particle.renderOrder   = this.renderOrder;
	        particle.mirror        = !!randInt(2);

	        // call particle create callaback
	        this.particleCreateCallback && this.particleCreateCallback(particle);

	        // return the newly created particle
	        return particle;
	    }

	    // Particle emitters are not rendered, only the particles are
	    render() {}
	}

	///////////////////////////////////////////////////////////////////////////////
	/**
	 * Particle Object - Created automatically by Particle Emitters
	 * @extends EngineObject
	 */
	class Particle extends EngineObject
	{
	    /**
	     * Create a particle with the given shis.colorStart = undefined;ettings
	     * @param {Vector2}  position     - World space position of the particle
	     * @param {TileInfo} [tileInfo]   - Tile info to render particles
	     * @param {Number}   [angle]      - Angle to rotate the particle
	     * @param {Color}    [colorStart] - Color at start of life
	     * @param {Color}    [colorEnd]   - Color at end of life
	     * @param {Number}   [lifeTime]   - How long to live for
	     * @param {Number}   [sizeStart]  - Angle to rotate the particle
	     * @param {Number}   [sizeEnd]    - Angle to rotate the particle
	     * @param {Number}   [fadeRate]   - Angle to rotate the particle
	     * @param {Boolean}  [additive]   - Angle to rotate the particle
	     * @param {Number}   [trailScale] - If a trail, how long to make it
	     * @param {ParticleEmitter} [localSpaceEmitter] - Parent emitter if local space
	     * @param {Function}  [destroyCallback] - Called when particle dies
	     */
	    constructor(position, tileInfo, angle, colorStart, colorEnd, lifeTime, sizeStart, sizeEnd, fadeRate, additive, trailScale, localSpaceEmitter, destroyCallback
	    )
	    { 
	        super(position, vec2(), tileInfo, angle); 
	    
	        /** @property {Color} - Color at start of life */
	        this.colorStart = colorStart;
	        /** @property {Color} - Calculated change in color */
	        this.colorEndDelta = colorEnd.subtract(colorStart);
	        /** @property {Number} - How long to live for */
	        this.lifeTime = lifeTime;
	        /** @property {Number} - Size at start of life */
	        this.sizeStart = sizeStart;
	        /** @property {Number} - Calculated change in size */
	        this.sizeEndDelta = sizeEnd - sizeStart;
	        /** @property {Number} - How quick to fade in/out */
	        this.fadeRate = fadeRate;
	        /** @property {Boolean} - Is it additive */
	        this.additive = additive;
	        /** @property {Number} - If a trail, how long to make it */
	        this.trailScale = trailScale;
	        /** @property {ParticleEmitter} - Parent emitter if local space */
	        this.localSpaceEmitter = localSpaceEmitter;
	        /** @property {Function} - Called when particle dies */
	        this.destroyCallback = destroyCallback;
	    }

	    /** Render the particle, automatically called each frame, sorted by renderOrder */
	    render()
	    {
	        // modulate size and color
	        const p = min((time - this.spawnTime) / this.lifeTime, 1);
	        const radius = this.sizeStart + p * this.sizeEndDelta;
	        const size = vec2(radius);
	        const fadeRate = this.fadeRate/2;
	        const color = new Color(
	            this.colorStart.r + p * this.colorEndDelta.r,
	            this.colorStart.g + p * this.colorEndDelta.g,
	            this.colorStart.b + p * this.colorEndDelta.b,
	            (this.colorStart.a + p * this.colorEndDelta.a) * 
	             (p < fadeRate ? p/fadeRate : p > 1-fadeRate ? (1-p)/fadeRate : 1)); // fade alpha

	        // draw the particle
	        this.additive && setBlendMode(true);

	        let pos = this.pos, angle = this.angle;
	        if (this.localSpaceEmitter)
	        {
	            // in local space of emitter
	            pos = this.localSpaceEmitter.pos.add(pos.rotate(-this.localSpaceEmitter.angle)); 
	            angle += this.localSpaceEmitter.angle;
	        }
	        if (this.trailScale)
	        {
	            // trail style particles
	            let velocity = this.velocity;
	            if (this.localSpaceEmitter)
	                velocity = velocity.rotate(-this.localSpaceEmitter.angle);
	            const speed = velocity.length();
	            if (speed)
	            {
	                const direction = velocity.scale(1/speed);
	                const trailLength = speed * this.trailScale;
	                size.y = max(size.x, trailLength);
	                angle = direction.angle();
	                drawTile(pos.add(direction.multiply(vec2(0,-trailLength/2))), size, this.tileInfo, color, angle, this.mirror);
	            }
	        }
	        else
	            drawTile(pos, size, this.tileInfo, color, angle, this.mirror);
	        this.additive && setBlendMode();
	        debugParticles && debugRect(pos, size, '#f005', 0, angle);

	        if (p == 1)
	        {
	            // destroy particle when it's time runs out
	            this.color = color;
	            this.size = size;
	            this.destroyCallback && this.destroyCallback(this);
	            this.destroyed = 1;
	        }
	    }
	}
	/** 
	 * LittleJS Medal System
	 * - Tracks and displays medals
	 * - Saves medals to local storage
	 * - Newgrounds integration
	 * @namespace Medals
	 */



	/** List of all medals
	 *  @type {Array}
	 *  @memberof Medals */
	const medals = [];

	// Engine internal variables not exposed to documentation
	let medalsDisplayQueue = [], medalsSaveName, medalsDisplayTimeLast;

	///////////////////////////////////////////////////////////////////////////////

	/** Initialize medals with a save name used for storage
	 *  - Call this after creating all medals
	 *  - Checks if medals are unlocked
	 *  @param {String} saveName
	 *  @memberof Medals */
	function medalsInit(saveName)
	{
	    // check if medals are unlocked
	    medalsSaveName = saveName;
	    medals.forEach(medal=> medal.unlocked = (localStorage[medal.storageKey()] | 0));
	}

	/** 
	 * Medal - Tracks an unlockable medal 
	 * @example
	 * // create a medal
	 * const medal_example = new Medal(0, 'Example Medal', 'More info about the medal goes here.', '🎖️');
	 * 
	 * // initialize medals
	 * medalsInit('Example Game');
	 * 
	 * // unlock the medal
	 * medal_example.unlock();
	 */
	class Medal
	{
	    /** Create a medal object and adds it to the list of medals
	     *  @param {Number} id            - The unique identifier of the medal
	     *  @param {String} name          - Name of the medal
	     *  @param {String} [description] - Description of the medal
	     *  @param {String} [icon]        - Icon for the medal
	     *  @param {String} [src]         - Image location for the medal
	     */
	    constructor(id, name, description='', icon='🏆', src)
	    {
	        ASSERT(id >= 0 && !medals[id]);

	        // save attributes and add to list of medals
	        medals[this.id = id] = this;
	        this.name = name;
	        this.description = description;
	        this.icon = icon;
	        if (src)
	            (this.image = new Image).src = src;
	    }

	    /** Unlocks a medal if not already unlocked */
	    unlock()
	    {
	        if (medalsPreventUnlock || this.unlocked)
	            return;

	        // save the medal
	        ASSERT(medalsSaveName, 'save name must be set');
	        localStorage[this.storageKey()] = this.unlocked = 1;
	        medalsDisplayQueue.push(this);
	        newgrounds && newgrounds.unlockMedal(this.id);
	    }

	    /** Render a medal
	     *  @param {Number} [hidePercent] - How much to slide the medal off screen
	     */
	    render(hidePercent=0)
	    {
	        const context = overlayContext;
	        const width = min(medalDisplaySize.x, mainCanvas.width);
	        const x = overlayCanvas.width - width;
	        const y = -medalDisplaySize.y*hidePercent;

	        // draw containing rect and clip to that region
	        context.save();
	        context.beginPath();
	        context.fillStyle = new Color(.9,.9,.9).toString();
	        context.strokeStyle = new Color(0,0,0).toString();
	        context.lineWidth = 3;
	        context.rect(x, y, width, medalDisplaySize.y);
	        context.fill();
	        context.stroke();
	        context.clip();

	        // draw the icon and text
	        this.renderIcon(vec2(x+15+medalDisplayIconSize/2, y+medalDisplaySize.y/2));
	        const pos = vec2(x+medalDisplayIconSize+30, y+28);
	        drawTextScreen(this.name, pos, 38, new Color(0,0,0), 0, undefined, 'left');
	        pos.y += 32;
	        drawTextScreen(this.description, pos, 24, new Color(0,0,0), 0, undefined, 'left');
	        context.restore();
	    }

	    /** Render the icon for a medal
	     *  @param {Vector2} pos - Screen space position
	     *  @param {Number} [size=medalDisplayIconSize] - Screen space size
	     */
	    renderIcon(pos, size=medalDisplayIconSize)
	    {
	        // draw the image or icon
	        if (this.image)
	            overlayContext.drawImage(this.image, pos.x-size/2, pos.y-size/2, size, size);
	        else
	            drawTextScreen(this.icon, pos, size*.7, new Color(0,0,0));
	    }
	 
	    // Get local storage key used by the medal
	    storageKey() { return medalsSaveName + '_' + this.id; }
	}

	// engine automatically renders medals
	function medalsRender()
	{
	    if (!medalsDisplayQueue.length)
	        return;
	    
	    // update first medal in queue
	    const medal = medalsDisplayQueue[0];
	    const time = timeReal - medalsDisplayTimeLast;
	    if (!medalsDisplayTimeLast)
	        medalsDisplayTimeLast = timeReal;
	    else if (time > medalDisplayTime)
	    {
	        medalsDisplayTimeLast = 0;
	        medalsDisplayQueue.shift();
	    }
	    else
	    {
	        // slide on/off medals
	        const slideOffTime = medalDisplayTime - medalDisplaySlideTime;
	        const hidePercent = 
	            time < medalDisplaySlideTime ? 1 - time / medalDisplaySlideTime :
	            time > slideOffTime ? (time - slideOffTime) / medalDisplaySlideTime : 0;
	        medal.render(hidePercent);
	    }
	}

	///////////////////////////////////////////////////////////////////////////////

	// global Newgrounds object
	let newgrounds;

	/** This can used to enable Newgrounds functionality
	 *  @param {Number} app_id   - The newgrounds App ID
	 *  @param {String} [cipher] - The encryption Key (AES-128/Base64)
	 *  @param {Object} [cryptoJS] - An instance of CryptoJS, if there is a cipher
	 *  @memberof Medals */
	function newgroundsInit(app_id, cipher, cryptoJS)
	{ newgrounds = new Newgrounds(app_id, cipher, cryptoJS); }

	/** 
	 * Newgrounds API wrapper object
	 * @example
	 * // create a newgrounds object, replace the app id with your own
	 * const app_id = '53123:1ZuSTQ9l';
	 * newgrounds = new Newgrounds(app_id);
	 */
	class Newgrounds
	{
	    /** Create a newgrounds object
	     *  @param {Number} app_id   - The newgrounds App ID
	     *  @param {String} [cipher] - The encryption Key (AES-128/Base64)
	     *  @param {Object} [cryptoJS] - An instance of CryptoJS, if there is a cipher */
	    constructor(app_id, cipher, cryptoJS)
	    {
	        ASSERT(!newgrounds && app_id>0, 'there can only be one newgrounds object');
	        ASSERT(!cipher || cryptoJS, 'must provide cryptojs if there is a cipher');

	        this.app_id = app_id;
	        this.cipher = cipher;
	        this.cryptoJS = cryptoJS;
	        this.host = location ? location.hostname : '';

	        // get session id from url search params
	        const url = new URL(location.href);
	        this.session_id = url.searchParams.get('ngio_session_id');

	        if (!this.session_id)
	            return; // only use newgrounds when logged in

	        // get medals
	        const medalsResult = this.call('Medal.getList');
	        this.medals = medalsResult ? medalsResult.result.data['medals'] : [];
	        for (const newgroundsMedal of this.medals)
	        {
	            const medal = medals[newgroundsMedal['id']];
	            if (medal)
	            {
	                // copy newgrounds medal data
	                medal.image =       new Image;
	                medal.image.src =   newgroundsMedal['icon'];
	                medal.name =        newgroundsMedal['name'];
	                medal.description = newgroundsMedal['description'];
	                medal.unlocked =    newgroundsMedal['unlocked'];
	                medal.difficulty =  newgroundsMedal['difficulty'];
	                medal.value =       newgroundsMedal['value'];

	                if (medal.value)
	                    medal.description = medal.description + ' (' + medal.value + ')';
	            }
	        }
	    
	        // get scoreboards
	        const scoreboardResult = this.call('ScoreBoard.getBoards');
	        this.scoreboards = scoreboardResult ? scoreboardResult.result.data.scoreboards : [];

	        const keepAliveMS = 5 * 60 * 1e3;
	        setInterval(()=>this.call('Gateway.ping', 0, true), keepAliveMS);
	    }

	    /** Send message to unlock a medal by id
	     * @param {Number} id - The medal id */
	    unlockMedal(id) { return this.call('Medal.unlock', {'id':id}, true); }

	    /** Send message to post score
	     * @param {Number} id    - The scoreboard id
	     * @param {Number} value - The score value */
	    postScore(id, value) { return this.call('ScoreBoard.postScore', {'id':id, 'value':value}, true); }

	    /** Get scores from a scoreboard
	     * @param {Number} id       - The scoreboard id
	     * @param {String} [user]   - A user's id or name
	     * @param {Number} [social] - If true, only social scores will be loaded
	     * @param {Number} [skip]   - Number of scores to skip before start
	     * @param {Number} [limit]  - Number of scores to include in the list
	     * @return {Object}         - The response JSON object
	     */
	    getScores(id, user, social=0, skip=0, limit=10)
	    { return this.call('ScoreBoard.getScores', {'id':id, 'user':user, 'social':social, 'skip':skip, 'limit':limit}); }

	    /** Send message to log a view */
	    logView() { return this.call('App.logView', {'host':this.host}, true); }

	    /** Send a message to call a component of the Newgrounds API
	     * @param {String}  component    - Name of the component
	     * @param {Object}  [parameters] - Parameters to use for call
	     * @param {Boolean} [async]      - If true, don't wait for response before continuing
	     * @return {Object}              - The response JSON object
	     */
	    call(component, parameters, async=false)
	    {
	        const call = {'component':component, 'parameters':parameters};
	        if (this.cipher)
	        {
	            // encrypt using AES-128 Base64 with cryptoJS
	            const cryptoJS = this.cryptoJS;
	            const aesKey = cryptoJS['enc']['Base64']['parse'](this.cipher);
	            const iv = cryptoJS['lib']['WordArray']['random'](16);
	            const encrypted = cryptoJS['AES']['encrypt'](JSON.stringify(call), aesKey, {'iv':iv});
	            call['secure'] = cryptoJS['enc']['Base64']['stringify'](iv.concat(encrypted['ciphertext']));
	            call['parameters'] = 0;
	        }

	        // build the input object
	        const input =
	        {
	            'app_id':     this.app_id,
	            'session_id': this.session_id,
	            'call':       call
	        };

	        // build post data
	        const formData = new FormData();
	        formData.append('input', JSON.stringify(input));
	        
	        // send post data
	        const xmlHttp = new XMLHttpRequest();
	        const url = 'https://newgrounds.io/gateway_v3.php';
	        xmlHttp.open('POST', url, async);
	        xmlHttp.send(formData);
	        return xmlHttp.responseText && JSON.parse(xmlHttp.responseText);
	    }
	}
	/**
	 * LittleJS WebGL Interface
	 * - All webgl used by the engine is wrapped up here
	 * - For normal stuff you won't need to see or call anything in this file
	 * - For advanced stuff there are helper functions to create shaders, textures, etc
	 * - Can be disabled with glEnable to revert to 2D canvas rendering
	 * - Batches sprite rendering on GPU for incredibly fast performance
	 * - Sprite transform math is done in the shader where possible
	 * - Supports shadertoy style post processing shaders
	 * @namespace WebGL
	 */



	/** The WebGL canvas which appears above the main canvas and below the overlay canvas
	 *  @type {HTMLCanvasElement}
	 *  @memberof WebGL */
	let glCanvas;

	/** 2d context for glCanvas
	 *  @type {WebGL2RenderingContext}
	 *  @memberof WebGL */
	let glContext;

	// WebGL internal variables not exposed to documentation
	let glShader, glActiveTexture, glArrayBuffer, glGeometryBuffer, glPositionData, glColorData, glInstanceCount, glAdditive, glBatchAdditive;

	///////////////////////////////////////////////////////////////////////////////

	// Initalize WebGL, called automatically by the engine
	function glInit()
	{
	    // create the canvas and textures
	    glCanvas = document.createElement('canvas');
	    glContext = glCanvas.getContext('webgl2');

	    // some browsers are much faster without copying the gl buffer so we just overlay it instead
	    glOverlay && document.body.appendChild(glCanvas);

	    // setup vertex and fragment shaders
	    glShader = glCreateProgram(
	        '#version 300 es\n' +     // specify GLSL ES version
	        'precision highp float;'+ // use highp for better accuracy
	        'uniform mat4 m;'+        // transform matrix
	        'in vec2 g;'+             // geometry
	        'in vec4 p,u,c,a;'+       // position/size, uvs, color, additiveColor
	        'in float r;'+            // rotation
	        'out vec2 v;'+            // return uv, color, additiveColor
	        'out vec4 d,e;'+          // return uv, color, additiveColor
	        'void main(){'+           // shader entry point
	        'vec2 s=(g-.5)*p.zw;'+    // get size offset
	        'gl_Position=m*vec4(p.xy+s*cos(r)-vec2(-s.y,s)*sin(r),1,1);'+ // transform position
	        'v=mix(u.xw,u.zy,g);'+    // pass uv to fragment shader
	        'd=c;e=a;'+               // pass colors to fragment shader
	        '}'                       // end of shader
	        ,
	        '#version 300 es\n' +     // specify GLSL ES version
	        'precision highp float;'+ // use highp for better accuracy
	        'in vec2 v;'+             // uv
	        'in vec4 d,e;'+           // color, additiveColor
	        'uniform sampler2D s;'+   // texture
	        'out vec4 c;'+            // out color
	        'void main(){'+           // shader entry point
	        'c=texture(s,v)*d+e;'+    // modulate texture by color plus additive
	        '}'                       // end of shader
	    );

	    // init buffers
	    const glInstanceData = new ArrayBuffer(gl_INSTANCE_BUFFER_SIZE);
	    glPositionData = new Float32Array(glInstanceData);
	    glColorData = new Uint32Array(glInstanceData);
	    glArrayBuffer = glContext.createBuffer();
	    glGeometryBuffer = glContext.createBuffer();

	    // create the geometry buffer, triangle strip square
	    const geometry = new Float32Array([glInstanceCount=0,0,1,0,0,1,1,1]);
	    glContext.bindBuffer(gl_ARRAY_BUFFER, glGeometryBuffer);
	    glContext.bufferData(gl_ARRAY_BUFFER, geometry, gl_STATIC_DRAW);
	}

	// Setup render each frame, called automatically by engine
	function glPreRender()
	{
	    // clear and set to same size as main canvas
	    glContext.viewport(0, 0, glCanvas.width=mainCanvas.width, glCanvas.height=mainCanvas.height);
	    glContext.clear(gl_COLOR_BUFFER_BIT);

	    // set up the shader
	    glContext.useProgram(glShader);
	    glContext.activeTexture(gl_TEXTURE0);
	    glContext.bindTexture(gl_TEXTURE_2D, glActiveTexture = textureInfos[0].glTexture);

	    // set vertex attributes
	    let offset = glAdditive = glBatchAdditive = 0;
	    let initVertexAttribArray = (name, type, typeSize, size)=>
	    {
	        const location = glContext.getAttribLocation(glShader, name);
	        const stride = typeSize && gl_INSTANCE_BYTE_STRIDE; // only if not geometry
	        const divisor = typeSize && 1; // only if not geometry
	        const normalize = typeSize==1; // only if color
	        glContext.enableVertexAttribArray(location);
	        glContext.vertexAttribPointer(location, size, type, normalize, stride, offset);
	        glContext.vertexAttribDivisor(location, divisor);
	        offset += size*typeSize;
	    };
	    glContext.bindBuffer(gl_ARRAY_BUFFER, glGeometryBuffer);
	    initVertexAttribArray('g', gl_FLOAT, 0, 2); // geometry
	    glContext.bindBuffer(gl_ARRAY_BUFFER, glArrayBuffer);
	    glContext.bufferData(gl_ARRAY_BUFFER, gl_INSTANCE_BUFFER_SIZE, gl_DYNAMIC_DRAW);
	    initVertexAttribArray('p', gl_FLOAT, 4, 4); // position & size
	    initVertexAttribArray('u', gl_FLOAT, 4, 4); // texture coords
	    initVertexAttribArray('c', gl_UNSIGNED_BYTE, 1, 4); // color
	    initVertexAttribArray('a', gl_UNSIGNED_BYTE, 1, 4); // additiveColor
	    initVertexAttribArray('r', gl_FLOAT, 4, 1); // rotation

	    // build the transform matrix
	    const s = vec2(2*cameraScale).divide(mainCanvasSize);
	    const p = vec2(-1).subtract(cameraPos.multiply(s));
	    glContext.uniformMatrix4fv(glContext.getUniformLocation(glShader, 'm'), false,
	        new Float32Array([
	            s.x, 0,   0,   0,
	            0,   s.y, 0,   0,
	            1,   1,   1,   1,
	            p.x, p.y, 0,   0
	        ])
	    );
	}

	/** Set the WebGl texture, called automatically if using multiple textures
	 *  - This may also flush the gl buffer resulting in more draw calls and worse performance
	 *  @param {WebGLTexture} texture
	 *  @memberof WebGL */
	function glSetTexture(texture)
	{
	    // must flush cache with the old texture to set a new one
	    if (texture == glActiveTexture)
	        return;

	    glFlush();
	    glContext.bindTexture(gl_TEXTURE_2D, glActiveTexture = texture);
	}

	/** Compile WebGL shader of the given type, will throw errors if in debug mode
	 *  @param {String} source
	 *  @param {Number} type
	 *  @return {WebGLShader}
	 *  @memberof WebGL */
	function glCompileShader(source, type)
	{
	    // build the shader
	    const shader = glContext.createShader(type);
	    glContext.shaderSource(shader, source);
	    glContext.compileShader(shader);

	    // check for errors
	    if (!glContext.getShaderParameter(shader, gl_COMPILE_STATUS))
	        throw glContext.getShaderInfoLog(shader);
	    return shader;
	}

	/** Create WebGL program with given shaders
	 *  @param {String} vsSource
	 *  @param {String} fsSource
	 *  @return {WebGLProgram}
	 *  @memberof WebGL */
	function glCreateProgram(vsSource, fsSource)
	{
	    // build the program
	    const program = glContext.createProgram();
	    glContext.attachShader(program, glCompileShader(vsSource, gl_VERTEX_SHADER));
	    glContext.attachShader(program, glCompileShader(fsSource, gl_FRAGMENT_SHADER));
	    glContext.linkProgram(program);

	    // check for errors
	    if (!glContext.getProgramParameter(program, gl_LINK_STATUS))
	        throw glContext.getProgramInfoLog(program);
	    return program;
	}

	/** Create WebGL texture from an image and init the texture settings
	 *  @param {HTMLImageElement} image
	 *  @return {WebGLTexture}
	 *  @memberof WebGL */
	function glCreateTexture(image)
	{
	    // build the texture
	    const texture = glContext.createTexture();
	    glContext.bindTexture(gl_TEXTURE_2D, texture);
	    if (image)
	        glContext.texImage2D(gl_TEXTURE_2D, 0, gl_RGBA, gl_RGBA, gl_UNSIGNED_BYTE, image);

	    // use point filtering for pixelated rendering
	    const filter = canvasPixelated ? gl_NEAREST : gl_LINEAR;
	    glContext.texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MIN_FILTER, filter);
	    glContext.texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MAG_FILTER, filter);

	    return texture;
	}

	/** Draw all sprites and clear out the buffer, called automatically by the system whenever necessary
	 *  @memberof WebGL */
	function glFlush()
	{
	    if (!glInstanceCount) return;

	    const destBlend = glBatchAdditive ? gl_ONE : gl_ONE_MINUS_SRC_ALPHA;
	    glContext.blendFuncSeparate(gl_SRC_ALPHA, destBlend, gl_ONE, destBlend);
	    glContext.enable(gl_BLEND);

	    // draw all the sprites in the batch and reset the buffer
	    glContext.bufferSubData(gl_ARRAY_BUFFER, 0, glPositionData);
	    glContext.drawArraysInstanced(gl_TRIANGLE_STRIP, 0, 4, glInstanceCount);
	    if (showWatermark)
	        drawCount += glInstanceCount;
	    glInstanceCount = 0;
	    glBatchAdditive = glAdditive;
	}

	/** Draw any sprites still in the buffer, copy to main canvas and clear
	 *  @param {CanvasRenderingContext2D} context
	 *  @param {Boolean} [forceDraw]
	 *  @memberof WebGL */
	function glCopyToContext(context, forceDraw=false)
	{
	    if (!glInstanceCount && !forceDraw) return;

	    glFlush();

	    // do not draw in overlay mode because the canvas is visible
	    if (!glOverlay || forceDraw)
	        context.drawImage(glCanvas, 0, 0);
	}

	/** Add a sprite to the gl draw list, used by all gl draw functions
	 *  @param {Number} x
	 *  @param {Number} y
	 *  @param {Number} sizeX
	 *  @param {Number} sizeY
	 *  @param {Number} angle
	 *  @param {Number} uv0X
	 *  @param {Number} uv0Y
	 *  @param {Number} uv1X
	 *  @param {Number} uv1Y
	 *  @param {Number} rgba
	 *  @param {Number} [rgbaAdditive=0]
	 *  @memberof WebGL */
	function glDraw(x, y, sizeX, sizeY, angle, uv0X, uv0Y, uv1X, uv1Y, rgba, rgbaAdditive=0)
	{
	    ASSERT(typeof rgba == 'number' && typeof rgbaAdditive == 'number', 'invalid color');

	    // flush if there is not enough room or if different blend mode
	    if (glInstanceCount >= gl_MAX_INSTANCES || glBatchAdditive != glAdditive)
	        glFlush();

	    let offset = glInstanceCount * gl_INDICIES_PER_INSTANCE;
	    glPositionData[offset++] = x;
	    glPositionData[offset++] = y;
	    glPositionData[offset++] = sizeX;
	    glPositionData[offset++] = sizeY;
	    glPositionData[offset++] = uv0X;
	    glPositionData[offset++] = uv0Y;
	    glPositionData[offset++] = uv1X;
	    glPositionData[offset++] = uv1Y;
	    glColorData[offset++] = rgba;
	    glColorData[offset++] = rgbaAdditive;
	    glPositionData[offset++] = angle;
	    glInstanceCount++;
	}

	///////////////////////////////////////////////////////////////////////////////
	// post processing - can be enabled to pass other canvases through a final shader

	let glPostShader, glPostTexture, glPostIncludeOverlay;

	/** Set up a post processing shader
	 *  @param {String} shaderCode
	 *  @param {Boolean} includeOverlay
	 *  @memberof WebGL */
	function glInitPostProcess(shaderCode, includeOverlay=false)
	{
	    ASSERT(!glPostShader, 'can only have 1 post effects shader');

	    if (!shaderCode) // default shader pass through
	        shaderCode = 'void mainImage(out vec4 c,vec2 p){c=texture(iChannel0,p/iResolution.xy);}';

	    // create the shader
	    glPostShader = glCreateProgram(
	        '#version 300 es\n' +            // specify GLSL ES version
	        'precision highp float;'+        // use highp for better accuracy
	        'in vec2 p;'+                    // position
	        'void main(){'+                  // shader entry point
	        'gl_Position=vec4(p+p-1.,1,1);'+ // set position
	        '}'                              // end of shader
	        ,
	        '#version 300 es\n' +            // specify GLSL ES version
	        'precision highp float;'+        // use highp for better accuracy
	        'uniform sampler2D iChannel0;'+  // input texture
	        'uniform vec3 iResolution;'+     // size of output texture
	        'uniform float iTime;'+          // time
	        'out vec4 c;'+                   // out color
	        '\n' + shaderCode + '\n'+        // insert custom shader code
	        'void main(){'+                  // shader entry point
	        'mainImage(c,gl_FragCoord.xy);'+ // call post process function
	        'c.a=1.;'+                       // always use full alpha
	        '}'                              // end of shader
	    );

	    // create buffer and texture
	    glPostTexture = glCreateTexture(undefined);
	    glPostIncludeOverlay = includeOverlay;

	    // hide the original 2d canvas
	    mainCanvas.style.visibility = 'hidden';
	    if (glPostIncludeOverlay)
	        overlayCanvas.style.visibility = 'hidden';
	}

	// Render the post processing shader, called automatically by the engine
	function glRenderPostProcess()
	{
	    if (!glPostShader)
	        return;
	    
	    // prepare to render post process shader
	    if (glEnable)
	    {
	        glFlush(); // clear out the buffer
	        mainContext.drawImage(glCanvas, 0, 0); // copy to the main canvas
	    }
	    else
	    {
	        // set the viewport
	        glContext.viewport(0, 0, glCanvas.width = mainCanvas.width, glCanvas.height = mainCanvas.height);
	    }

	    // copy overlay canvas so it will be included in post processing
	    glPostIncludeOverlay && mainContext.drawImage(overlayCanvas, 0, 0);

	    // setup shader program to draw one triangle
	    glContext.useProgram(glPostShader);
	    glContext.bindBuffer(gl_ARRAY_BUFFER, glGeometryBuffer);
	    glContext.pixelStorei(gl_UNPACK_FLIP_Y_WEBGL, 1);
	    glContext.disable(gl_BLEND);

	    // set textures, pass in the 2d canvas and gl canvas in separate texture channels
	    glContext.activeTexture(gl_TEXTURE0);
	    glContext.bindTexture(gl_TEXTURE_2D, glPostTexture);
	    glContext.texImage2D(gl_TEXTURE_2D, 0, gl_RGBA, gl_RGBA, gl_UNSIGNED_BYTE, mainCanvas);

	    // set vertex position attribute
	    const vertexByteStride = 8;
	    const pLocation = glContext.getAttribLocation(glPostShader, 'p');
	    glContext.enableVertexAttribArray(pLocation);
	    glContext.vertexAttribPointer(pLocation, 2, gl_FLOAT, false, vertexByteStride, 0);

	    // set uniforms and draw
	    const uniformLocation = (name)=>glContext.getUniformLocation(glPostShader, name);
	    glContext.uniform1i(uniformLocation('iChannel0'), 0);
	    glContext.uniform1f(uniformLocation('iTime'), time);
	    glContext.uniform3f(uniformLocation('iResolution'), mainCanvas.width, mainCanvas.height, 1);
	    glContext.drawArrays(gl_TRIANGLE_STRIP, 0, 4);
	}

	///////////////////////////////////////////////////////////////////////////////
	// store gl constants as integers so their name doesn't use space in minifed
	const
	gl_ONE = 1,
	gl_TRIANGLE_STRIP = 5,
	gl_SRC_ALPHA = 770,
	gl_ONE_MINUS_SRC_ALPHA = 771,
	gl_BLEND = 3042,
	gl_TEXTURE_2D = 3553,
	gl_UNSIGNED_BYTE = 5121,
	gl_FLOAT = 5126,
	gl_RGBA = 6408,
	gl_NEAREST = 9728,
	gl_LINEAR = 9729,
	gl_TEXTURE_MAG_FILTER = 10240,
	gl_TEXTURE_MIN_FILTER = 10241,
	gl_COLOR_BUFFER_BIT = 16384,
	gl_TEXTURE0 = 33984,
	gl_ARRAY_BUFFER = 34962,
	gl_STATIC_DRAW = 35044,
	gl_DYNAMIC_DRAW = 35048,
	gl_FRAGMENT_SHADER = 35632,
	gl_VERTEX_SHADER = 35633,
	gl_COMPILE_STATUS = 35713,
	gl_LINK_STATUS = 35714,
	gl_UNPACK_FLIP_Y_WEBGL = 37440,

	// constants for batch rendering
	gl_INDICIES_PER_INSTANCE = 11,
	gl_MAX_INSTANCES = 1e4,
	gl_INSTANCE_BYTE_STRIDE = gl_INDICIES_PER_INSTANCE * 4, // 11 * 4
	gl_INSTANCE_BUFFER_SIZE = gl_MAX_INSTANCES * gl_INSTANCE_BYTE_STRIDE;
	/** 
	 * LittleJS - The Tiny Fast JavaScript Game Engine
	 * MIT License - Copyright 2021 Frank Force
	 * 
	 * Engine Features
	 * - Object oriented system with base class engine object
	 * - Base class object handles update, physics, collision, rendering, etc
	 * - Engine helper classes and functions like Vector2, Color, and Timer
	 * - Super fast rendering system for tile sheets
	 * - Sound effects audio with zzfx and music with zzfxm
	 * - Input processing system with gamepad and touchscreen support
	 * - Tile layer rendering and collision system
	 * - Particle effect system
	 * - Medal system tracks and displays achievements
	 * - Debug tools and debug rendering system
	 * - Post processing effects
	 * - Call engineInit() to start it up!
	 * @namespace Engine
	 */



	/** Name of engine
	 *  @type {String}
	 *  @default
	 *  @memberof Engine */
	const engineName = 'LittleJS';

	/** Version of engine
	 *  @type {String}
	 *  @default
	 *  @memberof Engine */
	const engineVersion = '1.9.5';

	/** Frames per second to update
	 *  @type {Number}
	 *  @default
	 *  @memberof Engine */
	const frameRate = 60;

	/** How many seconds each frame lasts, engine uses a fixed time step
	 *  @type {Number}
	 *  @default 1/60
	 *  @memberof Engine */
	const timeDelta = 1/frameRate;

	/** Array containing all engine objects
	 *  @type {Array}
	 *  @memberof Engine */
	let engineObjects = [];

	/** Array with only objects set to collide with other objects this frame (for optimization)
	 *  @type {Array}
	 *  @memberof Engine */
	let engineObjectsCollide = [];

	/** Current update frame, used to calculate time
	 *  @type {Number}
	 *  @memberof Engine */
	let frame = 0;

	/** Current engine time since start in seconds
	 *  @type {Number}
	 *  @memberof Engine */
	let time = 0;

	/** Actual clock time since start in seconds (not affected by pause or frame rate clamping)
	 *  @type {Number}
	 *  @memberof Engine */
	let timeReal = 0;

	/** Is the game paused? Causes time and objects to not be updated
	 *  @type {Boolean}
	 *  @default false
	 *  @memberof Engine */
	let paused = false;

	/** Set if game is paused
	 *  @param {Boolean} isPaused
	 *  @memberof Engine */
	function setPaused(isPaused) { paused = isPaused; }

	// Frame time tracking
	let frameTimeLastMS = 0, frameTimeBufferMS = 0, averageFPS = 0;

	///////////////////////////////////////////////////////////////////////////////

	/** Startup LittleJS engine with your callback functions
	 *  @param {Function} gameInit       - Called once after the engine starts up, setup the game
	 *  @param {Function} gameUpdate     - Called every frame at 60 frames per second, handle input and update the game state
	 *  @param {Function} gameUpdatePost - Called after physics and objects are updated, setup camera and prepare for render
	 *  @param {Function} gameRender     - Called before objects are rendered, draw any background effects that appear behind objects
	 *  @param {Function} gameRenderPost - Called after objects are rendered, draw effects or hud that appear above all objects
	 *  @param {Array} [imageSources=['tiles.png']] - Image to load
	 *  @memberof Engine */
	function engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, imageSources=['tiles.png'])
	{
	    ASSERT(Array.isArray(imageSources), 'pass in images as array');

	    // Called automatically by engine to setup render system
	    function enginePreRender()
	    {
	        // save canvas size
	        mainCanvasSize = vec2(mainCanvas.width, mainCanvas.height);

	        // disable smoothing for pixel art
	        mainContext.imageSmoothingEnabled = !canvasPixelated;

	        // setup gl rendering if enabled
	        glEnable && glPreRender();
	    }

	    // internal update loop for engine
	    function engineUpdate(frameTimeMS=0)
	    {
	        // update time keeping
	        let frameTimeDeltaMS = frameTimeMS - frameTimeLastMS;
	        frameTimeLastMS = frameTimeMS;
	        averageFPS = lerp(.05, averageFPS, 1e3/(frameTimeDeltaMS||1));
	        const debugSpeedUp   = keyIsDown('Equal'); // +
	        const debugSpeedDown = keyIsDown('Minus'); // -
	        frameTimeDeltaMS *= debugSpeedUp ? 5 : debugSpeedDown ? .2 : 1;
	        timeReal += frameTimeDeltaMS / 1e3;
	        frameTimeBufferMS += paused ? 0 : frameTimeDeltaMS;
	        if (!debugSpeedUp)
	            frameTimeBufferMS = min(frameTimeBufferMS, 50); // clamp in case of slow framerate
	        updateCanvas();

	        if (paused)
	        {
	            // do post update even when paused
	            inputUpdate();
	            debugUpdate();
	            gameUpdatePost();
	            inputUpdatePost();
	        }
	        else
	        {
	            // apply time delta smoothing, improves smoothness of framerate in some browsers
	            let deltaSmooth = 0;
	            if (frameTimeBufferMS < 0 && frameTimeBufferMS > -9)
	            {
	                // force an update each frame if time is close enough (not just a fast refresh rate)
	                deltaSmooth = frameTimeBufferMS;
	                frameTimeBufferMS = 0;
	            }
	            
	            // update multiple frames if necessary in case of slow framerate
	            for (;frameTimeBufferMS >= 0; frameTimeBufferMS -= 1e3 / frameRate)
	            {
	                // increment frame and update time
	                time = frame++ / frameRate;

	                // update game and objects
	                inputUpdate();
	                gameUpdate();
	                engineObjectsUpdate();

	                // do post update
	                debugUpdate();
	                gameUpdatePost();
	                inputUpdatePost();
	            }

	            // add the time smoothing back in
	            frameTimeBufferMS += deltaSmooth;
	        }
	        
	        // render sort then render while removing destroyed objects
	        enginePreRender();
	        gameRender();
	        engineObjects.sort((a,b)=> a.renderOrder - b.renderOrder);
	        for (const o of engineObjects)
	            o.destroyed || o.render();
	        gameRenderPost();
	        glRenderPostProcess();
	        medalsRender();
	        touchGamepadRender();
	        debugRender();
	        glEnable && glCopyToContext(mainContext);

	        if (showWatermark)
	        {
	            // update fps
	            overlayContext.textAlign = 'right';
	            overlayContext.textBaseline = 'top';
	            overlayContext.font = '1em monospace';
	            overlayContext.fillStyle = '#000';
	            const text = engineName + ' ' + 'v' + engineVersion + ' / ' 
	                + drawCount + ' / ' + engineObjects.length + ' / ' + averageFPS.toFixed(1)
	                + (glEnable ? ' GL' : ' 2D') ;
	            overlayContext.fillText(text, mainCanvas.width-3, 3);
	            overlayContext.fillStyle = '#fff';
	            overlayContext.fillText(text, mainCanvas.width-2, 2);
	            drawCount = 0;
	        }

	        requestAnimationFrame(engineUpdate);
	    }

	    function updateCanvas()
	    {
	        if (canvasFixedSize.x)
	        {
	            // clear canvas and set fixed size
	            mainCanvas.width  = canvasFixedSize.x;
	            mainCanvas.height = canvasFixedSize.y;
	            
	            // fit to window by adding space on top or bottom if necessary
	            const aspect = innerWidth / innerHeight;
	            const fixedAspect = mainCanvas.width / mainCanvas.height;
	            (glCanvas||mainCanvas).style.width = mainCanvas.style.width = overlayCanvas.style.width  = aspect < fixedAspect ? '100%' : '';
	            (glCanvas||mainCanvas).style.height = mainCanvas.style.height = overlayCanvas.style.height = aspect < fixedAspect ? '' : '100%';
	        }
	        else
	        {
	            // clear canvas and set size to same as window
	            mainCanvas.width  = min(innerWidth,  canvasMaxSize.x);
	            mainCanvas.height = min(innerHeight, canvasMaxSize.y);
	        }
	        
	        // clear overlay canvas and set size
	        overlayCanvas.width  = mainCanvas.width;
	        overlayCanvas.height = mainCanvas.height;

	        // save canvas size
	        mainCanvasSize = vec2(mainCanvas.width, mainCanvas.height);
	    }

	    // setup html
	     const styleBody = 
	        'margin:0;overflow:hidden;' + // fill the window
	        'background:#000;' +          // set background color
	        'touch-action:none;' +        // prevent mobile pinch to resize
	        'user-select:none;' +         // prevent mobile hold to select
	        '-webkit-user-select:none;' + // compatibility for ios
	        '-webkit-touch-callout:none'; // compatibility for ios
	    document.body.style.cssText = styleBody;
	    document.body.appendChild(mainCanvas = document.createElement('canvas'));
	    mainContext = mainCanvas.getContext('2d');

	    // init stuff and start engine
	    debugInit();
	    glEnable && glInit();

	    // create overlay canvas for hud to appear above gl canvas
	    document.body.appendChild(overlayCanvas = document.createElement('canvas'));
	    overlayContext = overlayCanvas.getContext('2d');

	    // set canvas style
	    const styleCanvas = 'position:absolute;' +             // position
	        'top:50%;left:50%;transform:translate(-50%,-50%)'; // center
	    (glCanvas||mainCanvas).style.cssText = mainCanvas.style.cssText = overlayCanvas.style.cssText = styleCanvas;
	    updateCanvas();
	    
	    // create promises for loading images
	    const promises = imageSources.map((src, textureIndex)=>
	        new Promise(resolve => 
	        {
	            const image = new Image;
	            image.onerror = image.onload = ()=> 
	            {
	                textureInfos[textureIndex] = new TextureInfo(image);
	                resolve();
	            };
	            image.src = src;
	        })
	    );

	    // draw splash screen
	    showSplashScreen && promises.push(new Promise(resolve => 
	    {
	        let t = 0;
	        console.log(`${engineName} Engine v${engineVersion}`);
	        updateSplash();
	        function updateSplash()
	        {
	            clearInput();
	            drawEngineSplashScreen(t+=.01);
	            t>1 ? resolve() : setTimeout(updateSplash, 16);
	        }
	    }));

	    // load all of the images
	    Promise.all(promises).then(()=> 
	    {
	        // start the engine
	        gameInit();
	        engineUpdate();
	    });
	}

	/** Update each engine object, remove destroyed objects, and update time
	 *  @memberof Engine */
	function engineObjectsUpdate()
	{
	    // get list of solid objects for physics optimzation
	    engineObjectsCollide = engineObjects.filter(o=>o.collideSolidObjects);

	    // recursive object update
	    function updateObject(o)
	    {
	        if (!o.destroyed)
	        {
	            o.update();
	            for (const child of o.children)
	                updateObject(child);
	        }
	    }
	    for (const o of engineObjects)
	        o.parent || updateObject(o);

	    // remove destroyed objects
	    engineObjects = engineObjects.filter(o=>!o.destroyed);
	}

	/** Destroy and remove all objects
	 *  @memberof Engine */
	function engineObjectsDestroy()
	{
	    for (const o of engineObjects)
	        o.parent || o.destroy();
	    engineObjects = engineObjects.filter(o=>!o.destroyed);
	}

	/** Collects all object within a given area
	 *  @param {Vector2} [pos]                 - Center of test area, or undefined for all objects
	 *  @param {Number|Vector2} [size]         - Radius of circle if float, rectangle size if Vector2
	 *  @param {Array} [objects=engineObjects] - List of objects to check
	 *  @return {Array}                        - List of collected objects
	 *  @memberof Engine */
	function engineObjectsCollect(pos, size, objects=engineObjects)
	{
	    const collectedObjects = [];
	    if (!pos) // all objects
	    {
	        for (const o of objects)
	            collectedObjects.push(o);
	    }
	    else if (size instanceof Vector2)  // bounding box test
	    {
	        for (const o of objects)
	            isOverlapping(pos, size, o.pos, o.size) && collectedObjects.push(o);
	    }
	    else  // circle test
	    {
	        const sizeSquared = size*size;
	        for (const o of objects)
	            pos.distanceSquared(o.pos) < sizeSquared && collectedObjects.push(o);
	    }
	    return collectedObjects;
	}

	/** Triggers a callback for each object within a given area
	 *  @param {Vector2} [pos]                 - Center of test area, or undefined for all objects
	 *  @param {Number|Vector2} [size]         - Radius of circle if float, rectangle size if Vector2
	 *  @param {Function} [callbackFunction]   - Calls this function on every object that passes the test
	 *  @param {Array} [objects=engineObjects] - List of objects to check
	 *  @memberof Engine */
	function engineObjectsCallback(pos, size, callbackFunction, objects=engineObjects)
	{ engineObjectsCollect(pos, size, objects).forEach(o => callbackFunction(o)); }

	///////////////////////////////////////////////////////////////////////////////
	// LittleJS splash screen and logo

	function drawEngineSplashScreen(t)
	{
	    const x = overlayContext;
	    const w = overlayCanvas.width = innerWidth;
	    const h = overlayCanvas.height = innerHeight;

	    {
	        // background
	        const p3 = percent(t, 1, .8);
	        const p4 = percent(t, 0, .5);
	        const g = x.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.hypot(w,h)*.7);
	        g.addColorStop(0,hsl(0,0,lerp(p4,0,p3/2),p3).toString());
	        g.addColorStop(1,hsl(0,0,0,p3).toString());
	        x.save();
	        x.fillStyle = g;
	        x.fillRect(0,0,w,h);
	    }

	    // draw LittleJS logo...
	    const rect = (X, Y, W, H, C)=>
	    {
	        x.beginPath();
	        x.rect(X,Y,W,C?H*p:H);
	        x.fillStyle = C;
	        C ? x.fill() : x.stroke();
	    };
	    const line = (X, Y, Z, W)=>
	    {
	        x.beginPath();
	        x.lineTo(X,Y);
	        x.lineTo(Z,W);
	        x.stroke();
	    };
	    const circle = (X, Y, R, A=0, B=2*PI, C, F)=>
	    {
	        const D = (A+B)/2, E = p*(B-A)/2;
	        x.beginPath();
	        F && x.lineTo(X,Y);
	        x.arc(X,Y,R,D-E,D+E);
	        x.fillStyle = C;
	        C ? x.fill() : x.stroke();
	    };
	    const color = (c=0, l=0) =>
	        hsl([.98,.3,.57,.14][c%4]-10,.8,[0,.3,.5,.8,.9][l]).toString();
	    const alpha = wave(1,1,t);
	    const p = percent(alpha, .1, .5);

	    // setup
	    x.translate(w/2,h/2);
	    const size = min(6, min(w,h)/99); // fit to screen
	    x.scale(size,size);
	    x.translate(-40,-35);
	    x.lineJoin = x.lineCap = 'round';
	    x.lineWidth = .1 + p*1.9;

	    // drawing effect
	    const p2 = percent(alpha,.1,1);
	    x.setLineDash([99*p2,99]);

	    // cab top
	    rect(7,17,18,-8,color(2,2));
	    rect(7,9,18,4,color(2,3));
	    rect(25,9,8,8,color(2,1));
	    rect(25,9,-18,8);
	    rect(25,9,8,8);

	    // cab
	    rect(25,17,7,22,color());
	    rect(11,40,14,-23,color(1,1));
	    rect(11,17,14,17,color(1,2));
	    rect(11,17,14,9,color(1,3));
	    rect(15,31,6,-9,color(2,2));
	    circle(15,23,5,0,PI/2,color(2,4),1);
	    rect(25,17,-14,23);
	    rect(21,22,-6,9);

	    // little stack
	    rect(37,14,9,6,color(3,2));
	    rect(37,14,4.5,6,color(3,3));
	    rect(37,14,9,6);

	    // big stack
	    rect(50,20,10,-8,color(0,1));
	    rect(50,20,6.5,-8,color(0,2));
	    rect(50,20,3.5,-8,color(0,3));
	    rect(50,20,10,-8);
	    circle(55,2,11.4,.5,PI-.5,color(3,3));
	    circle(55,2,11.4,.5,PI/2,color(3,2),1);
	    circle(55,2,11.4,.5,PI-.5);
	    rect(45,7,20,-7,color(0,2));
	    rect(45,-1,20,4,color(0,3));
	    rect(45,-1,20,8);

	    // engine
	    for (let i=5; i--;)
	    {
	        // stagger radius to fix slight seam
	        circle(60-i*6,30, 9.9,0,2*PI,color(i+2,3));
	        circle(60-i*6,30,10.0,-.5,PI+.5,color(i+2,2));
	        circle(60-i*6,30,10.1,.5,PI-.5,color(i+2,1));
	    }

	    // engine outline
	    circle(36,30,10,PI/2,PI*3/2);
	    circle(48,30,10,PI/2,PI*3/2);
	    circle(60,30,10);
	    line(36,20,60,20);

	    // engine front light
	    circle(60,30,4,PI,3*PI,color(3,2)); 
	    circle(60,30,4,PI,2*PI,color(3,3));
	    circle(60,30,4,PI,3*PI);

	    // front brush
	    for (let i=6; i--;)
	    {
	        x.beginPath();
	        x.lineTo(53,54);
	        x.lineTo(53,40);
	        x.lineTo(53+(1+i*2.9)*p,40);
	        x.lineTo(53+(4+i*3.5)*p,54);
	        x.fillStyle = color(0,i%2+2);
	        x.fill();
	        i%2 && x.stroke();
	    }

	    // wheels
	    rect(6,40,5,5);
	    rect(6,40,5,5,color());
	    rect(15,54,38,-14,color());
	    for (let i=3; i--;)
	    for (let j=2; j--;)
	    {
	        circle(15*i+15,47,j?7:1,PI,3*PI,color(i,3));
	        x.stroke();
	        circle(15*i+15,47,j?7:1,0,PI,color(i,2));
	        x.stroke();
	    }
	    line(6,40,68,40); // center
	    line(77,54,4,54); // bottom

	    // draw engine name
	    const s = engineName;
	    x.font = '900 16px arial';
	    x.textAlign = 'center';
	    x.textBaseline = 'top';
	    x.lineWidth = .1+p*3.9;
	    let w2 = 0;
	    for (let i=0; i<s.length; ++i)
	        w2 += x.measureText(s[i]).width;
	    for (let j=2; j--;)
	    for (let i=0, X=41-w2/2; i<s.length; ++i)
	    {
	        x.fillStyle = color(i,2);
	        const w = x.measureText(s[i]).width;
	        x[j?'strokeText':'fillText'](s[i],X+w/2,55.5,17*p);
	        X += w;
	    }
	    
	    x.restore();
	}

	var LJS = /*#__PURE__*/Object.freeze({
		__proto__: null,
		engineName: engineName,
		engineVersion: engineVersion,
		frameRate: frameRate,
		timeDelta: timeDelta,
		get engineObjects () { return engineObjects; },
		get frame () { return frame; },
		get time () { return time; },
		get timeReal () { return timeReal; },
		get paused () { return paused; },
		setPaused: setPaused,
		engineInit: engineInit,
		engineObjectsUpdate: engineObjectsUpdate,
		engineObjectsDestroy: engineObjectsDestroy,
		engineObjectsCallback: engineObjectsCallback,
		debug: debug,
		get debugOverlay () { return debugOverlay; },
		get showWatermark () { return showWatermark; },
		ASSERT: ASSERT,
		debugRect: debugRect,
		debugCircle: debugCircle,
		debugPoint: debugPoint,
		debugLine: debugLine,
		debugAABB: debugAABB,
		debugText: debugText,
		debugClear: debugClear,
		debugSaveCanvas: debugSaveCanvas,
		get cameraPos () { return cameraPos; },
		get cameraScale () { return cameraScale; },
		get canvasMaxSize () { return canvasMaxSize; },
		get canvasFixedSize () { return canvasFixedSize; },
		get canvasPixelated () { return canvasPixelated; },
		get fontDefault () { return fontDefault; },
		get showSplashScreen () { return showSplashScreen; },
		get tileSizeDefault () { return tileSizeDefault; },
		get tileFixBleedScale () { return tileFixBleedScale; },
		get enablePhysicsSolver () { return enablePhysicsSolver; },
		get objectDefaultMass () { return objectDefaultMass; },
		get objectDefaultDamping () { return objectDefaultDamping; },
		get objectDefaultAngleDamping () { return objectDefaultAngleDamping; },
		get objectDefaultElasticity () { return objectDefaultElasticity; },
		get objectDefaultFriction () { return objectDefaultFriction; },
		get objectMaxSpeed () { return objectMaxSpeed; },
		get gravity () { return gravity; },
		get particleEmitRateScale () { return particleEmitRateScale; },
		get glEnable () { return glEnable; },
		get glOverlay () { return glOverlay; },
		get gamepadsEnable () { return gamepadsEnable; },
		get gamepadDirectionEmulateStick () { return gamepadDirectionEmulateStick; },
		get inputWASDEmulateDirection () { return inputWASDEmulateDirection; },
		get touchGamepadEnable () { return touchGamepadEnable; },
		get touchGamepadAnalog () { return touchGamepadAnalog; },
		get touchGamepadSize () { return touchGamepadSize; },
		get touchGamepadAlpha () { return touchGamepadAlpha; },
		get vibrateEnable () { return vibrateEnable; },
		get soundEnable () { return soundEnable; },
		get soundVolume () { return soundVolume; },
		get soundDefaultRange () { return soundDefaultRange; },
		get soundDefaultTaper () { return soundDefaultTaper; },
		get medalDisplayTime () { return medalDisplayTime; },
		get medalDisplaySlideTime () { return medalDisplaySlideTime; },
		get medalDisplaySize () { return medalDisplaySize; },
		get medalDisplayIconSize () { return medalDisplayIconSize; },
		setCameraPos: setCameraPos,
		setCameraScale: setCameraScale,
		setCanvasMaxSize: setCanvasMaxSize,
		setCanvasFixedSize: setCanvasFixedSize,
		setCanvasPixelated: setCanvasPixelated,
		setFontDefault: setFontDefault,
		setShowSplashScreen: setShowSplashScreen,
		setGlEnable: setGlEnable,
		setGlOverlay: setGlOverlay,
		setTileSizeDefault: setTileSizeDefault,
		setTileFixBleedScale: setTileFixBleedScale,
		setEnablePhysicsSolver: setEnablePhysicsSolver,
		setObjectDefaultMass: setObjectDefaultMass,
		setObjectDefaultDamping: setObjectDefaultDamping,
		setObjectDefaultAngleDamping: setObjectDefaultAngleDamping,
		setObjectDefaultElasticity: setObjectDefaultElasticity,
		setObjectDefaultFriction: setObjectDefaultFriction,
		setObjectMaxSpeed: setObjectMaxSpeed,
		setGravity: setGravity,
		setParticleEmitRateScale: setParticleEmitRateScale,
		setGamepadsEnable: setGamepadsEnable,
		setGamepadDirectionEmulateStick: setGamepadDirectionEmulateStick,
		setInputWASDEmulateDirection: setInputWASDEmulateDirection,
		setTouchGamepadEnable: setTouchGamepadEnable,
		setTouchGamepadAnalog: setTouchGamepadAnalog,
		setTouchGamepadSize: setTouchGamepadSize,
		setTouchGamepadAlpha: setTouchGamepadAlpha,
		setVibrateEnable: setVibrateEnable,
		setSoundEnable: setSoundEnable,
		setSoundVolume: setSoundVolume,
		setSoundDefaultRange: setSoundDefaultRange,
		setSoundDefaultTaper: setSoundDefaultTaper,
		setMedalDisplayTime: setMedalDisplayTime,
		setMedalDisplaySlideTime: setMedalDisplaySlideTime,
		setMedalDisplaySize: setMedalDisplaySize,
		setMedalDisplayIconSize: setMedalDisplayIconSize,
		setMedalsPreventUnlock: setMedalsPreventUnlock,
		setShowWatermark: setShowWatermark,
		setDebugKey: setDebugKey,
		PI: PI,
		abs: abs,
		min: min,
		max: max,
		sign: sign,
		mod: mod,
		clamp: clamp,
		percent: percent,
		distanceWrap: distanceWrap,
		lerpWrap: lerpWrap,
		distanceAngle: distanceAngle,
		lerpAngle: lerpAngle,
		lerp: lerp,
		smoothStep: smoothStep,
		nearestPowerOfTwo: nearestPowerOfTwo,
		isOverlapping: isOverlapping,
		wave: wave,
		formatTime: formatTime,
		rand: rand,
		randInt: randInt,
		randSign: randSign,
		randInCircle: randInCircle,
		randVector: randVector,
		randColor: randColor,
		RandomGenerator: RandomGenerator,
		Vector2: Vector2,
		Color: Color,
		Timer: Timer,
		vec2: vec2,
		rgb: rgb,
		hsl: hsl,
		textureInfos: textureInfos,
		tile: tile,
		TileInfo: TileInfo,
		TextureInfo: TextureInfo,
		get mainCanvas () { return mainCanvas; },
		get mainContext () { return mainContext; },
		get overlayCanvas () { return overlayCanvas; },
		get overlayContext () { return overlayContext; },
		get mainCanvasSize () { return mainCanvasSize; },
		screenToWorld: screenToWorld,
		worldToScreen: worldToScreen,
		drawTile: drawTile,
		drawRect: drawRect,
		drawLine: drawLine,
		drawCanvas2D: drawCanvas2D,
		setBlendMode: setBlendMode,
		drawTextScreen: drawTextScreen,
		drawText: drawText,
		get engineFontImage () { return engineFontImage; },
		FontImage: FontImage,
		isFullscreen: isFullscreen,
		toggleFullscreen: toggleFullscreen,
		get glCanvas () { return glCanvas; },
		get glContext () { return glContext; },
		glSetTexture: glSetTexture,
		glCompileShader: glCompileShader,
		glCreateProgram: glCreateProgram,
		glCreateTexture: glCreateTexture,
		glInitPostProcess: glInitPostProcess,
		keyIsDown: keyIsDown,
		keyWasPressed: keyWasPressed,
		keyWasReleased: keyWasReleased,
		clearInput: clearInput,
		mouseIsDown: mouseIsDown,
		mouseWasPressed: mouseWasPressed,
		mouseWasReleased: mouseWasReleased,
		get mousePos () { return mousePos; },
		get mousePosScreen () { return mousePosScreen; },
		get mouseWheel () { return mouseWheel; },
		get isUsingGamepad () { return isUsingGamepad; },
		preventDefaultInput: preventDefaultInput,
		gamepadIsDown: gamepadIsDown,
		gamepadWasPressed: gamepadWasPressed,
		gamepadWasReleased: gamepadWasReleased,
		gamepadStick: gamepadStick,
		mouseToScreen: mouseToScreen,
		gamepadsUpdate: gamepadsUpdate,
		vibrate: vibrate,
		vibrateStop: vibrateStop,
		isTouchDevice: isTouchDevice,
		Sound: Sound,
		SoundWave: SoundWave,
		Music: Music,
		playAudioFile: playAudioFile,
		speak: speak,
		speakStop: speakStop,
		getNoteFrequency: getNoteFrequency,
		audioContext: audioContext,
		playSamples: playSamples,
		zzfx: zzfx,
		EngineObject: EngineObject,
		get tileCollision () { return tileCollision; },
		get tileCollisionSize () { return tileCollisionSize; },
		initTileCollision: initTileCollision,
		setTileCollisionData: setTileCollisionData,
		getTileCollisionData: getTileCollisionData,
		tileCollisionTest: tileCollisionTest,
		tileCollisionRaycast: tileCollisionRaycast,
		TileLayerData: TileLayerData,
		TileLayer: TileLayer,
		ParticleEmitter: ParticleEmitter,
		Particle: Particle,
		medals: medals,
		get medalsPreventUnlock () { return medalsPreventUnlock; },
		medalsInit: medalsInit,
		newgroundsInit: newgroundsInit,
		Medal: Medal,
		Newgrounds: Newgrounds
	});

	window.LJS = LJS;

	// const client = new Client('ws://localhost:2567');
	const client = new lib.Client('wss://soapy-elated-marble.glitch.me/');

	let clientId;
	let room;
	let tanks = new Map();
	let bullets = new Map();
	let obstacles = new Map();
	const spawnTimer = new Timer;

	const CANVAS_SIZE = vec2(720);
	const LEVEL_SIZE = vec2(100);
	const TANK_SIZE = vec2(7);
	const BULLET_SIZE = vec2(2);

	class Cannon extends EngineObject {
	    constructor(tank, length = 7, width = 5, color = new Color(0, 0, 0)) {
	        super(tank.pos.copy(), vec2(length, width));
	        this.tank = tank;
	        this.length = length;
	        this.width = width;
	        this.color = color;
	        this.renderOrder = 1;
	    }

	    update() {
	        this.pos = this.tank.pos.add(vec2(this.length * 0.6, 0).rotate(this.tank.angle));
	    }

	    render() {
	        // Render the cannon as a line extending from the tank
	        const cannonEnd = this.tank.pos.add(vec2(this.length, 0).rotate(this.tank.angle));
	        drawLine(this.tank.pos, cannonEnd, this.width, this.color);
	    }
	}

	class Tank extends EngineObject {
	    constructor(id, x, y) {
	        super(vec2(x, y), TANK_SIZE);
	        this.id = id;
	        this.targetPos = this.pos.copy();
	        this.targetAngle = 0;
	        this.health = 3;
	        this.angle = 0;
	        this.particle;
	        this.cannon = new Cannon(this, TANK_SIZE.x, 3, this.color);
	        this.addChild(this.cannon);
	        this.renderOrder = 1;
	    }

	    update() {
	        this.pos = this.pos.lerp(this.targetPos, 0.2);
	        this.angle = lerpAngle(0.2, this.angle, this.targetAngle);
	    }

	    render() {
	        drawRect(this.pos, TANK_SIZE, this.color);
	    }

	    updateFromServer(data) {
	        if ('x' in data && 'y' in data)
	            this.targetPos = vec2(data.x, data.y);
	        if ('angle' in data)
	            this.targetAngle = data.angle;
	        if ('r' in data && 'g' in data && 'b' in data) {
	            const { r, g, b } = data;
	            const color = new Color(r, g, b);
	            this.color = color;
	            this.cannon.color = color;
	        }
	    }

	    destroy() {
	        const color = this.color;
	        if (!this.particle) {
	            this.particle = new ParticleEmitter(
	                this.pos, 0,                          // pos, angle
	                30, 0.5, 100, PI,                  // emitSize, emitTime, emitRate, emiteCone
	                0,                               // tileIndex
	                color, color,                    // colorStartA, colorStartB
	                color.scale(1, 0), color.scale(1, 0), // colorEndA, colorEndB
	                .2, 10, .2, .1, .05,              // time, sizeStart, sizeEnd, speed, angleSpeed
	                .99, 1, .5, PI,                  // damping, angleDamping, gravity, cone
	                .1, .5, 0, 0,                     // fadeRate, randomness, collide, additive
	                0, 10, 0                         // randomColorLinear, renderOrder, localSpace
	            );
	            this.particle.renderOrder = 10;
	        }
	        super.destroy();

	        if (this.id === clientId)
	            spawnTimer.set(5);
	    }
	}

	class Bullet extends EngineObject {
	    constructor(ownerId, id, x, y, direction) {
	        super(vec2(x, y), BULLET_SIZE);
	        this.ownerId = ownerId;
	        this.id = id;
	        this.direction = direction;
	        this.elasticity = 1;
	    }

	    update() {
	        super.update();
	        this.pos = this.pos.lerp(this.targetPos, 0.2);
	    }

	    render() {
	        drawRect(this.pos, this.size, new Color(1, 1, 0));
	    }

	    updateFromServer(data) {
	        if ('x' in data && 'y' in data)
	            this.targetPos = vec2(data.x, data.y);
	        if ('directionX' in data && 'directionY' in data) {
	            this.direction = vec2(data.directionX, data.directionY);
	        }
	    }
	}

	class Obstacle extends EngineObject {
	    constructor(x, y) {
	        super(vec2(x, y), vec2(10, 10));  // Static size for obstacles
	        this.setCollision();
	        this.mass = 0;
	    }

	    updateFromServer(data) {
	        if ('x' in data && 'y' in data)
	            this.targetPos = vec2(data.x, data.y);
	    }

	    render() {
	        drawRect(this.pos, this.size, new Color(0.5, 0.5, 0.5));
	    }
	}

	async function joinRoom() {
	    try {
	        room = await client.joinOrCreate('tank_room');
	        clientId = room.sessionId;
	        window.id = clientId;

	        room.state.tanks.onAdd((tank, key) => {
	            const newTank = new Tank(key, tank.x, tank.y);
	            tanks.set(key, newTank);
	        });
	        room.state.tanks.onChange((tank, key) => {
	            const localTank = tanks.get(key);
	            if (localTank) {
	                localTank.updateFromServer(tank);
	            }
	        });
	        room.state.tanks.onRemove((_, key) => {
	            const local = tanks.get(key);
	            if (local) {
	                local.destroy();
	                tanks.delete(key);
	            }
	        });

	        room.state.bullets.onAdd((bullet, key) => {
	            const { ownerId, id, x, y, direction } = bullet;
	            const newBullet = new Bullet(ownerId, id, x, y, direction);
	            bullets.set(key, newBullet);
	        });
	        room.state.bullets.onChange((bullet, key) => {
	            const local = bullets.get(key);
	            if (local) {
	                local.updateFromServer(bullet);
	            }
	        });
	        room.state.bullets.onRemove((_, key) => {
	            const local = bullets.get(key);
	            if (local) {
	                local.destroy();
	                bullets.delete(key);
	            }
	        });

	        room.state.obstacles.onAdd((obstacle, key) => {
	            const { x, y } = obstacle;
	            const newObstacle = new Obstacle(x, y);
	            obstacles.set(key, newObstacle);
	        });
	        room.state.obstacles.onChange((obstacle, key) => {
	            const local = obstacles.get(key);
	            if (local) {
	                local.updateFromServer(obstacle);
	            }
	        });
	        room.state.obstacles.onRemove((_, key) => {
	            const local = obstacles.get(key);
	            if (local) {
	                local.destroy();
	                obstacles.delete(key);
	            }
	        });
	    } catch (e) {
	        console.error("JOIN ERROR", e);
	    }
	}

	function gameInit() {
	    setCanvasFixedSize(CANVAS_SIZE);
	    setCameraPos(LEVEL_SIZE.scale(0.5));
	    setCameraScale(CANVAS_SIZE.x / LEVEL_SIZE.x);
	    joinRoom();
	}

	let lastInput;
	function gameUpdate() {
	    if (room) {
	        const input = {
	            left: keyIsDown('ArrowLeft'),
	            right: keyIsDown('ArrowRight'),
	            up: keyIsDown('KeyZ'),
	            shoot: keyWasPressed('KeyX'),
	        };
	        if (!compareInput(input, lastInput)) {
	            lastInput = input;
	            room.send(0, input);
	        }
	    }
	}

	function compareInput(a, b) {
	    if (!a || !b) return false
	    return Object.values(a).toString() === Object.values(b).toString()
	}

	function gameRender() {
	    drawRect(LEVEL_SIZE.scale(0.5), LEVEL_SIZE, rgb(0.8, 0.8, 0.8));
	    drawTextScreen("Arrow keys: Rotate, Z: Move, X: Shoot", vec2(360, 20), 20, rgb(0, 0, 0), 0, undefined, 'center');

	    if (spawnTimer.active()) {
	        const time = Math.floor(-1 * spawnTimer.get());
	        drawText(time, cameraPos, 100, new Color(1, 0.1, 0));
	    }
	}

	engineInit(gameInit, gameUpdate, () => { }, gameRender, () => { });

})();
//# sourceMappingURL=bundle.js.map
