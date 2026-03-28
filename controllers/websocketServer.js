export default (wsApp, options, done) => {

    // 根路由 - 显示服务信息和主服务链接
    wsApp.get('/', async (request, reply) => {
        const protocol = request.headers['x-forwarded-proto'] || (request.socket.encrypted ? 'https' : 'http');
        const wsName = request.hostname;
        const PORT = options.PORT;
        const WsPORT = options.WsPORT;
        const hostname = wsName.replace(`:${options.WsPORT}`, `:${options.PORT}`);
        const requestHost = `${protocol}://${hostname}`;
        const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebSocket 服务 - 端口 ${WsPORT}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            box-sizing: border-box;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            border: 1px solid rgba(255, 255, 255, 0.18);
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .service-info {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #4CAF50;
        }
        .main-service-link {
            display: inline-block;
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            font-size: 1.1em;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
            margin: 10px 5px;
        }
        .main-service-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
            text-decoration: none;
            color: white;
        }
        .status {
            display: inline-block;
            background: #4CAF50;
            color: white;
            padding: 5px 15px;
            border-radius: 15px;
            font-size: 0.9em;
            margin-left: 10px;
        }
        .endpoint {
            font-family: 'Courier New', monospace;
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            word-break: break-all;
        }
        .clients-count {
            text-align: center;
            font-size: 1.2em;
            margin: 20px 0;
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 WebSocket 服务</h1>
        
        <div class="service-info">
            <h3>📡 当前服务信息</h3>
            <p><strong>端口:</strong> ${WsPORT} <span class="status">运行中</span></p>
            <p><strong>服务类型:</strong> 专用 WebSocket 服务</p>
            <p><strong>功能:</strong> 提供动态 WebSocket 连接服务 如 斗鱼/抖音 弹幕直播</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <h3>🌐 主服务访问</h3>
            <a href="${requestHost}" class="main-service-link" target="_blank">
                访问主服务 (端口 ${PORT})
            </a>
        </div>

        <div class="service-info">
            <h3>ℹ️ 服务说明</h3>
            <ul>
                <li>此服务运行在独立端口 ${WsPORT}</li>
                <li>专门提供 WebSocket 实时通信功能</li>
                <li>与主服务 (端口 ${PORT}) 协同工作</li>
                <li>支持斗鱼直播弹幕等实时功能</li>
            </ul>
        </div>
    </div>
</body>
</html>`;

        reply.type('text/html');
        return html;
    });

    done()
}