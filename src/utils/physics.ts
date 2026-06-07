import { PHYSICS_CONSTANTS } from '@/shared/constants';
import type { HairState } from '@/shared/types';

export const vec3Add = (
  a: [number, number, number],
  b: [number, number, number]
): [number, number, number] => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export const vec3Sub = (
  a: [number, number, number],
  b: [number, number, number]
): [number, number, number] => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

export const vec3Scale = (
  v: [number, number, number],
  s: number
): [number, number, number] => [v[0] * s, v[1] * s, v[2] * s];

export const vec3Length = (v: [number, number, number]): number =>
  Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);

export const vec3Normalize = (
  v: [number, number, number]
): [number, number, number] => {
  const len = vec3Length(v);
  if (len === 0) return [0, 0, 0];
  return vec3Scale(v, 1 / len);
};

export const vec3Dot = (
  a: [number, number, number],
  b: [number, number, number]
): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export const vec3Cross = (
  a: [number, number, number],
  b: [number, number, number]
): [number, number, number] => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

export const vec3Lerp = (
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export const vec3Distance = (
  a: [number, number, number],
  b: [number, number, number]
): number => vec3Length(vec3Sub(a, b));

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

export const getForceColor = (
  forceMagnitude: number,
  maxForce: number = PHYSICS_CONSTANTS.MAX_FORCE
): [number, number, number] => {
  const normalized = clamp(forceMagnitude / maxForce, 0, 1);
  const gradient = [
    { value: 0, color: [30, 144, 255] },
    { value: 0.25, color: [50, 205, 50] },
    { value: 0.5, color: [255, 215, 0] },
    { value: 0.75, color: [255, 140, 0] },
    { value: 1, color: [255, 69, 0] },
  ];

  for (let i = 0; i < gradient.length - 1; i++) {
    const curr = gradient[i];
    const next = gradient[i + 1];
    if (normalized >= curr.value && normalized <= next.value) {
      const t = (normalized - curr.value) / (next.value - curr.value);
      return [
        lerp(curr.color[0], next.color[0], t),
        lerp(curr.color[1], next.color[1], t),
        lerp(curr.color[2], next.color[2], t),
      ];
    }
  }
  return [255, 69, 0];
};

export const createHairState = (
  id: number,
  rootPosition: [number, number, number],
  normal: [number, number, number],
  length: number,
  curliness: number
): HairState => {
  const segments: HairState['segments'] = [];
  const numSegments = PHYSICS_CONSTANTS.HAIR_SEGMENTS;
  const segmentLength = length / numSegments;

  let prevPos = [...rootPosition] as [number, number, number];
  const curlOffset = curliness * 0.02;

  for (let i = 0; i < numSegments; i++) {
    const t = (i + 1) / numSegments;
    const curlX = Math.sin(t * Math.PI * 2 * curliness * 3) * curlOffset * t;
    const curlZ = Math.cos(t * Math.PI * 2 * curliness * 3) * curlOffset * t;

    const pos: [number, number, number] = [
      rootPosition[0] + normal[0] * segmentLength * (i + 1) + curlX,
      rootPosition[1] + normal[1] * segmentLength * (i + 1),
      rootPosition[2] + normal[2] * segmentLength * (i + 1) + curlZ,
    ];

    segments.push({
      position: [...pos] as [number, number, number],
      prevPosition: [...prevPos] as [number, number, number],
    });
    prevPos = pos;
  }

  return {
    id,
    rootPosition: [...rootPosition] as [number, number, number],
    tipPosition: [...segments[segments.length - 1].position] as [
      number,
      number,
      number
    ],
    prevTipPosition: [...segments[segments.length - 1].position] as [
      number,
      number,
      number
    ],
    velocity: [0, 0, 0],
    force: [0, 0, 0],
    isShedding: false,
    isSleeping: false,
    segments,
  };
};

export const updateHairPhysics = (
  hair: HairState,
  dt: number,
  stiffness: number,
  gravity: [number, number, number] = [0, -PHYSICS_CONSTANTS.GRAVITY, 0],
  wind: [number, number, number] = [0, 0, 0]
): void => {
  if (hair.isSleeping || hair.isShedding) return;

  const { segments } = hair;
  const numSegments = segments.length;

  for (let i = 1; i < numSegments; i++) {
    const seg = segments[i];
    const vel = vec3Sub(seg.position, seg.prevPosition);

    const damping = PHYSICS_CONSTANTS.DAMPING;
    let newPos: [number, number, number] = [
      seg.position[0] + vel[0] * damping,
      seg.position[1] + vel[1] * damping,
      seg.position[2] + vel[2] * damping,
    ];

    newPos = vec3Add(newPos, vec3Scale(gravity, dt * dt));
    newPos = vec3Add(newPos, vec3Scale(wind, dt * dt * 0.1));

    seg.prevPosition = [...seg.position] as [number, number, number];
    seg.position = newPos;
  }

  const bendStiffness = stiffness * 0.8 + 0.2;
  for (let iter = 0; iter < PHYSICS_CONSTANTS.CONSTRAINT_ITERATIONS; iter++) {
    for (let i = 0; i < numSegments - 1; i++) {
      const p1 = i === 0 ? hair.rootPosition : segments[i - 1].position;
      const p2 = segments[i].position;
      const p3 = segments[i + 1].position;

      const d1 = vec3Sub(p2, p1);
      const d2 = vec3Sub(p3, p2);
      const len1 = vec3Length(d1);
      const len2 = vec3Length(d2);
      const avgLen = (len1 + len2) / 2;

      const bendForce = vec3Sub(d2, d1);
      const bendAmount = vec3Length(bendForce);

      if (bendAmount > 0.001) {
        const correction = vec3Scale(
          bendForce,
          (bendAmount * bendStiffness * 0.1) / bendAmount
        );
        segments[i + 1].position = vec3Sub(
          segments[i + 1].position,
          correction
        ) as [number, number, number];
      }

      const dir = vec3Sub(p3, p2);
      const curLen = vec3Length(dir);
      if (curLen > 0) {
        const diff = (curLen - avgLen) / curLen;
        const correction = vec3Scale(dir, diff * 0.5);
        segments[i].position = vec3Add(
          segments[i].position,
          correction
        ) as [number, number, number];
        segments[i + 1].position = vec3Sub(
          segments[i + 1].position,
          correction
        ) as [number, number, number];
      }
    }
  }

  const lastSeg = segments[numSegments - 1];
  hair.prevTipPosition = [...hair.tipPosition] as [number, number, number];
  hair.tipPosition = [...lastSeg.position] as [number, number, number];
  hair.velocity = vec3Scale(
    vec3Sub(hair.tipPosition, hair.prevTipPosition),
    1 / Math.max(dt, 0.001)
  );

  const totalMovement = vec3Length(
    vec3Sub(hair.tipPosition, hair.prevTipPosition)
  );
  hair.isSleeping = totalMovement < PHYSICS_CONSTANTS.STATIC_THRESHOLD;
};

export const computeCombForce = (
  hair: HairState,
  combPosition: [number, number, number],
  combVelocity: [number, number, number],
  combRadius: number,
  combStiffness: number
): {
  force: [number, number, number];
  magnitude: number;
  contact: boolean;
} => {
  let maxForce: [number, number, number] = [0, 0, 0];
  let maxMagnitude = 0;
  let hasContact = false;

  for (const seg of hair.segments) {
    const dist = vec3Distance(seg.position, combPosition);

    if (dist < combRadius * 2) {
      hasContact = true;
      const normal = vec3Normalize(vec3Sub(seg.position, combPosition));
      const penetration = Math.max(0, combRadius * 2 - dist);

      const relVel = vec3Sub(hair.velocity, combVelocity);
      const dot = vec3Dot(relVel, normal);
      const dampingForce = vec3Scale(
        normal,
        -dot * PHYSICS_CONSTANTS.AIR_RESISTANCE * 10
      );

      const stiffnessForce = vec3Scale(
        normal,
        penetration * combStiffness * 50
      );

      const totalForce = vec3Add(stiffnessForce, dampingForce);
      const magnitude = vec3Length(totalForce);

      if (magnitude > maxMagnitude) {
        maxForce = totalForce;
        maxMagnitude = magnitude;
      }
    }
  }

  return {
    force: maxForce,
    magnitude: Math.min(maxMagnitude, PHYSICS_CONSTANTS.MAX_FORCE),
    contact: hasContact,
  };
};

export const checkShedding = (
  forceMagnitude: number,
  hairLength: number,
  density: number
): boolean => {
  const threshold =
    PHYSICS_CONSTANTS.SHEDDING_THRESHOLD * (1 - density * 0.3);
  return forceMagnitude > threshold && Math.random() < 0.001 * hairLength;
};

export const computeStaticElectricity = (
  forceMagnitude: number,
  humidity: number,
  staticCoefficient: number
): number => {
  const humidityFactor = Math.max(0, 1 - humidity / 100);
  return (
    forceMagnitude *
    staticCoefficient *
    humidityFactor *
    0.01
  );
};

export class SpatialHash {
  private cellSize: number;
  private table: Map<string, number[]>;

  constructor(cellSize: number = 0.05) {
    this.cellSize = cellSize;
    this.table = new Map();
  }

  private getKey(pos: [number, number, number]): string {
    const x = Math.floor(pos[0] / this.cellSize);
    const y = Math.floor(pos[1] / this.cellSize);
    const z = Math.floor(pos[2] / this.cellSize);
    return `${x},${y},${z}`;
  }

  clear(): void {
    this.table.clear();
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
    const minX = Math.floor((pos[0] - radius) / this.cellSize);
    const maxX = Math.floor((pos[0] + radius) / this.cellSize);
    const minY = Math.floor((pos[1] - radius) / this.cellSize);
    const maxY = Math.floor((pos[1] + radius) / this.cellSize);
    const minZ = Math.floor((pos[2] - radius) / this.cellSize);
    const maxZ = Math.floor((pos[2] + radius) / this.cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const key = `${x},${y},${z}`;
          const ids = this.table.get(key);
          if (ids) {
            result.push(...ids);
          }
        }
      }
    }
    return result;
  }
}
