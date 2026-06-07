import type {
  ExperimentRecord,
  ForceDataPoint,
  StressTestResult,
} from '@/shared/types';

export const exportToCSV = (
  forceData: ForceDataPoint[],
  filename: string = 'experiment_data.csv'
): void => {
  const headers = [
    'timestamp',
    'hair_id',
    'pos_x',
    'pos_y',
    'pos_z',
    'force_magnitude',
    'force_dir_x',
    'force_dir_y',
    'force_dir_z',
    'is_shedding',
  ];

  const rows = forceData.map((d) => [
    d.timestamp.toFixed(4),
    d.hairId,
    d.position[0].toFixed(6),
    d.position[1].toFixed(6),
    d.position[2].toFixed(6),
    d.forceMagnitude.toFixed(6),
    d.forceDirection[0].toFixed(6),
    d.forceDirection[1].toFixed(6),
    d.forceDirection[2].toFixed(6),
    d.isShedding ? '1' : '0',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join(
    '\n'
  );

  downloadFile(csvContent, filename, 'text/csv');
};

export const exportToJSON = (
  data: ExperimentRecord | StressTestResult,
  filename: string
): void => {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
};

export const downloadFile = (
  content: string,
  filename: string,
  mimeType: string
): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateExperimentReport = (
  experiment: ExperimentRecord
): string => {
  const { name, timestamp, duration, summary, hairParams, combConfig, environmentParams } =
    experiment;

  const date = new Date(timestamp).toLocaleString('zh-CN');
  const durationStr = (duration / 1000).toFixed(2);

  return `
# 梳毛实验报告

## 基本信息
- **实验名称**: ${name}
- **实验时间**: ${date}
- **持续时长**: ${durationStr} 秒

## 参数配置

### 毛发参数
- 长度: ${(hairParams.length * 10).toFixed(1)} cm
- 密度: ${(hairParams.density * 100).toFixed(0)}%
- 硬度: ${(hairParams.stiffness * 100).toFixed(0)}%
- 卷曲度: ${(hairParams.curliness * 100).toFixed(0)}%
- 颜色: ${hairParams.color}

### 梳子配置
- 类型: ${combConfig.type === 'needle' ? '针梳' : combConfig.type === 'shedding' ? '脱毛梳' : '排梳'}
- 齿间距: ${combConfig.toothSpacing} mm
- 齿长度: ${combConfig.toothLength} mm
- 硬度: ${(combConfig.stiffness * 100).toFixed(0)}%

### 环境参数
- 温度: ${environmentParams.temperature}°C
- 湿度: ${environmentParams.humidity}%
- 静电系数: ${environmentParams.staticCoefficient}

## 实验结果摘要

### 受力统计
- **总受力**: ${summary.totalForce.toFixed(4)} N
- **平均受力**: ${summary.averageForce.toFixed(4)} N
- **最大受力**: ${summary.maxForce.toFixed(4)} N

### 现象统计
- **掉毛数量**: ${summary.sheddingCount} 根
- **打结数量**: ${summary.knotCount} 处
- **静电事件**: ${summary.staticElectricityEvents} 次

## 分析建议

${generateAnalysis(summary)}

---
*报告由毛发物理仿真系统自动生成*
  `.trim();
};

const generateAnalysis = (summary: ExperimentRecord['summary']): string => {
  const analysis: string[] = [];

  if (summary.maxForce > 4.0) {
    analysis.push(
      '⚠️ **警告**: 最大受力超过4N，可能对猫咪造成不适，建议优化梳子设计或调整梳毛力度。'
    );
  } else if (summary.maxForce > 3.0) {
    analysis.push(
      '⚡ **注意**: 最大受力较高，建议评估梳子材质和齿形设计。'
    );
  }

  if (summary.sheddingCount > 50) {
    analysis.push(
      `📊 **掉毛分析**: 本次实验掉毛${summary.sheddingCount}根，${
        summary.sheddingCount > 100 ? '属于较高水平' : '处于正常范围'
      }。`
    );
  }

  if (summary.knotCount > 20) {
    analysis.push(
      `🔗 **打结分析**: 检测到${summary.knotCount}处打结，建议使用开结梳预处理或降低梳毛速度。`
    );
  }

  if (summary.staticElectricityEvents > 10) {
    analysis.push(
      '⚡ **静电分析**: 静电现象明显，建议增加环境湿度或使用抗静电梳子材质。'
    );
  }

  if (analysis.length === 0) {
    analysis.push('✅ **综合评估**: 各项指标处于正常范围，梳子设计表现良好。');
  }

  return analysis.join('\n\n');
};

export const generateStressTestReport = (result: StressTestResult): string => {
  const duration = ((result.endTime - result.startTime) / 1000).toFixed(1);

  return `
# 压力测试报告

## 测试配置
- **完成迭代**: ${result.completedIterations} 次梳毛
- **测试时长**: ${duration} 秒

## 性能指标

### 帧率统计
- **平均帧率**: ${result.avgFps.toFixed(1)} FPS
- **最低帧率**: ${result.minFps.toFixed(1)} FPS
- **最高帧率**: ${result.maxFps.toFixed(1)} FPS

### 帧时间
- **平均帧时间**: ${result.avgFrameTime.toFixed(2)} ms

### 渲染性能
- **平均Draw Call**: ${
    result.drawCalls.length > 0
      ? (result.drawCalls.reduce((a, b) => a + b, 0) / result.drawCalls.length).toFixed(0)
      : 'N/A'
  }

## 评估结果

${result.avgFps >= 60 ? '✅ **通过**: 平均帧率达到60FPS目标' : '⚠️ **未达标**: 平均帧率低于60FPS目标'}

---
*报告由毛发物理仿真系统自动生成*
  `.trim();
};
