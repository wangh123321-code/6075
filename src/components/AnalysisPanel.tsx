import { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  Wind,
  Scissors,
  ChevronDown,
  ChevronUp,
  Download,
  Zap,
} from 'lucide-react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { cn } from '@/lib/utils';
import { exportToCSV, generateExperimentReport } from '@/utils/dataExport';
import type { ExperimentRecord } from '@/shared/types';

interface PanelSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function PanelSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: PanelSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-purple-400">{icon}</span>
          <span className="font-medium text-slate-200">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ label, value, icon, color, trend }: StatCardProps) {
  return (
    <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
      <div className="flex items-start justify-between mb-2">
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            color
          )}
        >
          {icon}
        </div>
        {trend && (
          <div
            className={cn(
              'text-xs px-1.5 py-0.5 rounded',
              trend === 'up'
                ? 'bg-red-500/20 text-red-400'
                : trend === 'down'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-slate-500/20 text-slate-400'
            )}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-100 font-mono">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

export function AnalysisPanel() {
  const {
    forceData,
    experimentSummary,
    showForceHeatmap,
    toggleForceHeatmap,
    performanceMetrics,
    playbackState,
    saveCurrentExperiment,
  } = useSimulationStore();

  const [forceHistory, setForceHistory] = useState<
    Array<{ time: number; avgForce: number; maxForce: number }>
  >([]);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 100) return;
    lastUpdateRef.current = now;

    if (forceData.length > 0) {
      const recentForces = forceData.slice(-100);
      const avgForce =
        recentForces.reduce((sum, f) => sum + f.forceMagnitude, 0) /
        recentForces.length;
      const maxForce = Math.max(...recentForces.map((f) => f.forceMagnitude));

      setForceHistory((prev) => {
        const newPoint = {
          time: Date.now() / 1000,
          avgForce,
          maxForce,
        };
        const updated = [...prev, newPoint];
        if (updated.length > 120) updated.shift();
        return updated;
      });
    }
  }, [forceData]);

  const forceChartOption = {
    backgroundColor: 'transparent',
    grid: { left: 40, right: 10, top: 20, bottom: 30 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(30, 41, 59, 0.9)',
      borderColor: 'rgba(71, 85, 105, 0.5)',
      textStyle: { color: '#e2e8f0' },
      formatter: (params: any) => {
        let result = '';
        params.forEach((p: any) => {
          result += `<div>${p.marker}${p.seriesName}: ${p.value[1].toFixed(4)} N</div>`;
        });
        return result;
      },
    },
    legend: {
      data: ['平均受力', '最大受力'],
      textStyle: { color: '#94a3b8', fontSize: 10 },
      top: 0,
    },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#64748b', fontSize: 9 },
    },
    yAxis: {
      type: 'value',
      name: '受力 (N)',
      nameTextStyle: { color: '#64748b', fontSize: 10 },
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#64748b', fontSize: 9 },
      splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
    },
    series: [
      {
        name: '平均受力',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, color: '#3b82f6' },
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
        data: forceHistory.map((p) => [p.time * 1000, p.avgForce]),
      },
      {
        name: '最大受力',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, color: '#ef4444' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239, 68, 68, 0.2)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0)' },
            ],
          },
        },
        data: forceHistory.map((p) => [p.time * 1000, p.maxForce]),
      },
    ],
  };

  const forceDistributionOption = {
    backgroundColor: 'transparent',
    grid: { left: 40, right: 10, top: 20, bottom: 30 },
    tooltip: {
      backgroundColor: 'rgba(30, 41, 59, 0.9)',
      borderColor: 'rgba(71, 85, 105, 0.5)',
      textStyle: { color: '#e2e8f0' },
    },
    xAxis: {
      type: 'category',
      data: ['0-0.5', '0.5-1.0', '1.0-1.5', '1.5-2.0', '2.0-2.5', '2.5-3.0', '3.0+'],
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#64748b', fontSize: 9, rotate: 45 },
    },
    yAxis: {
      type: 'value',
      name: '次数',
      nameTextStyle: { color: '#64748b', fontSize: 10 },
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#64748b', fontSize: 9 },
      splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
    },
    series: [
      {
        type: 'bar',
        data: [
          {
            value: forceData.filter((f) => f.forceMagnitude < 0.5).length,
            itemStyle: { color: '#22c55e' },
          },
          {
            value: forceData.filter(
              (f) => f.forceMagnitude >= 0.5 && f.forceMagnitude < 1.0
            ).length,
            itemStyle: { color: '#84cc16' },
          },
          {
            value: forceData.filter(
              (f) => f.forceMagnitude >= 1.0 && f.forceMagnitude < 1.5
            ).length,
            itemStyle: { color: '#eab308' },
          },
          {
            value: forceData.filter(
              (f) => f.forceMagnitude >= 1.5 && f.forceMagnitude < 2.0
            ).length,
            itemStyle: { color: '#f59e0b' },
          },
          {
            value: forceData.filter(
              (f) => f.forceMagnitude >= 2.0 && f.forceMagnitude < 2.5
            ).length,
            itemStyle: { color: '#f97316' },
          },
          {
            value: forceData.filter(
              (f) => f.forceMagnitude >= 2.5 && f.forceMagnitude < 3.0
            ).length,
            itemStyle: { color: '#ef4444' },
          },
          {
            value: forceData.filter((f) => f.forceMagnitude >= 3.0).length,
            itemStyle: { color: '#dc2626' },
          },
        ],
        borderRadius: [4, 4, 0, 0],
      },
    ],
  };

  const handleExportCSV = () => {
    exportToCSV(forceData, `experiment_${Date.now()}.csv`);
  };

  const handleExportReport = async () => {
    if (!experimentSummary) return;

    const experiment: ExperimentRecord = {
      id: 'temp',
      name: `实验_${new Date().toLocaleString('zh-CN')}`,
      catBreed: useSimulationStore.getState().selectedBreed?.name || '自定义',
      combType: useSimulationStore.getState().combType,
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
      duration: playbackState.duration * 1000,
      breedPreset: useSimulationStore.getState().selectedBreed!,
      hairParams: useSimulationStore.getState().hairParams,
      combConfig: useSimulationStore.getState().combConfig,
      environmentParams: useSimulationStore.getState().environmentParams,
      forceData,
      summary: experimentSummary,
    };

    const report = generateExperimentReport(experiment);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experiment_report_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-80 h-full bg-slate-900/90 backdrop-blur-xl border-l border-slate-700/50 p-4 overflow-y-auto space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-slate-100">受力分析</h2>
        <div className="flex gap-1">
          <button
            onClick={toggleForceHeatmap}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              showForceHeatmap
                ? 'bg-blue-500 text-white'
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
            )}
          >
            热力图
          </button>
          <button
            onClick={handleExportCSV}
            className="p-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
            title="导出CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="总受力"
          value={experimentSummary?.totalForce.toFixed(2) || '0.00'}
          icon={<Activity className="w-4 h-4 text-blue-400" />}
          color="bg-blue-500/20"
        />
        <StatCard
          label="最大受力"
          value={experimentSummary?.maxForce.toFixed(2) || '0.00'}
          icon={<TrendingUp className="w-4 h-4 text-red-400" />}
          color="bg-red-500/20"
          trend={experimentSummary && experimentSummary.maxForce > 3 ? 'up' : 'neutral'}
        />
        <StatCard
          label="掉毛数量"
          value={experimentSummary?.sheddingCount || 0}
          icon={<Scissors className="w-4 h-4 text-orange-400" />}
          color="bg-orange-500/20"
        />
        <StatCard
          label="静电事件"
          value={experimentSummary?.staticElectricityEvents || 0}
          icon={<Zap className="w-4 h-4 text-yellow-400" />}
          color="bg-yellow-500/20"
        />
      </div>

      <PanelSection title="受力趋势" icon={<Activity className="w-4 h-4" />}>
        <div className="h-48">
          <ReactECharts
            option={forceChartOption}
            style={{ height: '100%', width: '100%' }}
            notMerge
            lazyUpdate
          />
        </div>
      </PanelSection>

      <PanelSection title="受力分布" icon={<TrendingUp className="w-4 h-4" />}>
        <div className="h-48">
          <ReactECharts
            option={forceDistributionOption}
            style={{ height: '100%', width: '100%' }}
            notMerge
            lazyUpdate
          />
        </div>
      </PanelSection>

      <PanelSection
        title="热力图图例"
        icon={<AlertTriangle className="w-4 h-4" />}
        defaultOpen={false}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-xs text-slate-400">0 N - 轻微</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-xs text-slate-400">1.25 N - 正常</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span className="text-xs text-slate-400">2.5 N - 中等</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500" />
            <span className="text-xs text-slate-400">3.75 N - 较强</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-xs text-slate-400">5.0 N - 强烈</span>
          </div>
        </div>
      </PanelSection>

      <PanelSection title="实验警告" icon={<AlertTriangle className="w-4 h-4" />}>
        <div className="space-y-2">
          {experimentSummary?.maxForce && experimentSummary.maxForce > 4 ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-xs text-red-400">
              ⚠️ 最大受力超过4N，可能对猫咪造成不适
            </div>
          ) : null}
          {experimentSummary?.sheddingCount &&
          experimentSummary.sheddingCount > 100 ? (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 text-xs text-orange-400">
              📊 掉毛数量较多，建议评估梳子设计
            </div>
          ) : null}
          {experimentSummary?.staticElectricityEvents &&
          experimentSummary.staticElectricityEvents > 10 ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 text-xs text-yellow-400">
              ⚡ 静电现象明显，建议增加环境湿度
            </div>
          ) : null}
          {experimentSummary &&
          experimentSummary.maxForce <= 4 &&
          experimentSummary.sheddingCount <= 100 &&
          experimentSummary.staticElectricityEvents <= 10 ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-xs text-green-400">
              ✅ 各项指标正常，梳子设计表现良好
            </div>
          ) : null}
        </div>
      </PanelSection>

      <button
        onClick={handleExportReport}
        disabled={!experimentSummary}
        className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
      >
        <Download className="w-4 h-4" />
        导出完整报告
      </button>
    </div>
  );
}
