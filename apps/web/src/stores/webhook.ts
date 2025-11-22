import { defineStore } from 'pinia'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from './editor'
import { webhookService } from '@/services/webhook-service'

export interface WebhookContent {
  title: string
  content: string
  timestamp: number
}

export const useWebhookStore = defineStore('webhook', () => {
  // 状态
  const isListening = ref(false)
  const serverStatus = ref<'stopped' | 'starting' | 'running' | 'error'>('stopped')
  const lastContent = ref<WebhookContent | null>(null)
  const serverPort = ref(3001)
  const errorMessage = ref('')
  const requestCount = ref(0)
  const lastRequestTime = ref<number | null>(null)

  // 计算属性
  const statusText = computed(() => {
    switch (serverStatus.value) {
      case 'stopped':
        return '已停止'
      case 'starting':
        return '启动中...'
      case 'running':
        return '运行中'
      case 'error':
        return '错误'
      default:
        return '未知'
    }
  })

  const statusColor = computed(() => {
    switch (serverStatus.value) {
      case 'running':
        return 'text-green-500'
      case 'starting':
        return 'text-yellow-500'
      case 'error':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  })

  const canStartListening = computed(() => {
    return serverStatus.value === 'stopped' || serverStatus.value === 'error'
  })

  const canStopListening = computed(() => {
    return serverStatus.value === 'running'
  })

  const lastUpdateTime = computed(() => {
    if (!lastContent.value) return null
    return new Date(lastContent.value.timestamp).toLocaleString()
  })

  // 内容处理器取消函数
  let contentHandlerUnsubscribe: (() => void) | null = null

  // 方法
  const startListening = async () => {
    if (serverStatus.value === 'running') {
      console.log('[Webhook] 服务器已在运行')
      return
    }

    try {
      serverStatus.value = 'starting'
      errorMessage.value = ''

      console.log(`[Webhook] 启动监听服务`)

      // 启动 webhook 服务
      const success = await webhookService.startListening()

      if (success) {
        // 注册内容处理器
        contentHandlerUnsubscribe = webhookService.addContentHandler(handleWebhookContent)

        isListening.value = true
        serverStatus.value = 'running'

        console.log('[Webhook] 监听服务启动成功')
      } else {
        throw new Error('启动失败')
      }

    } catch (error) {
      console.error('[Webhook] 启动监听服务失败:', error)
      serverStatus.value = 'error'
      errorMessage.value = error instanceof Error ? error.message : '未知错误'
      isListening.value = false

      // 清理处理器
      if (contentHandlerUnsubscribe) {
        contentHandlerUnsubscribe()
        contentHandlerUnsubscribe = null
      }
    }
  }

  const stopListening = async () => {
    if (serverStatus.value !== 'running') {
      console.log('[Webhook] 监听服务未运行')
      return
    }

    try {
      console.log('[Webhook] 停止监听服务')

      const success = await webhookService.stopListening()

      if (success) {
        // 清理处理器
        if (contentHandlerUnsubscribe) {
          contentHandlerUnsubscribe()
          contentHandlerUnsubscribe = null
        }

        isListening.value = false
        serverStatus.value = 'stopped'
        errorMessage.value = ''

        console.log('[Webhook] 监听服务已停止')
      } else {
        throw new Error('停止失败')
      }

    } catch (error) {
      console.error('[Webhook] 停止监听服务失败:', error)
      errorMessage.value = error instanceof Error ? error.message : '未知错误'
      serverStatus.value = 'error'
    }
  }

  const toggleListening = async () => {
    if (canStartListening.value) {
      await startListening()
    } else if (canStopListening.value) {
      await stopListening()
    }
  }

  const handleWebhookContent = (content: { title: string; content: string }) => {
    console.log('[Webhook] 收到新内容:', content.title)

    // 更新存储的内容
    lastContent.value = {
      title: content.title,
      content: content.content,
      timestamp: Date.now()
    }

    // 更新请求统计
    requestCount.value++
    lastRequestTime.value = Date.now()

    // 更新编辑器内容
    try {
      const editorStore = useEditorStore()

      // 设置新内容到编辑器
      editorStore.importContent(content.content)

      console.log('[Webhook] 编辑器内容已更新')

      // 可选：显示通知
      showNotification(`已接收新文章: ${content.title}`)

    } catch (error) {
      console.error('[Webhook] 更新编辑器内容失败:', error)
    }
  }

  const showNotification = (message: string) => {
    // 使用项目现有的通知系统
    // 这里可以集成 vue-sonner 或其他通知组件
    console.log('[Webhook] 通知:', message)

    // 如果有全局通知函数，可以调用
    if (typeof window !== 'undefined' && 'toast' in window) {
      // @ts-ignore
      window.toast.success(message)
    }
  }

  const clearContent = () => {
    lastContent.value = null
    requestCount.value = 0
    lastRequestTime.value = null
  }

  const setServerPort = (port: number) => {
    if (serverStatus.value === 'running') {
      console.warn('[Webhook] 服务器运行中，无法修改端口')
      return
    }
    serverPort.value = port
  }

  // 测试连接
  const testConnection = async () => {
    try {
      const result = webhookService.testConnection()

      if (result.success) {
        console.log('[Webhook] 测试成功')
        showNotification('测试成功！内容已发送到编辑器')
        return true
      } else {
        throw new Error(result.message)
      }

    } catch (error) {
      console.error('[Webhook] 测试失败:', error)
      showNotification('测试失败：' + (error instanceof Error ? error.message : '未知错误'))
      return false
    }
  }

  // 生命周期钩子
  onMounted(() => {
    // 组件挂载时初始化服务
    // 如果服务已经在监听（从本地存储恢复），同步状态
    const savedState = localStorage.getItem('webhook-listening')
    if (savedState === 'true') {
      isListening.value = true
      serverStatus.value = 'running'

      // 重新注册处理器
      contentHandlerUnsubscribe = webhookService.addContentHandler(handleWebhookContent)
    }
  })

  onUnmounted(() => {
    // 组件卸载时清理处理器
    if (contentHandlerUnsubscribe) {
      contentHandlerUnsubscribe()
      contentHandlerUnsubscribe = null
    }
  })

  return {
    // 状态
    isListening,
    serverStatus,
    lastContent,
    serverPort,
    errorMessage,
    requestCount,
    lastRequestTime,

    // 计算属性
    statusText,
    statusColor,
    canStartListening,
    canStopListening,
    lastUpdateTime,

    // 方法
    startListening,
    stopListening,
    toggleListening,
    testConnection,
    clearContent,
    setServerPort,
  }
})