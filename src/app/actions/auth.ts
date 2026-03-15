'use server';

import { prisma } from '@/lib/prisma';
import { login as setSession, getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

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

export async function forgotPasswordAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;

  if (!email) return { error: 'Informe seu e-mail.' };

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Por segurança, não informamos se o e-mail existe ou não
    return { success: 'Se este e-mail estiver cadastrado, você receberá um link de recuperação em breve.' };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1 hora

  await prisma.passwordResetToken.upsert({
    where: { email },
    update: { token, expires },
    create: { email, token, expires }
  });

  // Log para o console (já que não há serviço de e-mail)
  console.log(`\n--- RECUPERAÇÃO DE SENHA ---`);
  console.log(`Usuário: ${user.name} (${user.email})`);
  console.log(`Link: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`);
  console.log(`----------------------------\n`);

  return { success: 'Instruções de recuperação foram registradas no log do sistema para teste.' };
}

export async function resetPasswordAction(prevState: any, formData: FormData) {
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || password.length < 6) return { error: 'A senha deve ter pelo menos 6 caracteres.' };
  if (password !== confirmPassword) return { error: 'As senhas não coincidem.' };

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token }
  });

  if (!resetToken || resetToken.expires < new Date()) {
    return { error: 'Token inválido ou expirado.' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword }
    }),
    prisma.passwordResetToken.delete({
      where: { token }
    })
  ]);

  return { success: 'Senha alterada com sucesso! Você já pode fazer login.' };
}

export async function updatePasswordAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: 'Não autorizado.' };

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!currentPassword || !newPassword) return { error: 'Preencha todos os campos.' };
  if (newPassword.length < 6) return { error: 'A nova senha deve ter pelo menos 6 caracteres.' };
  if (newPassword !== confirmPassword) return { error: 'As novas senhas não coincidem.' };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user) return { error: 'Usuário não encontrado.' };

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) return { error: 'Senha atual incorreta.' };

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });

  return { success: 'Senha atualizada com sucesso!' };
}
