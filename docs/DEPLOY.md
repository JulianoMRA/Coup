# Deploy em Produção

## Visão geral

O deploy é feito em duas etapas: **backend primeiro (Railway), depois frontend (Vercel)**. A ordem importa porque o frontend precisa da URL do backend para se conectar.

## Variáveis de ambiente

Consulte o arquivo [`.env.example`](../.env.example) para a descrição completa de cada variável.

---

## Etapa 1: Backend no Railway

1. Crie um projeto no [Railway](https://railway.com) e conecte ao repositório GitHub
2. O campo **Root Directory** deve ficar **em branco** (padrão) — o monorepo precisa da raiz para resolver as dependências entre pacotes (`packages/shared`)
3. O `railway.json` na raiz do repositório configura automaticamente:
   - Build: `npm run build` (compila shared e backend)
   - Start: `node dist/index.js`
4. Configure a variável de ambiente `FRONTEND_URL` com a URL da Vercel (pode ser atualizada depois, após o deploy do frontend)
5. **NÃO configure `PORT`** — o Railway injeta automaticamente a porta correta. Definir manualmente pode causar conflito
6. Após o deploy, copie a URL pública gerada (formato `https://xxx.up.railway.app`)

---

## Etapa 2: Frontend na Vercel

1. Crie um projeto na [Vercel](https://vercel.com) e conecte ao repositório GitHub
2. O `vercel.json` na raiz configura automaticamente o build do Next.js
3. Configure a variável de ambiente `NEXT_PUBLIC_BACKEND_URL` com a URL do Railway obtida na Etapa 1
4. O deploy é automático a cada push para `main`
5. Após o deploy, copie a URL pública da Vercel
6. Volte ao Railway e atualize `FRONTEND_URL` com a URL da Vercel (se ainda não configurou na Etapa 1)

---

## Alerta importante sobre variáveis NEXT_PUBLIC_*

> **Atenção:** Variáveis `NEXT_PUBLIC_*` são embeddadas no bundle durante o `next build`. Se você alterar `NEXT_PUBLIC_BACKEND_URL` na Vercel, é necessário disparar um novo deploy (Redeploy) para o novo valor entrar em vigor. Apenas salvar a variável no painel da Vercel **não** é suficiente.

---

## Diagrama do fluxo de deploy

```
1. Railway (backend)
   └── Root Directory: em branco
   └── railway.json → build: npm run build | start: node dist/index.js
   └── Env: FRONTEND_URL=<URL da Vercel>
   └── PORT: injetado automaticamente pelo Railway
   └── Gera URL: https://xxx.up.railway.app  ←────────────┐

2. Vercel (frontend)                                       │
   └── vercel.json → build Next.js                        │
   └── Env: NEXT_PUBLIC_BACKEND_URL=https://xxx.up.railway.app ──┘
   └── Auto-deploy em push para main
   └── Gera URL: https://seu-app.vercel.app
       └── Atualizar FRONTEND_URL no Railway com esta URL
```
