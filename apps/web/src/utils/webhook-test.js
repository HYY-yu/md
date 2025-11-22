// Webhook 测试工具
// 使用方法：在浏览器控制台中运行这些代码

// 获取 webhook 服务实例
const webhookService = window.__WEBHOOK_SERVICE__

if (!webhookService) {
  console.error('❌ Webhook 服务未初始化，请刷新页面后重试')
} else {
  console.log('✅ Webhook 服务已找到，可以开始测试')

  // 测试数据模板
  const webhookTestTemplate = {
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
          文章标题: "🚀 测试文章标题",
          正文内容: "# 🎉 测试文章\n\n这是一个通过 Webhook 发送到编辑器的测试文章。\n\n## 功能特性\n\n1. **实时更新** - 内容会自动同步到编辑器\n2. **格式支持** - 完整支持 Markdown 语法\n3. **状态指示** - 菜单中会显示监听状态\n\n## 代码示例\n\n```javascript\nconsole.log('Hello, Webhook!')\n```\n\n## 列表示例\n\n- 📝 支持文本内容\n- 🎨 支持 Markdown 格式\n- 🔗 支持外部数据源\n\n> 💡 **提示**: 这是测试数据，可以随时替换为真实内容。\n\n---\n\n*测试时间: " + new Date().toLocaleString() + "*"
        }
      ]
    }
  }

  // 测试函数
  window.testWebhook = function(title = "默认测试标题", content = "# 默认测试内容\n\n这是默认的测试内容。") {
    const testData = { ...webhookTestTemplate }
    testData.data.rows[0].文章标题 = title
    testData.data.rows[0].正文内容 = content
    testData.id = "test-id-" + Date.now()

    console.log('📤 发送测试数据:', testData)
    const result = webhookService.processWebhookData(testData)

    if (result.success) {
      console.log('✅ 测试成功:', result.message)
    } else {
      console.error('❌ 测试失败:', result.message)
    }

    return result
  }

  // 测试预设内容
  window.testPresetContent = function() {
    const presets = [
      {
        title: "📊 数据报告示例",
        content: "# 📊 本周数据报告\n\n## 概览\n\n- **总访问量**: 12,345\n- **新增用户**: 892\n- **转化率**: 3.2%\n\n## 详细数据\n\n| 指标 | 数值 | 环比 |\n|------|------|------|\n| 访问量 | 12,345 | +5.2% |\n| 用户数 | 892 | +8.1% |\n| 转化率 | 3.2% | -0.3% |\n\n## 结论\n\n本周数据表现良好，访问量和用户数都有显著增长。"
      },
      {
        title: "🔧 技术文档示例",
        content: "# 🔧 API 接口文档\n\n## 接口概述\n\n该接口用于接收外部系统推送的文章内容。\n\n### 请求地址\n\n```\nPOST /api/content\n```\n\n### 请求格式\n\n```json\n{\n  \"type\": \"records.after.update\",\n  \"data\": {\n    \"rows\": [{\n      \"文章标题\": \"标题\",\n      \"正文内容\": \"Markdown 内容\"\n    }]\n  }\n}\n```\n\n### 功能特点\n\n- 🚀 **实时同步** - 内容即时更新到编辑器\n- 🎨 **格式保留** - 完整支持 Markdown 语法\n- 🔄 **自动覆盖** - 新内容会替换现有内容"
      },
      {
        title: "📝 会议纪要示例",
        content: "# 📝 项目会议纪要\n\n**时间**: 2025年11月22日 14:00\n**地点**: 线上会议\n**参与人**: 张三、李四、王五\n\n## 会议议题\n\n### 1. 项目进度同步\n\n- ✅ 前端开发完成 80%\n- 🔄 后端接口调试中\n- ⏳ 测试环境待搭建\n\n### 2. 技术方案讨论\n\n#### 方案 A: 微服务架构\n\n**优点**:\n- 模块化程度高\n- 便于团队协作\n- 易于扩展\n\n**缺点**:\n- 架构复杂度增加\n- 运维成本较高\n\n#### 方案 B: 单体应用\n\n**优点**:\n- 开发简单\n- 部署方便\n- 运维成本低\n\n**缺点**:\n- 扩展性受限\n- 技术栈相对固定\n\n### 3. 下一步计划\n\n1. **本周五前**: 完成技术方案确定\n2. **下周开始**: 启动正式开发\n3. **月底前**: 完成第一版本\n\n---\n\n**下次会议**: 2025年11月29日 14:00"
      }
    ]

    // 随机选择一个预设
    const preset = presets[Math.floor(Math.random() * presets.length)]
    return window.testWebhook(preset.title, preset.content)
  }

  // 批量测试
  window.batchTest = function(count = 3) {
    console.log(`🚀 开始批量测试 ${count} 条数据`)

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const title = `批量测试 #${i + 1}`\        const content = `# ${title}\n\n这是第 ${i + 1} 条测试数据。\n\n- 序号: ${i + 1}\n- 时间: ${new Date().toLocaleString()}\n- 随机数: ${Math.random()}`\        window.testWebhook(title, content)
      }, i * 1000) // 每秒发送一条
    }
  }

  console.log('🎉 测试工具已加载！可用的函数:')
  console.log('- testWebhook(title, content) - 发送自定义测试数据')
  console.log('- testPresetContent() - 发送预设的测试内容')
  console.log('- batchTest(count) - 批量测试，默认3条')
  console.log('\n💡 示例:')
  console.log('testWebhook("我的标题", "# 内容\\n\\n这是内容")')
  console.log('testPresetContent()')
  console.log('batchTest(5)')
}