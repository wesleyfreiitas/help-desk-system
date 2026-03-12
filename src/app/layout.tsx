import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HelpDesk System',
  description: 'Sistema de Abertura e Gestão de Chamados inspirado no Freshdesk',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
