export class WebSocketClient {
  private ws: WebSocket | null = null
  private url = 'ws://localhost:8080'
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageHandlers: Array<(message: any) => void> = []
  private isConnecting = false

  constructor() {
    this.connect()
  }

  private connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return
    }

    this.isConnecting = true
    console.log(`[WebSocket] 尝试连接到 ${this.url}`)

    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        console.log('[WebSocket] 连接成功')
        this.isConnecting = false
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('[WebSocket] 收到消息:', data)

          // 通知所有消息处理器
          this.messageHandlers.forEach(handler => {
            try {
              handler(data)
            } catch (error) {
              console.error('[WebSocket] 消息处理器执行出错:', error)
            }
          })

        } catch (error) {
          console.error('[WebSocket] 解析消息失败:', error)
        }
      }

      this.ws.onclose = (event) => {
        console.log(`[WebSocket] 连接关闭: ${event.code} - ${event.reason}`)
        this.isConnecting = false
        this.ws = null

        // 自动重连
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          console.log(`[WebSocket] ${this.reconnectDelay}ms 后尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

          setTimeout(() => {
            this.connect()
          }, this.reconnectDelay)

          // 增加重连延迟
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000)
        } else {
          console.error('[WebSocket] 达到最大重连次数，停止重连')
        }
      }

      this.ws.onerror = (error) => {
        console.error('[WebSocket] 连接错误:', error)
        this.isConnecting = false
      }

    } catch (error) {
      console.error('[WebSocket] 创建连接失败:', error)
      this.isConnecting = false
    }
  }

  public addMessageHandler(handler: (message: any) => void) {
    this.messageHandlers.push(handler)
    return () => {
      const index = this.messageHandlers.indexOf(handler)
      if (index > -1) {
        this.messageHandlers.splice(index, 1)
      }
    }
  }

  public sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
      return true
    } else {
      console.warn('[WebSocket] 未连接，无法发送消息')
      return false
    }
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.messageHandlers = []
    this.reconnectAttempts = 0
  }

  public getConnectionStatus(): string {
    if (this.isConnecting) return '连接中'
    if (!this.ws) return '未连接'

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return '连接中'
      case WebSocket.OPEN: return '已连接'
      case WebSocket.CLOSING: return '断开中'
      case WebSocket.CLOSED: return '已断开'
      default: return '未知状态'
    }
  }
}

// 创建全局实例
export const websocketClient = new WebSocketClient()