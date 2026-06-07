import { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { cn } from '@/lib/utils';

interface MetricHistory {
  timestamp: number;
  fps: number;
  frameTime: number;
  memory: number;
  drawCalls: number;
  triangles: number;
}

export function PerformanceMonitor() {
  const { performanceMetrics, renderSettings } = useSimulationStore();
  const [history, setHistory] = useState<MetricHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'realtime' | 'system'>('realtime');
  const historyRef = useRef<MetricHistory[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newPoint: MetricHistory = {
        timestamp: Date.now(),
        fps: performanceMetrics.fps,
        frameTime: performanceMetrics.frameTime,
        memory: performanceMetrics.memoryUsage,
        drawCalls: performanceMetrics.drawCalls,
        triangles: performanceMetrics.triangleCount,
      };

      historyRef.current = [...historyRef.current.slice(-120), newPoint];
      setHistory([...historyRef.current]);
    }, 500);

    return () => clearInterval(interval);
  }, [performanceMetrics]);

  const fpsChartOption = {
    backgroundColor: 'transparent',
    grid: { top: 30, right: 20, bottom: 30, left: 50 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0' },
      formatter: (params: any) => {
        const data = params[0];
        return `帧率: ${data.value} FPS`;
      },
    },
    xAxis: {
      type: 'category',
      data: history.map((_, i) => i),
      show: false,
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 120,
      splitLine: { lineStyle: { color: '#1e293b' } },
      axisLabel: { color: '#64748b' },
    },
    series: [
      {
        type: 'line',
        data: history.map((h) => h.fps),
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: '#3b82f6',
          width: 2,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' },
            ],
          },
        },
        markLine: {
          silent: true,
          lineStyle: { color: '#ef4444', type: 'dashed' },
          data: [{ yAxis: 60 }],
        },
      },
    ],
  };

  const frameTimeChartOption = {
    backgroundColor: 'transparent',
    grid: { top: 30, right: 20, bottom: 30, left: 50 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0' },
      formatter: (params: any) => {
        const data = params[0];
        return `帧时间: ${data.value} ms`;
      },
    },
    xAxis: {
      type: 'category',
      data: history.map((_, i) => i),
      show: false,
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 50,
      splitLine: { lineStyle: { color: '#1e293b' } },
      axisLabel: { color: '#64748b' },
    },
    series: [
      {
        type: 'line',
        data: history.map((h) => h.frameTime),
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: '#22c55e',
          width: 2,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(34, 197, 94, 0.3)' },
              { offset: 1, color: 'rgba(34, 197, 94, 0)' },
            ],
          },
        },
        markLine: {
          silent: true,
          lineStyle: { color: '#ef4444', type: 'dashed' },
          data: [{ yAxis: 16.67 }],
        },
      },
    ],
  };

  const memoryChartOption = {
    backgroundColor: 'transparent',
    grid: { top: 30, right: 20, bottom: 30, left: 50 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0' },
      formatter: (params: any) => {
        const data = params[0];
        return `内存: ${data.value} MB`;
      },
    },
    xAxis: {
      type: 'category',
      data: history.map((_, i) => i),
      show: false,
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#1e293b' } },
      axisLabel: { color: '#64748b' },
    },
    series: [
      {
        type: 'line',
        data: history.map((h) => h.memory),
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: '#a855f7',
          width: 2,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(168, 85, 247, 0.3)' },
              { offset: 1, color: 'rgba(168, 85, 247, 0)' },
            ],
          },
        },
      },
    ],
  };

  const getFpsStatus = (fps: number) => {
    if (fps >= 60)
      return { color: 'green', text: '优秀', icon: CheckCircle2 };
    if (fps >= 30) return { color: 'yellow', text: '良好', icon: AlertCircle };
    return { color: 'red', text: '较差', icon: AlertCircle };
  };

  const fpsStatus = getFpsStatus(performanceMetrics.fps);

  return (
    <div className="h-screen overflow-y-auto bg-slate-950">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">性能监控</h1>
          <p className="text-slate-400">实时监控系统运行状态和性能指标</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('realtime')}
            className={cn(
              'px-4 py-2 rounded-lg font-medium text-sm transition-all',
              activeTab === 'realtime'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            )}
          >
            实时性能
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={cn(
              'px-4 py-2 rounded-lg font-medium text-sm transition-all',
              activeTab === 'system'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            )}
          >
            系统资源
          </button>
        </div>

        {activeTab === 'realtime' && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <MetricCard
                icon={Activity}
                label="帧率"
                value={`${performanceMetrics.fps.toFixed(0)} FPS`}
                subValue={`目标: 60 FPS`}
                status={fpsStatus}
              />
              <MetricCard
                icon={Clock}
                label="帧时间"
                value={`${performanceMetrics.frameTime.toFixed(2)} ms`}
                subValue={`目标: < 16.67 ms`}
                status={{
                  color: performanceMetrics.frameTime <= 16.67 ? 'green' : 'yellow',
                  text: performanceMetrics.frameTime <= 16.67 ? '达标' : '偏高',
                  icon: performanceMetrics.frameTime <= 16.67 ? CheckCircle2 : AlertCircle,
                }}
              />
              <MetricCard
                icon={Cpu}
                label="Draw Call"
                value={performanceMetrics.drawCalls.toString()}
                subValue="绘制调用次数"
                color="cyan"
              />
              <MetricCard
                icon={TrendingUp}
                label="三角形"
                value={performanceMetrics.triangleCount.toLocaleString()}
                subValue="场景总面数"
                color="purple"
              />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  帧率趋势
                </h3>
                <ReactECharts
                  option={fpsChartOption}
                  style={{ height: '250px' }}
                  notMerge
                />
              </div>

              <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-400" />
                  帧时间趋势
                </h3>
                <ReactECharts
                  option={frameTimeChartOption}
                  style={{ height: '250px' }}
                  notMerge
                />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MemoryStick className="w-5 h-5 text-purple-400" />
                内存使用趋势
              </h3>
              <ReactECharts
                option={memoryChartOption}
                style={{ height: '200px' }}
                notMerge
              />
            </div>
          </>
        )}

        {activeTab === 'system' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-400" />
                渲染配置
              </h3>
              <div className="space-y-4">
                <ConfigRow
                  label="毛发数量"
                  value={renderSettings.hairCount.toLocaleString()}
                  highLight
                />
                <ConfigRow
                  label="GPU实例化渲染"
                  value={renderSettings.instanceRendering ? '开启' : '关闭'}
                  status={renderSettings.instanceRendering ? 'success' : 'warning'}
                />
                <ConfigRow
                  label="视锥剔除"
                  value={renderSettings.frustumCulling ? '开启' : '关闭'}
                  status={renderSettings.frustumCulling ? 'success' : 'warning'}
                />
                <ConfigRow
                  label="LOD层级细节"
                  value={renderSettings.lodEnabled ? '开启' : '关闭'}
                  status={renderSettings.lodEnabled ? 'success' : 'warning'}
                />
                <ConfigRow
                  label="后处理效果"
                  value={renderSettings.postProcessing ? '开启' : '关闭'}
                />
                <ConfigRow
                  label="阴影质量"
                  value={renderSettings.shadowQuality.toString()}
                />
                <ConfigRow
                  label="抗锯齿"
                  value={renderSettings.antialiasing ? '开启' : '关闭'}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-green-400" />
                  浏览器信息
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">User Agent</span>
                    <span className="text-slate-200 font-mono text-xs truncate max-w-[200px]">
                      {navigator.userAgent.slice(0, 50)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">语言</span>
                    <span className="text-slate-200">{navigator.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">屏幕分辨率</span>
                    <span className="text-slate-200">
                      {window.screen.width} x {window.screen.height}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">设备像素比</span>
                    <span className="text-slate-200">
                      {window.devicePixelRatio.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-cyan-400" />
                  技术指标
                </h3>
                <div className="space-y-3">
                  <ProgressBar
                    label="WebGL 支持"
                    value={100}
                    color="green"
                    statusText="支持"
                  />
                  <ProgressBar
                    label="WebGPU 支持"
                    value={50}
                    color="yellow"
                    statusText="实验性"
                  />
                  <ProgressBar
                    label="实例化渲染"
                    value={100}
                    color="green"
                    statusText="已启用"
                  />
                  <ProgressBar
                    label="硬件加速"
                    value={100}
                    color="green"
                    statusText="已启用"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subValue,
  status,
  color = 'blue',
}: {
  icon: any;
  label: string;
  value: string;
  subValue: string;
  status?: { color: string; text: string; icon: any };
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    green: 'from-green-500/20 to-green-500/5 border-green-500/30',
    yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30',
    red: 'from-red-500/20 to-red-500/5 border-red-500/30',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30',
  };

  const iconColorClasses: Record<string, string> = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
    cyan: 'text-cyan-400',
  };

  const finalColor = status?.color || color;

  return (
    <div
      className={cn(
        'bg-gradient-to-br border rounded-xl p-5 relative overflow-hidden',
        colorClasses[finalColor]
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2 rounded-lg', iconColorClasses[finalColor])}>
          <Icon className="w-6 h-6" />
        </div>
        {status && (
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              status.color === 'green' && 'bg-green-500/20 text-green-400',
              status.color === 'yellow' && 'bg-yellow-500/20 text-yellow-400',
              status.color === 'red' && 'bg-red-500/20 text-red-400'
            )}
          >
            <status.icon className="w-3 h-3" />
            {status.text}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xs text-slate-600 mt-1">{subValue}</div>
    </div>
  );
}

function ConfigRow({
  label,
  value,
  status,
  highLight = false,
}: {
  label: string;
  value: string;
  status?: 'success' | 'warning' | 'error';
  highLight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
      <span className="text-slate-400 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'font-medium text-sm',
            highLight ? 'text-blue-400 font-bold' : 'text-slate-200'
          )}
        >
          {value}
        </span>
        {status && (
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              status === 'success' && 'bg-green-500',
              status === 'warning' && 'bg-yellow-500',
              status === 'error' && 'bg-red-500'
            )}
          />
        )}
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  color,
  statusText,
}: {
  label: string;
  value: number;
  color: string;
  statusText: string;
}) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-slate-400">{label}</span>
        <span className="text-xs text-slate-500">{statusText}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', colorClasses[color])}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
