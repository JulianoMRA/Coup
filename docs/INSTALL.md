# Instalacao e Execucao Local

Este guia mostra como configurar e rodar o projeto **Coup Online** na sua maquina, passo a passo.

---

## Requisitos

Antes de comecar, certifique-se de ter instalado:

- **Node.js 24 ou superior** — verifique com `node -v`. Se precisar instalar ou gerenciar versoes, use o [nvm](https://github.com/nvm-sh/nvm).
- **npm** — ja vem incluido com o Node.js.
- **Git** — para clonar o repositorio.

> O projeto usa **npm workspaces**. Isso significa que uma unica instalacao na raiz cuida de todas as dependencias — frontend, backend e pacotes compartilhados.

---

## 1. Clone o repositorio

```bash
git clone https://github.com/JulianoMRA/Coup.git
cd Coup
```

---

## 2. Instale as dependencias

```bash
npm install
```

Este comando instala as dependencias de todos os workspaces (`apps/frontend`, `apps/backend` e `packages/shared`) de uma so vez.

---

## 3. Configure o ambiente

```bash
cp .env.example .env
```

O arquivo `.env.example` contem instrucoes detalhadas para cada variavel de ambiente. Para desenvolvimento local, os valores padrao ja funcionam sem alteracao — voce so precisa ajusta-los para deploy em producao.

> Nunca edite o `.env.example` diretamente; ele serve como template.

---

## 4. Inicie o modo desenvolvimento

```bash
npm run dev
```

Este unico comando sobe **dois servidores simultaneamente** usando o `concurrently` — nao e necessario abrir dois terminais:

| Servico | URL |
|---------|-----|
| Frontend (Next.js) | http://localhost:3000 |
| Backend (Express + Socket.IO) | http://localhost:3001 |

Abra http://localhost:3000 no navegador para acessar o jogo.

---

## 5. Rode os testes

```bash
npm run test
```

Executa todos os testes do projeto (frontend, backend e shared) com o Vitest.

---

## 6. Verificacao de tipos TypeScript

```bash
npm run typecheck
```

Compila os tipos de todos os pacotes sem gerar arquivos — util para verificar erros de tipagem antes de abrir um PR.

---

## 7. Scan de secrets (opcional)

```bash
npm run scan:secrets
```

Escaneia o codigo-fonte em busca de possiveis segredos expostos (chaves de API, tokens, etc.) usando o secretlint. Este scan tambem roda automaticamente no pre-commit via husky.

---

## Problemas comuns

**`npm install` falhou com erro de workspace:**
Certifique-se de estar na raiz do projeto (onde fica o `package.json` principal), nao dentro de um subdiretorio.

**A porta 3000 ou 3001 ja esta em uso:**
Encerre o processo que ocupa a porta antes de rodar `npm run dev`.

**Variaveis de ambiente ausentes:**
Confirme que o arquivo `.env` existe na raiz. Se nao existir, repita o passo 3.
