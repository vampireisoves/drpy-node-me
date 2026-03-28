# 猫源调试教程

道长只有windows环境，这里以windows为例

1. 环境变量 .env 里 确保 `CAT_DEBUG=1`
2. 启动时通过 `dev-win-debug` 脚本启动 或者 `yarn dev-win-debug`
3. 谷歌浏览器 输入 `chrome://inspect`，在里面找到本地项目对应的端口
4. 在浏览器上找到类似 这种字符串:

```
Remote Target #LOCALHOST
localhost:9229 (v22.14.0) trace
index.js file:///E:/_gitwork_drpy-node_index.js
```

点击下方的 `inspect` 超链接会打开一个控制台窗口，显示 `devTools`

1. 在 `devTools` 控制台可以看到输出，在源代码来源标签页可以看到运行的js文件。
   找到对应的源如 `spider/catvod` 里面的猫测试，进去打断点
2. 确保 在 `config/env.json` 里有 `"enable_cat": "2"`,猫源用T4方式运行
3. 浏览器访问 `http://127.0.0.1:5757/api/猫测试?do=cat&healthy=1&pwd=dzyyds` 这样的链接就可以访问触发程序的断点

## 其它说明

1. 环境变量 .env 里  `CAT_DEBUG=0` 也可以调试，同时支持显示 `getProxyUrl` `ENV` 等特殊变量。
   只是调试的时候js需要在(无网域)下面找到 `data:text/javascript;base64,` 开头的文件。

2. DS源是特殊字符串读取虚拟机运行方式，无法调试，我已经试过了，各位就不用再试了，调试源只针对catvod目录下的esm源
3. 已测试 `webstorm` 等工具自带的调试模式无法调试动态import的源，也就是对 `catvod` 源无法调试，但是可以调试ds框架主js相关逻辑。
   所以写源调试还是要按我提供的教程来操作。