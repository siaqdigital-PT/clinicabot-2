# ClinicaBot — Guia de Setup

## Pré-requisitos

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Conta [Supabase](https://supabase.com) (base de dados PostgreSQL)
- Conta [Resend](https://resend.com) (email)
- Conta [Groq](https://console.groq.com) (API de IA)
- Conta [Vercel](https://vercel.com) (deploy)
- Conta [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) (upload de logos)

---

## 1. Instalar dependências

```bash
cd clinicabot
pnpm install
```

## 2. Configurar variáveis de ambiente

```bash
cp .env.example apps/web/.env.local
```

Editar `apps/web/.env.local` com os seus valores:

```env
DATABASE_URL="postgresql://user:pass@host/clinicabot?sslmode=require"
DIRECT_URL="postgresql://user:pass@host/clinicabot?sslmode=require"
NEXTAUTH_SECRET="gerar com: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
GROQ_API_KEY="gsk_..."
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@clinicabot.pt"
CRON_SECRET="gerar com: openssl rand -hex 32"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_WIDGET_URL="http://localhost:5173"
BLOB_READ_WRITE_TOKEN="vercel_blob_..."
```

## 3. Base de dados

```bash
# Gerar o Prisma Client
pnpm db:generate

# Criar as tabelas na BD
cd apps/web
npx prisma db push --schema ../../packages/db/prisma/schema.prisma

# Popular com dados de exemplo
pnpm db:seed
```

**Credenciais criadas pelo seed:**
| Utilizador | Email | Password |
|---|---|---|
| Super Admin | admin@clinicabot.pt | admin123 |
| Admin Demo | admin@clinica-demo.pt | demo123 |
| Receção Demo | recepcao@clinica-demo.pt | recepcao123 |

## 4. Arrancar em desenvolvimento

```bash
# Tudo em paralelo (web + widget + landing)
pnpm dev

# Ou individual:
pnpm --filter @clinicabot/web dev     # http://localhost:3000
pnpm --filter @clinicabot/widget dev  # http://localhost:5173
pnpm --filter @clinicabot/landing dev # http://localhost:3001
```

## 5. Abrir o Prisma Studio (explorar BD)

```bash
pnpm db:studio
```

---

## Estrutura de ficheiros

```
clinicabot/
├── apps/
│   ├── web/                          # Painel admin + API (Next.js 14)
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── appointments/     # CRUD de marcações
│   │   │   │   ├── availability/     # Slots disponíveis
│   │   │   │   ├── chat/             # Chatbot IA (Groq)
│   │   │   │   ├── clinics/          # Gestão de clínicas
│   │   │   │   ├── cron/reminders/   # Cron de lembretes (Vercel)
│   │   │   │   ├── doctors/          # CRUD de médicos
│   │   │   │   ├── reports/          # Métricas e relatórios
│   │   │   │   ├── upload/logo/      # Upload de logo (Vercel Blob)
│   │   │   │   ├── account/          # Gestão de conta do utilizador
│   │   │   │   ├── admin/            # APIs exclusivas Super Admin
│   │   │   │   └── widget-config/    # Config pública do widget
│   │   │   ├── dashboard/            # Páginas do painel
│   │   │   ├── login/                # Página de login
│   │   │   ├── forgot-password/      # Recuperação de password
│   │   │   └── reset-password/       # Redefinição de password
│   │   ├── auth.ts                   # NextAuth v5
│   │   ├── middleware.ts             # Proteção de rotas
│   │   └── lib/
│   │       ├── availability.ts       # Lógica de slots
│   │       ├── chatbot/              # Groq client + tools + prompts
│   │       └── email/                # Templates Resend
│   ├── widget/                       # Widget embebível (React + Vite IIFE)
│   │   └── src/
│   │       ├── main.tsx              # Entry point + auto-mount
│   │       ├── Widget.tsx            # Shell + estilos + dark mode
│   │       ├── ChatWindow.tsx        # UI de chat + streaming
│   │       └── FloatingButton.tsx    # Botão flutuante
│   └── landing/                      # Landing page de marketing
│       └── components/               # Hero, Features, Demo, Pricing, FAQ, Contact
├── packages/
│   ├── db/
│   │   ├── prisma/schema.prisma      # Schema completo (12 modelos)
│   │   ├── prisma/seed.ts            # Seed com dados demo genéricos
│   │   └── src/index.ts              # Prisma client singleton
│   ├── types/src/index.ts            # Tipos TypeScript partilhados
│   └── utils/src/index.ts            # Utilitários (datas, tokens, slugify)
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```

---

## Modelo de Negócio

- **Licença:** 2.500 EUR pagamento único (inclui setup, configuração e 3 meses de suporte)
- **Renovação anual:** 250 EUR/ano (manutenção, suporte e atualizações)
- O Super Admin (dono do produto) mantém acesso total a todas as clínicas
- Cada cliente tem acesso apenas à sua clínica

---

## Gestão de Clínicas (Super Admin)

O Super Admin pode em `/dashboard/admin`:
- Criar novas clínicas com credenciais temporárias
- Ver estatísticas globais de todas as clínicas
- Suspender/reativar clínicas (ex: falta de pagamento da renovação)
- Resetar passwords de utilizadores
- Ver médicos, especialidades e marcações de cada clínica

---

## Deploy no Vercel

```bash
# Instalar CLI
npm install -g vercel

# Deploy (a partir da raiz do monorepo)
vercel --prod
```

**Variáveis de ambiente necessárias no Vercel:**
```
DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, NEXTAUTH_URL,
GROQ_API_KEY, RESEND_API_KEY, RESEND_FROM_EMAIL,
CRON_SECRET, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_WIDGET_URL,
BLOB_READ_WRITE_TOKEN
```

**Cron Job (lembretes automáticos):**
```json
{ "crons": [{ "path": "/api/cron/reminders", "schedule": "0 8 * * *" }] }
```

**Embed do widget no site do cliente:**
```html
<div id="clinicabot-widget" data-clinic="SLUG_DA_CLINICA"></div>
<script src="https://clinicabot.vercel.app/widget/bundle.js" async></script>
```

---

## Funcionalidades Implementadas

- Dashboard completo com 8+ páginas
- Chatbot IA com marcações automáticas e streaming de respostas
- Widget embebível com modo escuro automático
- Upload de logo por clínica (Vercel Blob)
- Conhecimento personalizado do chatbot (horários, preços, FAQs)
- Recuperação e alteração de password
- Reset de password pelo Super Admin
- Suspender/reativar clínicas
- Exportar relatórios em PDF e Excel
- Calendário visual de marcações
- Notificações em tempo real
- Emails de confirmação e lembretes automáticos
- Landing page com modelo de preços por licença

---

## Pendente

- [ ] Domínio próprio clinicabot.pt
- [ ] Email suporte@clinicabot.pt no Resend
- [ ] Google OAuth
- [ ] Data de expiração de renovação por clínica
- [ ] Página de onboarding para novos clientes
- [ ] Regenerar API keys por segurança