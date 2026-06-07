export interface HairParams {
  length: number;
  density: number;
  stiffness: number;
  curliness: number;
  color: string;
}

export interface CatBreedPreset {
  id: string;
  name: string;
  description: string;
  hairParams: HairParams;
  imageUrl: string;
}

export type CombType = 'needle' | 'shedding' | 'detangling';

export interface CombConfig {
  type: CombType;
  toothSpacing: number;
  toothLength: number;
  stiffness: number;
}

export interface ForceDataPoint {
  timestamp: number;
  hairId: number;
  position: [number, number, number];
  forceMagnitude: number;
  forceDirection: [number, number, number];
  isShedding: boolean;
  force?: number;
  stressLevel?: number;
}

export interface ExperimentSummary {
  totalForce: number;
  averageForce: number;
  maxForce: number;
  sheddingCount: number;
  knotCount: number;
  staticElectricityEvents: number;
  combPassCount?: number;
  avgForce?: number;
  hairLossCount?: number;
  staticDischargeCount?: number;
}

export interface EnvironmentParams {
  temperature: number;
  humidity: number;
  staticCoefficient: number;
}

export interface ExperimentRecord {
  id: string;
  name: string;
  catBreed: string;
  combType: string;
  timestamp?: number;
  duration?: number;
  durationMs?: number;
  breedPreset?: CatBreedPreset;
  hairParams: HairParams;
  combConfig?: CombConfig;
  environmentParams: EnvironmentParams;
  forceData: ForceDataPoint[];
  summary: ExperimentSummary | null;
  recordedFrames?: SimulationFrame[];
  createdAt: string;
}

export type CombPathType = 'linear' | 'zigzag' | 'circular' | 'random';

export interface StressTestConfig {
  id: string;
  name: string;
  iterations: number;
  hairCount: number;
  combPath: CombPathType;
  speed: number;
  collectPerfData: boolean;
}

export interface StressTestResult {
  id: string;
  configId: string;
  startTime: number;
  endTime: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  avgFrameTime: number;
  gpuMemoryUsage: number[];
  drawCalls: number[];
  completedIterations: number;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  gpuMemory: number;
  drawCalls: number;
  cpuUsage: number;
  memoryUsage: number;
  triangleCount: number;
}

export interface HairState {
  id: number;
  rootPosition: [number, number, number];
  tipPosition: [number, number, number];
  prevTipPosition: [number, number, number];
  velocity: [number, number, number];
  force: [number, number, number];
  isShedding: boolean;
  isSleeping: boolean;
  segments: Array<{
    position: [number, number, number];
    prevPosition: [number, number, number];
  }>;
}

export interface RenderSettings {
  hairCount: number;
  instanceRendering: boolean;
  frustumCulling: boolean;
  lodEnabled: boolean;
  shadowQuality: number;
  antialiasing: boolean;
  bloomEnabled: boolean;
  postProcessing: boolean;
  triangleCount?: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  isReplaying: boolean;
  recordedFrames: SimulationFrame[];
}

export interface SimulationFrame {
  timestamp: number;
  hairStates: Array<{
    id: number;
    tipPosition: [number, number, number];
    forceMagnitude: number;
    isShedding: boolean;
  }>;
  combPosition: [number, number, number];
  performanceMetrics: PerformanceMetrics;
}

export interface HairForces {
  hairId: number;
  forceMagnitude: number;
  forceDirection: [number, number, number];
  position: [number, number, number];
}
