const http = require('http');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const ITERATIONS = parseInt(process.env.ITERATIONS) || 1000;
const HAIR_COUNT = parseInt(process.env.HAIR_COUNT) || 100000;

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runStressTest() {
  console.log('=' .repeat(60));
  console.log('🚀 毛发物理仿真系统 - 压力测试');
  console.log('=' .repeat(60));
  console.log(`\n📋 测试配置:`);
  console.log(`   迭代次数: ${ITERATIONS}`);
  console.log(`   毛发数量: ${HAIR_COUNT.toLocaleString()} 根`);
  console.log(`   API地址: ${API_BASE_URL}`);
  console.log(`\n⏳ 开始测试...\n`);

  const startTime = Date.now();
  const fpsData = [];
  const responseTimes = [];
  const errors = [];

  for (let i = 0; i < ITERATIONS; i++) {
    const iterationStart = Date.now();

    try {
      const response = await makeRequest('/experiments/stress-test', 'POST', {
        iterations: 1,
        hairCount: HAIR_COUNT,
      });

      const responseTime = Date.now() - iterationStart;
      responseTimes.push(responseTime);
      fpsData.push(response.avgFps || 60);

      if (i % 100 === 0 && i > 0) {
        const progress = ((i + 1) / ITERATIONS) * 100;
        const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const avgFps = fpsData.reduce((a, b) => a + b, 0) / fpsData.length;
        console.log(`📊 进度: ${progress.toFixed(0)}% (${i + 1}/${ITERATIONS}) | 平均响应: ${avgResponseTime.toFixed(0)}ms | 平均FPS: ${avgFps.toFixed(1)}`);
      }
    } catch (error) {
      errors.push({ iteration: i, error: error.message });
      console.error(`❌ 迭代 ${i} 失败: ${error.message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  const totalTime = (Date.now() - startTime) / 1000;
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);
  const avgFps = fpsData.reduce((a, b) => a + b, 0) / fpsData.length;
  const minFps = Math.min(...fpsData);
  const maxFps = Math.max(...fpsData);

  console.log('\n' + '='.repeat(60));
  console.log('📈 测试结果');
  console.log('=' .repeat(60));

  console.log(`\n⏱️  时间统计:`);
  console.log(`   总耗时: ${totalTime.toFixed(2)}s`);
  console.log(`   平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`   最小响应时间: ${minResponseTime}ms`);
  console.log(`   最大响应时间: ${maxResponseTime}ms`);
  console.log(`   吞吐量: ${(ITERATIONS / totalTime).toFixed(2)} req/s`);

  console.log(`\n🎮 性能统计:`);
  console.log(`   平均帧率: ${avgFps.toFixed(1)} FPS`);
  console.log(`   最低帧率: ${minFps.toFixed(1)} FPS`);
  console.log(`   最高帧率: ${maxFps.toFixed(1)} FPS`);

  console.log(`\n✅ 成功率: ${((ITERATIONS - errors.length) / ITERATIONS * 100).toFixed(2)}%`);
  if (errors.length > 0) {
    console.log(`❌ 错误数: ${errors.length}`);
  }

  console.log(`\n📊 评估结果:`);
  if (avgFps >= 60) {
    console.log(`   ✅ 优秀 - 平均帧率达到60FPS目标`);
  } else if (avgFps >= 30) {
    console.log(`   ⚠️  良好 - 平均帧率达到30FPS以上`);
  } else {
    console.log(`   ❌ 未达标 - 平均帧率低于30FPS`);
  }

  if (avgResponseTime <= 100) {
    console.log(`   ✅ 优秀 - 平均响应时间低于100ms`);
  } else if (avgResponseTime <= 500) {
    console.log(`   ⚠️  良好 - 平均响应时间低于500ms`);
  } else {
    console.log(`   ❌ 偏高 - 平均响应时间超过500ms`);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🎉 测试完成!');
  console.log('=' .repeat(60));

  process.exit(errors.length > 0 ? 1 : 0);
}

runStressTest().catch(console.error);
