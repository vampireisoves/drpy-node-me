### 获取52pojie cookie

1. 手动登录52pojie网站
2. 按下F12或右键检查打开开发者工具，点击网络(network)选项卡
3. 刷新网页，拉动开发者工具界面滑动条到顶部，找到52pojie.cn并点击
4. 开发者工具右侧点击标头(headers)，下拉滑动条，找到请求标头（request headers），复制cookie中的 ####
   htVC_2132_saltkey=xxxxx;htVC_2132_auth=xxxxxx'两项
5. 复制下拉填到环境变量.env文件里 `cookie_52pojie=` 分号;隔开

## 特殊

论坛网页可能存在爬虫特征校验导致js脚本运行失败，需要验证浏览器环境。
后期考虑使用 golang的  `req/v3` 库来过验证。