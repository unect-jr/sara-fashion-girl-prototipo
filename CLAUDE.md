# CLAUDE.md — Protótipo Sarah Fashion Girl (gestão de estoque consignado)

Protótipo **somente front-end**, com dados mockados, feito pela **Unect Jr.** (empresa júnior universitária)
para apresentar ao lead/cliente (Sarah Fashion Girl) na reunião de alinhamento. Será publicado na **Vercel**.
Objetivo: mostrar que entendemos a dor do cliente (controle de estoque em consignação) com um fluxo completo,
navegável e de altíssima qualidade visual, fiel ao Figma.

## Leia sob demanda (NÃO leia tudo toda vez)
- `docs/produto.md` — contexto do negócio, glossário, regras, dados mock e fluxos entre telas. Leia antes de implementar qualquer lógica ou fluxo.
- `docs/frontend.md` — fidelidade ao Figma, tokens, componentes, animações, acessibilidade, deploy. Leia antes de implementar qualquer UI.

## Comandos
- `npm run dev` — servidor Vite com HMR
- `npm run build` — `tsc -b` + build de produção em `dist/`
- `npm run lint` — ESLint
- `npm run preview` — serve o `dist/`
Sem test runner. Valide cada etapa com `npm run build`.

## Stack e armadilhas
- React 19 + TypeScript + Vite + `@vitejs/plugin-react`.
- Tailwind CSS v4 via `@tailwindcss/vite`. Não existe `tailwind.config.js`: tokens ficam em `src/index.css` com `@theme`.
- TypeScript estrito: sem locals/params não usados, `verbatimModuleSyntax` (use `import type`), `erasableSyntaxOnly` (sem `enum`, sem parameter properties, sem namespaces).
- Dependências permitidas além do template: `react-router`, `motion` (animações). Qualquer outra: pergunte antes.
- `src/App.css` e `src/assets/*` do template não são usados; remova quando for conveniente.

## Regras inegociáveis
1. **Figma é a fonte da verdade** (via MCP). Os PNGs em `design/` servem só de conferência visual. Nunca invente cor, fonte ou espaçamento que exista no Figma.
2. Todo texto da interface em **pt-BR**; moeda `R$ 1.234,56`, datas como `quinta-feira, 18 de setembro` (use `Intl`).
3. **Sem backend**. Estado em memória (Context + useReducer) com seed em `src/data/`; persistir em `localStorage` é opcional, com try/catch.
4. As telas precisam estar **conectadas pelo mesmo estado**: dar entrada de mercadoria, criar remessa ou registrar acerto atualiza Painel, Estoque, Vendedoras e Crediário.
5. Estados de **vazio, carregamento simulado e erro** nas listas e modais; nada de tela quebrada na demo.
6. Código em inglês, nomes de domínio em português (`Remessa`, `Vendedora`, `Acerto`, `Crediario`), comentários em português, sem `any`.

## Fluxo de trabalho com o Figma (por tela)
1. Receber o link do frame. Buscar o contexto de design desse frame pelo MCP do Figma (um frame por vez, nunca o arquivo inteiro).
2. Antes de codar algo grande, mostrar plano curto: componentes novos, reaproveitados, rota e dados. Esperar OK.
3. Implementar; reaproveitar componentes de `src/components/`.
4. Conferir contra o PNG correspondente em `design/` e rodar `npm run build`.
5. Responder só com a lista de arquivos criados/alterados e pendências.

## Economia de tokens
- Uma tela ou tarefa por sessão. Sugira `/clear` quando terminar.
- Não leia `node_modules/`, `dist/`, lockfiles nem os PNGs sem necessidade. Prefira Glob/Grep a ler arquivos inteiros.
- Não reescreva arquivos grandes para mudanças pequenas: edite só o trecho.
- Não crie documentação, testes ou arquivos extras que não foram pedidos.
- Respostas curtas; não repita o que já está nos docs.

## Git
Commits em português, conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`), um commit por tela ou marco.