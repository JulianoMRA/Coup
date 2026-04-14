# Como Contribuir

Obrigado por contribuir com o Coup Online! Este guia cobre o que você precisa saber para colaborar de forma consistente com o projeto.

## Setup local

Para configurar o ambiente de desenvolvimento, siga as instruções em [Instalação e Execução Local](INSTALL.md).

## Convenções de código

- TypeScript em todo o projeto — evite `any`
- Testes são obrigatórios para novas funcionalidades (Vitest)
- Siga o estilo existente: `camelCase` para variáveis e funções, `PascalCase` para tipos e componentes

## Padrão de commits

O projeto usa **Conventional Commits**. Exemplos:

```
feat: adiciona timer na janela de reacao
fix: corrige desconexao durante troca de cartas
chore: atualiza dependencias
refactor: extrai logica de validacao para helper
test: adiciona testes para o fluxo de bloqueio
```

O formato é `tipo: descrição em minúsculas, sem ponto final`.

## Hooks automáticos

O projeto usa **husky** com **secretlint** no pre-commit. O hook roda automaticamente a cada commit e verifica se nenhum secret foi commitado acidentalmente.

> **NUNCA use `git commit --no-verify`** — isso desabilita a única proteção automática contra vazamento de secrets no repositório.

## Antes de abrir um PR

Execute os dois comandos abaixo e certifique-se de que ambos passam sem erros:

```bash
npm run typecheck
npm run test
```

O CI roda os mesmos checks — se falharem localmente, vão falhar no CI também.

## Fluxo de Pull Request

1. Crie uma branch com nome descritivo (ex: `feat/timer-reacao`, `fix/desconexao-troca`)
2. Faça commits atômicos seguindo Conventional Commits
3. Abra um PR com descrição clara do que muda e por que
4. Aguarde todos os checks (CI) passarem
5. Solicite review e aguarde aprovação antes do merge
