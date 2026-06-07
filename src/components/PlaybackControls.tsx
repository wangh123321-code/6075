import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Save,
  Zap,
  Gauge,
} from 'lucide-react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { cn } from '@/lib/utils';
import { SIMULATION_CONSTANTS } from '@/shared/constants';

export function PlaybackControls() {
  const {
    playbackState,
    togglePlayPause,
    setPlaybackTime,
    setPlaybackSpeed,
    stepFrame,
    startReplay,
    stopReplay,
    clearRecording,
    saveCurrentExperiment,
    updateExperimentSummary,
    isStressTestRunning,
    stressTestProgress,
    setStressTestRunning,
    setStressTestProgress,
    renderSettings,
  } = useSimulationStore();

  const { isPlaying, isPaused, currentTime, duration, playbackSpeed, isReplaying, recordedFrames } =
    playbackState;

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaybackTime(parseFloat(e.target.value));
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaybackSpeed(parseFloat(e.target.value));
  };

  const handleSaveExperiment = async () => {
    const name = prompt('请输入实验名称:', `实验_${new Date().toLocaleString('zh-CN')}`);
    if (name) {
      updateExperimentSummary();
      await saveCurrentExperiment(name);
      alert('实验保存成功!');
    }
  };

  const runStressTest = async () => {
    if (isStressTestRunning) return;

    const confirmed = confirm(
      '即将启动1000次自动梳毛压测，这可能需要几分钟时间。确定要开始吗？'
    );
    if (!confirmed) return;

    setStressTestRunning(true);
    setStressTestProgress(0);

    const iterations = 1000;
    const fpsData: number[] = [];
    const frameTimeData: number[] = [];
    const drawCallsData: number[] = [];

    for (let i = 0; i < iterations; i++) {
      await new Promise((resolve) => setTimeout(resolve, 16));

      const state = useSimulationStore.getState();
      fpsData.push(state.performanceMetrics.fps);
      frameTimeData.push(state.performanceMetrics.frameTime);
      drawCallsData.push(state.performanceMetrics.drawCalls);

      setStressTestProgress(Math.round(((i + 1) / iterations) * 100));

      if (i % 100 === 0) {
        console.log(`压测进度: ${i + 1}/${iterations}`);
      }
    }

    const avgFps = fpsData.reduce((a, b) => a + b, 0) / fpsData.length;
    const minFps = Math.min(...fpsData);
    const maxFps = Math.max(...fpsData);
    const avgFrameTime = frameTimeData.reduce((a, b) => a + b, 0) / frameTimeData.length;

    const report = `
# 压力测试报告

## 测试配置
- 测试时间: ${new Date().toLocaleString('zh-CN')}
- 迭代次数: ${iterations} 次梳毛
- 毛发数量: ${renderSettings.hairCount.toLocaleString()} 根
- GPU实例化: ${renderSettings.instanceRendering ? '开启' : '关闭'}
- 视锥剔除: ${renderSettings.frustumCulling ? '开启' : '关闭'}

## 性能指标

### 帧率统计
- **平均帧率**: ${avgFps.toFixed(1)} FPS
- **最低帧率**: ${minFps.toFixed(1)} FPS
- **最高帧率**: ${maxFps.toFixed(1)} FPS

### 帧时间
- **平均帧时间**: ${avgFrameTime.toFixed(2)} ms

### 渲染性能
- **平均Draw Call**: ${(drawCallsData.reduce((a, b) => a + b, 0) / drawCallsData.length).toFixed(0)}

## 评估结果

${avgFps >= 60 ? '✅ **通过**: 平均帧率达到60FPS目标' : '⚠️ **未达标**: 平均帧率低于60FPS目标'}

---
*报告由毛发物理仿真系统自动生成*
    `.trim();

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stress_test_report_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);

    setStressTestRunning(false);
    alert('压测完成! 报告已下载。');
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-20 bg-slate-900/90 backdrop-blur-xl border-t border-slate-700/50 px-6 py-3 flex items-center gap-6">
      <div className="flex items-center gap-2">
        <button
          onClick={clearRecording}
          className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          title="重置"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={() => stepFrame('backward')}
          disabled={recordedFrames.length < 2}
          className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="上一帧"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            if (isReplaying) {
              stopReplay();
            } else if (recordedFrames.length > 0) {
              startReplay();
            } else {
              togglePlayPause();
            }
          }}
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center transition-all',
            isPlaying || isReplaying
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
          )}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying || isReplaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>

        <button
          onClick={() => stepFrame('forward')}
          disabled={recordedFrames.length < 2}
          className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="下一帧"
        >
          <SkipForward className="w-5 h-5" />
        </button>

        <button
          onClick={handleSaveExperiment}
          disabled={recordedFrames.length === 0}
          className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="保存实验"
        >
          <Save className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-mono w-16 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(duration, 0.01)}
            step={SIMULATION_CONSTANTS.STEP_FRAME_TIME}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs text-slate-500 font-mono w-16">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">速度</span>
          <input
            type="range"
            min={SIMULATION_CONSTANTS.MIN_PLAYBACK_SPEED}
            max={SIMULATION_CONSTANTS.MAX_PLAYBACK_SPEED}
            step={0.1}
            value={playbackSpeed}
            onChange={handleSpeedChange}
            className="w-24 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs text-blue-400 font-mono w-10">
            {playbackSpeed.toFixed(1)}x
          </span>

          <div className="flex-1" />

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Gauge className="w-3.5 h-3.5" />
            <span>已记录 {recordedFrames.length} 帧</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isStressTestRunning && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <span className="text-xs text-yellow-400">
              压测中 {stressTestProgress}%
            </span>
          </div>
        )}

        <button
          onClick={runStressTest}
          disabled={isStressTestRunning}
          className={cn(
            'px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2',
            isStressTestRunning
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
          )}
        >
          <Zap className="w-4 h-4" />
          启动压测 (1000次)
        </button>
      </div>
    </div>
  );
}
