import { NextFunction, Request, Response } from 'express'
import express from 'express'
import cors from 'cors'

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

// 存储最新的内容
let latestContent: {
  title: string
  content: string
  timestamp: number
} | null = null

// 内容监听器列表
const contentListeners: Array<(content: { title: string; content: string }) => void> = []

export class WebhookAPI {
  private app: express.Application
  private server: any = null

  constructor() {
    this.app = express()
    this.setupMiddleware()
    this.setupRoutes()
  }

  private setupMiddleware() {
    this.app.use(cors())
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    // 请求日志
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
      next()
    })
  }

  private setupRoutes() {
    // 健康检查
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: Date.now() })
    })

    // 主要的 webhook 接口
    this.app.post('/api/content', (req: Request, res: Response) => {
      try {
        const webhookData: WebhookData = req.body

        // 验证数据结构
        if (!this.validateWebhookData(webhookData)) {
          return res.status(400).json({
            error: 'Invalid data format',
            message: '请求数据格式不正确'
          })
        }

        // 提取文章信息
        const article = webhookData.data.rows[0]
        const title = article.文章标题
        const content = article.正文内容

        if (!title || !content) {
          return res.status(400).json({
            error: 'Missing required fields',
            message: '文章标题或正文内容为空'
          })
        }

        // 更新最新内容
        latestContent = {
          title,
          content,
          timestamp: Date.now()
        }

        // 通知所有监听器
        this.notifyContentListeners(latestContent)

        console.log(`[Webhook] 收到新内容: ${title}`)
        console.log(`[Webhook] 内容长度: ${content.length} 字符`)

        res.json({
          success: true,
          message: '内容已更新到编辑器',
          title,
          contentLength: content.length,
          timestamp: latestContent.timestamp
        })

      } catch (error) {
        console.error('[Webhook] 处理请求时出错:', error)
        res.status(500).json({
          error: 'Internal server error',
          message: '服务器内部错误'
        })
      }
    })

    // 获取当前内容
    this.app.get('/api/content', (req: Request, res: Response) => {
      if (!latestContent) {
        return res.status(404).json({
          error: 'No content available',
          message: '暂无内容'
        })
      }

      res.json({
        ...latestContent,
        age: Date.now() - latestContent.timestamp
      })
    })

    // 测试接口
    this.app.post('/api/content/test', (req: Request, res: Response) => {
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

      // 模拟正常处理流程
      const article = testData.data.rows[0]
      latestContent = {
        title: article.文章标题,
        content: article.正文内容,
        timestamp: Date.now()
      }

      this.notifyContentListeners(latestContent)

      res.json({
        success: true,
        message: '测试数据已处理',
        ...latestContent
      })
    })

    // 404 处理
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not found',
        message: '接口不存在'
      })
    })

    // 错误处理
    this.app.use((error: any, req: Request, res: Response, next: NextFunction) => {
      console.error('[API] 服务器错误:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: '服务器内部错误'
      })
    })
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

  private notifyContentListeners(content: { title: string; content: string }) {
    contentListeners.forEach(listener => {
      try {
        listener(content)
      } catch (error) {
        console.error('[Webhook] 监听器执行出错:', error)
      }
    })
  }

  // 添加内容监听器
  public addContentListener(listener: (content: { title: string; content: string }) => void) {
    contentListeners.push(listener)
    return () => {
      const index = contentListeners.indexOf(listener)
      if (index > -1) {
        contentListeners.splice(index, 1)
      }
    }
  }

  // 启动服务器
  public start(port: number = 3001): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(port, () => {
          console.log(`[API] Webhook 服务器启动成功，端口: ${port}`)
          console.log(`[API] POST /api/content - 接收 webhook 数据`)
          console.log(`[API] GET /api/content - 获取当前内容`)
          console.log(`[API] POST /api/content/test - 测试接口`)
          resolve()
        })

        this.server.on('error', (error: any) => {
          console.error('[API] 服务器启动失败:', error)
          reject(error)
        })

      } catch (error) {
        console.error('[API] 创建服务器失败:', error)
        reject(error)
      }
    })
  }

  // 停止服务器
  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('[API] 服务器已停止')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  // 获取最新内容
  public getLatestContent() {
    return latestContent
  }

  // 监听器数量
  public getListenerCount() {
    return contentListeners.length
  }
}

// 创建全局实例
export const webhookAPI = new WebhookAPI()