# Documentação do Projeto: Upp HelpDesk

O **Upp HelpDesk** é uma solução robusta e moderna de gerenciamento de suporte, inspirada em plataformas líderes como o Freshdesk. O sistema foi projetado para centralizar o atendimento ao cliente, automatizar fluxos de trabalho através de e-mail e garantir o cumprimento de níveis de serviço (SLAs).

---

## 🚀 1. Tecnologias Utilizadas

O projeto utiliza o que há de mais moderno no ecossistema JavaScript/TypeScript:

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL
- **ORM**: [Prisma](https://www.prisma.io/)
- **Autenticação**: NextAuth.js baseado em JWT (Jose) com suporte a cookies `SameSite: None` para cenários embedded (iframes).
- **Estilização**: CSS Vanilla (Design Moderno com CSS Variables, Glassmorphism e Responsividade).
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Gráficos**: [Recharts](https://recharts.org/)
- **E-mail**: Nodemailer (Envio) e ImapFlow (Recebimento/Sincronização).
- **Processamento de Dados**: PapaParse (CSV) e XLSX (Excel).

---

## 📁 2. Estrutura de Pastas

A estrutura segue o padrão do Next.js App Router:

- `src/app`: Rotas da aplicação, layouts e componentes de página.
  - `(dashboard)`: Grupo de rotas protegidas (Dashboard, Chamados, Relatórios).
  - `actions`: Server Actions que encapsulam a lógica de negócio (CRUDs, tickets, permissões).
  - `components`: Componentes reutilizáveis (UI, filtros, modais).
- `src/lib`: Bibliotecas compartilhadas, configurações (Prisma, Auth, Mail, Audit).
- `prisma`: Esquema do banco de dados e scripts de seed.
- `public`: Ativos estáticos (Logos, manifestos).

---

## 🗄️ 3. Modelagem de Dados (Database Schema)

O banco de dados é composto por 15+ modelos interconectados:

### **Núcleo de Usuários e Acesso**
- **User**: Gerencia Admins, Atendentes e Clientes. Possui campos para soft-delete (`deletedAt`).
- **AccessLog**: Registra o histórico de logins, IPs e navegadores.
- **AuditLog**: Rastreia cada criação, edição ou exclusão (CRUD) em nível de recurso.

### **CRM e Ativação**
- **Client (Empresa)**: Centraliza contatos e chamados. Armazena Razão Social, CNPJ, e configurações de ativação.
- **Product**: Produtos que podem ser associados a chamados.
- **Category**: Categorias para classificação de chamados.

### **Ticketing (Chamados)**
- **Ticket**: O coração do sistema. Controla o protocolo (#123456), status, prioridade, prazos de SLA e associação com cliente/atendente.
- **Interaction**: Histórico de mensagens dentro de um chamado, incluindo notas internas (`isInternal`).
- **Attachment**: Arquivos anexados às interações.
- **TicketOption**: Configurações dinâmicas de tipos, origens, status e prioridades com suporte a reordenação por drag-and-drop.
- **CannedResponse**: Respostas prontas para agilizar o atendimento.

### **Configurações e SLAs**
- **SlaPolicy**: Define tempos alvo de primeira resposta e resolução baseados na prioridade.
- **CustomField** & **CustomFieldValue**: Sistema de campos dinâmicos que podem ser vinculados a Empresas ou Usuários.
- **SystemSetting**: Chave-valor para configurações globais (SMTP, IMAP, Regras da Organização).

---

## 🛠️ 4. Fluxos e Funcionalidades

### **4.1 Gestão de Chamados**
- **Criação**: Via portal ou automaticamente via sincronização de e-mail.
- **Interação**: Respostas públicas para o cliente ou notas privadas para a equipe.
- **Estados**: Fluxo completo de ABERTO -> EM ANDAMENTO -> RESOLVIDO -> FECHADO.
- **Associação**: Atribuição automática ou manual para atendentes/times.

### **4.2 Automação de E-mail**
- **Sincronização IMAP**: O sistema monitora caixas de entrada e transforma e-mails recebidos em chamados (ou anexa como resposta a chamados existentes via `Message-ID`).
- **Notificações SMTP**: Alertas automáticos para novos chamados, respostas e menções.

### **4.3 Inteligência e Relatórios**
- **SLA Tracking**: Cálculo em tempo real do tempo restante de resolução. Pausa de SLA se o ticket estiver aguardando cliente.
- **Relatórios de Auditoria**: Aba de acessos e aba de ações administrativas detalhadas.
- **Dashboards**: Métricas de satisfação, volume de chamados e performance da equipe.

### **4.4 Padronização e Requisitos de Dados**
Recentemente implementamos regras de consistência:
- **Nomes de Empresa**: Salvos sempre em **CAIXA ALTA**.
- **Telefones**: Máscara automática `(XX) XXXXX-XXXX`.
- **Documentos**: Validação e máscara para **CPF** e **CNPJ**.

---

## 🔐 5. Segurança e Permissões

Níveis de Acesso:
1. **ADMIN**: Acesso total às configurações do sistema, relatórios financeiros e gestão de pessoal.
2. **ATTENDANT**: Staff focado em resolver chamados.
3. **ORG_MANAGER**: Usuário cliente que pode ver os chamados de toda a sua empresa.
4. **ORG_MEMBER / CLIENT**: Usuário cliente focado em seus próprios incidentes.

---

## 📝 6. Configuração do Ambiente (.env)

O sistema requer as seguintes variáveis:
```env
DATABASE_URL="postgresql://user:pass@host:port/dbname"
JWT_SECRET="sua-chave-secreta"
# Configurações de E-mail (Opcional, pode ser via UI Settings)
SMTP_HOST="smtp.exemplo.com"
SMTP_PORT=587
SMTP_USER="sua@conta.com"
SMTP_PASS="sua-senha"
```

---

## 📈 7. Manutenção e Auditoria

Toda alteração em recursos críticos (Usuários, Empresas, Configurações) gera um `AuditLog`. Isso permite:
- Saber **quem** alterou um campo específico.
- Comparar o estado **anterior** e o **novo** (armazenado como JSON no banco).
- Rastrear o IP e o momento exato da alteração.

---
*Documentação atualizada em: 19 de março de 2026*
