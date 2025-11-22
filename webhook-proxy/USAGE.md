# 🚀 快速使用指南

## 当前状态

✅ **代理服务器正在运行**: `http://localhost:3001`
✅ **前端功能已集成**: 循环依赖已修复
✅ **测试接口可用**: `/api/content/test`

## 🎯 立即测试

### 1. 启动 MD 编辑器前端

```bash
cd /Volumes/GW/codes/frontendProject/md/apps/web
pnpm dev
```

### 2. 启用 Webhook 监听

1. 在 MD 编辑器中，点击菜单栏 **"视图"** → **"监听 Webhook"**
2. 看到图标变为 🟢 绿色表示监听成功
3. 可以在 **"Webhook 设置"** 中查看状态

### 3. 测试数据发送

```bash
# 方式一：使用测试接口
curl -X POST http://localhost:3001/api/content/test

# 方式二：发送自定义数据
curl -X POST http://localhost:3001/api/content \
  -H "Content-Type: application/json" \
  -d '{
    "type": "records.after.update",
    "id": "test-' + $(date +%s) + '",
    "version": "v3",
    "data": {
      "table_id": "my-table",
      "table_name": "资讯型文章",
      "rows": [{
        "Id": 1,
        "CreatedAt": "2025-11-20T14:28:17.803Z",
        "UpdatedAt": "2025-11-20T14:28:17.803Z",
        "文章标题": "🚀 我的测试文章",
        "正文内容": "# 🎉 我的测试文章\n\n这是通过 Webhook 发送的内容！\n\n## 功能特点\n\n- ✅ 实时更新\n- 🎨 格式支持\n- 🔄 自动覆盖"
      }]
    }
  }'
```

### 4. 查看结果

发送数据后，您应该能立即看到：
- 编辑器内容自动更新
- 控制台显示处理日志
- 菜单状态显示为"正在监听"

## 🔧 故障排除

### 如果启动失败
```bash
# 检查端口占用
lsof -i :3001

# 重启代理服务器
cd /Volumes/GW/codes/frontendProject/md/webhook-proxy
npm start
```

### 如果前端报错
1. 刷新页面重试
2. 检查浏览器控制台错误信息
3. 确保代理服务器正在运行

### 如果内容未更新
1. 确认已点击"监听 Webhook"
2. 检查网络请求是否成功
3. 查看代理服务器日志

## 📁 文件位置

- **代理服务器**: `/Volumes/GW/codes/frontendProject/md/webhook-proxy/`
- **前端集成**: `/Volumes/GW/codes/frontendProject/md/apps/web/src/`
- **使用文档**: `/Volumes/GW/codes/frontendProject/md/apps/web/WEBHOOK_GUIDE.md`

## 🎊 成功标准

当您看到以下情况时，说明功能已正常工作：
- ✅ 代理服务器运行在 `localhost:3001`
- ✅ 前端菜单显示绿色监听状态
- ✅ 发送数据后编辑器立即更新内容
- ✅ 控制台显示成功处理日志