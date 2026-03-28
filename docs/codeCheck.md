# 代码质量评估

使用工具[fuck-u-code](https://github.com/Done-0/fuck-u-code)
使用方法，在项目根目录执行:

```shell
fuck-u-code analyze -e data/cat -e apps/cat -e libs_drpy/_dist -e node_modules -e spider -e public/monkey -t 20
# 或者
fuck-u-code analyze -e data/cat -e apps/cat -e libs_drpy/_dist -e node_modules -e spider -e public/monkey -t 20 -v > report.md
# 只看最终报告
fuck-u-code analyze -e data/cat -e apps/cat -e libs_drpy/_dist -e node_modules -e spider -e public/monkey -s -v
```

排除目录说明:

- `data/cat` 和 `apps/cat` 是原猫源必要文件依赖，无法优化，不作为ds框架代码的一部分去评估
- `node_modules` 是ds的三方依赖模块，也不作为框架代码去评估
- `spider` 是用户自定义的源，代码能力差异较大，且太多存在注释问题，不用去评估
- `libs_drpy/_dist` 是drpy的静态打包依赖库，无需评估
- `public/monkey` 油猴脚本，无需评估