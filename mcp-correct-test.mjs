/**
 * MCP 图像处理正确测试脚本
 * 关键：工具执行结果通过 SSE 流异步返回，必须持续监听 SSE
 */

import http from 'http';
import { execSync } from 'child_process';

const TEST_IMAGE_URL = 'https://1s-1257307499.cos.ap-beijing.myqcloud.com/hengyouxin/2026-07-28/1785189785597_hengyouxin_340058750474141696.jpg';

async function testImageProcess(operations, testName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 测试: ${testName}`);
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

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log('⏰ 超时');
      resolve(false);
    }, 30000);

    let sessionId = null;
    let gotResponse = false;

    const req = http.request({
      hostname: 'localhost',
      port: 3210,
      path: '/sse',
      method: 'GET',
      headers: { 'Accept': 'text/event-stream' }
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk.toString();
        const lines = data.split('\n');

        for (const line of lines) {
          // 提取sessionId
          if (!sessionId && line.startsWith('data:') && line.includes('sessionId=')) {
            const match = line.match(/sessionId=([^\s]+)/);
            if (match) {
              sessionId = match[1];
              console.log(`✅ Session: ${sessionId}`);

              // 发送工具调用
              const toolReq = http.request({
                hostname: 'localhost',
                port: 3210,
                path: `/messages?sessionId=${sessionId}`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              }, (toolRes) => {
                let body = '';
                toolRes.on('data', (c) => body += c);
                toolRes.on('end', () => {
                  console.log(`📤 POST 响应: ${body}`);
                });
              });

              toolReq.write(JSON.stringify({
                jsonrpc: '2.0',
                method: 'tools/call',
                id: Date.now(),
                params: {
                  name: 'image_process_execute',
                  arguments: {
                    imageUrl: TEST_IMAGE_URL,
                    operations: operations
                  }
                }
              }));
              toolReq.end();
            }
          }

          // 关键：监听 SSE message 事件（工具执行结果）
          if (line.startsWith('event: message')) {
            gotResponse = true;
          }
          if (line.startsWith('data:') && gotResponse) {
            const jsonData = line.substring(5).trim();
            try {
              const parsed = JSON.parse(jsonData);
              console.log(`📥 工具返回结果:`);
              console.log(JSON.stringify(parsed, null, 2));

              clearTimeout(timeout);

              // 等待数据库更新
              setTimeout(async () => {
                console.log('\n🔍 检查数据库...');
                try {
                  const result = execSync(
                    'mysql -h 49.232.186.238 -u s1 -p666666 s1 -N -e "SELECT id, title, status, create_time FROM image_processing_record ORDER BY create_time DESC LIMIT 1"',
                    { encoding: 'utf-8' }
                  );
                  const [id, title, status, createTime] = result.split('\t');
                  console.log(`   ID: ${id?.trim()}`);
                  console.log(`   标题: ${title?.trim()}`);
                  console.log(`   状态: ${status?.trim()}`);

                  const success = id?.trim() !== beforeRecord;
                  console.log(success ? '\n✅ 测试通过!' : '\n⚠️ 没有产生新记录');
                  resolve(success);
                } catch (e) {
                  console.log('❌ 数据库查询失败');
                  resolve(false);
                }
              }, 3000);
            } catch (e) {
              // 不是JSON，忽略
            }
          }
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Error:', e.message);
      clearTimeout(timeout);
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     MCP 图像处理正确测试                                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  const tests = [
    {
      name: '基础缩放 800x800',
      operations: [{ type: 'resize', params: { width: 800, height: 800 } }]
    },
    {
      name: '黑白滤镜',
      operations: [{ type: 'grayscale', params: { intensity: 100 } }]
    },
    {
      name: '怀旧效果',
      operations: [{ type: 'sepia', params: { intensity: 80 } }]
    },
    {
      name: '文字水印',
      operations: [{ type: 'watermark', params: { type: 'text', text: 'YISHE 2026', position: 'bottom-right', fontSize: 28, color: '#FFFFFF' } }]
    },
    {
      name: '组合：缩放+黑白+水印',
      operations: [
        { type: 'resize', params: { width: 800, height: 800 } },
        { type: 'grayscale', params: {} },
        { type: 'watermark', params: { type: 'text', text: 'YISHE', position: 'bottom-right' } }
      ]
    },
    {
      name: 'Lowpoly艺术风格',
      operations: [{ type: 'lowpoly', params: { pointCount: 900, edgeBias: 0.65 } }]
    },
    {
      name: '宝丽来相框',
      operations: [{ type: 'polaroid', params: { angle: 5 } }]
    },
    {
      name: '悬浮阴影',
      operations: [{ type: 'dropShadow', params: { opacity: 70, sigma: 8, dx: 6, dy: 6 } }]
    }
  ];

  const results = [];
  for (const test of tests) {
    const success = await testImageProcess(test.operations, test.name);
    results.push({ name: test.name, success });
    // 间隔避免冲突
    await new Promise(r => setTimeout(r, 2000));
  }

  // 报告
  console.log('\n\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     测试报告                                             ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  const passed = results.filter(r => r.success).length;
  console.log(`\n总计: ${results.length} 个用例`);
  console.log(`通过: ${passed} ✅  失败: ${results.length - passed} ${results.length - passed > 0 ? '❌' : ''}`);
  console.log(`通过率: ${Math.round((passed / results.length) * 100)}%`);

  for (const r of results) {
    console.log(`${r.success ? '✅' : '❌'} ${r.name}`);
  }

  process.exit(0);
}

main();
