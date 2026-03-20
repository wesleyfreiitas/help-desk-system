import { triggerClickToCall, getUpphoneConfig } from '../src/app/actions/upphone';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // We need to mock a session or bypass it if possible. 
  // Since I can't easily mock auth in a script, I'll modify triggerClickToCall 
  // temporarily to skip auth check for this test if I have to.
  // Actually, I'll just check if there's any config.
  
  const config = await prisma.systemSetting.findUnique({ where: { key: 'upphone_config' } });
  console.log('Config:', config?.value);

  // Instead of calling the action (which checks session), I'll try to duplicate the logic here or bypass auth locally.
}

main().catch(console.error).finally(() => prisma.$disconnect());
