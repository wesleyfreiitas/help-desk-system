# HelpDesk System (Clone Freshdesk)

Um sistema completo de Help Desk com controle de chamados, controle de SLA e hierarquia de acesso, construído com **Next.js 15**, **Prisma**, **SQLite** e interface totalmente **Vanilla CSS** com layout *premium*.

## Funcionalidades Prontas

- **Autenticação e Permissões:** Perfis integrados (Administrador, Atendente, Cliente) via JWT em cookies.
- **SLA Engine:** Cálculo automático de prazo de Resposta e Resolução. Pausa a contagem quando o chamado está "Aguardando Cliente" e é retomado através de resposta do cliente.
- **Telas Modernas:** Dashboard central analítico. Filtros de listagem na tela `/tickets`. Responsividade pronta.
- **Detalhamento do Ticket (Timeline):** Layout de bate-papo com segregação de comentários internos versus públicos. 

## Como Rodar Localmente (Desenvolvimento)

O projeto já contém um banco SQLite com dados `seed` (fictícios) configurados.

1. Navegue até a pasta do projeto:
```bash
cd Chamados
```

2. Instale as dependências caso ainda não estejam:
```bash
npm install
```

3. Geração e setup de banco (opcional, só se quiser resetar os dados):
```bash
npm run prisma db push
npm run prisma db seed
```

4. Suba o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse http://localhost:3000

## Credenciais de Acesso (Mock Data)

*Todos os e-mails possuem a senha genérica*: `123456`

- **Administrador:** `admin@helpdesk.com`
- **Atendente:** `joao@helpdesk.com`
- **Cliente:** `maria@acme.com` (apenas visualiza os chamados da própria empresa Empresa ACME)

## Decisões Técnicas
- O projeto usa Vanilla CSS em `globals.css` focado em um Design System bonito sem a alta verbosidade do Tailwind para facilitar customização futura com SASS/Less se o usuário desejar.
- O Prisma SQLite é a base pois permite que qualquer pessoa baixe o projeto e dê start imediatamente sem depender de contêineres Docker (Postgres/MySQL) rodando no fundo. O Prisma permite o switch fácil alterando a URL do banco em `schema.prisma`.
