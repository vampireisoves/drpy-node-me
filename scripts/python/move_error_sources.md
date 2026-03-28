# 错误源文件移动脚本

## 功能说明

这个脚本用于自动处理drpy-node项目中的错误源文件：

1. 读取 `data/source-checker/report.json` 文件
2. 找出其中 `status` 为 `"error"` 的数据源
3. 根据数据源的 `name` 字段提取文件名（去掉括号内容）
4. 在 `spider/js/` 目录中查找对应的JS文件
5. 将找到的JS文件移动到 `spider/js_bad/` 目录

## 文件说明

- `move_error_sources.py` - 主脚本，执行实际的文件移动操作
- `test_error_sources.py` - 测试脚本，只查看错误源信息，不移动文件

## 使用方法

### 1. 测试运行（推荐先执行）

```bash
cd e:\gitwork\drpy-node
python scripts\python\test_error_sources.py
```

这会显示错误源的信息，但不会实际移动文件。

### 2. 正式运行

```bash
cd e:\gitwork\drpy-node
python scripts\python\move_error_sources.py
```

这会实际移动错误源对应的JS文件到js_bad目录。

## 文件名匹配逻辑

脚本使用以下逻辑来匹配文件：

1. **完全匹配**：直接匹配提取的文件名
2. **去括号匹配**：去掉JS文件名中的括号内容后进行匹配
3. **部分匹配**：如果前两种都失败，则查找包含该名称的文件

## 示例

假设report.json中有一个错误源：

```json
{
  "name": "皮皮虾[优](DS)",
  "status": "error"
}
```

脚本会：

1. 提取文件名：`皮皮虾`
2. 查找文件：`spider/js/皮皮虾[优].js`
3. 移动到：`spider/js_bad/皮皮虾[优].js`

## 注意事项

- 脚本会自动创建 `js_bad` 目录（如果不存在）
- 移动操作是不可逆的，建议先运行测试脚本
- 如果同名文件已存在于js_bad目录，会覆盖原文件
- 脚本会输出详细的处理日志

## 输出示例

```
读取报告文件: e:\gitwork\drpy-node\data\source-checker\report.json
JS源目录: e:\gitwork\drpy-node\spider\js
JS错误目录: e:\gitwork\drpy-node\spider\js_bad
--------------------------------------------------
总共找到 198 个数据源

处理错误源: 皮皮虾[优](DS)
  提取的文件名: 皮皮虾
  ✓ 已移动: 皮皮虾[优].js -> e:\gitwork\drpy-node\spider\js_bad\皮皮虾[优].js

==================================================
处理完成！统计信息:
  错误源总数: 58
  成功移动: 45
  未找到文件: 13
==================================================
```