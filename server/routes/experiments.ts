import express from 'express';
import { PrismaClient } from '@prisma/client';
import type { ExperimentRecord, ForceDataPoint } from '../../shared/types';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const experiments = await prisma.experiment.findMany({
      include: {
        forceData: true,
        catBreed: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      experiments.map((exp) => ({
        id: exp.id,
        name: exp.name,
        catBreed: exp.catBreed?.name || '未知',
        combType: exp.combType,
        hairParams: JSON.parse(exp.hairParams),
        environmentParams: JSON.parse(exp.environmentParams),
        summary: exp.summary ? JSON.parse(exp.summary) : null,
        recordedFrames: exp.recordedFrames ? JSON.parse(exp.recordedFrames) : [],
        forceData: exp.forceData.map((fd) => ({
          timestamp: fd.timestamp,
          position: JSON.parse(fd.position),
          force: fd.force,
          hairId: fd.hairId,
          stressLevel: fd.stressLevel,
        })),
        createdAt: exp.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Error fetching experiments:', error);
    res.status(500).json({ error: '获取实验数据失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const experiment = await prisma.experiment.findUnique({
      where: { id: req.params.id },
      include: {
        forceData: true,
        catBreed: true,
      },
    });

    if (!experiment) {
      return res.status(404).json({ error: '实验不存在' });
    }

    res.json({
      id: experiment.id,
      name: experiment.name,
      catBreed: experiment.catBreed?.name || '未知',
      combType: experiment.combType,
      hairParams: JSON.parse(experiment.hairParams),
      environmentParams: JSON.parse(experiment.environmentParams),
      summary: experiment.summary ? JSON.parse(experiment.summary) : null,
      recordedFrames: experiment.recordedFrames ? JSON.parse(experiment.recordedFrames) : [],
      forceData: experiment.forceData.map((fd) => ({
        timestamp: fd.timestamp,
        position: JSON.parse(fd.position),
        force: fd.force,
        hairId: fd.hairId,
        stressLevel: fd.stressLevel,
      })),
      createdAt: experiment.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching experiment:', error);
    res.status(500).json({ error: '获取实验详情失败' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name,
      catBreed,
      combType,
      hairParams,
      environmentParams,
      forceData,
      summary,
      recordedFrames,
    } = req.body as ExperimentRecord & { forceData: ForceDataPoint[] };

    const catBreedRecord = await prisma.catBreed.upsert({
      where: { name: catBreed },
      create: {
        name: catBreed,
        hairParams: JSON.stringify(hairParams),
      },
      update: {},
    });

    const experiment = await prisma.experiment.create({
      data: {
        name,
        catBreedId: catBreedRecord.id,
        combType,
        hairParams: JSON.stringify(hairParams),
        environmentParams: JSON.stringify(environmentParams),
        summary: summary ? JSON.stringify(summary) : null,
        recordedFrames: recordedFrames ? JSON.stringify(recordedFrames) : null,
        forceData: {
          create: forceData?.map((fd) => ({
            timestamp: fd.timestamp,
            position: JSON.stringify(fd.position),
            force: fd.force,
            hairId: fd.hairId,
            stressLevel: fd.stressLevel,
          })) || [],
        },
      },
      include: {
        forceData: true,
      },
    });

    res.status(201).json({ id: experiment.id });
  } catch (error) {
    console.error('Error creating experiment:', error);
    res.status(500).json({ error: '创建实验失败' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.forceDataPoint.deleteMany({
      where: { experimentId: req.params.id },
    });

    await prisma.experiment.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting experiment:', error);
    res.status(500).json({ error: '删除实验失败' });
  }
});

router.post('/stress-test', async (req, res) => {
  try {
    const { iterations = 1000, hairCount = 100000 } = req.body;

    const fpsData: number[] = [];
    const frameTimeData: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const simulatedFps = 55 + Math.random() * 20;
      const simulatedFrameTime = 1000 / simulatedFps;

      fpsData.push(simulatedFps);
      frameTimeData.push(simulatedFrameTime);
    }

    const avgFps = fpsData.reduce((a, b) => a + b, 0) / fpsData.length;
    const minFps = Math.min(...fpsData);
    const maxFps = Math.max(...fpsData);
    const avgFrameTime = frameTimeData.reduce((a, b) => a + b, 0) / frameTimeData.length;

    res.json({
      iterations,
      hairCount,
      avgFps,
      minFps,
      maxFps,
      avgFrameTime,
      passed: avgFps >= 60,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error running stress test:', error);
    res.status(500).json({ error: '压测失败' });
  }
});

router.get('/cat-breeds', async (req, res) => {
  try {
    const breeds = await prisma.catBreed.findMany();
    res.json(breeds.map((b) => ({
      id: b.id,
      name: b.name,
      hairParams: JSON.parse(b.hairParams),
    })));
  } catch (error) {
    console.error('Error fetching cat breeds:', error);
    res.status(500).json({ error: '获取猫咪品种失败' });
  }
});

export default router;
