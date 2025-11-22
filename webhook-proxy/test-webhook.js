#!/usr/bin/env node

const http = require('http')

// 测试数据
const testData = {
  type: "records.after.update",
  id: "test-id-" + Date.now(),
  version: "v3",
  data: {
    table_id: "m6my9qzyincl4rp",
    table_name: "资讯型文章",
    rows: [
      {
        Id: 1,
        CreatedAt: "2025-11-20T14:28:17.803Z",
        UpdatedAt: "2025-11-20T14:28:17.803Z",
        文章标题: "🚀 快速开始使用 Markdown 展示器",
        正文内容: `# 🎉 Markdown 展示器

这是一个通过 Webhook 发送到编辑器的测试文章。

## 功能特性

1. **实时更新** - 内容会自动同步到编辑器
2. **格式支持** - 完整支持 Markdown 语法
3. **状态指示** - 菜单中会显示监听状态

## 代码示例

\`\`\`javascript
console.log('Hello, Webhook!')
console.log('当前时间:', new Date().toLocaleString())
\`\`\`

## 列表示例

- 📝 支持文本内容
- 🎨 支持 Markdown 格式
- 🔗 支持外部数据源

> 💡 **提示**: 这是测试数据，可以随时替换为真实内容。

## 表格示例

| 功能 | 状态 | 描述 |
|------|------|------|
| Webhook 接收 | ✅ | 支持外部数据推送 |
| 自动更新 | ✅ | 内容实时同步到编辑器 |
| 格式解析 | ✅ | 自动解析 Markdown 格式 |

---

*测试时间: ${new Date().toLocaleString()}*`,
        主题: "技术文档",
        仿写作者: "AI助手"
      }
    ]
  }
}

// 发送 HTTP 请求
function sendWebhook(data, endpoint = '/api/content') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data)

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    console.log(`📤 发送请求到 http://localhost:3001${endpoint}`)
    console.log(`📄 内容长度: ${postData.length} 字节`)
    console.log(`📝 标题: ${data.data.rows[0].文章标题}`)
    console.log('')

    const req = http.request(options, (res) => {
      let responseBody = ''

      res.on('data', (chunk) => {
        responseBody += chunk
      })

      res.on('end', () => {
        console.log(`📥 响应状态: ${res.statusCode}`)
        console.log(`📋 响应内容: ${responseBody}`)
        console.log('')

        try {
          const response = JSON.parse(responseBody)
          resolve({
            statusCode: res.statusCode,
            data: response
          })
        } catch (error) {
          reject(new Error('解析响应失败: ' + error.message))
        }
      })
    })

    req.on('error', (error) => {
      console.error('❌ 请求失败:', error.message)
      reject(error)
    })

    // 发送请求数据
    req.write(postData)
    req.end()
  })
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始 Webhook 测试')
  console.log('=' * 50)
  console.log('')

  try {
    // 测试健康检查
    console.log('1️⃣ 健康检查')
    const healthResponse = await fetch('http://localhost:3001/health')
    const healthData = await healthResponse.json()
    console.log('✅ 健康检查通过:', healthData)
    console.log('')

    // 测试状态查询
    console.log('2️⃣ 状态查询')
    const statusResponse = await fetch('http://localhost:3001/status')
    const statusData = await statusResponse.json()
    console.log('✅ 状态查询通过:', statusData)
    console.log('')

    // 测试主要的 webhook 接口
    console.log('3️⃣ 主 Webhook 接口测试')
    const mainResult = await sendWebhook(testData)

    if (mainResult.statusCode === 200 && mainResult.data.success) {
      console.log('🎉 主接口测试成功!')
    } else {
      console.log('❌ 主接口测试失败')
    }
    console.log('')

    // 测试测试接口
    console.log('4️⃣ 测试接口测试')
    const testResult = await sendWebhook({}, '/api/content/test')

    if (testResult.statusCode === 200 && testResult.data.success) {
      console.log('🎉 测试接口测试成功!')
    } else {
      console.log('❌ 测试接口测试失败')
    }
    console.log('')

    console.log('🎯 测试完成!')
    console.log('💡 如果前端编辑器已启动并启用"监听 Webhook"功能，')
    console.log('   您应该能看到内容自动更新到编辑器中。')

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message)
    console.log('')
    console.log('💡 请确保:')
    console.log('   1. 代理服务器正在运行 (http://localhost:3001)')
    console.log('   2. 前端应用已启动')
    console.log('   3. 已在前端启用"监听 Webhook"功能')
  }
}

// 运行测试
if (require.main === module) {
  runTests()
}

module.exports = { sendWebhook, testData, runTests }