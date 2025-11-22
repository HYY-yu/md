import { websocketClient } from './websocket-client'

// 定义外部数据结构
interface WebhookData {
  type: string
  id: string
  version: string
  data: {
    table_id: string
    table_name: string
    rows: Array<{
      Id: number
      CreatedAt: string
      UpdatedAt: string
      文章标题: string
      正文内容: string
      [key: string]: any
    }>
  }
}

export class WebhookService {
  private static instance: WebhookService | null = null
  private isListeningState = false
  private contentHandlers: Array<(content: { title: string; content: string }) => void> = []
  private websocketMessageHandlerUnsubscribe: (() => void) | null = null

  private constructor() {}

  public static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService()
    }
    return WebhookService.instance
  }

  public initialize() {
    // 注册 WebSocket 消息处理器
    this.websocketMessageHandlerUnsubscribe = websocketClient.addMessageHandler((message) => {
      if (message.type === 'webhook' && message.data) {
        console.log('[Webhook Service] 通过 WebSocket 收到数据:', message.data.title)
        this.handleWebhookContent(message.data)
      }
    })

    // 尝试从本地存储恢复状态
    const savedState = localStorage.getItem('webhook-listening')
    if (savedState === 'true') {
      // 标记为监听状态，但不自动启动（避免页面加载时自动启动）
      this.isListeningState = true
    }

    console.log('[Webhook Service] 初始化完成')
    console.log('[Webhook Service] WebSocket 状态:', websocketClient.getConnectionStatus())
  }

  // 注册内容处理器
  public addContentHandler(handler: (content: { title: string; content: string }) => void) {
    this.contentHandlers.push(handler)
    return () => {
      const index = this.contentHandlers.indexOf(handler)
      if (index > -1) {
        this.contentHandlers.splice(index, 1)
      }
    }
  }

  // 启动监听模式
  public async startListening() {
    if (this.isListeningState) {
      console.log('[Webhook Service] 已经在监听状态')
      return true
    }

    try {
      this.isListeningState = true

      // 保存状态到本地存储
      localStorage.setItem('webhook-listening', 'true')

      console.log('[Webhook Service] 开始监听 (模拟模式)')
      console.log('[Webhook Service] 请使用测试接口或代理服务器处理请求')

      return true
    } catch (error) {
      console.error('[Webhook Service] 启动监听失败:', error)
      return false
    }
  }

  public async stopListening() {
    if (!this.isListeningState) {
      console.log('[Webhook Service] 已经停止监听')
      return true
    }

    try {
      this.isListeningState = false

      // 保存状态到本地存储
      localStorage.setItem('webhook-listening', 'false')

      console.log('[Webhook Service] 停止监听')

      return true
    } catch (error) {
      console.error('[Webhook Service] 停止监听失败:', error)
      return false
    }
  }

  public processWebhookData(data: WebhookData): { success: boolean; message: string } {
    try {
      // 验证数据结构
      if (!this.validateWebhookData(data)) {
        return {
          success: false,
          message: 'Invalid data format'
        }
      }

      // 提取文章信息
      const article = data.data.rows[0]
      const title = article.文章标题
      const content = article.正文内容

      if (!title || !content) {
        return {
          success: false,
          message: '文章标题或正文内容为空'
        }
      }

      // 处理内容
      this.handleWebhookContent({ title, content })

      console.log(`[Webhook Service] 处理成功: ${title}`)

      return {
        success: true,
        message: '内容已更新到编辑器'
      }

    } catch (error) {
      console.error('[Webhook Service] 处理数据时出错:', error)
      return {
        success: false,
        message: '处理失败: ' + (error instanceof Error ? error.message : '未知错误')
      }
    }
  }

  public testConnection(): { success: boolean; message: string } {
    if (!this.isListeningState) {
      return {
        success: false,
        message: '请先启动监听'
      }
    }

    const testData: WebhookData = {
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
            正文内容: "# 测试内容\n\n这是一个测试文章的内容。\n\n## 二级标题\n\n- 列表项 1\n- 列表项 2\n\n```javascript\nconsole.log('Hello World!')\n```"
          }
        ]
      }
    }

    const result = this.processWebhookData(testData)

    if (result.success) {
      console.log('[Webhook Service] 测试成功')
    } else {
      console.error('[Webhook Service] 测试失败:', result.message)
    }

    return result
  }

  private validateWebhookData(data: any): data is WebhookData {
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

  private handleWebhookContent(content: { title: string; content: string }) {
    console.log('[Webhook Service] 收到新内容:', content.title)

    // 通知所有注册的内容处理器
    this.contentHandlers.forEach((handler) => {
      try {
        handler(content)
      } catch (error) {
        console.error('[Webhook Service] 内容处理器执行出错:', error)
      }
    })

    // 如果没有处理器，尝试直接更新编辑器
    if (this.contentHandlers.length === 0) {
      try {
        // 动态导入 useEditorStore 避免循环依赖
        import('@/stores/editor').then(({ useEditorStore }) => {
          const editorStore = useEditorStore()
          editorStore.importContent(content.content)
          console.log('[Webhook Service] 编辑器内容已更新（直接调用）')
        })

      } catch (error) {
        console.error('[Webhook Service] 更新编辑器内容失败:', error)
      }
    }

    console.log('[Webhook Service] 内容处理完成:', content.title)
  }

  public isListening(): boolean {
    return this.isListeningState
  }

  public getMockEndpointUrl(): string {
    // 返回模拟的端点 URL，用于文档说明
    return `http://localhost:3001/api/content`
  }

  public getWebSocketStatus(): string {
    return websocketClient.getConnectionStatus()
  }

  public destroy() {
    // 清理 WebSocket 消息处理器
    if (this.websocketMessageHandlerUnsubscribe) {
      this.websocketMessageHandlerUnsubscribe()
      this.websocketMessageHandlerUnsubscribe = null
    }

    // 清理内容处理器
    this.contentHandlers = []

    console.log('[Webhook Service] 已销毁')
  }

  public getInstructions(): string {
    return `
# Webhook 使用说明

现在使用 WebSocket 连接到代理服务器进行实时通信。

## 工作原理

1. 前端应用通过 WebSocket 连接到代理服务器 (ws://localhost:8080)
2. 外部系统发送 HTTP 请求到代理服务器 (http://localhost:3001/api/content)
3. 代理服务器通过 WebSocket 实时推送到前端应用
4. 前端应用接收数据并更新编辑器内容

## 方案一：使用本地代理服务器（推荐）

1. 创建一个简单的 Node.js 代理服务器：
\`\`\`javascript
// webhook-proxy.js
const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

app.post('/api/content', (req, res) => {
  // 转发到浏览器应用
  console.log('收到 webhook 数据:', req.body)

  // 这里可以通过 WebSocket 或其他方式通知前端应用
  // 或者直接在浏览器控制台中手动测试数据

  res.json({ success: true, message: '数据已接收' })
})

app.listen(3001, () => {
  console.log('Webhook 代理服务器运行在 http://localhost:3001')
})
\`\`\`

## 方案二：手动测试

1. 在菜单中点击 "监听 Webhook" 启动监听
2. 使用 "测试连接" 功能进行测试
3. 或在浏览器控制台中手动调用：

\`\`\`javascript
// 手动测试 webhook 数据
const testData = {
  type: "records.after.update",
  id: "test-id-" + Date.now(),
  version: "v3",
  data: {
    table_id: "test-table",
    table_name: "测试文章",
    rows: [{
      Id: 1,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      文章标题: "测试标题",
      正文内容: "# 测试内容\\n\\n这是测试文章内容。"
    }]
  }
}

// 获取 webhook service 实例并处理数据
const webhookService = window.__WEBHOOK_SERVICE__
if (webhookService) {
  const result = webhookService.processWebhookData(testData)
  console.log('处理结果:', result)
}
\`\`\`

## 请求格式

POST \`http://localhost:3001/api/content\`

Content-Type: application/json

\`\`\`json
{
  "type": "records.after.update",
  "id": "unique-id",
  "version": "v3",
  "data": {
    "table_id": "table-id",
    "table_name": "资讯型文章",
    "rows": [{
      "Id": 1,
      "CreatedAt": "2025-11-20T14:28:17.803Z",
      "UpdatedAt": "2025-11-20T14:28:17.803Z",
      "文章标题": "文章标题",
      "正文内容": "文章的 Markdown 内容"
    }]
  }
}
\`\`\`
    `
  }
}

// 创建全局实例
export const webhookService = WebhookService.getInstance()

// 将实例挂载到 window 对象，方便调试
if (typeof window !== 'undefined') {
  (window as any).__WEBHOOK_SERVICE__ = webhookService
}