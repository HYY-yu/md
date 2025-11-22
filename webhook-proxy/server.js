const express = require('express')
const cors = require('cors')
const { WebSocketServer } = require('ws')
const path = require('path')

const app = express()
const PORT = 3001

// 中间件
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.path}`)
  next()
})

// WebSocket 服务器，用于与前端通信
const wss = new WebSocketServer({ port: 8080 })

console.log(`🔗 WebSocket 服务器启动在端口 8080`)

wss.on('connection', (ws) => {
  console.log('✅ 前端应用已连接到 WebSocket')

  ws.on('message', (message) => {
    console.log('📨 收到前端消息:', message.toString())
  })

  ws.on('close', () => {
    console.log('❌ 前端应用已断开连接')
  })

  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'connection',
    message: '🚀 代理服务器已连接，准备接收 Webhook 数据'
  }))
})

// 定义数据验证函数
function validateWebhookData(data) {
  return (
    data &&
    typeof data === 'object' &&
    data.type === 'records.after.update' &&
    data.data &&
    Array.isArray(data.data.rows) &&
    data.data.rows.length > 0 &&
    typeof data.data.rows[0].文章标题 === 'string' &&
    typeof data.data.rows[0].正文内容 === 'string'
  )
}

// 主要的 Webhook 接收端点
app.post('/api/content', (req, res) => {
  try {
    console.log('📥 收到 Webhook 数据:', JSON.stringify(req.body, null, 2))

    // 验证数据格式
    if (!validateWebhookData(req.body)) {
      console.error('❌ 数据格式验证失败')
      return res.status(400).json({
        error: 'Invalid data format',
        message: '请求数据格式不正确，请检查必需字段：文章标题、正文内容'
      })
    }

    // 提取文章信息
    const article = req.body.data.rows[0]
    const title = article.文章标题
    const content = article.正文内容

    if (!title || !content) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: '文章标题或正文内容为空'
      })
    }

    const payload = {
      type: 'webhook',
      data: {
        title,
        content,
        timestamp: Date.now(),
        source: req.body
      }
    }

    // 通过 WebSocket 通知前端应用
    let clientsNotified = 0
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(payload))
        clientsNotified++
      }
    })

    console.log(`📤 已通知 ${clientsNotified} 个前端客户端`)
    console.log(`📝 标题: ${title}`)
    console.log(`📄 内容长度: ${content.length} 字符`)

    res.json({
      success: true,
      message: '内容已更新到编辑器',
      title: title,
      contentLength: content.length,
      timestamp: payload.data.timestamp,
      clientsNotified: clientsNotified
    })

  } catch (error) {
    console.error('❌ 处理 Webhook 请求时出错:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: '服务器内部错误: ' + error.message
    })
  }
})

// 测试端点
app.post('/api/content/test', (req, res) => {
  const testData = {
    type: "records.after.update",
    id: "test-id-" + Date.now(),
    version: "v3",
    data: {
      table_id: "test-table",
      table_name: "测试文章",
      rows: [
        {
          Id: 1,
          CreatedAt: new Date().toISOString(),
          UpdatedAt: new Date().toISOString(),
          文章标题: "🚀 测试文章标题",
          正文内容: "# 测试内容\n\n这是一个测试文章的内容。\n\n## 二级标题\n\n- 列表项 1\n- 列表项 2\n\n```javascript\nconsole.log('Hello World!')\n```\n\n> 💡 这是通过测试接口发送的内容",
          主题: "技术文档",
          仿写作者: "系统测试"
        }
      ]
    }
  }

  console.log('📥 收到测试请求，生成测试数据')

  // 直接处理测试数据，而不是重定向
  try {
    // 验证数据格式
    if (!validateWebhookData(testData)) {
      console.error('❌ 测试数据格式验证失败')
      return res.status(400).json({
        error: 'Invalid test data format',
        message: '测试数据格式不正确'
      })
    }

    // 提取文章信息
    const article = testData.data.rows[0]
    const title = article.文章标题
    const content = article.正文内容

    const payload = {
      type: 'webhook',
      data: {
        title,
        content,
        timestamp: Date.now(),
        source: testData
      }
    }

    // 通过 WebSocket 通知前端应用
    let clientsNotified = 0
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(payload))
        clientsNotified++
      }
    })

    console.log(`📤 已通知 ${clientsNotified} 个前端客户端`)
    console.log(`📝 测试标题: ${title}`)
    console.log(`📄 测试内容长度: ${content.length} 字符`)

    res.json({
      success: true,
      message: '测试内容已更新到编辑器',
      title: title,
      contentLength: content.length,
      timestamp: payload.data.timestamp,
      clientsNotified: clientsNotified,
      testMode: true
    })

  } catch (error) {
    console.error('❌ 处理测试请求时出错:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: '测试服务器内部错误: ' + error.message
    })
  }
})

// 获取当前内容（如果有的话）
app.get('/api/content', (req, res) => {
  res.json({
    message: 'GET /api/content - 用于获取当前内容',
    status: 'running',
    timestamp: Date.now(),
    connectedClients: wss.clients.size
  })
})

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    service: 'webhook-proxy',
    websocket_port: 8080,
    connected_clients: wss.clients.size
  })
})

// 状态信息
app.get('/status', (req, res) => {
  res.json({
    service: 'MD Editor Webhook Proxy',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      webhook: `http://localhost:${PORT}/api/content`,
      test: `http://localhost:${PORT}/api/content/test`,
      health: `http://localhost:${PORT}/health`,
      status: `http://localhost:${PORT}/status`
    },
    websocket: {
      port: 8080,
      connected_clients: wss.clients.size
    }
  })
})

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: '接口不存在',
    available_endpoints: [
      'POST /api/content - 主要 webhook 接口',
      'POST /api/content/test - 测试接口',
      'GET /health - 健康检查',
      'GET /status - 状态信息'
    ]
  })
})

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('💥 服务器错误:', error)
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: Date.now()
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log('')
  console.log('🚀 Webhook 代理服务器启动成功!')
  console.log('')
  console.log('📡 服务端点:')
  console.log(`   POST  http://localhost:${PORT}/api/content     - 主要 webhook 接口`)
  console.log(`   POST  http://localhost:${PORT}/api/content/test - 测试接口`)
  console.log(`   GET   http://localhost:${PORT}/health          - 健康检查`)
  console.log(`   GET   http://localhost:${PORT}/status          - 状态信息`)
  console.log('')
  console.log('🔗 WebSocket 服务器运行在端口 8080')
  console.log('')
  console.log('📝 使用说明:')
  console.log('   1. 启动前端应用并打开"监听 Webhook"功能')
  console.log('   2. 使用以下命令测试:')
  console.log(`      curl -X POST http://localhost:${PORT}/api/content/test`)
  console.log('   3. 查看前端编辑器是否接收到测试内容')
  console.log('')
  console.log('💡 提示: 确保 MD 编辑器正在运行并已启用 Webhook 监听功能')
  console.log('')
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...')

  wss.close(() => {
    console.log('✅ WebSocket 服务器已关闭')
    process.exit(0)
  })

  setTimeout(() => {
    console.log('❌ 强制关闭服务器')
    process.exit(1)
  }, 5000)
})