/**
 * IP地址获取工具模块
 * 
 * 该模块提供获取当前客户端公网IP地址的功能
 * 通过调用外部API服务来获取真实的公网IP地址
 * 
 * @author drpy
 * @version 1.0.0
 */

/**
 * 获取当前客户端的公网IP地址
 * 
 * 通过调用 httpbin.org 的IP查询API来获取当前客户端的真实公网IP地址
 * 该函数是异步的，返回一个Promise对象
 * 
 * @async
 * @function getIp
 * @returns {Promise<string>} 返回客户端的公网IP地址字符串
 * @throws {Error} 当网络请求失败或解析响应失败时抛出错误
 * 
 * @example
 * // 获取当前IP地址
 * const ip = await getIp();
 * console.log('当前IP:', ip); // 输出: 当前IP: 192.168.1.100
 */
async function getIp() {
    // 向httpbin.org发送请求获取IP信息
    let ip_obj = (await req('http://httpbin.org/ip')).content;
    // 解析响应内容并返回IP地址
    return ip_obj.parseX.origin
}

// 导出模块的公共API
$.exports = {
    getIp  // 导出获取IP地址的函数
}
