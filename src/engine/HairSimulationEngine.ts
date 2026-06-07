import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  PointLight,
  MeshBuilder,
  Color3,
  Color4,
  DefaultRenderingPipeline,
  PBRMaterial,
  InstancedMesh,
  Matrix,
  Quaternion,
  PointerEventTypes,
  PickingInfo,
  Animation,
  CubicEase,
  Mesh,
  EasingFunction,
  ParticleSystem,
  Texture,
  ColorCurves,
  LensRenderingPipeline,
} from '@babylonjs/core';
import '@babylonjs/post-processes';
import type { HairState, HairParams, CombConfig, SimulationFrame } from '@/shared/types';
import { PHYSICS_CONSTANTS } from '@/shared/constants';
import {
  createHairState,
  updateHairPhysics,
  computeCombForce,
  checkShedding,
  computeStaticElectricity,
  getForceColor,
  SpatialHash,
  vec3Distance,
  vec3Sub,
  vec3Normalize,
  vec3Add,
  vec3Scale,
  vec3Lerp,
} from '@/utils/physics';

export interface EngineOptions {
  canvasId: string;
  hairCount?: number;
  instanceRendering?: boolean;
  frustumCulling?: boolean;
}

export interface HairForces {
  hairId: number;
  forceMagnitude: number;
  forceDirection: [number, number, number];
  isShedding: boolean;
  position: [number, number, number];
}

export class HairSimulationEngine {
  private engine: Engine;
  private scene: Scene;
  private canvas: HTMLCanvasElement;
  private camera: ArcRotateCamera;
  private catMesh: any;
  private hairStates: HairState[] = [];
  private hairInstances: InstancedMesh | null = null;
  private hairCount: number;
  private instanceRendering: boolean;
  private frustumCulling: boolean;
  private spatialHash: SpatialHash;
  private combMesh: any = null;
  private isCombing: boolean = false;
  private combPosition: Vector3 = new Vector3(0, 0, 0);
  private prevCombPosition: Vector3 = new Vector3(0, 0, 0);
  private combVelocity: Vector3 = new Vector3(0, 0, 0);
  private particleSystem: ParticleSystem | null = null;
  private staticParticleSystem: ParticleSystem | null = null;
  private hairForces: Map<number, HairForces> = new Map();
  private showHeatmap: boolean = false;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 60;
  private isRecording: boolean = false;
  private recordedFrames: SimulationFrame[] = [];
  private simulationTime: number = 0;
  private hairParams: HairParams;
  private combConfig: CombConfig;
  private environmentParams: { temperature: number; humidity: number; staticCoefficient: number };
  private onForceUpdate?: (forces: HairForces[]) => void;
  private onPerfUpdate?: (fps: number, frameTime: number, drawCalls: number) => void;

  constructor(options: EngineOptions) {
    this.canvas = document.getElementById(options.canvasId) as unknown as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas element with id "${options.canvasId}" not found`);
    }

    this.hairCount = options.hairCount || 100000;
    this.instanceRendering = options.instanceRendering ?? true;
    this.frustumCulling = options.frustumCulling ?? true;
    this.spatialHash = new SpatialHash(0.05);

    this.hairParams = {
      length: 0.5,
      density: 0.7,
      stiffness: 0.5,
      curliness: 0.3,
      color: '#8B4513',
    };

    this.combConfig = {
      type: 'needle',
      toothSpacing: 2.5,
      toothLength: 15,
      stiffness: 0.8,
    };

    this.environmentParams = {
      temperature: 22,
      humidity: 50,
      staticCoefficient: 0.3,
    };

    this.engine = new Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });

    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.05, 0.05, 0.08, 1);

    this.camera = this.createCamera();
    this.createLights();
    this.createCatModel();
    this.createComb();
    this.createParticleSystems();
    this.createHair();
    this.setupPostProcessing();
    this.setupInputHandling();
    this.startRenderLoop();
  }

  private createCamera(): ArcRotateCamera {
    const camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 2.5,
      2,
      new Vector3(0, 0, 0),
      this.scene
    );
    camera.attachControl(this.canvas, true);
    camera.wheelPrecision = 50;
    camera.minZ = 0.1;
    camera.maxZ = 100;
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = Math.PI / 2.2;
    camera.lowerRadiusLimit = 1;
    camera.upperRadiusLimit = 5;
    return camera;
  }

  private createLights(): void {
    const ambientLight = new HemisphericLight(
      'ambientLight',
      new Vector3(0, 1, 0),
      this.scene
    );
    ambientLight.intensity = 0.4;
    ambientLight.diffuse = new Color3(0.8, 0.85, 1);
    ambientLight.groundColor = new Color3(0.2, 0.2, 0.25);

    const keyLight = new DirectionalLight(
      'keyLight',
      new Vector3(-1, -0.8, -0.5),
      this.scene
    );
    keyLight.position = new Vector3(5, 5, 5);
    keyLight.intensity = 0.8;
    keyLight.diffuse = new Color3(1, 0.98, 0.95);

    const fillLight = new PointLight(
      'fillLight',
      new Vector3(-2, 1, -2),
      this.scene
    );
    fillLight.intensity = 0.3;
    fillLight.diffuse = new Color3(0.7, 0.7, 1);

    const rimLight = new DirectionalLight(
      'rimLight',
      new Vector3(1, -0.5, 1),
      this.scene
    );
    rimLight.intensity = 0.5;
    rimLight.diffuse = new Color3(1, 0.9, 0.8);
  }

  private createCatModel(): void {
    this.catMesh = MeshBuilder.CreateSphere(
      'catBody',
      { diameter: 0.8, segments: 64 },
      this.scene
    );

    const head = MeshBuilder.CreateSphere(
      'catHead',
      { diameter: 0.5, segments: 48 },
      this.scene
    );
    head.parent = this.catMesh;
    head.position = new Vector3(0, 0.3, 0.5);

    const earLeft = MeshBuilder.CreateCylinder(
      'earLeft',
      { height: 0.25, diameterTop: 0, diameterBottom: 0.15, tessellation: 3 },
      this.scene
    );
    earLeft.parent = head;
    earLeft.position = new Vector3(-0.15, 0.25, 0.15);
    earLeft.rotation.z = -0.3;

    const earRight = MeshBuilder.CreateCylinder(
      'earRight',
      { height: 0.25, diameterTop: 0, diameterBottom: 0.15, tessellation: 3 },
      this.scene
    );
    earRight.parent = head;
    earRight.position = new Vector3(0.15, 0.25, 0.15);
    earRight.rotation.z = 0.3;

    const catMaterial = new PBRMaterial('catMaterial', this.scene);
    catMaterial.albedoColor = new Color3(0.95, 0.88, 0.75);
    catMaterial.metallic = 0.0;
    catMaterial.roughness = 0.8;
    catMaterial.subSurface.isRefractionEnabled = true;
    catMaterial.subSurface.tintColor = new Color3(0.95, 0.85, 0.7);
    catMaterial.subSurface.maximumThickness = 0.1;

    this.catMesh.material = catMaterial;
    head.material = catMaterial;
    earLeft.material = catMaterial;
    earRight.material = catMaterial;

    this.catMesh.position = new Vector3(0, -0.2, 0);
    this.catMesh.rotation.y = Math.PI / 6;
  }

  private createComb(): void {
    const combGroup = MeshBuilder.CreateBox(
      'combHandle',
      { width: 0.1, height: 0.02, depth: 0.2 },
      this.scene
    );

    const teethCount = Math.floor(this.combConfig.toothLength / 5);
    for (let i = 0; i < teethCount; i++) {
      const tooth = MeshBuilder.CreateCylinder(
        `tooth${i}`,
        {
          height: this.combConfig.toothLength / 100,
          diameter: 0.008,
          tessellation: 8,
        },
        this.scene
      );
      tooth.parent = combGroup;
      tooth.position = new Vector3(
        (i - teethCount / 2) * (this.combConfig.toothSpacing / 100),
        -this.combConfig.toothLength / 200,
        0
      );
      tooth.rotation.x = Math.PI / 2;
    }

    const combMaterial = new PBRMaterial('combMaterial', this.scene);
    combMaterial.albedoColor = new Color3(0.3, 0.3, 0.35);
    combMaterial.metallic = 0.8;
    combMaterial.roughness = 0.2;

    combGroup.material = combMaterial;
    combGroup.getChildMeshes().forEach((child) => {
      child.material = combMaterial;
    });

    this.combMesh = combGroup;
    this.combMesh.position = new Vector3(0, 0.5, 0);
    this.combMesh.setEnabled(false);
  }

  private createParticleSystems(): void {
    this.particleSystem = new ParticleSystem(
      'shedParticles',
      200,
      this.scene
    );
    this.particleSystem.particleTexture = new Texture(
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4"><circle cx="2" cy="2" r="1.5" fill="%23D4A574"/></svg>',
      this.scene
    );
    this.particleSystem.emitter = new Vector3(0, 0, 0);
    this.particleSystem.minEmitBox = new Vector3(-0.1, -0.1, -0.1);
    this.particleSystem.maxEmitBox = new Vector3(0.1, 0.1, 0.1);
    this.particleSystem.color1 = new Color4(0.83, 0.65, 0.45, 1);
    this.particleSystem.color2 = new Color4(0.7, 0.55, 0.38, 1);
    this.particleSystem.minSize = 0.01;
    this.particleSystem.maxSize = 0.03;
    this.particleSystem.minLifeTime = 1;
    this.particleSystem.maxLifeTime = 3;
    this.particleSystem.emitRate = 0;
    this.particleSystem.gravity = new Vector3(0, -0.5, 0);
    this.particleSystem.direction1 = new Vector3(-0.5, 0.5, -0.5);
    this.particleSystem.direction2 = new Vector3(0.5, 1, 0.5);
    this.particleSystem.start();

    this.staticParticleSystem = new ParticleSystem(
      'staticParticles',
      100,
      this.scene
    );
    this.staticParticleSystem.particleTexture = new Texture(
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="%23FFFF00"/></svg>',
      this.scene
    );
    this.staticParticleSystem.emitter = new Vector3(0, 0, 0);
    this.staticParticleSystem.minEmitBox = new Vector3(-0.05, -0.05, -0.05);
    this.staticParticleSystem.maxEmitBox = new Vector3(0.05, 0.05, 0.05);
    this.staticParticleSystem.color1 = new Color4(1, 1, 0, 0.8);
    this.staticParticleSystem.color2 = new Color4(1, 0.8, 0, 0.6);
    this.staticParticleSystem.minSize = 0.005;
    this.staticParticleSystem.maxSize = 0.015;
    this.staticParticleSystem.minLifeTime = 0.2;
    this.staticParticleSystem.maxLifeTime = 0.5;
    this.staticParticleSystem.emitRate = 0;
    this.staticParticleSystem.start();
  }

  private createHair(): void {
    const hairLength = 0.01 + this.hairParams.length * 0.09;
    const actualCount = Math.floor(10000 + this.hairParams.density * 90000);

    const hairTemplate = MeshBuilder.CreateCylinder(
      'hairTemplate',
      {
        height: hairLength,
        diameter: 0.002,
        tessellation: 4,
        cap: 0,
      },
      this.scene
    );

    if (this.instanceRendering) {
      this.hairInstances = new InstancedMesh(
        'hairInstances',
        hairTemplate
      );
    }

    hairTemplate.setEnabled(false);

    const hairMaterial = new PBRMaterial('hairMaterial', this.scene);
    const color = this.hexToColor3(this.hairParams.color);
    hairMaterial.albedoColor = color;
    hairMaterial.metallic = 0.0;
    hairMaterial.roughness = 0.9;
    hairMaterial.specularIntensity = 0.3;
    hairMaterial.backFaceCulling = false;

    if (this.hairInstances) {
      this.hairInstances.material = hairMaterial;
    } else {
      hairTemplate.material = hairMaterial;
    }

    this.generateHairStates(actualCount);
    this.updateHairInstancePositions();
  }

  private generateHairStates(count: number): void {
    this.hairStates = [];
    this.spatialHash.clear();

    const positions = this.generateHairRootPositions(count);

    for (let i = 0; i < count; i++) {
      const rootPos = positions[i].position;
      const normal = positions[i].normal;

      const hair = createHairState(
        i,
        rootPos,
        normal,
        0.01 + this.hairParams.length * 0.09,
        this.hairParams.curliness
      );

      this.hairStates.push(hair);
      this.spatialHash.insert(i, hair.tipPosition);
    }
  }

  private generateHairRootPositions(
    count: number
  ): Array<{ position: [number, number, number]; normal: [number, number, number] }> {
    const positions: Array<{
      position: [number, number, number];
      normal: [number, number, number];
    }> = [];

    const catPos = this.catMesh.position;
    const catScale = 0.4;

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = catScale * (0.9 + Math.random() * 0.2);

      const x = radius * Math.sin(phi) * Math.cos(theta) + catPos.x;
      const y = radius * Math.sin(phi) * Math.sin(theta) + catPos.y + 0.1;
      const z = radius * Math.cos(phi) + catPos.z;

      const normal: [number, number, number] = vec3Normalize([
        x - catPos.x,
        y - catPos.y,
        z - catPos.z,
      ]);

      positions.push({
        position: [x, y, z],
        normal,
      });
    }

    return positions;
  }

  private updateHairInstancePositions(): void {
    if (!this.hairInstances) return;

    const matrix = Matrix.Identity();
    const scaleVector = new Vector3(1, 1, 1);
    const rotation = new Quaternion();
    const position = new Vector3();

    for (let i = 0; i < this.hairStates.length; i++) {
      const hair = this.hairStates[i];

      if (hair.isShedding) {
        continue;
      }

      const root = hair.rootPosition;
      const tip = hair.tipPosition;
      const direction: [number, number, number] = vec3Normalize(vec3Sub(tip, root));

      const length = vec3Distance(root, tip);
      const midPoint: [number, number, number] = vec3Lerp(root, tip, 0.5);

      position.set(midPoint[0], midPoint[1], midPoint[2]);

      const up = new Vector3(0, 1, 0);
      const dirVec = new Vector3(direction[0], direction[1], direction[2]);
      const quat = new Quaternion();
      Quaternion.FromUnitVectorsToRef(up, dirVec, quat);
      rotation.copyFrom(quat);

      scaleVector.set(1, length / (0.01 + this.hairParams.length * 0.09), 1);

      Matrix.ComposeToRef(scaleVector, rotation, position, matrix);
      (this.hairInstances! as any)._matrices[i] = matrix;

      if (this.showHeatmap) {
        const forceData = this.hairForces.get(i);
        const force = forceData ? forceData.forceMagnitude : 0;
        const color = getForceColor(force);
        const color3 = new Color3(color[0] / 255, color[1] / 255, color[2] / 255);
        (this.hairInstances!.material as PBRMaterial).albedoColor = color3;
      }
    }

    if (this.showHeatmap) {
      this.hairInstances.hasVertexAlpha = false;
    }
  }

  private setupPostProcessing(): void {
    const pipeline = new DefaultRenderingPipeline(
      'defaultPipeline',
      true,
      this.scene,
      [this.camera]
    );
    pipeline.bloomEnabled = true;
    pipeline.bloomThreshold = 0.9;
    pipeline.bloomWeight = 0.15;
    pipeline.bloomKernel = 64;
    pipeline.bloomScale = 0.5;

    pipeline.fxaaEnabled = true;

    pipeline.imageProcessing.contrast = 1.1;
    pipeline.imageProcessing.exposure = 1.0;

    const colorCurves = new ColorCurves();
    colorCurves.globalSaturation = 1.1;
    colorCurves.globalExposure = 1.05;
    pipeline.imageProcessing.colorCurves = colorCurves;
    pipeline.imageProcessing.colorCurvesEnabled = true;
  }

  private setupInputHandling(): void {
    this.scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
          if (pointerInfo.event.button === 0) {
            this.handlePointerDown(pointerInfo.pickInfo);
          }
          break;
        case PointerEventTypes.POINTERUP:
          if (pointerInfo.event.button === 0) {
            this.handlePointerUp();
          }
          break;
        case PointerEventTypes.POINTERMOVE:
          this.handlePointerMove(pointerInfo.pickInfo);
          break;
      }
    });
  }

  private handlePointerDown(pickInfo: PickingInfo | undefined): void {
    if (!pickInfo || !pickInfo.hit) return;
    this.isCombing = true;
    this.combMesh.setEnabled(true);
    this.prevCombPosition.copyFrom(this.combPosition);
    this.updateCombPosition(pickInfo.pickedPoint!);
  }

  private handlePointerUp(): void {
    this.isCombing = false;
    this.combMesh.setEnabled(false);
  }

  private handlePointerMove(pickInfo: PickingInfo | undefined): void {
    if (!pickInfo || !pickInfo.hit) return;
    if (this.isCombing) {
      this.prevCombPosition.copyFrom(this.combPosition);
      this.updateCombPosition(pickInfo.pickedPoint!);
    }
  }

  private updateCombPosition(newPosition: Vector3): void {
    this.combPosition.copyFrom(newPosition);
    this.combPosition.y += 0.02;

    if (this.combMesh) {
      this.combMesh.position.copyFrom(this.combPosition);
      this.combMesh.rotation.z = Math.atan2(
        this.combPosition.x - this.prevCombPosition.x,
        this.combPosition.z - this.prevCombPosition.z
      );
    }

    this.combVelocity = this.combPosition
      .subtract(this.prevCombPosition)
      .scale(60);
  }

  private startRenderLoop(): void {
    this.engine.runRenderLoop(() => {
      const now = performance.now();
      const dt = Math.min((now - this.lastFrameTime) / 1000, 0.05);
      this.lastFrameTime = now;

      this.frameCount++;
      if (this.frameCount % 30 === 0) {
        this.fps = 1 / dt;
        if (this.onPerfUpdate) {
          this.onPerfUpdate(this.fps, dt * 1000, this.scene.getEngine()._drawCalls.total);
        }
      }

      if (this.isCombing) {
        this.simulationTime += dt;
        this.updatePhysics(dt);
        this.updateHairInstancePositions();
        this.checkSheddingAndStatic();

        if (this.isRecording) {
          this.recordFrame();
        }
      } else {
        this.updatePhysics(Math.min(dt, 0.016));
        this.updateHairInstancePositions();
      }

      this.scene.render();
    });

    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  private updatePhysics(dt: number): void {
    this.hairForces.clear();
    this.spatialHash.clear();

    const gravity: [number, number, number] = [0, -9.81, 0];
    const wind: [number, number, number] = [0.01, 0, 0.005];

    for (let i = 0; i < this.hairStates.length; i++) {
      const hair = this.hairStates[i];

      if (hair.isShedding) continue;

      updateHairPhysics(hair, dt, this.hairParams.stiffness, gravity, wind);

      if (this.isCombing) {
        const combPos: [number, number, number] = [
          this.combPosition.x,
          this.combPosition.y,
          this.combPosition.z,
        ];
        const combVel: [number, number, number] = [
          this.combVelocity.x,
          this.combVelocity.y,
          this.combVelocity.z,
        ];

        const forceResult = computeCombForce(
          hair,
          combPos,
          combVel,
          PHYSICS_CONSTANTS.COLLISION_RADIUS * 3,
          this.combConfig.stiffness
        );

        if (forceResult.contact && forceResult.magnitude > 0.01) {
          for (const seg of hair.segments) {
            const correction = vec3Scale(
              forceResult.force,
              dt * dt * 0.1
            );
            seg.position = vec3Add(
              seg.position,
              correction
            ) as [number, number, number];
          }

          this.hairForces.set(i, {
            hairId: i,
            forceMagnitude: forceResult.magnitude,
            forceDirection: forceResult.force,
            isShedding: false,
            position: hair.tipPosition,
          });
        }
      }

      this.spatialHash.insert(i, hair.tipPosition);
    }

    if (this.onForceUpdate && this.hairForces.size > 0) {
      this.onForceUpdate(Array.from(this.hairForces.values()));
    }
  }

  private checkSheddingAndStatic(): void {
    let sheddingCount = 0;
    let staticCount = 0;

    for (const [hairId, forceData] of this.hairForces) {
      const hair = this.hairStates[hairId];
      if (!hair || hair.isShedding) continue;

      if (
        checkShedding(
          forceData.forceMagnitude,
          this.hairParams.length,
          this.hairParams.density
        )
      ) {
        hair.isShedding = true;
        forceData.isShedding = true;
        sheddingCount++;

        if (this.particleSystem) {
          this.particleSystem.emitter = new Vector3(
            hair.tipPosition[0],
            hair.tipPosition[1],
            hair.tipPosition[2]
          );
          this.particleSystem.manualEmitCount = 3;
        }
      }

      const staticForce = computeStaticElectricity(
        forceData.forceMagnitude,
        this.environmentParams.humidity,
        this.environmentParams.staticCoefficient
      );

      if (staticForce > 0.1 && Math.random() < 0.1) {
        staticCount++;
        if (this.staticParticleSystem) {
          this.staticParticleSystem.emitter = new Vector3(
            hair.tipPosition[0],
            hair.tipPosition[1],
            hair.tipPosition[2]
          );
          this.staticParticleSystem.manualEmitCount = 2;
        }

        for (const seg of hair.segments) {
          seg.position[1] += 0.002;
        }
      }
    }
  }

  private recordFrame(): void {
    const frame: SimulationFrame = {
      timestamp: this.simulationTime,
      hairStates: this.hairStates
        .filter((h) => !h.isShedding)
        .slice(0, 1000)
        .map((h) => ({
          id: h.id,
          tipPosition: [...h.tipPosition] as [number, number, number],
          forceMagnitude: this.hairForces.get(h.id)?.forceMagnitude || 0,
          isShedding: h.isShedding,
        })),
      combPosition: [
        this.combPosition.x,
        this.combPosition.y,
        this.combPosition.z,
      ],
      performanceMetrics: {
        fps: this.fps,
        frameTime: 1000 / this.fps,
        gpuMemory: 0,
        drawCalls: this.scene.getEngine()._drawCalls.total,
        cpuUsage: 0,
        memoryUsage: 0,
        triangleCount: 0,
      },
    };

    this.recordedFrames.push(frame);
  }

  private hexToColor3(hex: string): Color3 {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return new Color3(0.5, 0.3, 0.1);
    return new Color3(
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    );
  }

  public setHairParams(params: Partial<HairParams>): void {
    Object.assign(this.hairParams, params);
    this.rebuildHair();
  }

  public setCombConfig(config: CombConfig): void {
    this.combConfig = config;
    if (this.combMesh) {
      this.combMesh.dispose();
      this.createComb();
    }
  }

  public setEnvironmentParams(params: {
    temperature?: number;
    humidity?: number;
    staticCoefficient?: number;
  }): void {
    Object.assign(this.environmentParams, params);
  }

  public setShowHeatmap(show: boolean): void {
    this.showHeatmap = show;
    if (this.hairInstances) {
      if (show) {
        this.hairInstances.hasVertexAlpha = false;
      } else {
        const color = this.hexToColor3(this.hairParams.color);
        (this.hairInstances!.material as PBRMaterial).albedoColor = color;
      }
    }
  }

  private rebuildHair(): void {
    if (this.hairInstances) {
      this.hairInstances.dispose();
    }
    this.hairInstances = null;
    this.createHair();
  }

  public setOnForceUpdate(callback: (forces: HairForces[]) => void): void {
    this.onForceUpdate = callback;
  }

  public setOnPerfUpdate(
    callback: (fps: number, frameTime: number, drawCalls: number) => void
  ): void {
    this.onPerfUpdate = callback;
  }

  public startRecording(): void {
    this.isRecording = true;
    this.recordedFrames = [];
    this.simulationTime = 0;
  }

  public stopRecording(): SimulationFrame[] {
    this.isRecording = false;
    return this.recordedFrames;
  }

  public getRecordedFrames(): SimulationFrame[] {
    return this.recordedFrames;
  }

  public getFPS(): number {
    return this.fps;
  }

  public getScene(): Scene {
    return this.scene;
  }

  public getEngine(): Engine {
    return this.engine;
  }

  public getCamera(): ArcRotateCamera {
    return this.camera;
  }

  public dispose(): void {
    this.engine.dispose();
  }
}
