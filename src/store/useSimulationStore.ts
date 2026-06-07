import { create } from 'zustand';
import type {
  HairParams,
  CatBreedPreset,
  CombConfig,
  CombType,
  EnvironmentParams,
  ForceDataPoint,
  ExperimentSummary,
  ExperimentRecord,
  RenderSettings,
  PerformanceMetrics,
  PlaybackState,
  SimulationFrame,
  CustomCombParams,
  CombPreset,
} from '@/shared/types';
import {
  DEFAULT_HAIR_PARAMS,
  DEFAULT_ENVIRONMENT,
  DEFAULT_RENDER_SETTINGS,
  COMB_CONFIGS,
  CAT_BREED_PRESETS,
  SIMULATION_CONSTANTS,
  PHYSICS_CONSTANTS,
  DEFAULT_CUSTOM_COMB_PARAMS,
} from '@/shared/constants';

interface SimulationState {
  hairParams: HairParams;
  setHairParams: (params: Partial<HairParams>) => void;
  resetHairParams: () => void;

  selectedBreed: CatBreedPreset | null;
  setSelectedBreed: (breed: CatBreedPreset | null) => void;
  loadBreedPreset: (breedId: string) => void;

  combType: CombType;
  combConfig: CombConfig;
  setCombType: (type: CombType) => void;

  customCombParams: CustomCombParams;
  setCustomCombParams: (params: Partial<CustomCombParams>) => void;
  resetCustomCombParams: () => void;

  combPresets: CombPreset[];
  saveCombPreset: (name: string, description: string) => Promise<boolean>;
  loadCombPreset: (presetId: string) => void;
  deleteCombPreset: (presetId: string) => void;
  loadCombPresets: () => void;
  generateCombThumbnail: () => Promise<string>;

  environmentParams: EnvironmentParams;
  setEnvironmentParams: (params: Partial<EnvironmentParams>) => void;

  renderSettings: RenderSettings;
  setRenderSettings: (settings: Partial<RenderSettings>) => void;

  showForceHeatmap: boolean;
  toggleForceHeatmap: () => void;

  analysisPanelOpen: boolean;
  setAnalysisPanelOpen: (open: boolean) => void;

  isCombing: boolean;
  setIsCombing: (combing: boolean) => void;

  combPosition: [number, number, number];
  setCombPosition: (position: [number, number, number]) => void;

  forceData: ForceDataPoint[];
  addForceData: (data: ForceDataPoint) => void;
  clearForceData: () => void;

  experimentSummary: ExperimentSummary | null;
  updateExperimentSummary: () => void;

  performanceMetrics: PerformanceMetrics;
  updatePerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void;

  playbackState: PlaybackState;
  startRecording: () => void;
  stopRecording: () => void;
  recordFrame: (frame: SimulationFrame) => void;
  clearRecording: () => void;
  setPlaybackTime: (time: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  togglePlayPause: () => void;
  stepFrame: (direction: 'forward' | 'backward') => void;
  startReplay: () => void;
  stopReplay: () => void;

  experiments: ExperimentRecord[];
  loadExperiments: () => Promise<void>;
  deleteExperiment: (id: string) => Promise<boolean>;
  exportExperiment: (id: string, format: 'json' | 'csv' | 'report') => Promise<boolean>;

  currentExperiment: ExperimentRecord | null;
  saveCurrentExperiment: (name: string) => Promise<boolean>;
  loadExperiment: (id: string) => Promise<boolean>;

  isStressTestRunning: boolean;
  stressTestProgress: number;
  setStressTestRunning: (running: boolean) => void;
  setStressTestProgress: (progress: number) => void;

  resetAll: () => void;
  resetAllSettings: () => void;
  clearAllData: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  hairParams: { ...DEFAULT_HAIR_PARAMS },
  setHairParams: (params) =>
    set((state) => ({
      hairParams: { ...state.hairParams, ...params },
    })),
  resetHairParams: () => set({ hairParams: { ...DEFAULT_HAIR_PARAMS } }),

  selectedBreed: null,
  setSelectedBreed: (breed) => set({ selectedBreed: breed }),
  loadBreedPreset: (breedId) => {
    const breed = CAT_BREED_PRESETS.find((b) => b.id === breedId);
    if (breed) {
      set({
        selectedBreed: breed,
        hairParams: { ...breed.hairParams },
      });
    }
  },

  combType: 'needle',
  combConfig: { ...COMB_CONFIGS.needle },
  setCombType: (type) =>
    set((state) => {
      if (type === 'custom') {
        return {
          combType: type,
          combConfig: {
            type: 'custom',
            toothSpacing: state.customCombParams.toothSpacing,
            toothLength: state.customCombParams.toothLength,
            stiffness: state.customCombParams.stiffness,
            customParams: { ...state.customCombParams },
          },
        };
      }
      return {
        combType: type,
        combConfig: { ...COMB_CONFIGS[type] },
      };
    }),

  customCombParams: { ...DEFAULT_CUSTOM_COMB_PARAMS },
  setCustomCombParams: (params) =>
    set((state) => {
      const newParams = { ...state.customCombParams, ...params };
      const newCombConfig =
        state.combType === 'custom'
          ? {
              type: 'custom' as const,
              toothSpacing: newParams.toothSpacing,
              toothLength: newParams.toothLength,
              stiffness: newParams.stiffness,
              customParams: newParams,
            }
          : state.combConfig;
      return {
        customCombParams: newParams,
        combConfig: newCombConfig,
      };
    }),
  resetCustomCombParams: () =>
    set((state) => {
      const newParams = { ...DEFAULT_CUSTOM_COMB_PARAMS };
      const newCombConfig =
        state.combType === 'custom'
          ? {
              type: 'custom' as const,
              toothSpacing: newParams.toothSpacing,
              toothLength: newParams.toothLength,
              stiffness: newParams.stiffness,
              customParams: newParams,
            }
          : state.combConfig;
      return {
        customCombParams: newParams,
        combConfig: newCombConfig,
      };
    }),

  combPresets: [],
  loadCombPresets: () => {
    try {
      const stored = localStorage.getItem('combPresets');
      if (stored) {
        const presets = JSON.parse(stored);
        set({ combPresets: presets });
      }
    } catch (error) {
      console.error('Failed to load comb presets:', error);
    }
  },
  saveCombPreset: async (name, description) => {
    try {
      const state = get();
      const thumbnail = await state.generateCombThumbnail();
      const newPreset: CombPreset = {
        id: `preset_${Date.now()}`,
        name,
        description,
        params: { ...state.customCombParams },
        thumbnail,
        createdAt: Date.now(),
      };

      const newPresets = [...state.combPresets, newPreset];
      localStorage.setItem('combPresets', JSON.stringify(newPresets));
      set({ combPresets: newPresets });
      return true;
    } catch (error) {
      console.error('Failed to save comb preset:', error);
      return false;
    }
  },
  loadCombPreset: (presetId) => {
    set((state) => {
      const preset = state.combPresets.find((p) => p.id === presetId);
      if (!preset) return state;

      return {
        customCombParams: { ...preset.params },
        combType: 'custom',
        combConfig: {
          type: 'custom',
          toothSpacing: preset.params.toothSpacing,
          toothLength: preset.params.toothLength,
          stiffness: preset.params.stiffness,
          customParams: { ...preset.params },
        },
      };
    });
  },
  deleteCombPreset: (presetId) => {
    set((state) => {
      const newPresets = state.combPresets.filter((p) => p.id !== presetId);
      localStorage.setItem('combPresets', JSON.stringify(newPresets));
      return { combPresets: newPresets };
    });
  },

  generateCombThumbnail: async (): Promise<string> => {
    const state = get();
    const params = state.customCombParams;
    const paramsStr = JSON.stringify(params);
    const hash = btoa(paramsStr).slice(0, 20);

    const shapeMap: Record<string, string> = {
      round: 'rounded',
      pointed: 'pointed',
      spherical: 'ball',
    };
    const materialMap: Record<string, string> = {
      plastic: 'plastic',
      metal: 'metallic',
      wood: 'wooden',
      silicone: 'silicone',
    };

    const prompt = `A ${materialMap[params.materialType]} hair comb with ${params.toothCount} teeth, ${shapeMap[params.toothTipShape]} tips, professional product photography, white background, studio lighting, 3D render`;

    return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square_hd&t=${hash}`;
  },

  environmentParams: { ...DEFAULT_ENVIRONMENT },
  setEnvironmentParams: (params) =>
    set((state) => ({
      environmentParams: { ...state.environmentParams, ...params },
    })),

  renderSettings: { ...DEFAULT_RENDER_SETTINGS },
  setRenderSettings: (settings) =>
    set((state) => ({
      renderSettings: { ...state.renderSettings, ...settings },
    })),

  showForceHeatmap: false,
  toggleForceHeatmap: () =>
    set((state) => ({ showForceHeatmap: !state.showForceHeatmap })),

  analysisPanelOpen: true,
  setAnalysisPanelOpen: (open) => set({ analysisPanelOpen: open }),

  isCombing: false,
  setIsCombing: (combing) => set({ isCombing: combing }),

  combPosition: [0, 0, 0],
  setCombPosition: (position) => set({ combPosition: position }),

  forceData: [],
  addForceData: (data) =>
    set((state) => ({
      forceData: [...state.forceData, data],
    })),
  clearForceData: () => set({ forceData: [], experimentSummary: null }),

  experimentSummary: null,
  updateExperimentSummary: () => {
    const { forceData } = get();
    if (forceData.length === 0) {
      set({ experimentSummary: null });
      return;
    }

    const totalForce = forceData.reduce((sum, d) => sum + d.forceMagnitude, 0);
    const maxForce = Math.max(...forceData.map((d) => d.forceMagnitude));
    const sheddingCount = forceData.filter((d) => d.isShedding).length;
    const knotCount = forceData.filter(
      (d) => d.forceMagnitude > PHYSICS_CONSTANTS.KNOT_THRESHOLD
    ).length;
    const staticEvents = Math.floor(
      forceData.filter(
        (d) => d.forceMagnitude > PHYSICS_CONSTANTS.KNOT_THRESHOLD * 0.8
      ).length * 0.1
    );

    set({
      experimentSummary: {
        totalForce,
        averageForce: totalForce / forceData.length,
        maxForce,
        sheddingCount,
        knotCount,
        staticElectricityEvents: staticEvents,
      },
    });
  },

  performanceMetrics: {
    fps: 60,
    frameTime: 16.67,
    gpuMemory: 0,
    drawCalls: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    triangleCount: 0,
  },
  updatePerformanceMetrics: (metrics) =>
    set((state) => ({
      performanceMetrics: { ...state.performanceMetrics, ...metrics },
    })),

  playbackState: {
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: 0,
    playbackSpeed: SIMULATION_CONSTANTS.DEFAULT_PLAYBACK_SPEED,
    isReplaying: false,
    recordedFrames: [],
  },
  startRecording: () =>
    set((state) => ({
      playbackState: {
        ...state.playbackState,
        isPlaying: true,
        isPaused: false,
        isReplaying: false,
        recordedFrames: [],
        currentTime: 0,
        duration: 0,
      },
      forceData: [],
      experimentSummary: null,
    })),
  stopRecording: () =>
    set((state) => ({
      playbackState: {
        ...state.playbackState,
        isPlaying: false,
        isPaused: true,
        duration: state.playbackState.currentTime,
      },
    })),
  recordFrame: (frame) =>
    set((state) => {
      const frames = [...state.playbackState.recordedFrames, frame];
      if (frames.length > SIMULATION_CONSTANTS.MAX_RECORDED_FRAMES) {
        frames.shift();
      }
      return {
        playbackState: {
          ...state.playbackState,
          recordedFrames: frames,
          currentTime: frame.timestamp,
          duration: Math.max(state.playbackState.duration, frame.timestamp),
        },
      };
    }),
  clearRecording: () =>
    set((state) => ({
      playbackState: {
        ...state.playbackState,
        recordedFrames: [],
        currentTime: 0,
        duration: 0,
        isReplaying: false,
        isPlaying: false,
        isPaused: false,
      },
      forceData: [],
      experimentSummary: null,
    })),
  setPlaybackTime: (time) =>
    set((state) => ({
      playbackState: {
        ...state.playbackState,
        currentTime: Math.max(0, Math.min(time, state.playbackState.duration)),
      },
    })),
  setPlaybackSpeed: (speed) =>
    set((state) => ({
      playbackState: {
        ...state.playbackState,
        playbackSpeed: Math.max(
          SIMULATION_CONSTANTS.MIN_PLAYBACK_SPEED,
          Math.min(SIMULATION_CONSTANTS.MAX_PLAYBACK_SPEED, speed)
        ),
      },
    })),
  togglePlayPause: () =>
    set((state) => ({
      playbackState: {
        ...state.playbackState,
        isPlaying: !state.playbackState.isPlaying,
        isPaused: !state.playbackState.isPaused,
      },
    })),
  stepFrame: (direction) => {
    const { playbackState } = get();
    const frames = playbackState.recordedFrames;
    if (frames.length < 2) return;

    const currentIdx = frames.findIndex(
      (f) => f.timestamp >= playbackState.currentTime
    );
    const step = direction === 'forward' ? 1 : -1;
    const newIdx = Math.max(
      0,
      Math.min(frames.length - 1, currentIdx + step)
    );
    set((state) => ({
      playbackState: {
        ...state.playbackState,
        currentTime: frames[newIdx].timestamp,
        isPlaying: false,
        isPaused: true,
      },
    }));
  },
  startReplay: () =>
    set((state) => ({
      playbackState: {
        ...state.playbackState,
        isReplaying: true,
        isPlaying: true,
        isPaused: false,
        currentTime: 0,
      },
    })),
  stopReplay: () =>
    set((state) => ({
      playbackState: {
        ...state.playbackState,
        isReplaying: false,
        isPlaying: false,
        isPaused: true,
      },
    })),

  currentExperiment: null,
  saveCurrentExperiment: async (name) => {
    const state = get();
    try {
      const forceDataPoints = state.forceData.map((fd) => ({
        timestamp: fd.timestamp,
        position: fd.position,
        force: fd.forceMagnitude,
        hairId: fd.hairId,
        stressLevel: fd.forceMagnitude / 5,
      }));

      const response = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          catBreed: state.selectedBreed?.name || '自定义',
          combType: state.combType,
          hairParams: state.hairParams,
          environmentParams: state.environmentParams,
          forceData: forceDataPoints,
          summary: state.experimentSummary
            ? {
                combPassCount: state.experimentSummary.knotCount,
                avgForce: state.experimentSummary.averageForce,
                maxForce: state.experimentSummary.maxForce,
                hairLossCount: state.experimentSummary.sheddingCount,
                staticDischargeCount: state.experimentSummary.staticElectricityEvents,
                knotCount: state.experimentSummary.knotCount,
              }
            : null,
          recordedFrames: state.playbackState.recordedFrames,
        }),
      });
      const result = await response.json();
      return !!result.id;
    } catch {
      return false;
    }
  },
  loadExperiment: async (id) => {
    try {
      const response = await fetch(`/api/experiments/${id}`);
      const experiment = await response.json();
      set({
        currentExperiment: experiment,
        hairParams: experiment.hairParams,
        combConfig: experiment.combConfig,
        environmentParams: experiment.environmentParams,
        forceData: experiment.forceData,
        experimentSummary: experiment.summary,
      });
      return true;
    } catch {
      return false;
    }
  },

  isStressTestRunning: false,
  stressTestProgress: 0,
  setStressTestRunning: (running) => set({ isStressTestRunning: running }),
  setStressTestProgress: (progress) => set({ stressTestProgress: progress }),

  experiments: [],
  loadExperiments: async () => {
    try {
      const response = await fetch('/api/experiments');
      const data = await response.json();
      set({ experiments: data });
    } catch (error) {
      console.error('Failed to load experiments:', error);
    }
  },
  deleteExperiment: async (id) => {
    try {
      await fetch(`/api/experiments/${id}`, { method: 'DELETE' });
      set((state) => ({
        experiments: state.experiments.filter((e) => e.id !== id),
      }));
      return true;
    } catch {
      return false;
    }
  },
  exportExperiment: async (id, format) => {
    try {
      const response = await fetch(`/api/experiments/${id}`);
      const experiment = await response.json();

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(experiment, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `experiment_${id}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        const headers = 'timestamp,force,hairId,stressLevel,posX,posY,posZ\n';
        const rows = experiment.forceData
          .map(
            (fd: ForceDataPoint) =>
              `${fd.timestamp},${fd.force},${fd.hairId},${fd.stressLevel},${fd.position[0]},${fd.position[1]},${fd.position[2]}`
          )
          .join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `experiment_${id}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'report') {
        const report = `
# 实验报告

## 实验信息
- **名称**: ${experiment.name}
- **猫咪品种**: ${experiment.catBreed}
- **梳子类型**: ${experiment.combType}
- **创建时间**: ${new Date(experiment.createdAt).toLocaleString('zh-CN')}

## 毛发参数
- 长度: ${experiment.hairParams.length.toFixed(0)}mm
- 密度: ${experiment.hairParams.density.toFixed(0)}%
- 硬度: ${experiment.hairParams.stiffness.toFixed(0)}%
- 卷曲度: ${experiment.hairParams.curliness.toFixed(0)}%

## 环境参数
- 温度: ${experiment.environmentParams.temperature}°C
- 湿度: ${experiment.environmentParams.humidity}%
- 静电系数: ${experiment.environmentParams.staticCoefficient}

## 实验结果

### 统计摘要
${
  experiment.summary
    ? `
- 梳毛次数: ${experiment.summary.combPassCount || 0} 次
- 平均受力: ${(experiment.summary.avgForce || 0).toFixed(2)} N
- 最大受力: ${(experiment.summary.maxForce || 0).toFixed(2)} N
- 掉毛数量: ${experiment.summary.hairLossCount || 0} 根
- 静电次数: ${experiment.summary.staticDischargeCount || 0} 次
- 打结数量: ${experiment.summary.knotCount || 0} 个
`
    : '暂无统计数据'
}

### 受力数据点数
${experiment.forceData.length} 个数据点

---
*报告由毛发物理仿真系统自动生成*
        `.trim();

        const blob = new Blob([report], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `experiment_report_${id}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }
      return true;
    } catch {
      return false;
    }
  },

  resetAllSettings: () => {
    set({
      renderSettings: { ...DEFAULT_RENDER_SETTINGS },
    });
  },
  clearAllData: () => {
    set({
      experiments: [],
      forceData: [],
      experimentSummary: null,
      playbackState: {
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
        duration: 0,
        playbackSpeed: SIMULATION_CONSTANTS.DEFAULT_PLAYBACK_SPEED,
        isReplaying: false,
        recordedFrames: [],
      },
    });
  },

  resetAll: () =>
    set({
      hairParams: { ...DEFAULT_HAIR_PARAMS },
      selectedBreed: null,
      combType: 'needle',
      combConfig: { ...COMB_CONFIGS.needle },
      environmentParams: { ...DEFAULT_ENVIRONMENT },
      showForceHeatmap: false,
      isCombing: false,
      forceData: [],
      experimentSummary: null,
      playbackState: {
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
        duration: 0,
        playbackSpeed: SIMULATION_CONSTANTS.DEFAULT_PLAYBACK_SPEED,
        isReplaying: false,
        recordedFrames: [],
      },
    }),
}));
