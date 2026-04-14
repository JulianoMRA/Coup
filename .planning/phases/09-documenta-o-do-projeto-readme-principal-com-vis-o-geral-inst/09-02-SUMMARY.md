---
plan: 09-02
phase: 09
status: completed
tasks_completed: 2
tasks_total: 2
---

# Summary: Plan 09-02 — CONTRIBUTING.md, DEPLOY.md, README.md

## What Was Built

Três arquivos Markdown criados em PT-BR que completam a documentação do projeto:

- **docs/CONTRIBUTING.md** — Guia de contribuição com setup (link para INSTALL.md sem duplicar), convenções Conventional Commits, hooks automáticos (husky + secretlint), alerta sobre `--no-verify`, checklist pré-PR e fluxo de Pull Request.
- **docs/DEPLOY.md** — Guia de deploy em produção: Railway primeiro (backend), Vercel depois (frontend). Inclui alerta sobre Root Directory em branco no Railway, aviso de não configurar PORT, e alerta de redeploy obrigatório para variáveis `NEXT_PUBLIC_*`.
- **README.md** — README raiz com título, badge de CI (GitHub Actions ci.yml), descrição técnica do monorepo, quick start (5 comandos), links rápidos para os 4 docs, stack tecnológica e referência ao .env.example.

## Commits

- `d6a40c9` docs(09-02): add CONTRIBUTING.md and DEPLOY.md
- `11bca96` docs(09-02): add root README.md with overview, badges and quick links

## Key Files

### Created
- `docs/CONTRIBUTING.md` — Guia de contribuição completo em PT-BR
- `docs/DEPLOY.md` — Guia Railway → Vercel com alertas de pitfalls
- `README.md` — README raiz com badge CI e links para todos os docs

## Self-Check

- [x] docs/CONTRIBUTING.md existe com Conventional Commits, link para INSTALL.md, alerta `--no-verify`
- [x] docs/DEPLOY.md existe com ordem Railway → Vercel, Root Directory vazio, PORT, NEXT_PUBLIC alerta
- [x] README.md existe com título "Coup Online", badge ci.yml, quick start, links para 4 docs
- [x] Nenhum arquivo contém URLs reais de produção
- [x] Todo conteúdo em PT-BR
- [x] CONTRIBUTING.md referencia INSTALL.md sem duplicar instruções
