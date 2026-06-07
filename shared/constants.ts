import type { CatBreedPreset, CombConfig, CombType, EnvironmentParams, HairParams, RenderSettings } from './types';

export const DEFAULT_HAIR_PARAMS: HairParams = {
  length: 0.5,
  density: 0.7,
  stiffness: 0.5,
  curliness: 0.3,
  color: '#8B4513',
};

export const CAT_BREED_PRESETS: CatBreedPreset[] = [
  {
    id: 'persian',
    name: '波斯猫',
    description: '长毛、浓密、柔软，需要频繁梳理',
    hairParams: {
      length: 0.9,
      density: 0.9,
      stiffness: 0.2,
      curliness: 0.1,
      color: '#FFFFFF',
    },
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20persian%20cat%20with%20long%20fluffy%20white%20fur%2C%20portrait%2C%20professional%20photography&image_size=square',
  },
  {
    id: 'british-shorthair',
    name: '英国短毛猫',
    description: '短毛、浓密、质地较硬',
    hairParams: {
      length: 0.25,
      density: 0.8,
      stiffness: 0.7,
      curliness: 0.05,
      color: '#6B7280',
    },
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20british%20shorthair%20cat%20with%20gray%20fur%20and%20round%20face%2C%20portrait%2C%20professional%20photography&image_size=square',
  },
  {
    id: 'maine-coon',
    name: '缅因猫',
    description: '长毛、厚实、略带卷曲',
    hairParams: {
      length: 0.85,
      density: 0.85,
      stiffness: 0.5,
      curliness: 0.2,
      color: '#D2691E',
    },
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=majestic%20maine%20coon%20cat%20with%20long%20brown%20fur%2C%20large%20size%2C%20portrait%2C%20professional%20photography&image_size=square',
  },
  {
    id: 'sphynx',
    name: '无毛猫',
    description: '几乎无毛，只有细小绒毛',
    hairParams: {
      length: 0.05,
      density: 0.1,
      stiffness: 0.8,
      curliness: 0.5,
      color: '#F5DEB3',
    },
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sphynx%20hairless%20cat%20with%20wrinkled%20skin%2C%20portrait%2C%20professional%20photography&image_size=square',
  },
  {
    id: 'ragdoll',
    name: '布偶猫',
    description: '中长毛、柔软、顺滑',
    hairParams: {
      length: 0.7,
      density: 0.75,
      stiffness: 0.3,
      curliness: 0.05,
      color: '#DEB887',
    },
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20ragdoll%20cat%20with%20blue%20eyes%20and%20cream%20colored%20fur%2C%20portrait%2C%20professional%20photography&image_size=square',
  },
  {
    id: 'devon-rex',
    name: '德文卷毛',
    description: '短卷毛、蓬松、弹性好',
    hairParams: {
      length: 0.2,
      density: 0.6,
      stiffness: 0.4,
      curliness: 0.8,
      color: '#2F4F4F',
    },
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=devon%20rex%20cat%20with%20curly%20short%20fur%20and%20big%20ears%2C%20portrait%2C%20professional%20photography&image_size=square',
  },
];

export const COMB_CONFIGS: Record<CombType, CombConfig> = {
  needle: {
    type: 'needle',
    toothSpacing: 2.5,
    toothLength: 15,
    stiffness: 0.8,
  },
  shedding: {
    type: 'shedding',
    toothSpacing: 1.0,
    toothLength: 10,
    stiffness: 0.6,
  },
  detangling: {
    type: 'detangling',
    toothSpacing: 5.0,
    toothLength: 20,
    stiffness: 0.9,
  },
};

export const COMB_NAMES: Record<CombType, string> = {
  needle: '针梳',
  shedding: '脱毛梳',
  detangling: '排梳',
};

export const DEFAULT_ENVIRONMENT: EnvironmentParams = {
  temperature: 22,
  humidity: 50,
  staticCoefficient: 0.3,
};

export const DEFAULT_RENDER_SETTINGS: RenderSettings = {
  hairCount: 100000,
  instanceRendering: true,
  frustumCulling: true,
  lodEnabled: true,
  shadowQuality: 2,
  antialiasing: true,
  bloomEnabled: true,
  postProcessing: true,
};

export const FORCE_COLOR_GRADIENT = [
  { value: 0, color: [30, 144, 255] },
  { value: 0.25, color: [50, 205, 50] },
  { value: 0.5, color: [255, 215, 0] },
  { value: 0.75, color: [255, 140, 0] },
  { value: 1, color: [255, 69, 0] },
];

export const PHYSICS_CONSTANTS = {
  GRAVITY: 9.81,
  AIR_RESISTANCE: 0.02,
  DAMPING: 0.95,
  CONSTRAINT_ITERATIONS: 4,
  BEND_CONSTRAINT_ITERATIONS: 3,
  HAIR_SEGMENTS: 8,
  COLLISION_RADIUS: 0.005,
  STATIC_THRESHOLD: 0.001,
  MAX_FORCE: 5.0,
  SHEDDING_THRESHOLD: 3.5,
  KNOT_THRESHOLD: 2.0,
};

export const SIMULATION_CONSTANTS = {
  MAX_RECORDED_FRAMES: 3600,
  DEFAULT_PLAYBACK_SPEED: 1.0,
  MIN_PLAYBACK_SPEED: 0.1,
  MAX_PLAYBACK_SPEED: 2.0,
  STEP_FRAME_TIME: 0.01,
};

export const STRESS_TEST_CONSTANTS = {
  DEFAULT_ITERATIONS: 1000,
  DEFAULT_HAIR_COUNT: 100000,
  PATH_TYPES: ['linear', 'zigzag', 'circular', 'random'],
  DEFAULT_SPEED: 1.0,
};
