# Claude Desktop 连接客户端 MCP Server 配置教程

## 前提条件

1. 已安装 [Claude Desktop](https://claude.ai/download)
2. 客户端 (yishe-client) 已启动且 MCP Server 显示"运行中"

## 配置步骤

### 1. 打开配置文件

打开终端，执行：

```bash
open ~/Library/Application\ Support/Claude/
```

用文本编辑器打开 `claude_desktop_config.json`（如果不存在就新建）。

### 2. 写入以下内容

```json
{
  "mcpServers": {
    "yishe-client": {
      "type": "sse",
      "url": "http://localhost:3210/sse"
    }
  }
}
```

### 3. 重启 Claude Desktop

退出并重新打开 Claude Desktop，MCP 工具会自动加载。

---

## 可用工具列表

| 工具名 | 说明 |
|--------|------|
| `hotsearch_weibo` | 采集微博热搜 |
| `hotsearch_douyin` | 采集抖音热搜 |
| `hotsearch_bilibili` | 采集B站热搜 |
| `hotsearch_zhihu` | 采集知乎热榜 |
| `hotsearch_toutiao` | 采集今日头条热搜 |
| `hotsearch_douban` | 采集豆瓣热门 |
| `hotsearch_kuaishou` | 采集快手热搜 |
| `hotsearch_v2ex` | 采集V2EX热门 |
| `hotsearch_36kr` | 采集36氪热门 |
| `hotsearch_ithome` | 采集IT之家热门 |
| `hotsearch_github` | 采集GitHub Trending |
| `hotsearch_wikipedia` | 采集维基百科热点 |
| `hotsearch_devto` | 采集Dev.to热门文章 |
| `hotsearch_google_trends` | 采集Google趋势 |
| `hotsearch_hackernews` | 采集Hacker News |
| `hotsearch_bbc_news` | 采集BBC新闻 |
| `hotsearch_cnn` | 采集CNN新闻 |
| `hotsearch_nytimes` | 采集纽约时报 |
| `hotsearch_aljazeera` | 采集半岛电视台 |
| `hotsearch_ebay_trending` | 采集eBay热门商品 |
| `hotsearch_shopify_trending` | 采集Shopify热门商品 |
| `hotsearch_collect_all` | 采集所有平台 |
| `browser_invoke` | 浏览器自动化 |
| `service_status` | 查询服务状态 |

---

## 使用示例

在 Claude Desktop 中直接说：

> 帮我采集一下微博热搜

> 采集所有平台的热搜数据

> 查看客户端服务状态

Claude 会自动调用对应的 MCP 工具完成任务。

---

## 常见问题

**Q: 连接不上？**
- 确认客户端 MCP Server 状态卡片显示"运行中"
- 确认端口 3210 没被占用：`lsof -i :3210`

**Q: 工具没有加载？**
- 重启 Claude Desktop
- 检查 JSON 格式是否正确（无尾逗号）

**Q: macOS 提示安全警告？**
- 系统偏好设置 → 安全性与隐私 → 允许
