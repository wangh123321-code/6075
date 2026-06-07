import { useEffect, useRef, useCallback } from 'react';
import { HairSimulationEngine, HairForces } from '@/engine/HairSimulationEngine';
import { useSimulationStore } from '@/store/useSimulationStore';

interface SimulationCanvasProps {
  className?: string;
}

export function SimulationCanvas({ className }: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<HairSimulationEngine | null>(null);
  const forceHistoryRef = useRef<Array<{ time: number; avgForce: number; maxForce: number }>>([]);

  const {
    hairParams,
    combConfig,
    environmentParams,
    renderSettings,
    showForceHeatmap,
    setIsCombing,
    setCombPosition,
    addForceData,
    updatePerformanceMetrics,
    recordFrame,
    playbackState,
    isCombing: isStoreCombing,
  } = useSimulationStore();

  const handleForceUpdate = useCallback(
    (forces: HairForces[]) => {
      if (forces.length === 0) return;

      const avgForce =
        forces.reduce((sum, f) => sum + f.forceMagnitude, 0) / forces.length;
      const maxForce = Math.max(...forces.map((f) => f.forceMagnitude));

      const now = performance.now() / 1000;
      forceHistoryRef.current.push({ time: now, avgForce, maxForce });
      if (forceHistoryRef.current.length > 600) {
        forceHistoryRef.current.shift();
      }

      forces.forEach((force) => {
        addForceData({
          timestamp: now,
          hairId: force.hairId,
          position: force.position,
          forceMagnitude: force.forceMagnitude,
          forceDirection: force.forceDirection,
          isShedding: force.isShedding,
        });
      });
    },
    [addForceData]
  );

  const handlePerfUpdate = useCallback(
    (fps: number, frameTime: number, drawCalls: number) => {
      updatePerformanceMetrics({
        fps,
        frameTime,
        drawCalls,
        memoryUsage: (performance as any).memory?.usedJSHeapSize
          ? (performance as any).memory.usedJSHeapSize / 1024 / 1024
          : 0,
      });
    },
    [updatePerformanceMetrics]
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new HairSimulationEngine({
      canvasId: 'simulationCanvas',
      hairCount: renderSettings.hairCount,
      instanceRendering: renderSettings.instanceRendering,
      frustumCulling: renderSettings.frustumCulling,
    });

    engineRef.current = engine;

    engine.setOnForceUpdate(handleForceUpdate);
    engine.setOnPerfUpdate(handlePerfUpdate);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h') {
        useSimulationStore.getState().toggleForceHeatmap();
      }
      if (e.key === ' ') {
        e.preventDefault();
        useSimulationStore.getState().togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      engine.dispose();
    };
  }, []);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setHairParams(hairParams);
  }, [hairParams]);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setCombConfig(combConfig);
  }, [combConfig]);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setEnvironmentParams(environmentParams);
  }, [environmentParams]);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setShowHeatmap(showForceHeatmap);
  }, [showForceHeatmap]);

  useEffect(() => {
    if (!engineRef.current) return;

    if (playbackState.isPlaying && !playbackState.isReplaying) {
      engineRef.current.startRecording();
    } else if (!playbackState.isPlaying && isStoreCombing) {
      const frames = engineRef.current.stopRecording();
      useSimulationStore.getState().updateExperimentSummary();
    }
  }, [playbackState.isPlaying, playbackState.isReplaying, isStoreCombing]);

  return (
    <div className={`relative w-full h-full ${className || ''}`}>
      <canvas
        ref={canvasRef}
        id="simulationCanvas"
        className="w-full h-full block"
        onMouseDown={() => setIsCombing(true)}
        onMouseUp={() => setIsCombing(false)}
        onMouseLeave={() => setIsCombing(false)}
        style={{ touchAction: 'none' }}
      />

      <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm rounded-lg p-3 text-xs text-slate-300 font-mono space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">FPS:</span>
          <span
            className={`font-bold ${
              useSimulationStore.getState().performanceMetrics.fps >= 60
                ? 'text-green-400'
                : useSimulationStore.getState().performanceMetrics.fps >= 30
                ? 'text-yellow-400'
                : 'text-red-400'
            }`}
          >
            {useSimulationStore.getState().performanceMetrics.fps.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">毛发:</span>
          <span className="text-blue-400">
            {renderSettings.hairCount.toLocaleString()} 根
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Draw Call:</span>
          <span className="text-purple-400">
            {useSimulationStore.getState().performanceMetrics.drawCalls}
          </span>
        </div>
      </div>

      <div className="absolute top-4 right-4 flex gap-2">
        <div
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            showForceHeatmap
              ? 'bg-blue-500 text-white'
              : 'bg-slate-800/80 text-slate-400'
          }`}
        >
          热力图 [H]
        </div>
        <div
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            renderSettings.instanceRendering
              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
              : 'bg-slate-800/80 text-slate-400'
          }`}
        >
          GPU实例化
        </div>
        <div
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            renderSettings.frustumCulling
              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
              : 'bg-slate-800/80 text-slate-400'
          }`}
        >
          视锥剔除
        </div>
      </div>

      {playbackState.isReplaying && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500/90 text-white px-6 py-3 rounded-lg font-medium animate-pulse">
          回放中... 按空格暂停
        </div>
      )}

      {!isStoreCombing && !playbackState.isReplaying && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-slate-900/60 backdrop-blur-sm text-slate-400 px-4 py-2 rounded-lg text-sm">
          按住鼠标左键在猫咪模型上拖动进行梳毛
        </div>
      )}
    </div>
  );
}
