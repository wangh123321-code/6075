import { useState, useEffect } from 'react';
import {
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Clock,
  Scissors,
  Trash2,
  Search,
} from 'lucide-react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { cn } from '@/lib/utils';
import type { ExperimentRecord } from '@/shared/types';

export function DataExport() {
  const { experiments, loadExperiments, deleteExperiment, exportExperiment } =
    useSimulationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await loadExperiments();
      setIsLoading(false);
    };
    init();
  }, [loadExperiments]);

  const filteredExperiments = experiments.filter(
    (exp) =>
      exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.catBreed.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExport = async (
    experiment: ExperimentRecord,
    format: 'json' | 'csv' | 'report'
  ) => {
    await exportExperiment(experiment.id, format);
  };

  const handleDelete = async (experiment: ExperimentRecord) => {
    if (confirm(`确定要删除实验「${experiment.name}」吗？`)) {
      await deleteExperiment(experiment.id);
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-slate-950">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">数据导出</h1>
          <p className="text-slate-400">管理和导出历史仿真实验数据</p>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="搜索实验名称或猫咪品种..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg">
            <span className="text-slate-400 text-sm">共</span>
            <span className="text-blue-400 font-bold text-lg">
              {filteredExperiments.length}
            </span>
            <span className="text-slate-400 text-sm">条记录</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredExperiments.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">
              暂无实验数据
            </h3>
            <p className="text-slate-500">
              完成仿真实验后，数据将自动保存在这里
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExperiments.map((experiment) => (
              <div
                key={experiment.id}
                className="bg-slate-900 border border-slate-700/50 rounded-xl p-6 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {experiment.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(experiment.createdAt)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Scissors className="w-3.5 h-3.5" />
                        {experiment.combType}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExport(experiment, 'json')}
                      className="p-2 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-lg transition-colors"
                      title="导出JSON"
                    >
                      <FileJson className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleExport(experiment, 'csv')}
                      className="p-2 hover:bg-green-500/20 text-slate-400 hover:text-green-400 rounded-lg transition-colors"
                      title="导出CSV"
                    >
                      <FileSpreadsheet className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleExport(experiment, 'report')}
                      className="p-2 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 rounded-lg transition-colors"
                      title="生成报告"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-slate-700 mx-1" />
                    <button
                      onClick={() => handleDelete(experiment)}
                      className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-4 mb-4">
                  <StatCard
                    label="猫咪品种"
                    value={experiment.catBreed}
                    color="blue"
                  />
                  <StatCard
                    label="梳毛次数"
                    value={experiment.summary?.combPassCount?.toString() || '0'}
                    color="green"
                  />
                  <StatCard
                    label="平均受力"
                    value={
                      experiment.summary?.avgForce
                        ? `${experiment.summary.avgForce.toFixed(1)} N`
                        : '-'
                    }
                    color="yellow"
                  />
                  <StatCard
                    label="最大受力"
                    value={
                      experiment.summary?.maxForce
                        ? `${experiment.summary.maxForce.toFixed(1)} N`
                        : '-'
                    }
                    color="red"
                  />
                  <StatCard
                    label="掉毛数量"
                    value={
                      experiment.summary?.hairLossCount?.toString() || '0'
                    }
                    color="purple"
                  />
                  <StatCard
                    label="静电次数"
                    value={
                      experiment.summary?.staticDischargeCount?.toString() ||
                      '0'
                    }
                    color="cyan"
                  />
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="px-2 py-1 bg-slate-800 rounded">
                    毛发长度: {experiment.hairParams.length.toFixed(0)}mm
                  </span>
                  <span className="px-2 py-1 bg-slate-800 rounded">
                    密度: {experiment.hairParams.density.toFixed(0)}%
                  </span>
                  <span className="px-2 py-1 bg-slate-800 rounded">
                    硬度: {experiment.hairParams.stiffness.toFixed(0)}%
                  </span>
                  <span className="px-2 py-1 bg-slate-800 rounded">
                    卷曲度: {experiment.hairParams.curliness.toFixed(0)}%
                  </span>
                  <span className="px-2 py-1 bg-slate-800 rounded">
                    温度: {experiment.environmentParams.temperature}°C
                  </span>
                  <span className="px-2 py-1 bg-slate-800 rounded">
                    湿度: {experiment.environmentParams.humidity}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'cyan';
}) {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
    cyan: 'text-cyan-400',
  };

  return (
    <div className="bg-slate-800/50 rounded-lg px-3 py-2">
      <div className="text-xs text-slate-500 mb-0.5">{label}</div>
      <div className={cn('font-semibold text-sm', colorClasses[color])}>
        {value}
      </div>
    </div>
  );
}
