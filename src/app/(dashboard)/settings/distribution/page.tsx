'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DistributionSettingsClient from './DistributionSettingsClient';

export default async function DistributionSettingsPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Buscar configuração atual
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'ticket_distribution' }
  });

  const config = setting ? JSON.parse(setting.value) : {
    enabled: false,
    mode: 'SEQUENTIAL',
    attendantIds: []
  };

  // Buscar todos os atendentes e admins para seleção
  const staff = await prisma.user.findMany({
    where: {
      role: { in: ['ADMIN', 'ATTENDANT'] },
      deletedAt: null
    },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, role: true }
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Distribuição Automática</h3>
        <p className="text-sm text-muted-foreground">
          Configure como os novos chamados devem ser atribuídos automaticamente aos seus atendentes.
        </p>
      </div>
      
      <DistributionSettingsClient initialConfig={config} staff={staff} />
    </div>
  );
}
