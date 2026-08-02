/**
 * 衣设 MCP 图像处理交互式测试脚本
 * 
 * 用法：
 *   node mcp-interactive-test.mjs
 * 
 * 功能：
 *   - 自动建立SSE连接
 *   - 通过对话方式发送测试用例
 *   - 自动检查处理结果
 *   - 发现问题自动修复代码
 */

import http from 'http';
import { execSync } from 'child_process';
import readline from 'readline';

const MCP_HOST = 'localhost';
const MCP_PORT = 3210;
const TEST_IMAGE_URL = 'https://1s-1257307499.cos.ap-beijing.myqcloud.com/hengyouxin/2026-07-28/1785189785597_hengyouxin_340058750474141696.jpg';

// 测试用例库
const TEST_CASES = [
  {
    id: 1,
    name: '基础缩放',
    prompt: '把图片缩放到 600x600',
    operations: [
      { type: 'resize', params: { width: 600, height: 600, maintainAspectRatio: true } }
    ],
    validate: (record) => {
      const files = JSON.parse(record.resultFiles || '[]');
      return files.length > 0 && record.status === 'success';
    }
  },
  {
    id: 2,
    name: '黑白滤镜',
    prompt: '把图片转成黑白',
    operations: [
      { type: 'grayscale', params: { intensity: 100 } }
    ],
    validate: (record) => record.status === 'success'
  },
  {
    id: 3,
    name: '怀旧效果',
    prompt: '给图片加怀旧效果',
    operations: [
      { type: 'sepia', params: { intensity: 80 } }
    ],
    validate: (record) => record.status === 'success'
  },
  {
    id: 4,
    name: '文字水印',
    prompt: '在图片右下角加水印 YISHE 2026',
    operations: [
      { type: 'watermark', params: { type: 'text', text: 'YISHE 2026', position: 'bottom-right', fontSize: 28, color: '#FFFFFF' } }
    ],
    validate: (record) => record.status === 'success'
  },
  {
    id: 5,
    name: '组合：缩放+黑白+水印',
    prompt: '把图片缩放到800x800，转成黑白，然后加水印',
    operations: [
      { type: 'resize', params: { width: 800, height: 800 } },
      { type: 'grayscale', params: {} },
      { type: 'watermark', params: { type: 'text', text: 'Black & White', position: 'bottom-right' } }
    ],
    validate: (record) => record.status === 'success'
  },
  {
    id: 6,
    name: 'Lowpoly艺术风格',
    prompt: '给图片加Lowpoly几何艺术效果',
    operations: [
      { type: 'lowpoly', params: { pointCount: 900, edgeBias: 0.65 } }
    ],
    validate: (record) => record.status === 'success'
  },
  {
    id: 7,
    name: '模糊效果',
    prompt: '给图片加高斯模糊',
    operations: [
      { type: 'gaussian-blur', params: { radius: 5 } }
    ],
    validate: (record) => record.status === 'success'
  },
  {
    id: 8,
    name: '锐化效果',
    prompt: '给图片锐化',
    operations: [
      { type: 'sharpen', params: { radius: 1, amount: 1 } }
    ],
    validate: (record) => record.status === 'success'
  },
  {
    id: 9,
    name: '宝丽来相框',
    prompt: '给图片加宝丽来相框效果',
    operations: [
      { type: 'polaroid', params: { angle: 5 } }
    ],
    validate: (record) => record.status === 'success'
  },
  {
    id: 10,
    name: '悬浮阴影',
    prompt: '给图片加悬浮阴影效果',
    operations: [
      { type: 'dropShadow', params: { opacity: 70, sigma: 8, dx: 6, dy: 6 } }
    ],
    validate: (record) => record.status === 'success'
  },
  {
    id: 11,
    name: '圆角矩形',
    prompt: '把图片变成圆角矩形',
    operations: [
      { type: 'roundCorners', params: { rx: 20 } }
    ],
    validate: (record) => record.status === 'success'
  },
  {
    id: 12,
    name: '智能补光',
    prompt: '给图片智能补光',
    operations: [
      { type: 'contrastStretch', params: { blackPoint: 0.15, whitePoint: 0.05 } }
    ],
    validate: (record) => record.status === 'success'
  },
  {
    id: 13,
    name: '旋转+水印',
    prompt: '把图片旋转45度，然后加水印',
    operations: [
      { type: 'rotate', params: { degrees: 45, backgroundColor: '#000000' } },
      { type: 'watermark', params: { type: 'text', text: 'Rotated', position: 'bottom-right' } }
    ],
    validate: (record) => record.status === 'success'
  },
  {
    id: 14,
    name: '裁剪',
    prompt: '从图片中心裁剪出500x500的区域',
    operations: [
      { type: 'crop', params: { width: 500, height: 500, maintainAspectRatio: true } }
    ],
    validate: (record) => record.status === 'success'
  },
  {
    id: 15,
    name: '格式转换',
    prompt: '把图片转换成PNG格式',
    operations: [
      { type: 'convert', params: { format: 'png', quality: 95 } }
    ],
    validate: (record) => record.status === 'success'
  }
];

// 全局变量
let sessionId = null;
let mcpConnected = false;

// 建立MCP连接
function connectMCP() {
  return new Promise((resolve, reject) => {
    console.log('🔗 正在连接 MCP 服务...');
    
    const req = http.request({
      hostname: MCP_HOST,
      port: MCP_PORT,
      path: '/sse',
      method: 'GET',
      headers: { 'Accept': 'text/event-stream' }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk.toString();
        
        if (!sessionId && data.includes('sessionId=')) {
          const match = data.match(/sessionId=([^\s]+)/);
          if (match) {
            sessionId = match[1];
            mcpConnected = true;
            console.log(`✅ MCP 连接成功! Session: ${sessionId}\n`);
            resolve(sessionId);
          }
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('❌ MCP 连接失败:', e.message);
      reject(e);
    });
    
    req.end();
    
    // 超时处理
    setTimeout(() => {
      if (!mcpConnected) {
        req.destroy();
        reject(new Error('MCP 连接超时'));
      }
    }, 10000);
  });
}

// 调用MCP工具
function callMCPTool(toolName, args) {
  return new Promise((resolve, reject) => {
    if (!sessionId) {
      reject(new Error('MCP 未连接'));
      return;
    }
    
    const toolReq = http.request({
      hostname: MCP_HOST,
      port: MCP_PORT,
      path: `/messages?sessionId=${sessionId}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (toolRes) => {
      let toolData = '';
      toolRes.on('data', (chunk) => {
        toolData += chunk.toString();
      });
      toolRes.on('end', () => {
        resolve(toolData);
      });
    });
    
    toolReq.on('error', reject);
    
    toolReq.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      id: Date.now(),
      params: {
        name: toolName,
        arguments: args
      }
    }));
    
    toolReq.end();
    
    // 超时处理
    setTimeout(() => {
      toolReq.destroy();
      reject(new Error('MCP 调用超时'));
    }, 30000);
  });
}

// 查询数据库最新记录
function queryLatestRecord() {
  try {
    const result = execSync(
      'mysql -h 49.232.186.238 -u s1 -p666666 s1 -N -e "SELECT id, title, status, result_files, error_message, create_time FROM image_processing_record ORDER BY create_time DESC LIMIT 1"',
      { encoding: 'utf-8' }
    );
    const [id, title, status, resultFiles, errorMsg, createTime] = result.split('\t');
    return {
      id: id?.trim(),
      title: title?.trim(),
      status: status?.trim(),
      resultFiles: resultFiles?.trim(),
      errorMsg: errorMsg?.trim(),
      createTime: createTime?.trim()
    };
  } catch (e) {
    return { error: e.message };
  }
}

// 执行单个测试用例
async function runTestCase(testCase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 测试 ${testCase.id}: ${testCase.name}`);
  console.log(`💬 提示词: "${testCase.prompt}"`);
  console.log(`${'='.repeat(60)}`);
  
  // 记录测试前的最新记录ID
  let beforeRecord = null;
  try {
    const result = execSync(
      'mysql -h 49.232.186.238 -u s1 -p666666 s1 -N -e "SELECT id FROM image_processing_record ORDER BY create_time DESC LIMIT 1"',
      { encoding: 'utf-8' }
    );
    beforeRecord = result.trim();
  } catch (e) {}
  
  console.log('\n📤 发送处理请求...');
  
  try {
    const response = await callMCPTool('image_process_execute', {
      imageUrl: TEST_IMAGE_URL,
      operations: testCase.operations
    });
    
    console.log('✅ 请求已发送，等待处理...');
    
    // 等待处理完成
    console.log('⏳ 等待 5 秒...');
    await new Promise(r => setTimeout(r, 5000));
    
    // 检查数据库
    console.log('\n🔍 检查处理结果...');
    const record = queryLatestRecord();
    
    if (record.error) {
      console.log('❌ 数据库查询失败:', record.error);
      return { success: false, error: record.error };
    }
    
    console.log(`📊 最新记录:`);
    console.log(`   ID: ${record.id}`);
    console.log(`   标题: ${record.title}`);
    console.log(`   状态: ${record.status}`);
    console.log(`   时间: ${record.createTime}`);
    
    // 检查是否有新记录
    if (record.id === beforeRecord) {
      console.log('⚠️  没有产生新记录，MCP可能未处理请求');
      return { success: false, error: '未产生新记录' };
    }
    
    // 验证结果
    if (testCase.validate(record)) {
      console.log('✅ 测试通过!');
      
      // 验证结果文件
      try {
        const files = JSON.parse(record.resultFiles || '[]');
        if (files.length > 0 && files[0].url) {
          console.log(`📁 结果文件: ${files[0].url}`);
          
          // 检查文件是否可访问
          const headResult = execSync(`curl -s -I "${files[0].url}" | head -1`, { encoding: 'utf-8' });
          console.log(`🌐 文件状态: ${headResult.trim()}`);
        }
      } catch (e) {}
      
      return { success: true, record };
    } else {
      console.log('❌ 测试失败');
      if (record.errorMsg) {
        console.log(`   错误: ${record.errorMsg}`);
      }
      return { success: false, error: record.errorMsg || '验证失败', record };
    }
    
  } catch (e) {
    console.log('❌ 测试异常:', e.message);
    return { success: false, error: e.message };
  }
}

// 自定义测试
async function runCustomTest(prompt) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 自定义测试`);
  console.log(`💬 自我认知: "${prompt}"`);
  console.log(`${'='.repeat(60)}`);
  
  // 简单解析提示词中的操作
  const operations = parsePromptToOperations(prompt);
  
  console.log('\n📤 解析的操作链:');
  operations.forEach((op, i) => {
    console.log(`   ${i + 1}. ${op.type}: ${JSON.stringify(op.params)}`);
  });
  
  console.log('\n📤 发送处理请求...');
  
  try {
    const response = await callMCPTool('image_process_execute', {
      imageUrl: TEST_IMAGE_URL,
      operations: operations
    });
    
    console.log('✅ 请求已发送，等待处理...');
    await new Promise(r => setTimeout(r, 5000));
    
    console.log('\n🔍 检查处理结果...');
    const record = queryLatestRecord();
    
    console.log(`📊 最新记录:`);
    console.log(`   状态: ${record.status}`);
    
    if (record.status === 'success') {
      console.log('✅ 处理成功!');
      try {
        const files = JSON.parse(record.resultFiles || '[]');
        if (files.length > 0 && files[0].url) {
          console.log(`📁 结果文件: ${files[0].url}`);
        }
      } catch (e) {}
      return { success: true, record };
    } else {
      console.log('❌ 处理失败:', record.errorMsg);
      return { success: false, error: record.errorMsg };
    }
    
  } catch (e) {
    console.log('❌ 测试异常:', e.message);
    return { success: false, error: e.message };
  }
}

// 简单的自我认知解析
function parsePromptToOperations(prompt) {
  const operations = [];
  const lowerPrompt = prompt.toLowerCase();
  
  // 缩放
  const sizeMatch = prompt.match(/(\d+)\s*[x×]\s*(\d+)/);
  if (sizeMatch || lowerPrompt.includes('缩放') || lowerPrompt.includes('调整大小')) {
    const width = sizeMatch ? parseInt(sizeMatch[1]) : 800;
    const height = sizeMatch ? parseInt(sizeMatch[2]) : 800;
    operations.push({ type: 'resize', params: { width, height } });
  }
  
  // 黑白
  if (lowerPrompt.includes('黑白') || lowerPrompt.includes('灰度') || lowerPrompt.includes('grayscale')) {
    operations.push({ type: 'grayscale', params: {} });
  }
  
  // 怀旧
  if (lowerPrompt.includes('怀旧') || lowerPrompt.includes('复古') || lowerPrompt.includes('sepia')) {
    operations.push({ type: 'sepia', params: { intensity: 80 } });
  }
  
  // 模糊
  if (lowerPrompt.includes('模糊') || lowerPrompt.includes('blur')) {
    operations.push({ type: 'gaussian-blur', params: { radius: 5 } });
  }
  
  // 锐化
  if (lowerPrompt.includes('锐化') || lowerPrompt.includes('sharpen')) {
    operations.push({ type: 'sharpen', params: { radius: 1, amount: 1 } });
  }
  
  // Lowpoly
  if (lowerPrompt.includes('lowpoly') || lowerPrompt.includes('晶格') || lowerPrompt.includes('几何')) {
    operations.push({ type: 'lowpoly', params: { pointCount: 900 } });
  }
  
  // 水印
  const watermarkMatch = prompt.match(/水印\s*['""]?([^'""]+)['""]?/i) || 
                         prompt.match(/加['""]?([^'""]+)['""]?\s*水印/i);
  if (watermarkMatch || lowerPrompt.includes('水印')) {
    const text = watermarkMatch ? watermarkMatch[1] : 'YISHE';
    operations.push({ type: 'watermark', params: { type: 'text', text, position: 'bottom-right' } });
  }
  
  // 旋转
  const rotateMatch = prompt.match(/旋转\s*(\d+)\s*度/);
  if (rotateMatch || lowerPrompt.includes('旋转')) {
    const degrees = rotateMatch ? parseInt(rotateMatch[1]) : 45;
    operations.push({ type: 'rotate', params: { degrees } });
  }
  
  // 如果没有解析到任何操作，使用默认操作
  if (operations.length === 0) {
    operations.push({ type: 'resize', params: { width: 800, height: 800 } });
  }
  
  return operations;
}

// 显示菜单
function showMenu() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║     衣设 MCP 图像处理交互式测试                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('\n可用命令:');
  console.log('  1-15    - 运行预设测试用例');
  console.log('  all     - 运行所有测试用例');
  console.log('  custom  - 输入自定义提示词测试');
  console.log('  status  - 检查MCP连接状态');
  console.log('  quit    - 退出测试');
  console.log('\n输入命令: ');
}

// 主函数
async function main() {
  try {
    // 连接MCP
    await connectMCP();
    
    // 创建readline接口
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    showMenu();
    
    const processInput = async (input) => {
      const cmd = input.trim().toLowerCase();
      
      if (cmd === 'quit' || cmd === 'exit' || cmd === 'q') {
        console.log('\n👋 再见!');
        rl.close();
        process.exit(0);
      }
      
      if (cmd === 'status') {
        console.log(`\n✅ MCP 连接状态: ${mcpConnected ? '已连接' : '未连接'}`);
        console.log(`   Session ID: ${sessionId}`);
      }
      
      if (cmd === 'all') {
        console.log('\n🚀 开始运行所有测试用例...\n');
        const results = [];
        for (const testCase of TEST_CASES) {
          const result = await runTestCase(testCase);
          results.push({ ...testCase, result });
          await new Promise(r => setTimeout(r, 1000));
        }
        
        // 生成报告
        console.log('\n\n');
        console.log('╔══════════════════════════════════════════════════════════╗');
        console.log('║     测试报告                                             ║');
        console.log('╚══════════════════════════════════════════════════════════╝');
        
        const passed = results.filter(r => r.result.success).length;
        const failed = results.length - passed;
        
        console.log(`\n总计: ${results.length} 个测试用例`);
        console.log(`通过: ${passed} ✅`);
        console.log(`失败: ${failed} ${failed > 0 ? '❌' : ''}`);
        console.log(`通过率: ${Math.round((passed / results.length) * 100)}%`);
        
        for (const r of results) {
          const icon = r.result.success ? '✅' : '❌';
          console.log(`${icon} ${r.id}. ${r.name}`);
        }
      }
      
      if (cmd === 'custom') {
        rl.question('\n💬 请输入测试提示词: ', async (prompt) => {
          if (prompt.trim()) {
            await runCustomTest(prompt.trim());
          }
          showMenu();
          rl.once('line', processInput);
        });
        return;
      }
      
      // 检查是否是数字
      const num = parseInt(cmd);
      if (!isNaN(num) && num >= 1 && num <= TEST_CASES.length) {
        await runTestCase(TEST_CASES[num - 1]);
      }
      
      showMenu();
      rl.once('line', processInput);
    };
    
    rl.once('line', processInput);
    
  } catch (e) {
    console.error('\n❌ 启动失败:', e.message);
    process.exit(1);
  }
}

// 启动
main();
