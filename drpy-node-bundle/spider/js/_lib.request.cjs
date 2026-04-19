// const axios = require('axios');

async function getPublicIp1() {
    let ip_obj = JSON.parse((await req('http://httpbin.org/ip')).content);
    console.log(ip_obj);
    return ip_obj.origin
}

async function getPublicIp2() {
    let ip_obj = (await axios('http://httpbin.org/ip')).data;
    console.log(ip_obj);
    return ip_obj.origin
}

// commonJS导出
module.exports = {
    getPublicIp1,
    getPublicIp2
};
