const WebSocket = require('ws');
const { TextDecoder, TextEncoder } = require('util');

/* ================= 协议序列化模块 ================= */
class STT {
    static escape(v) {
        return v.toString().replace(/@/g, '@A').replace(/\//g, '@S');
    }

    static unescape(v) {
        return v.toString().replace(/@S/g, '/').replace(/@A/g, '@');
    }

    static serialize(raw) {
        if (typeof raw === 'object' && !Array.isArray(raw)) {
            return Object.entries(raw)
                .map(([k, v]) => `${k}@=${STT.serialize(v)}`)
                .join('');
        } else if (Array.isArray(raw)) {
            return raw.map(v => `${STT.serialize(v)}`).join('');
        }
        return STT.escape(raw.toString()) + '/';
    }

    static deserialize(raw) {
        if (raw.includes('//')) {
            return raw.split('//')
                .filter(Boolean)
                .map(item => STT.deserialize(item));
        }

        if (raw.includes('@=')) {
            return raw.split('/')
                .filter(Boolean)
                .reduce((o, s) => {
                    const [k, v] = s.split('@=');
                    o[k] = v ? STT.deserialize(v) : '';
                    return o;
                }, {});
        }
        return STT.unescape(raw);
    }
}

/* ================= 数据包编解码模块 ================= */
class Packet {
    static HEADER_LEN_SIZE = 4;
    static HEADER_LEN_TYPECODE = 2;
    static HEADER_LEN_ENCRYPT = 1;
    static HEADER_LEN_PLACEHOLDER = 1;
    static HEADER_LEN_TOTAL = Packet.HEADER_LEN_SIZE * 2 +
        Packet.HEADER_LEN_TYPECODE +
        Packet.HEADER_LEN_ENCRYPT +
        Packet.HEADER_LEN_PLACEHOLDER;

    static concat(...buffers) {
        return buffers.reduce((acc, buf) => {
            const view = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
            const combined = new Uint8Array(acc.length + view.length);
            combined.set(acc, 0);
            combined.set(view, acc.length);
            return combined;
        }, new Uint8Array(0));
    }

    static Encode(data) {
        const encoder = new TextEncoder();
        const body = Packet.concat(encoder.encode(data), Uint8Array.of(0));
        const messageLength = body.length + Packet.HEADER_LEN_SIZE * 2;
        const buffer = new ArrayBuffer(body.length + Packet.HEADER_LEN_TOTAL);
        const view = new DataView(buffer);

        view.setUint32(0, messageLength, true);
        view.setUint32(4, messageLength, true);
        view.setInt16(8, 689, true);
        view.setInt16(10, 0, true);

        new Uint8Array(buffer).set(body, Packet.HEADER_LEN_TOTAL);
        return buffer;
    }

    static Decode(buf, callback) {
        const decoder = new TextDecoder();
        let buffer = new Uint8Array(buf).buffer;
        let readLength = 0;

        while (buffer.byteLength > 0) {
            if (!readLength) {
                if (buffer.byteLength < 4) return;
                readLength = new DataView(buffer).getUint32(0, true);
                buffer = buffer.slice(4);
            }

            if (buffer.byteLength < readLength) return;

            const message = decoder.decode(
                new Uint8Array(buffer).subarray(8, readLength - 1)
            );
            callback(message);
            buffer = buffer.slice(readLength);
            readLength = 0;
        }
    }
}

/* ================= 弹幕客户端核心 ================= */
class Client {
    static initOpts = { debug: false, ignore: [] };

    constructor(roomId, opts = {}) {
        this.roomId = roomId;
        this._ws = null;
        this._heartbeatTask = null;
        this._eventHandlers = new Map();
        this.debug = opts.debug || Client.initOpts.debug;
        this.ignore = opts.ignore || Client.initOpts.ignore;
    }

    /* 网络连接管理 */
    _initSocket(url) {
        console.log(`[连接] 正在连接至 ${url}`);
        this._ws = new WebSocket(url);

        this._ws
            .on('open', () => {
                console.log('[状态] WebSocket连接已建立');
                this.login();
                this.joinGroup();
                this.heartbeat();
                this._emit('connect');
            })
            .on('error', err => {
                console.error('[错误] 连接异常:', err.message);
                this._emit('error', err);
            })
            .on('close', () => {
                console.log('[状态] WebSocket连接已关闭');
                this._cleanup();
                this._emit('close');
            })
            .on('message', data => {
                if (this.debug) console.log('[调试] 收到原始数据:', data);
                this._handleMessage(data);
            });
    }

    /* 事件系统 */
    _emit(type, ...args) {
        const handlers = this._eventHandlers.get(type) || [];
        handlers.forEach(handler => handler(...args));
    }

    /* 消息处理 */
    _handleMessage(data) {
        Packet.Decode(data, raw => {
            try {
                const msg = STT.deserialize(raw);
                if (this.ignore.includes(msg.type)) return;

                if (this.debug) {
                    console.log('[调试] 解析消息:', JSON.stringify(msg, null, 2));
                }

                this._emit(msg.type, msg);
                this._emit('*', msg);
            } catch (e) {
                console.error('[错误] 消息解析失败:', e.message);
            }
        });
    }

    /* 客户端操作 */
    send(message) {
        if (this._ws?.readyState === WebSocket.OPEN) {
            const packet = Packet.Encode(STT.serialize(message));
            this._ws.send(packet);
            if (this.debug) console.log('[调试] 已发送消息:', message);
            return true;
        }
        console.warn('[警告] 发送失败，连接未就绪');
        return false;
    }

    login() {
        this.send({ type: 'loginreq', roomid: this.roomId });
    }

    joinGroup() {
        this.send({ type: 'joingroup', rid: this.roomId, gid: -9999 });
    }

    heartbeat() {
        if (this._heartbeatTask) {
            console.warn('[警告] 心跳检测已在运行中');
            return;
        }
        console.log('[状态] 启动心跳检测');
        this._heartbeatTask = setInterval(() => {
            this.send({ type: 'mrkl' });
            if (this.debug) console.log('[调试] 发送心跳包');
        }, 45000);
    }

    close() {
        console.log('[操作] 正在关闭连接...');
        if (this._ws) {
            console.log('[日志] 发送登出请求');
            this.send({ type: 'logout' });
            
            console.log('[日志] 关闭WebSocket连接');
            this._ws.close();
        }
        this._cleanup();
    }

    _cleanup() {
        console.log('[清理] 清除心跳定时器');
        clearInterval(this._heartbeatTask);
        this._heartbeatTask = null;
    }

    run(url) {
        const port = 8500 + Math.floor(Math.random() * 6) + 1;
        this._initSocket(url || `wss://danmuproxy.douyu.com:${port}/`);
    }

    /* 事件监听接口 */
    on(type, callback) {
        type = type.toLowerCase();
        const handlers = this._eventHandlers.get(type) || [];
        this._eventHandlers.set(type, [...handlers, callback]);
        return this;
    }
}

function getDmHtml(hostname) {
    let htmlContent = pathLib.readFile('./douyu/danmu.html');
    return jinja.render(htmlContent, {hostname});
}

module.exports = {
    Client,
    getDmHtml
};
