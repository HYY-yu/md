# MD Editor Webhook 代理服务器

这是一个为 MD 编辑器设计的 Webhook 代理服务器，用于接收外部数据并实时推送到前端编辑器。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务器

```bash
npm start
```

服务器将在以下地址启动：
- **HTTP 服务**: `http://localhost:3001`
- **WebSocket 服务**: `ws://localhost:8080`

### 3. 测试功能

```bash
# 测试接口（自动生成测试数据）
curl -X POST http://localhost:3001/api/content/test

# 健康检查
curl http://localhost:3001/health

# 查看状态
curl http://localhost:3001/status
```

## 📡 API 接口

### 主要 Webhook 接口

**地址**: `POST http://localhost:3001/api/content`

**Content-Type**: `application/json`

**请求格式**:
```json
{
  "type": "records.after.update",
  "id": "unique-request-id",
  "version": "v3",
  "data": {
    "table_id": "table-identifier",
    "table_name": "资讯型文章",
    "rows": [{
      "Id": 1,
      "CreatedAt": "2025-11-20T14:28:17.803Z",
      "UpdatedAt": "2025-11-20T14:28:17.803Z",
      "文章标题": "🚀 快速开始使用 Markdown 展示器",
      "正文内容": "# 🎉 Markdown 展示器\n\n这是文章内容...",
      "主题": "技术文档",
      "仿写作者": "AI助手"
    }]
  }
}
```

**成功响应** (200):
```json
{
  "success": true,
  "message": "内容已更新到编辑器",
  "title": "🚀 快速开始使用 Markdown 展示器",
  "contentLength": 256,
  "timestamp": 1763806778619,
  "clientsNotified": 1
}
```

### 测试接口

**地址**: `POST http://localhost:3001/api/content/test`

自动生成测试数据，无需传递参数。

### 状态接口

**地址**: `GET http://localhost:3001/status`

返回服务器状态和连接信息。

## 🔄 工作原理

```
外部系统 → Webhook 代理服务器 → WebSocket → MD 编辑器前端
```

1. **外部系统** 发送 HTTP POST 请求到 `/api/content`
2. **代理服务器** 验证数据格式并提取文章信息
3. **WebSocket 连接** 将数据实时推送到前端应用
4. **MD 编辑器** 接收数据并更新编辑器内容

## 🎯 使用场景

1. **CMS 系统** - 文章发布时自动同步到编辑器
2. **自动化工具** - 生成的内容直接推送到编辑器
3. **数据导入** - 批量导入外部文章数据
4. **实时协作** - 多用户内容同步

## 🛠️ 配置选项

### 端口配置

修改 `server.js` 中的端口配置：

```javascript
const PORT = 3001  // HTTP 服务器端口
const WS_PORT = 8080  // WebSocket 服务器端口
```

### 数据格式定制

可以在 `validateWebhookData` 函数中修改验证逻辑，支持不同的数据格式。

## 🔧 开发和调试

### 运行测试脚本

```bash
node test-webhook.js
```

### 日志输出

服务器会输出详细的日志信息：
- 请求接收和处理
- WebSocket 连接状态
- 数据解析和转发
- 错误信息

### 浏览器调试

在浏览器控制台中查看：
- WebSocket 连接状态
- 接收到的数据
- 编辑器更新情况

## 📝 示例代码

### 发送 Webhook 数据 (JavaScript)

```javascript
const webhookData = {
  type: "records.after.update",
  id: "test-" + Date.now(),
  version: "v3",
  data: {
    table_id: "my-table",
    table_name: "文章表",
    rows: [{
      Id: 1,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      文章标题: "我的新文章",
      正文内容: "# 我的新文章\n\n这是文章内容..."
    }]
  }
}

fetch('http://localhost:3001/api/content', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(webhookData)
})
.then(response => response.json())
.then(data => console.log('成功:', data))
.catch(error => console.error('错误:', error))
```

### Python 示例

```python
import requests
import json

webhook_data = {
    "type": "records.after.update",
    "id": f"test-{int(time.time())}",
    "version": "v3",
    "data": {
        "table_id": "my-table",
        "table_name": "文章表",
        "rows": [{
            "Id": 1,
            "CreatedAt": "2025-11-20T14:28:17.803Z",
            "UpdatedAt": "2025-11-20T14:28:17.803Z",
            "文章标题": "Python 发送的文章",
            "正文内容": "# Python 发送的文章\n\n这是通过 Python 发送的内容..."
        }]
    }
}

response = requests.post(
    'http://localhost:3001/api/content',
    headers={'Content-Type': 'application/json'},
    data=json.dumps(webhook_data)
)

print(f"状态码: {response.status_code}")
print(f"响应: {response.json()}")
```

## 🔍 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查找占用端口的进程
   lsof -i :3001
   # 杀掉进程
   kill -9 <PID>
   ```

2. **WebSocket 连接失败**
   - 确保前端应用正在运行
   - 检查防火墙设置
   - 查看浏览器控制台错误信息

3. **数据格式错误**
   - 检查必需字段：`文章标题` 和 `正文内容`
   - 确认 JSON 格式正确
   - 查看服务器日志

### 调试模式

启用详细日志：

```javascript
// 在 server.js 中添加
console.log('详细请求信息:', JSON.stringify(req.body, null, 2))
```

## 📊 监控

### 健康检查

```bash
curl http://localhost:3001/health
```

### 状态监控

```bash
curl http://localhost:3001/status
```

返回信息包括：
- 服务器状态
- WebSocket 连接数
- 端点信息

## 🚀 部署

### 生产环境

1. 使用 PM2 管理进程：
   ```bash
   npm install -g pm2
   pm2 start server.js --name webhook-proxy
   pm2 logs webhook-proxy
   ```

2. 使用 nginx 反向代理

3. 配置 HTTPS

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001 8080
CMD ["npm", "start"]
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！