'use server';

import { prisma } from '@/lib/prisma';
import { login as setSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function authenticate(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Preencha todos os campos.' };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { error: 'Usuário não encontrado.' };
  }

  // Para demonstração, se a senha no DB for 'hash_da_senha_123', vamos validar sem bcrypt pra simplificar o mock (a menos que já esteja criptografada)
  // Vamos implementar bcrypt como boa prática:
  const bcrypt = require('bcryptjs');
  
  let isValid = await bcrypt.compare(password, user.password);


  if (!isValid) {
    return { error: 'Senha incorreta.' };
  }

  await setSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    clientId: user.clientId,
  });

  redirect('/dashboard');
}

export async function logoutAction() {
  const { logout } = await import('@/lib/auth');
  await logout();
  redirect('/login');
}
