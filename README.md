# Coup Online

Jogo de cartas Coup para jogar online com amigos. Crie uma sala, compartilhe o link e jogue direto do navegador — sem cadastro, sem instalação.

[![CI](https://github.com/JulianoMRA/Coup/actions/workflows/ci.yml/badge.svg)](https://github.com/JulianoMRA/Coup/actions/workflows/ci.yml)
![Node.js](https://img.shields.io/badge/node-%3E%3D24-brightgreen)

## Visão geral

Monorepo com frontend React/Next.js e backend Express + Socket.IO. Comunicação em tempo real via WebSocket. Estado do jogo em memória — sem banco de dados. Tipos TypeScript compartilhados entre frontend e backend via pacote `packages/shared`.

## Quick start

```bash
git clone https://github.com/JulianoMRA/Coup.git
cd Coup
npm install
cp .env.example .env
npm run dev
```

Acesse `http://localhost:3000` no navegador. Para instruções detalhadas, veja o guia de instalação.

## Documentação

- [Instalação e Execução Local](docs/INSTALL.md)
- [Arquitetura do Sistema](docs/ARCHITECTURE.md)
- [Como Contribuir](docs/CONTRIBUTING.md)
- [Deploy em Produção](docs/DEPLOY.md)

## Stack tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js, React, Tailwind CSS |
| Backend | Express, Socket.IO |
| Linguagem | TypeScript |
| Testes | Vitest |
| Monorepo | npm workspaces |
