# ClinicaBot — Guia de Setup

## Pré-requisitos

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Conta [Neon](https://neon.tech) (BD grátis)
- Conta [Resend](https://resend.com) (email grátis)
- Conta [Groq](https://console.groq.com) (API Groq — grátis)

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
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
GROQ_API_KEY="gsk_..."
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@clinicabot.pt"
CRON_SECRET="$(openssl rand -hex 32)"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_WIDGET_URL="http://localhost:5173"
```

## 3. Base de dados

```bash
# Gerar o Prisma Client
pnpm db:generate

# Criar as tabelas na BD
pnpm db:push

# Popular com dados de exemplo (Polivi + Demo)
pnpm db:seed
```

**Credenciais criadas pelo seed:**
| Utilizador | Email | Password |
|---|---|---|
| Super Admin | admin@clinicabot.pt | admin123 |
| Admin Polivi | admin@polivi.pt | polivi123 |
| Receção | recepcao@polivi.pt | recepcao123 |

## 4. Arrancar em desenvolvimento

```bash
# Tudo em paralelo (web + widget)
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

## Estrutura de ficheiros criados

```
clinicabot/
├── apps/
│   ├── web/                          # Painel admin + API (Next.js 14)
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── appointments/     # CRUD de marcações
│   │   │   │   ├── availability/     # Slots disponíveis
│   │   │   │   ├── chat/             # Chatbot Grok
│   │   │   │   ├── clinics/          # Gestão de clínicas
│   │   │   │   ├── cron/reminders/   # Cron de lembretes
│   │   │   │   ├── doctors/          # CRUD de médicos
│   │   │   │   ├── reports/          # Métricas e relatórios
│   │   │   │   └── widget-config/    # Config pública do widget
│   │   │   ├── dashboard/            # Páginas do painel
│   │   │   └── login/                # Página de login
│   │   ├── auth.ts                   # NextAuth v5
│   │   ├── middleware.ts             # Proteção de rotas
│   │   └── lib/
│   │       ├── availability.ts       # Lógica de slots
│   │       ├── chatbot/              # Groq client + tools + prompts
│   │       └── email/                # Templates Resend
│   ├── widget/                       # Widget embebível (React + Vite IIFE)
│   │   └── src/
│   │       ├── main.tsx              # Entry point + auto-mount
│   │       ├── Widget.tsx            # Shell + estilos
│   │       ├── ChatWindow.tsx        # UI de chat
│   │       └── FloatingButton.tsx    # Botão flutuante
│   └── landing/                      # Landing page de marketing
│       └── components/               # Hero, Features, Pricing, FAQ, Contact
├── packages/
│   ├── db/
│   │   ├── prisma/schema.prisma      # Schema completo
│   │   ├── prisma/seed.ts            # Seed Polivi + Demo
│   │   └── src/index.ts              # Prisma client singleton
│   ├── types/src/index.ts            # Tipos TypeScript partilhados
│   └── utils/src/index.ts            # Utilitários (datas, tokens, etc.)
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```

---

## Deploy no Vercel

```bash
# Instalar CLI
npm install -g vercel

# Deploy (a partir da raiz do monorepo)
vercel --prod

# Configurar variáveis de ambiente no dashboard Vercel
# (ou via: vercel env add VARIABLE_NAME)
```

**Configurar Cron Job no Vercel:**
O ficheiro `apps/web/vercel.json` já tem o cron configurado:
```json
{ "crons": [{ "path": "/api/cron/reminders", "schedule": "0 8 * * *" }] }
```

**Embed do widget no site do cliente:**
```html
<div id="clinicabot-widget" data-clinic="demo"></div>
<script src="https://cdn.clinicabot.pt/widget/latest/bundle.js" async></script>
```

---

## Próximos passos

- [ ] Adicionar página `/dashboard/specialties` (CRUD de especialidades)
- [ ] Adicionar página `/dashboard/chat` (monitor de conversas)
- [ ] Adicionar página `/dashboard/reports` com gráficos e exportação PDF
- [ ] Implementar upload de logo (Vercel Blob)
- [ ] Adicionar Google OAuth (configurar no Google Cloud Console)
- [ ] Escrever testes com Vitest para a lógica de disponibilidade
- [ ] Configurar domínio personalizado no Vercel
