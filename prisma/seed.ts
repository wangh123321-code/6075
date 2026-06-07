import { PrismaClient } from '@prisma/client';
import { CAT_BREED_PRESETS } from '../shared/constants';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始播种数据...');

  for (const breed of CAT_BREED_PRESETS) {
    const existing = await prisma.catBreed.findUnique({
      where: { name: breed.name },
    });

    if (!existing) {
      await prisma.catBreed.create({
        data: {
          name: breed.name,
          hairParams: JSON.stringify(breed.hairParams),
        },
      });
      console.log(`✅ 创建猫咪品种: ${breed.name}`);
    } else {
      console.log(`⏭️  跳过已存在的品种: ${breed.name}`);
    }
  }

  console.log('🎉 数据播种完成!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
