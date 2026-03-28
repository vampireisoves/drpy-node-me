/**
 * 插件配置示例文件
 * 定义系统中可用的插件及其配置参数
 *
 * 插件配置说明：
 * - name: 插件名称，用于标识插件
 * - path: 插件路径，相对于项目根目录
 * - params: 插件启动参数，传递给插件的命令行参数
 * - desc: 插件描述，说明插件的功能
 * - active: 是否激活插件，true表示启用，false表示禁用
 *
 * 使用方法：
 * 1. 复制此文件为 .plugins.js
 * 2. 根据需要修改插件配置
 * 3. 设置 active 字段来启用或禁用插件
 */

const plugins = [
    {
        name: 'req-proxy',              // 插件名称
        path: 'plugins/req-proxy',      // 插件路径
        params: '-p 57571',             // 启动参数：指定端口为57571
        desc: 'req代理服务',             // 插件描述：提供请求代理功能
        active: false                    // 是否激活：true表示启用此插件
    },
    {
        name: 'pvideo',                 // 插件名称
        path: 'plugins/pvideo',         // 插件路径
        params: '-port 57572 -dns 8.8.8.8', // 启动参数：端口57572，DNS服务器8.8.8.8
        desc: '嗷呜适配代理服务',        // 插件描述：提供视频适配代理功能
        active: false                    // 是否激活：true表示启用此插件
    },
    {
        name: 'pup-sniffer',                 // 插件名称
        path: 'plugins/pup-sniffer',         // 插件路径
        params: '-port 57573', // 启动参数：端口57573
        desc: 'drplayer嗅探服务',        // 插件描述：提供视频适配代理功能
        active: false                    // 是否激活：true表示启用此插件
    },
    {
        name: 'mediaProxy',                 // 插件名称
        path: 'plugins/mediaProxy',         // 插件路径
        params: '-port 57574', // 启动参数：端口57574
        desc: 'go媒体代理服务',        // 插件描述：提供视频适配代理功能
        active: false                    // 是否激活：true表示启用此插件
    },
]

export default plugins;