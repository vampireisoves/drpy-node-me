import pako from '../libs_drpy/pako.min.js';

global.pako = pako;

import CryptoJS from '../libs_drpy/crypto-js.js';

global.CryptoJS = CryptoJS;

import randomUa from '../utils/random-http-ua.js';

global.randomUa = randomUa;

import * as jinjaMod from '../libs_drpy/jinja.js';

global.jinja = jinjaMod.render ? jinjaMod : (jinjaMod.default || jinjaMod);

import JSEncrypt from '../libs_drpy/jsencrypt.js';
import JSON5 from '../libs_drpy/_dist/json5.js';
import gbkTool from '../libs_drpy/_dist/gb18030.js';
import NODERSA from '../libs_drpy/_dist/node-rsa.js';
import {atob, btoa} from '../libs_drpy/abba.js'

global.JSEncrypt = JSEncrypt;
global.JSON5 = JSON5;
global.gbkTool = gbkTool;
global.NODERSA = NODERSA;
global.atob = atob;
global.btoa = btoa;