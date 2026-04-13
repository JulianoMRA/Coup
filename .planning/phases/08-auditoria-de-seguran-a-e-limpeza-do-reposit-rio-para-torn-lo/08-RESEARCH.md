# Phase 8: Auditoria de segurança e limpeza do repositório para torná-lo público - Research

**Pesquisado em:** 2026-04-13
**Domínio:** Segurança de repositório, detecção de segredos, higiene de variáveis de ambiente, preparação para repo público
**Confiança geral:** HIGH

---

## Resumo

O projeto Coup Online é um monorepo Node.js/Next.js/TypeScript que usa apenas duas variáveis de ambiente (`FRONTEND_URL` no backend, `NEXT_PUBLIC_BACKEND_URL` no frontend), ambas já documentadas em `.env.example` com valores placeholder. A análise do histórico git (172 commits) não encontrou nenhum arquivo `.env` real rastreado em nenhum momento — o `.gitignore` raiz já protege `.env` e `.env.local`. Não há chaves de API, credenciais de banco de dados, tokens JWT, senhas ou qualquer segredo real no código-fonte ou no histórico git.

O principal trabalho desta fase é: (1) corrigir lacunas no `.gitignore` em relação aos padrões oficiais Node/Next.js, (2) remover dois arquivos acidentalmente rastreados no diretório `.clone/worktrees/` que vazaram em um commit de desenvolvimento, (3) instalar `secretlint` como ferramenta de varredura automatizada de segredos, e (4) habilitar as funcionalidades de segurança nativas do GitHub (Secret Scanning, Dependabot) antes de tornar o repositório público.

**Recomendação principal:** O repositório está em boa forma de segurança. Nenhuma limpeza de histórico git (BFG, `git filter-repo`) é necessária. As lacunas são administrativas (`.gitignore`, arquivos de worktree rastreados, features do GitHub) e resolvíveis sem reescrever histórico.

---

## Auditório do Estado Atual (Findings da Análise do Codebase)

### Variáveis de ambiente referenciadas no código

| Variável | Onde usada | Exposta ao cliente? | Observação |
|----------|-----------|---------------------|------------|
| `FRONTEND_URL` | `apps/backend/src/index.ts` | Não (servidor) | Configura CORS origin — nunca sensível por si só |
| `PORT` | `apps/backend/src/index.ts` | Não (servidor) | Injetada pelo Railway automaticamente |
| `NEXT_PUBLIC_BACKEND_URL` | `apps/frontend/src/lib/backend-url.ts` | **Sim (bundle)** | URL pública do backend — por design não é segredo |

[VERIFIED: grep do codebase `process.env.*`]

### Arquivos `.env` no histórico git

Nenhum arquivo `.env` real foi rastreado em nenhum ponto do histórico. O único arquivo com "env" rastreado é `.env.example`, que contém apenas valores placeholder (`SEU-APP-NA-VERCEL`, `SEU-BACKEND`).

[VERIFIED: `git log --all --full-history -- ".env" ".env.local"` retornou zero resultados]
[VERIFIED: `git log --all -S "PASSWORD|SECRET|API_KEY|TOKEN"` retornou zero resultados]

### Problema encontrado: `.clone/worktrees/` rastreado no git

Dois arquivos de worktrees de agentes de desenvolvimento foram acidentalmente incluídos em um commit:

- `.clone/worktrees/agent-a8a1446e/packages/shared/src/types/game-state.ts`
- `.clone/worktrees/agent-a8c8cb15/vitest.config.ts`

Estes foram commitados em `22a4ac9` (commit de desenvolvimento). Não contêm segredos, mas são artefatos de desenvolvimento que não devem estar em um repo público.

[VERIFIED: `git ls-files | grep ".clone"`]

### Estado atual do `.gitignore`

O `.gitignore` raiz atual contém apenas 8 linhas:

```
node_modules
dist
.next
.env
.env.local
coverage
*.tsbuildinfo
.clone
```

Lacunas em relação ao template oficial Node/Next.js do GitHub: [CITED: github.com/github/gitignore/blob/main/Node.gitignore]

| Padrão ausente | Por que importa |
|----------------|-----------------|
| `*.log` / `npm-debug.log*` | Logs podem conter informações de erro com dados sensíveis |
| `.env.*` (além de `.env.local`) | Cobre `.env.production`, `.env.test`, etc. |
| `!.env.example` | Exceção explícita para garantir que .env.example seja sempre rastreado |
| `out/` | Output do Next.js para export estático |
| `.npm` | Cache do npm |
| `*.tgz` | Pacotes npm gerados |
| `.DS_Store` | macOS metadata |
| `Thumbs.db` | Windows metadata |
| `pids` / `*.pid` | Runtime process IDs |

### Segredos hardcoded no código-fonte

Nenhum encontrado. A análise grep do código-fonte não revelou URLs de produção reais, tokens, senhas, chaves de API ou qualquer credencial.

[VERIFIED: grep `https?://(?!localhost|example.com|SEU|seu)` em todos os arquivos .ts/.tsx/.js]
[VERIFIED: grep `railway.app|vercel.app` retornou apenas comentários em .planning/ e valores placeholder]

### Configuração CORS

A implementação CORS é adequada para produção:
- `parseAllowedOrigins` em `cors-origins.ts` processa a env `FRONTEND_URL`
- Suporta lista separada por vírgulas e wildcard `*` (convertido para regex segura)
- Fallback para `http://localhost:3000` quando sem `FRONTEND_URL` (seguro para dev)
- Aplicado tanto no Express quanto no Socket.IO

[VERIFIED: leitura de `apps/backend/src/index.ts` e `apps/backend/src/cors-origins.ts`]

### `private: true` nos package.json

| Arquivo | `private: true`? |
|---------|-----------------|
| `package.json` (raiz) | Sim |
| `apps/backend/package.json` | Sim |
| `apps/frontend/package.json` | Sim |
| `packages/shared/package.json` | Verificar |

[VERIFIED: leitura dos package.json da raiz, backend e frontend]
[ASSUMED: package shared — não foi verificado diretamente]

### GitHub Secret Scanning

O repositório aponta para `https://github.com/JulianoMRA/Coup.git`. Atualmente o repo é privado. Quando for tornado público, o GitHub habilita Secret Scanning automaticamente para novos repos públicos (gratuito).

[CITED: docs.github.com/en/code-security/how-tos/secure-your-secrets/detect-secret-leaks/enabling-secret-scanning-for-your-repository]

---

## Stack Padrão para Esta Fase

### Ferramentas de Varredura

| Ferramenta | Versão | Propósito | Por que usar |
|------------|--------|-----------|--------------|
| `secretlint` | 11.7.1 | Varredura de segredos no codebase atual | Puro Node.js, sem binário externo, integração npm nativa |
| `@secretlint/secretlint-rule-preset-recommend` | 11.7.1 | Regras prontas (AWS, GCP, Slack, npm tokens, SSH keys) | Cobre todos os tipos comuns de credenciais |
| `husky` | 9.1.7 | Pre-commit hooks | Impede futuros commits com segredos |

[VERIFIED: npm registry — `npm view secretlint version` = 11.7.1, `npm view @secretlint/secretlint-rule-preset-recommend version` = 11.7.1, `npm view husky version` = 9.1.7]

### Por que secretlint (e não gitleaks/truffleHog)

- `gitleaks` e `truffleHog` são binários Go — requerem instalação separada no Windows, não trivial em CI sem Docker
- `secretlint` é npm-nativo, funciona com `npx secretlint` sem instalação global
- O gitleaks npm package (versão 1.0.0) é abandonado há 6 anos — não usar
- `secretlint` v11.7.1 requer Node.js 20+ (este projeto usa Node 22) — compatível

[CITED: github.com/secretlint/secretlint]
[CITED: gitleaks.io — instalação requer binário, não npm]

### Para limpeza do `.clone/worktrees/`

Não é necessário reescrever histórico git (BFG / `git filter-repo`) porque os arquivos `.clone/` não contêm segredos — são apenas artefatos de desenvolvimento indesejados. A solução é:
1. `git rm --cached` os dois arquivos
2. Adicionar `.clone/` ao `.gitignore` (já está — confirmar que está correto)
3. Fazer um commit de limpeza

[VERIFIED: `.gitignore` atual já contém `.clone` como entrada]

---

## Padrões de Arquitetura

### .gitignore Completo Recomendado para Este Projeto

```
# Dependências
node_modules/

# Build output
dist/
.next/
out/

# Ambiente — nunca comitar valores reais
.env
.env.*
!.env.example

# Cobertura de testes
coverage/
.nyc_output/

# Cache TypeScript
*.tsbuildinfo

# Artefatos de ferramentas de desenvolvimento internas
.clone/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Sistema operacional
.DS_Store
Thumbs.db
ehthumbs.db

# Runtime
pids/
*.pid
*.seed
*.pid.lock

# npm
*.tgz
.npm

# IDEs (opcional — preferência pessoal)
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
```

### Configuração do secretlint

Criar `.secretlintrc.json` na raiz:

```json
{
  "rules": [
    {
      "id": "@secretlint/secretlint-rule-preset-recommend"
    }
  ]
}
```

### Hook pre-commit com husky

```bash
# Instalar husky
npm install --save-dev husky
npx husky init

# Criar hook pre-commit
echo 'npx secretlint "**/*"' > .husky/pre-commit
```

### Script npm para varredura manual

Adicionar no `package.json` raiz:

```json
{
  "scripts": {
    "scan:secrets": "secretlint \"**/*\""
  }
}
```

### Verificação de package.json do shared

```json
{
  "name": "@coup/shared",
  "private": true
}
```

O `private: true` deve estar presente para garantir que o pacote não seja publicado acidentalmente no npm.

---

## Não Construir do Zero

| Problema | Não construir | Usar | Por que |
|----------|--------------|------|---------|
| Varredura de segredos | Regex manual para patterns | `secretlint` com preset | Cobre 20+ tipos de credenciais com regras atualizadas |
| Prevenção de commits | Script shell personalizado | `husky` + `secretlint` | Padrão de mercado, integração com npm lifecycle |
| Limpeza de histórico | Script git manual | `git filter-repo` (se necessário) | Ferramenta oficial recomendada pelo GitHub (substitui BFG) |

**Observação:** Para este projeto, limpeza de histórico NÃO é necessária. Os arquivos `.clone/worktrees/` podem ser removidos com `git rm --cached` sem reescrever histórico.

---

## Armadilhas Comuns

### Armadilha 1: Reescrever histórico desnecessariamente

**O que acontece:** Usar BFG ou `git filter-repo` quando não há segredos reais no histórico — cria complexidade sem benefício (hashes mudam, forks ficam fora de sincronia, force push necessário).

**Por que acontece:** Confundir "arquivos indesejados no histórico" com "segredos no histórico".

**Como evitar:** Verificar primeiro se há segredos reais (`git log --all -S "API_KEY"`). Se não há segredos, um simples `git rm --cached` + novo commit é suficiente.

**Sinais de alerta:** Qualquer ferramenta que peça `git push --force` para um repo que já tem colaboradores.

### Armadilha 2: `.env.*` no .gitignore sem exceção para `.env.example`

**O que acontece:** Adicionar `.env.*` ao `.gitignore` faz o git ignorar também `.env.example`, que deve ser rastreado.

**Como evitar:** Sempre adicionar `!.env.example` logo após `.env.*`.

### Armadilha 3: Confundir `NEXT_PUBLIC_` como vulnerabilidade

**O que acontece:** `NEXT_PUBLIC_BACKEND_URL` fica visível no bundle do cliente — isso é **esperado e correto** para URLs de API públicas. Não é um vazamento.

**Por que importa:** A URL do backend Railway já é pública por natureza (qualquer pessoa pode ver no DevTools). O risco real seria colocar uma API key secreta numa var `NEXT_PUBLIC_`.

**Conclusão:** `NEXT_PUBLIC_BACKEND_URL` está correto como está. Nenhuma ação necessária.

[CITED: nextjs.org/docs/pages/guides/environment-variables — NEXT_PUBLIC_ vars são embedded por design]

### Armadilha 4: `.clone/` no .gitignore mas arquivos já rastreados

**O que acontece:** Adicionar `.clone/` ao `.gitignore` **não remove** arquivos já rastreados pelo git. É necessário explicitamente `git rm --cached`.

**Como evitar:** Sempre executar `git rm --cached path/to/file` para remover do tracking sem deletar o arquivo local, depois commitar.

### Armadilha 5: GitHub Secret Scanning só detecta padrões conhecidos

**O que acontece:** O Secret Scanning do GitHub detecta tokens de provedores conhecidos (AWS, GitHub tokens, Stripe, etc.) mas não detecta segredos arbitrários (ex: uma senha de banco de dados customizada).

**Como evitar:** Usar `secretlint` como camada adicional antes de tornar o repo público para cobrir patterns que o GitHub não detecta.

---

## Inventário de Estado em Runtime

> Esta fase é de auditoria/limpeza — não é uma fase de renomeação. Seção incluída para confirmar ausência de estado persistido com dados sensíveis.

| Categoria | Itens encontrados | Ação necessária |
|-----------|-------------------|-----------------|
| Dados armazenados | Nenhum banco de dados — estado em memória apenas | Nenhuma |
| Config de serviços vivos | Railway: `FRONTEND_URL`, `PORT` (vars de ambiente no painel) | Verificar que são apenas URLs placeholder até deploy |
| Estado registrado no OS | Nenhum task scheduler, pm2, systemd identificado | Nenhuma |
| Secrets/env vars | `.env` não existe localmente (gitignored, não rastreado) | Nenhuma |
| Build artifacts | `dist/`, `.next/` são gitignored | Nenhuma |

**Nada encontrado em nenhuma categoria além do esperado.** Verificado por análise de `git ls-files`, codebase grep e inspeção de `package.json`.

---

## Disponibilidade de Ambiente

| Dependência | Requerida por | Disponível | Versão | Fallback |
|------------|--------------|-----------|---------|---------|
| Node.js | secretlint, husky | Sim | v22.14.0 | — |
| npm | instalação de deps | Sim | 10.9.2 | — |
| git | remoção de arquivos rastreados | Sim | (no PATH) | — |
| gitleaks (binário) | varredura de histórico avançada | Não | — | secretlint (codebase atual) |
| husky | pre-commit hooks | Não instalado | — | Instalar via npm |
| secretlint | varredura automatizada | Não instalado | — | Instalar via npm |

**Dependências ausentes sem fallback:** Nenhuma que bloqueie execução.

**Dependências ausentes com fallback:** `gitleaks` (binário) — para este projeto, `secretlint` é suficiente dado que o histórico já foi verificado manualmente e não há segredos.

---

## Arquitetura de Validação

### Framework de Testes

| Propriedade | Valor |
|-------------|-------|
| Framework | Vitest 4.1.2 |
| Config | `vitest.config.ts` raiz + por workspace |
| Comando rápido | `npm run test` |
| Suite completa | `npm run test` |

### Mapeamento de Requisitos → Testes

| Comportamento | Tipo de Teste | Comando | Arquivo existe? |
|---------------|--------------|---------|-----------------|
| `.gitignore` cobre todos os padrões necessários | Manual (checklist) | — | N/A |
| `secretlint` passa sem alertas | Automatizado | `npx secretlint "**/*"` | Criar em Wave 0 |
| Arquivos `.clone/` não estão mais rastreados | Automatizado | `git ls-files \| grep .clone` | N/A (verificação shell) |
| `.env.example` tem todos os vars necessários | Manual (revisão) | — | N/A |
| `private: true` em todos os package.json | Automatizado | `grep "private" */package.json` | N/A (verificação shell) |

### Lacunas da Wave 0

- Configuração do secretlint (`.secretlintrc.json`)
- Instalação de `secretlint` e `husky` como devDependencies
- Pre-commit hook `.husky/pre-commit`

---

## Domínio de Segurança

### Categorias ASVS Aplicáveis

| Categoria ASVS | Aplica | Controle Padrão |
|----------------|--------|-----------------|
| V2 Autenticação | Não | N/A (sem auth neste projeto) |
| V3 Gerenciamento de Sessão | Não | N/A |
| V4 Controle de Acesso | Não | N/A |
| V5 Validação de Entrada | Parcial | CORS via `parseAllowedOrigins` já implementado |
| V6 Criptografia | Não | N/A (sem dados sensíveis persistidos) |
| V14 Configuração | **Sim** | Variáveis de ambiente, .gitignore, segredos |

### Padrões de Ameaça para Este Stack

| Padrão | STRIDE | Mitigação Padrão |
|--------|--------|-----------------|
| Segredo commitado no git | Information Disclosure | `.gitignore` + secretlint pre-commit |
| URL de backend exposta no bundle | Information Disclosure | Aceito por design — não é segredo |
| CORS misconfigured | Elevation of Privilege | `parseAllowedOrigins` já implementado e testado |
| Dependências com vulnerabilidades conhecidas | Tampering | Dependabot alerts (habilitar no GitHub) |
| Arquivo de ambiente local commitado | Information Disclosure | `.env` e `.env.*` no .gitignore |

---

## Exemplos de Código

### Remover arquivo rastreado sem deletar do disco

```bash
# Remover os dois arquivos .clone/ do tracking
git rm --cached ".clone/worktrees/agent-a8a1446e/packages/shared/src/types/game-state.ts"
git rm --cached ".clone/worktrees/agent-a8c8cb15/vitest.config.ts"
git commit -m "chore: remove worktree artifacts from git tracking"
```

### Verificar que nenhum .env está rastreado

```bash
git ls-files | grep -E "\.env$|\.env\." | grep -v ".env.example"
# Saída esperada: nenhuma linha
```

### Executar secretlint

```bash
# Varrer codebase inteiro
npx secretlint "**/*"

# Varrer apenas arquivos staged (para pre-commit)
npx secretlint $(git diff --cached --name-only)
```

### Verificar private: true em todos os package.json

```bash
grep -l '"private"' apps/*/package.json packages/*/package.json package.json
# Todos os 4 package.json devem aparecer
```

### Habilitar GitHub Security Features (via Settings UI)

Após tornar o repo público:
1. GitHub repo > Settings > Code security
2. Habilitar: Secret scanning, Push protection, Dependabot alerts, Dependabot security updates

---

## Log de Suposições

| # | Afirmação | Seção | Risco se errado |
|---|-----------|-------|-----------------|
| A1 | `packages/shared/package.json` tem `private: true` | Stack Padrão | Baixo — o pacote seria publicável no npm, mas sem npm token configurado isso não acontece acidentalmente |
| A2 | O repositório GitHub (JulianoMRA/Coup) ainda está privado no momento desta pesquisa | Resumo | Baixo — se já for público, verificar se Secret Scanning já está ativo |

---

## Perguntas em Aberto

1. **O repositório Railway/Vercel tem variáveis de ambiente de produção reais configuradas?**
   - O que sabemos: A fase 7 (deployment) ainda está em andamento (plan 07-02 não executado)
   - O que não está claro: Se há URLs de produção reais já configuradas no painel Railway/Vercel
   - Recomendação: Verificar no painel Railway/Vercel antes de tornar o repo público — URLs de produção são públicas por design mas confirmar que não há outros vars sensíveis

2. **Os arquivos `.clone/worktrees/` no git tracking expõem algo sensível?**
   - O que sabemos: Contêm `game-state.ts` e `vitest.config.ts` — código TypeScript puro sem segredos
   - O que não está claro: Se há outros arquivos `.clone/` não verificados
   - Recomendação: Fazer `git ls-files | grep ".clone"` antes do cleanup para garantir que a lista está completa

---

## Fontes

### Primárias (confiança ALTA)
- GitHub gitignore templates — `github.com/github/gitignore/blob/main/Node.gitignore` — padrões para Node.js
- Next.js docs — `nextjs.org/docs/pages/guides/environment-variables` — comportamento de NEXT_PUBLIC_
- secretlint GitHub — `github.com/secretlint/secretlint` — instalação e uso
- GitHub Secret Scanning docs — `docs.github.com/en/code-security/how-tos/secure-your-secrets` — features para repos públicos

### Secundárias (confiança MÉDIA)
- npm registry: versões verificadas via `npm view` para secretlint (11.7.1), husky (9.1.7)
- Análise direta do codebase: git log, grep, git ls-files — estado atual verificado nesta sessão

### Terciárias (confiança BAIXA)
- Nenhuma

---

## Metadados

**Breakdown de confiança:**
- Estado atual do codebase: HIGH — verificado diretamente via ferramentas
- Stack de varredura (secretlint): HIGH — verificado no npm registry
- Padrões .gitignore: HIGH — verificado no template oficial do GitHub
- Features do GitHub (Secret Scanning, Dependabot): MEDIUM — baseado em documentação oficial do GitHub, configuração real via UI

**Data da pesquisa:** 2026-04-13
**Válido até:** 2026-05-13 (estável — ferramentas de segurança não mudam rapidamente)
