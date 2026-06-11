/**
 * AI Agent 自动化测试脚本
 *
 * 用法:
 *   node agent-test.mjs --token <your-token>
 *   node agent-test.mjs --token <your-token> --url http://localhost:48080
 *
 * 参数:
 *   --token     认证 Token (必填，从 admin 页面复制)
 *   --url       服务端地址 (默认 http://localhost:48080)
 *   --prompt    单条自定义测试提示 (可选)
 *
 * 环境变量:
 *   AGENT_TEST_URL      服务端地址 (默认 http://localhost:48080)
 *   AGENT_TEST_TOKEN    认证 Token
 *   AGENT_TEST_PROMPTS  自定义测试提示 (JSON 数组, 可选)
 *
 * 流程:
 *   1. 查找在线设计工具
 *   2. WebSocket 连接监听结果
 *   3. 逐条发送测试提示
 *   4. 获取对话日志
 *   5. 输出分析报告
 */

import { io } from "socket.io-client";

// ── 参数解析 ──
const args = process.argv.slice(2);
function getArg(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
}

const SERVER_URL = getArg(
  "url",
  process.env.AGENT_TEST_URL || "http://localhost:48080",
).replace(/\/$/, "");

// Token: 优先 --token 参数，再取环境变量
const INPUT_TOKEN = getArg("token", process.env.AGENT_TEST_TOKEN || "");
if (!INPUT_TOKEN) {
  console.error(
    "❌ 缺少 Token，请通过 --token 参数或 AGENT_TEST_TOKEN 环境变量提供",
  );
  console.error("   用法: node agent-test.mjs --token <your-token>");
  process.exit(1);
}

// ── 测试用例 ──
const DEFAULT_PROMPTS = [
  {
    category: "基础文字",
    prompt: "清空画布，添加一个写着 HELLO 的红色大字，居中显示",
    expect: { toolCalls: ["canvas.clear", "canvas.addChild"], minElements: 1 },
  },
  {
    category: "背景渐变",
    prompt: "清空画布，设置深蓝到紫色的渐变背景，然后添加白色标题文字 DESIGN",
    expect: {
      toolCalls: [
        "canvas.clear",
        "canvas.setBackgroundColor",
        "canvas.addChild",
      ],
      minElements: 1,
    },
  },
  {
    category: "多图拼贴",
    prompt: "清空画布，搜索猫咪图片，然后用 HTML Grid 做一个 2x2 的拼图",
    expect: {
      toolCalls: ["canvas.clear", "resource.searchImage", "canvas.addChild"],
      minElements: 1,
    },
  },
  {
    category: "CSS特效",
    prompt: "清空画布，深色背景，添加一个有霓虹发光效果的紫色文字 NEON",
    expect: { toolCalls: ["canvas.clear", "canvas.addChild"], minElements: 1 },
  },
  {
    category: "形状组合",
    prompt: "清空画布，添加一个蓝色圆形和一个橙色矩形，矩形放在圆形右边",
    expect: { toolCalls: ["canvas.clear", "canvas.addChild"], minElements: 2 },
  },
];

const CUSTOM_PROMPTS_JSON = process.env.AGENT_TEST_PROMPTS;
const TEST_PROMPTS = CUSTOM_PROMPTS_JSON
  ? JSON.parse(CUSTOM_PROMPTS_JSON)
  : DEFAULT_PROMPTS;

// ── HTTP 请求工具 ──
let authToken = "";

async function api(path, body) {
  const headers = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  const res = await fetch(`${SERVER_URL}/api${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} 失败 (${res.status}): ${text}`);
  }
  const json = await res.json();
  return json.data ?? json;
}

// ── 第 1 步: 查找设计工具 ──
async function findDesignTools() {
  console.log("\n🔍 查找在线设计工具...");
  const connections = await api(
    "/websocket/my-online-runtime-connection-views",
    {
      summary: true,
      compact: true,
    },
  );
  const tools = (Array.isArray(connections) ? connections : []).filter((c) => {
    const src = c.clientSource || c.query?.clientSource || "";
    const srcStr = Array.isArray(src) ? src[0] : src;
    return (
      ["设计工具", "设计端"].includes(srcStr) ||
      c.clientInfo?.app?.name === "yishe-tool" ||
      c.id?.startsWith("designtool-")
    );
  });
  if (tools.length === 0) {
    throw new Error("未找到在线设计工具，请确认设计工具已打开并连接");
  }
  console.log(`✅ 找到 ${tools.length} 台设计工具:`);
  tools.forEach((t) => {
    const agent = t.clientInfo?.agent;
    const state = agent?.agentState || "unknown";
    console.log(`   - ${t.id} (${state}) ${agent?.step || ""}`);
  });
  return tools;
}

// ── 第 3 步: WebSocket 连接 ──
function connectWebSocket() {
  return new Promise((resolve, reject) => {
    const wsUrl = SERVER_URL.replace(/^http/, "ws");
    console.log(`\n📡 连接 WebSocket: ${wsUrl}/ws ...`);
    const socket = io(`${wsUrl}/ws`, {
      transports: ["websocket"],
      auth: { token: authToken },
      query: { clientSource: "管理后台", clientId: `agent-test-${Date.now()}` },
      reconnection: false,
      timeout: 10000,
    });
    socket.on("connect", () => {
      console.log("✅ WebSocket 已连接");
      resolve(socket);
    });
    socket.on("connect_error", (err) => {
      reject(new Error(`WebSocket 连接失败: ${err.message}`));
    });
  });
}

// ── 等待远程结果 ──
function waitForResult(socket, requestId, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off("remote-result", handler);
      reject(new Error(`等待结果超时 (${timeoutMs / 1000}s): ${requestId}`));
    }, timeoutMs);
    function handler(data) {
      if (data?.requestId === requestId) {
        clearTimeout(timer);
        socket.off("remote-result", handler);
        resolve(data);
      }
    }
    socket.on("remote-result", handler);
  });
}

// ── 发送命令并等待结果 ──
async function sendCommandAndWait(
  socket,
  connectionId,
  command,
  timeoutMs = 120000,
) {
  const requestId =
    command.requestId ||
    `test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  command.requestId = requestId;
  // 开始监听
  const resultPromise = waitForResult(socket, requestId, timeoutMs);
  // 发送命令
  await api("/websocket/remote-command", { connectionId, command });
  // 等待结果
  return await resultPromise;
}

// ── 第 4 步: 运行单个测试 ──
async function runTest(socket, tool, testCase, index, total) {
  const toolId = tool.id;
  console.log(`\n${"─".repeat(60)}`);
  console.log(`📋 [${index + 1}/${total}] ${testCase.category}`);
  console.log(`   提示: ${testCase.prompt}`);
  console.log(`${"─".repeat(60)}`);

  const startTime = Date.now();

  // 4a. 发送 chat 命令
  console.log("   ⏳ 发送 chat 命令...");
  const chatRequestId = `chat-${Date.now()}`;
  try {
    await api("/websocket/remote-command", {
      connectionId: toolId,
      command: {
        type: "chat",
        payload: { message: testCase.prompt },
        requestId: chatRequestId,
      },
    });
    console.log("   ✅ 命令已发送, 等待 Agent 执行...");
  } catch (err) {
    console.log(`   ❌ 发送失败: ${err.message}`);
    return { ...testCase, success: false, error: err.message, elapsed: 0 };
  }

  // 4b. 等待 chat 结果 (最多 120s)
  let chatResult = null;
  try {
    chatResult = await waitForResult(socket, chatRequestId, 120000);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ✅ Agent 完成 (${elapsed}s): ${chatResult.message || ""}`);
    if (chatResult.agentResponse) {
      console.log(`   💬 回复: ${chatResult.agentResponse.slice(0, 200)}`);
    }
  } catch (err) {
    console.log(`   ⚠️  ${err.message}`);
  }

  // 4c. 获取对话日志
  console.log("   📊 获取对话日志...");
  const logRequestId = `log-${Date.now()}`;
  let conversation = null;
  let agentStatus = null;
  try {
    await api("/websocket/remote-command", {
      connectionId: toolId,
      command: { type: "getConversation", requestId: logRequestId },
    });
    const logResult = await waitForResult(socket, logRequestId, 15000);
    conversation = logResult.conversation || [];
    agentStatus = logResult.agentStatus;
    console.log(`   ✅ 获取到 ${conversation.length} 条消息`);
  } catch (err) {
    console.log(`   ⚠️  获取日志失败: ${err.message}`);
  }

  const elapsed = Date.now() - startTime;

  // 4d. 分析结果
  const analysis = analyzeResult(testCase, conversation, chatResult);

  return {
    category: testCase.category,
    prompt: testCase.prompt,
    success: analysis.passed,
    elapsed,
    messageCount: conversation?.length || 0,
    toolCallsUsed: analysis.toolCallsUsed,
    chatResult,
    agentStatus,
    conversation,
    analysis,
  };
}

// ── 分析单个测试结果 ──
function analyzeResult(testCase, conversation, chatResult) {
  const result = {
    passed: true,
    issues: [],
    toolCallsUsed: [],
    details: {},
  };

  if (!conversation || conversation.length === 0) {
    result.passed = false;
    result.issues.push("无对话数据");
    return result;
  }

  // 分析工具调用
  const toolCalls = [];
  for (const msg of conversation) {
    if (msg.tool_calls?.length) {
      for (const tc of msg.tool_calls) {
        toolCalls.push(tc.name);
      }
    }
    // 从 tool 消息中提取工具名
    if (msg.role === "tool" && msg.tool_name) {
      if (!toolCalls.includes(msg.tool_name)) {
        toolCalls.push(msg.tool_name);
      }
    }
  }
  result.toolCallsUsed = [...new Set(toolCalls)];

  // 检查期望的工具调用
  if (testCase.expect?.toolCalls) {
    for (const expected of testCase.expect.toolCalls) {
      if (!result.toolCallsUsed.includes(expected)) {
        result.issues.push(`缺少期望的工具调用: ${expected}`);
        result.passed = false;
      }
    }
  }

  // 检查工具执行错误
  const toolErrors = conversation
    .filter((m) => m.role === "tool" && m.meta?.toolResult?.success === false)
    .map(
      (m) =>
        `${m.tool_name || "unknown"}: ${m.meta.toolResult.message || m.meta.toolResult.error || "未知错误"}`,
    );
  if (toolErrors.length > 0) {
    result.issues.push(`工具执行错误: ${toolErrors.join("; ")}`);
    result.passed = false;
  }
  result.details.toolErrors = toolErrors;

  // 检查 Agent 错误
  if (chatResult?.error) {
    result.issues.push(`Agent 错误: ${chatResult.error}`);
    result.passed = false;
  }

  // 统计
  const userMsgs = conversation.filter((m) => m.role === "user").length;
  const assistantMsgs = conversation.filter(
    (m) => m.role === "assistant",
  ).length;
  const toolMsgs = conversation.filter((m) => m.role === "tool").length;
  result.details.messageStats = {
    user: userMsgs,
    assistant: assistantMsgs,
    tool: toolMsgs,
  };

  // 耗时统计
  const durations = conversation
    .filter((m) => m.meta?.duration)
    .map((m) => ({
      role: m.role,
      duration: m.meta.duration,
      name: m.tool_name || "",
    }));
  result.details.durations = durations;
  const totalDuration = durations.reduce((sum, d) => sum + d.duration, 0);
  result.details.totalDurationMs = totalDuration;

  return result;
}

// ── 第 5 步: 生成报告 ──
function generateReport(results) {
  console.log(`\n${"═".repeat(60)}`);
  console.log("📊 测试报告");
  console.log("═".repeat(60));

  const passed = results.filter((r) => r.success).length;
  const failed = results.length - passed;
  const totalElapsed = results.reduce((sum, r) => sum + r.elapsed, 0);

  console.log(`\n总计: ${results.length} 个用例`);
  console.log(`通过: ${passed} ✅  失败: ${failed} ${failed > 0 ? "❌" : ""}`);
  console.log(`通过率: ${Math.round((passed / results.length) * 100)}%`);
  console.log(`总耗时: ${(totalElapsed / 1000).toFixed(1)}s`);

  console.log(`\n${"─".repeat(60)}`);
  console.log("详细结果:");
  console.log("─".repeat(60));

  for (const r of results) {
    const icon = r.success ? "✅" : "❌";
    const elapsed = (r.elapsed / 1000).toFixed(1);
    console.log(
      `\n${icon} ${r.category} (${elapsed}s, ${r.messageCount} 条消息)`,
    );
    console.log(`   提示: ${r.prompt}`);
    console.log(`   工具调用: ${r.toolCallsUsed.join(", ") || "无"}`);
    if (r.analysis?.issues?.length) {
      console.log(`   问题:`);
      r.analysis.issues.forEach((issue) => console.log(`     ⚠️  ${issue}`));
    }
    if (r.analysis?.details?.toolErrors?.length) {
      console.log(`   工具错误:`);
      r.analysis.details.toolErrors.forEach((e) => console.log(`     ❌ ${e}`));
    }
  }

  // 汇总所有工具调用
  const allTools = {};
  for (const r of results) {
    for (const t of r.toolCallsUsed || []) {
      allTools[t] = (allTools[t] || 0) + 1;
    }
  }
  console.log(`\n${"─".repeat(60)}`);
  console.log("工具调用统计:");
  console.log("─".repeat(60));
  Object.entries(allTools)
    .sort((a, b) => b[1] - a[1])
    .forEach(([tool, count]) => console.log(`   ${tool}: ${count} 次`));

  // 汇总问题
  const allIssues = results.flatMap((r) =>
    (r.analysis?.issues || []).map((i) => ({ category: r.category, issue: i })),
  );
  if (allIssues.length > 0) {
    console.log(`\n${"─".repeat(60)}`);
    console.log("问题汇总 (需优化):");
    console.log("─".repeat(60));
    for (const { category, issue } of allIssues) {
      console.log(`   [${category}] ${issue}`);
    }
  }

  // 输出 JSON 报告
  const reportFile = `agent-test-report-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
  const reportData = {
    timestamp: new Date().toISOString(),
    server: SERVER_URL,
    token: authToken.slice(0, 20) + "...",
    summary: {
      total: results.length,
      passed,
      failed,
      totalElapsedMs: totalElapsed,
    },
    results: results.map((r) => ({
      category: r.category,
      prompt: r.prompt,
      success: r.success,
      elapsedMs: r.elapsed,
      messageCount: r.messageCount,
      toolCallsUsed: r.toolCallsUsed,
      issues: r.analysis?.issues || [],
      toolErrors: r.analysis?.details?.toolErrors || [],
      messageStats: r.analysis?.details?.messageStats,
      totalDurationMs: r.analysis?.details?.totalDurationMs,
      conversation: r.conversation,
      agentStatus: r.agentStatus,
    })),
  };

  // 写文件
  import("fs").then((fs) => {
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2), "utf-8");
    console.log(`\n📄 JSON 报告已保存: ${reportFile}`);
  });

  return reportData;
}

// ── 主流程 ──
async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   AI Agent 自动化测试                    ║");
  console.log("╚══════════════════════════════════════════╝");

  // 1. 设置 Token
  authToken = INPUT_TOKEN;
  console.log(`\n🔑 Token: ${authToken.slice(0, 20)}...`);

  // 2. 查找设计工具
  const tools = await findDesignTools();
  const tool = tools[0]; // 用第一台

  // 3. WebSocket 连接
  const socket = await connectWebSocket();

  // 4. 逐条运行测试
  const results = [];
  for (let i = 0; i < TEST_PROMPTS.length; i++) {
    try {
      const result = await runTest(
        socket,
        tool,
        TEST_PROMPTS[i],
        i,
        TEST_PROMPTS.length,
      );
      results.push(result);
    } catch (err) {
      console.log(`\n❌ 测试异常: ${err.message}`);
      results.push({
        category: TEST_PROMPTS[i].category,
        prompt: TEST_PROMPTS[i].prompt,
        success: false,
        error: err.message,
        elapsed: 0,
        messageCount: 0,
        toolCallsUsed: [],
        analysis: { passed: false, issues: [err.message] },
      });
    }
  }

  // 5. 生成报告
  generateReport(results);

  // 清理
  socket.disconnect();
  console.log("\n🏁 测试完成");
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ 致命错误:", err.message);
  process.exit(1);
});
