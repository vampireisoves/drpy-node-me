import "../../libs_drpy/jsencrypt.js"

export const RSA = {
    decode(data, key, option = {}) {
        if (typeof JSEncrypt !== 'function') return false;

        const privateKey = this.getPrivateKey(key);
        const decryptor = new JSEncrypt();
        decryptor.setPrivateKey(privateKey);
        return decryptor.decryptUnicodeLong(data);
    },

    encode(data, key, option = {}) {
        if (typeof JSEncrypt !== 'function') return false;

        const publicKey = this.getPublicKey(key);
        const encryptor = new JSEncrypt();
        encryptor.setPublicKey(publicKey);
        return encryptor.encryptUnicodeLong(data);
    },

    fixKey(key, prefix, endfix) {
        if (!key.includes(prefix)) key = prefix + key;
        if (!key.includes(endfix)) key += endfix;
        return key;
    },

    getPrivateKey(key) {
        const prefix = '-----BEGIN RSA PRIVATE KEY-----';
        const endfix = '-----END RSA PRIVATE KEY-----';
        return this.fixKey(key, prefix, endfix);
    },

    getPublicKey(key) {
        const prefix = '-----BEGIN PUBLIC KEY-----';
        const endfix = '-----END PUBLIC KEY-----';
        return this.fixKey(key, prefix, endfix);
    }
};