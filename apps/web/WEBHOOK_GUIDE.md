# Webhook 功能使用指南

## 🎯 功能概述

这个 MD 编辑器支持通过 Webhook 接收外部数据并自动更新编辑器内容。当外部系统发送特定格式的数据到指定接口时，编辑器会自动解析并显示新的内容。

## 🚀 快速开始

### 1. 启动监听功能

1. 打开 MD 编辑器
2. 点击菜单栏中的 **"视图"** → **"监听 Webhook"**
3. 看到图标变为绿色 📶 表示监听已启动
4. 可以在 **"Webhook 设置"** 中查看详细状态

### 2. 发送测试数据

在浏览器控制台中执行：

```javascript
// 加载测试工具（如果未自动加载）
const script = document.createElement('script')
script.src = '/utils/webhook-test.js'
document.head.appendChild(script)

// 发送测试数据
testWebhook("测试标题", "# 测试内容\n\n这是测试内容")
```

## 📡 接口规范

### 请求地址

```
POST http://localhost:3001/api/content
```

### 请求格式

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "type": "records.after.update",
  "id": "unique-request-id",
  "version": "v3",
  "data": {
    "table_id": "table-identifier",
    "table_name": "资讯型文章",
    "rows": [
      {
        "Id": 1,
        "CreatedAt": "2025-11-20T14:28:17.803Z",
        "UpdatedAt": "2025-11-20T14:28:17.803Z",
        "文章标题": "🚀 快速开始使用 Markdown 展示器",
        "正文内容": "# 🎉 Markdown 展示器\n\n这是一个完整的 Markdown 文档示例。\n\n## 功能特性\n\n- 🎨 支持完整的 Markdown 语法\n- 📱 响应式设计\n- ⚡ 实时预览\n\n### 代码示例\n\n```javascript\nfunction hello() {\n  console.log('Hello World!')\n}\n```\n\n> 💡 这是引用示例\n\n- [x] 支持任务列表\n- [ ] 待完成事项",
        "主题": "技术文档",
        "仿写作者": "AI助手"
      }
    ]
  }
}
```

### 字段说明

- `type`: 固定为 `"records.after.update"`
- `id`: 请求的唯一标识符
- `version`: 固定为 `"v3"`
- `data.table_id`: 表标识符（可选）
- `data.table_name`: 表名称（可选）
- `data.rows`: 数据行数组
- `data.rows[i].文章标题`: **必需** - 文章标题
- `data.rows[i].正文内容`: **必需** - Markdown 格式的文章内容
- 其他字段: 会被忽略

### 响应格式

**成功响应 (200 OK):**
```json
{
  "success": true,
  "message": "内容已更新到编辑器",
  "title": "🚀 快速开始使用 Markdown 展示器",
  "contentLength": 256,
  "timestamp": 1732289197426
}
```

**错误响应 (400 Bad Request):**
```json
{
  "error": "Invalid data format",
  "message": "文章标题或正文内容为空"
}
```

## 🔧 部署方案

由于这是一个前端应用，有几种部署方案来接收 Webhook：

### 方案一：本地代理服务器（推荐）

创建一个简单的 Node.js 代理服务器：

```javascript
// webhook-proxy.js
const express = require('express')
const cors = require('cors')
const { WebSocketServer } = require('ws')

const app = express()
app.use(cors())
app.use(express.json())

// WebSocket 服务器，用于通知前端
const wss = new WebSocketServer({ port: 8080 })

console.log('WebSocket 服务器启动在端口 8080')

wss.on('connection', (ws) => {
  console.log('前端已连接')

  ws.on('message', (message) => {
    console.log('收到消息:', message.toString())
  })
})

// Webhook 接收端点
app.post('/api/content', (req, res) => {
  console.log('收到 Webhook 数据:', req.body)

  // 验证数据
  if (!req.body.data?.rows?.[0]?.文章标题 || !req.body.data?.rows[0]?.正文内容) {
    return res.status(400).json({
      error: 'Invalid data format',
      message: '文章标题或正文内容为空'
    })
  }

  const article = req.body.data.rows[0]

  // 通过 WebSocket 通知前端
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify({
        type: 'webhook',
        data: {
          title: article.文章标题,
          content: article.正文内容,
          timestamp: Date.now()
        }
      }))
    }
  })

  res.json({
    success: true,
    message: '内容已接收并转发到编辑器',
    title: article.文章标题,
    contentLength: article.正文内容.length
  })
})

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

app.listen(3001, () => {
  console.log('Webhook 代理服务器运行在 http://localhost:3001')
  console.log('POST /api/content - 接收 Webhook 数据')
})
```

**启动代理服务器：**
```bash
npm install express cors ws
node webhook-proxy.js
```

### 方案二：使用 ngrok（内网穿透）

如果需要从公网接收 Webhook：

```bash
# 安装 ngrok
npm install -g ngrok

# 启动代理服务器后
ngrok http 3001
```

使用 ngrok 提供的公网 URL 作为 Webhook 地址。

### 方案三：使用 Serverless 函数

#### Vercel Functions

```javascript
// api/content.js
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { data } = req.body

    if (!data?.rows?.[0]?.文章标题 || !data?.rows?.[0]?.正文内容) {
      return res.status(400).json({
        error: 'Invalid data format',
        message: '文章标题或正文内容为空'
      })
    }

    const article = data.rows[0]

    // 这里可以将数据存储到数据库或发送到前端
    // 例如通过 WebSocket、SSE 或实时数据库

    res.json({
      success: true,
      message: '内容已接收',
      title: article.文章标题,
      timestamp: Date.now()
    })

  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}
```

#### AWS Lambda

```javascript
// handler.js
exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body)
    const { data } = body

    if (!data?.rows?.[0]?.文章标题 || !data?.rows?.[0]?.正文内容) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Invalid data format',
          message: '文章标题或正文内容为空'
        })
      }
    }

    const article = data.rows[0]

    // 处理数据...

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: '内容已接收',
        title: article.文章标题
      })
    }

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    }
  }
}
```

## 🧪 测试工具

### 内置测试

在编辑器中：
1. 启动监听功能
2. 点击 **"视图"** → **"Webhook 设置"** → **"测试连接"**

### 控制台测试

在浏览器控制台中：

```javascript
// 基础测试
testWebhook("测试标题", "# 测试内容\n\n这是测试内容")

// 预设内容测试
testPresetContent()

// 批量测试（5条数据，每秒一条）
batchTest(5)

// 自定义测试
testWebhook(
  "🔧 技术文档",
  "# API 文档\n\n## 接口说明\n\n这是技术文档内容。"
)
```

### cURL 测试

```bash
curl -X POST http://localhost:3001/api/content \
  -H "Content-Type: application/json" \
  -d '{
    "type": "records.after.update",
    "id": "test-curl-",
    "version": "v3",
    "data": {
      "table_id": "test-table",
      "table_name": "测试文章",
      "rows": [{
        "Id": 1,
        "CreatedAt": "2025-11-20T14:28:17.803Z",
        "UpdatedAt": "2025-11-20T14:28:17.803Z",
        "文章标题": "🚀 cURL 测试文章",
        "正文内容": "# cURL 测试\n\n这是通过 cURL 发送的测试文章。"
      }]
    }
  }'
```

### Postman 测试

1. 创建新的 POST 请求
2. URL: `http://localhost:3001/api/content`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON): 使用上面的示例数据

## 📊 状态说明

菜单栏中会显示不同的状态图标：

- 🔴 **灰色/关闭图标**: 未监听
- 🟡 **黄色图标**: 启动中
- 🟢 **绿色图标**: 正在监听

**Webhook 设置子菜单中显示：**
- 监听状态（已停止/启动中/运行中/错误）
- 端口号（默认 3001）
- 测试连接按钮
- 启用/禁用监听开关

## 🔍 故障排除

### 常见问题

1. **无法启动监听**
   - 检查控制台错误信息
   - 确认没有其他程序占用端口
   - 刷新页面重试

2. **测试失败**
   - 确认监听已启动
   - 检查数据格式是否正确
   - 查看控制台日志

3. **内容未更新**
   - 确认数据中包含 `文章标题` 和 `正文内容` 字段
   - 检查内容是否为空
   - 尝试使用测试工具验证

4. **外部无法访问**
   - 检查防火墙设置
   - 确认服务器正常运行
   - 使用内网穿透工具（如 ngrok）

### 调试模式

在控制台中启用详细日志：

```javascript
// 启用调试模式
localStorage.setItem('webhook-debug', 'true')

// 查看当前状态
console.log('Webhook 服务状态:', window.__WEBHOOK_SERVICE__)

// 查看使用说明
console.log(window.__WEBHOOK_SERVICE__.getInstructions())
```

## 🚀 高级用法

### 自定义数据处理

可以扩展服务来处理自定义数据格式：

```javascript
// 扩展处理逻辑
const customHandler = (data) => {
  // 自定义数据处理逻辑
  return {
    title: data.customTitle || '默认标题',
    content: data.customContent || '默认内容'
  }
}
```

### 数据持久化

将接收到的数据保存到本地存储：

```javascript
// 启用持久化
localStorage.setItem('webhook-persist', 'true')
```

### 实时协作

结合 WebSocket 或 WebRTC 可以实现多用户实时协作编辑。

## 📝 更新日志

### v1.0.0 (2025-11-22)
- ✅ 基础 Webhook 接收功能
- ✅ 菜单集成和状态管理
- ✅ 测试工具和文档
- ✅ 自动内容更新到编辑器

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个功能！

## 📄 许可证

本项目采用 MIT 许可证。