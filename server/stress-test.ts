import { PHYSICS_CONSTANTS } from '../shared/constants';

export interface StressTestResult {
  iterations: number;
  hairCount: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  avgFrameTime: number;
  frameTimeData: number[];
  fpsData: number[];
  passed: boolean;
  timestamp: string;
  totalHairUpdates: number;
  totalCollisionChecks: number;
}

interface HairState {
  id: number;
  root: [number, number, number];
  tip: [number, number, number];
  prevTip: [number, number, number];
  velocity: [number, number, number];
}

function vec3Sub(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function vec3Add(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function vec3Scale(a: [number, number, number], s: number): [number, number, number] {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function vec3Length(a: [number, number, number]): number {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
}

function vec3Normalize(a: [number, number, number]): [number, number, number] {
  const len = vec3Length(a);
  if (len < 0.0001) return [0, 1, 0];
  return [a[0] / len, a[1] / len, a[2] / len];
}

function vec3Distance(a: [number, number, number], b: [number, number, number]): number {
  return vec3Length(vec3Sub(a, b));
}

function generateHairStates(count: number): HairState[] {
  const hairs: HairState[] = [];
  const catCenter: [number, number, number] = [0, 0.4, 0];
  const catRadius = 0.4;

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    const x = catRadius * Math.sin(phi) * Math.cos(theta);
    const y = catRadius * Math.sin(phi) * Math.sin(theta) + catCenter[1];
    const z = catRadius * Math.cos(phi);

    const root: [number, number, number] = [x, y, z];
    const normal = vec3Normalize(vec3Sub(root, catCenter));
    const hairLength = 0.05 + Math.random() * 0.08;

    const tip: [number, number, number] = [
      root[0] + normal[0] * hairLength,
      root[1] + normal[1] * hairLength,
      root[2] + normal[2] * hairLength,
    ];

    hairs.push({
      id: i,
      root,
      tip,
      prevTip: [...tip],
      velocity: [0, 0, 0],
    });
  }

  return hairs;
}

class SpatialHash {
  private cellSize: number;
  private table: Map<string, number[]>;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.table = new Map();
  }

  clear(): void {
    this.table.clear();
  }

  private getKey(pos: [number, number, number]): string {
    const cx = Math.floor(pos[0] / this.cellSize);
    const cy = Math.floor(pos[1] / this.cellSize);
    const cz = Math.floor(pos[2] / this.cellSize);
    return `${cx},${cy},${cz}`;
  }

  insert(hairId: number, pos: [number, number, number]): void {
    const key = this.getKey(pos);
    if (!this.table.has(key)) {
      this.table.set(key, []);
    }
    this.table.get(key)!.push(hairId);
  }

  query(pos: [number, number, number], radius: number): number[] {
    const result: number[] = [];
    const cs = this.cellSize;
    const minCell: [number, number, number] = [
      Math.floor((pos[0] - radius) / cs),
      Math.floor((pos[1] - radius) / cs),
      Math.floor((pos[2] - radius) / cs),
    ];
    const maxCell: [number, number, number] = [
      Math.floor((pos[0] + radius) / cs),
      Math.floor((pos[1] + radius) / cs),
      Math.floor((pos[2] + radius) / cs),
    ];

    for (let cx = minCell[0]; cx <= maxCell[0]; cx++) {
      for (let cy = minCell[1]; cy <= maxCell[1]; cy++) {
        for (let cz = minCell[2]; cz <= maxCell[2]; cz++) {
          const key = `${cx},${cy},${cz}`;
          const bucket = this.table.get(key);
          if (bucket) {
            result.push(...bucket);
          }
        }
      }
    }

    return result;
  }
}

function updateHairPhysics(hairs: HairState[], dt: number, spatialHash: SpatialHash): number {
  const gravity: [number, number, number] = [0, -PHYSICS_CONSTANTS.GRAVITY * dt * dt, 0];
  const damping = PHYSICS_CONSTANTS.DAMPING;
  let collisionChecks = 0;

  spatialHash.clear();
  for (let i = 0; i < hairs.length; i++) {
    spatialHash.insert(i, hairs[i].tip);
  }

  for (let i = 0; i < hairs.length; i++) {
    const hair = hairs[i];

    const temp = [...hair.tip];

    const vel = vec3Sub(hair.tip, hair.prevTip);
    const dampedVel = vec3Scale(vel, damping);

    hair.tip = vec3Add(hair.tip, vec3Add(dampedVel, gravity));
    hair.prevTip = temp;

    const restLength = 0.05 + (i % 100) * 0.001;
    const dir = vec3Sub(hair.tip, hair.root);
    const len = vec3Length(dir);

    if (len > 0) {
      const diff = (len - restLength) / len;
      const correction = vec3Scale(dir, diff * 0.5);
      hair.tip = vec3Sub(hair.tip, correction);
    }

    const nearby = spatialHash.query(hair.tip, PHYSICS_CONSTANTS.COLLISION_RADIUS * 2);
    for (const j of nearby) {
      if (j <= i) continue;
      collisionChecks++;
      const other = hairs[j];
      const dist = vec3Distance(hair.tip, other.tip);
      if (dist < PHYSICS_CONSTANTS.COLLISION_RADIUS * 2 && dist > 0) {
        const pushDir = vec3Normalize(vec3Sub(hair.tip, other.tip));
        const pushAmount = (PHYSICS_CONSTANTS.COLLISION_RADIUS * 2 - dist) * 0.5;
        hair.tip = vec3Add(hair.tip, vec3Scale(pushDir, pushAmount));
        other.tip = vec3Sub(other.tip, vec3Scale(pushDir, pushAmount));
      }
    }
  }

  return collisionChecks;
}

function simulateCombStroke(hairs: HairState[], iteration: number): number {
  const combStart: [number, number, number] = [
    -0.3 + (iteration % 5) * 0.15,
    0.6,
    -0.2 + Math.sin(iteration * 0.5) * 0.1,
  ];
  const combEnd: [number, number, number] = [
    combStart[0] + 0.4,
    combStart[1] - 0.3,
    combStart[2],
  ];

  const combRadius = 0.12;
  let affectedHairs = 0;

  for (const hair of hairs) {
    const toTip = vec3Sub(hair.tip, combStart);
    const combDir = vec3Normalize(vec3Sub(combEnd, combStart));

    const dot = toTip[0] * combDir[0] + toTip[1] * combDir[1] + toTip[2] * combDir[2];
    const clampedT = Math.max(0, Math.min(1, dot / vec3Length(vec3Sub(combEnd, combStart))));

    const closestPoint: [number, number, number] = [
      combStart[0] + combDir[0] * clampedT * vec3Length(vec3Sub(combEnd, combStart)),
      combStart[1] + combDir[1] * clampedT * vec3Length(vec3Sub(combEnd, combStart)),
      combStart[2] + combDir[2] * clampedT * vec3Length(vec3Sub(combEnd, combStart)),
    ];

    const dist = vec3Distance(hair.tip, closestPoint);

    if (dist < combRadius) {
      affectedHairs++;
      const force = (1 - dist / combRadius) * PHYSICS_CONSTANTS.MAX_FORCE * 0.5;
      const forceDir = vec3Normalize(vec3Sub(closestPoint, hair.tip));

      hair.tip = vec3Add(hair.tip, vec3Scale(forceDir, force * 0.01));
      hair.velocity = vec3Add(hair.velocity, vec3Scale(forceDir, force * 0.1));
    }
  }

  return affectedHairs;
}

export async function runStressTest(iterations: number, hairCount: number): Promise<StressTestResult> {
  const hairs = generateHairStates(hairCount);
  const spatialHash = new SpatialHash(PHYSICS_CONSTANTS.COLLISION_RADIUS * 4);
  const fpsData: number[] = [];
  const frameTimeData: number[] = [];
  let totalCollisionChecks = 0;
  let totalHairUpdates = 0;

  const warmupIterations = Math.min(50, Math.floor(iterations * 0.05));
  for (let i = 0; i < warmupIterations; i++) {
    updateHairPhysics(hairs, 1 / 60, spatialHash);
    simulateCombStroke(hairs, i);
  }

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();

    simulateCombStroke(hairs, i);
    const collisionChecks = updateHairPhysics(hairs, 1 / 60, spatialHash);

    const endTime = performance.now();
    const frameTime = endTime - startTime;
    const fps = 1000 / Math.max(frameTime, 0.001);

    fpsData.push(fps);
    frameTimeData.push(frameTime);
    totalCollisionChecks += collisionChecks;
    totalHairUpdates += hairCount;

    if (i % 100 === 0) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }

  const avgFps = fpsData.reduce((a, b) => a + b, 0) / fpsData.length;
  const minFps = Math.min(...fpsData);
  const maxFps = Math.max(...fpsData);
  const avgFrameTime = frameTimeData.reduce((a, b) => a + b, 0) / frameTimeData.length;

  return {
    iterations,
    hairCount,
    avgFps,
    minFps,
    maxFps,
    avgFrameTime,
    frameTimeData,
    fpsData,
    passed: avgFps >= 60,
    timestamp: new Date().toISOString(),
    totalHairUpdates,
    totalCollisionChecks,
  };
}
