import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'sso_config' }
  });
  console.log('Current SSO Config in DB:', setting ? JSON.parse(setting.value) : 'Not set');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
