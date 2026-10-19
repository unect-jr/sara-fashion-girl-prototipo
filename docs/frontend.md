# Frontend — qualidade, fidelidade e animações

## 1. Fidelidade ao Figma
- O MCP do Figma é a fonte da verdade. Os PNGs em `design/` conferem o resultado final.
- **Etapa de fundação (antes das telas):** extrair do Figma cores, tipografia, raios, sombras e espaçamentos e declarar em `src/index.css` com `@theme` (ex.: `--color-carmim`, `--color-ambar`, `--color-marinho`, `--color-bege`, `--font-display`, `--font-sans`). Todas as telas usam esses tokens; proibido valor "mágico" repetido nos componentes.
- Se o Figma e a skill `frontend-design` divergirem, **vence o Figma**: a skill orienta qualidade e acabamento, não troca a identidade do cliente.
- Linguagem visual observada: fundo off-white/bege, cards brancos arredondados, sidebar à esquerda com o wordmark "SARAH fashion girl", botões em pílula (primário carmim, secundário contornado), rótulos pequenos em caixa alta com espaçamento entre letras, cores de status consistentes (carmim = atrasado, âmbar/marrom = vence hoje, azul-marinho = em dia / na rua).
- Quando faltar algo no Figma (estados de hover, vazio, erro), derive dos tokens existentes e mantenha o mesmo tom.

## 2. Estrutura
```
src/
  components/   ui/ (Button, Pill, Badge, Modal, Input, Select, Card...) e blocos de domínio
  pages/        Painel, Estoque, Vendedoras, Remessas, Acertos, Crediario
  layouts/      AppLayout (sidebar + área de conteúdo)
  store/        Context + useReducer, ações e seletores
  data/         types.ts, seeds e seed.ts
  lib/          format.ts (moeda, datas), status.ts (cálculo de status por prazo)
```
Componentes pequenos e tipados. Um componente por arquivo. Reaproveitar antes de criar.

## 3. Ordem de implementação (um commit por marco)
1. Tokens + layout (sidebar, cabeçalho com data de hoje por extenso) + rotas.
2. Componentes base: Pílula (com os estados do Figma), Badge de status, Card, Modal, campos.
3. Store + seed + utilitários de formatação e status.
4. Painel.
5. Estoque + card de produto (todas as variantes) + modais Entrada de mercadoria e Novo produto.
6. Vendedoras (lista + detalhe).
7. Remessas (lista + criar + detalhe).
8. Acertos e Crediário (sem mockup; mesma linguagem visual).
9. Polimento: animações, estados vazio/erro, responsividade, acessibilidade.
10. Deploy na Vercel.

## 4. Animações (biblioteca `motion`, `import { motion } from "motion/react"`)
Objetivo: sensação profissional e viva **sem alterar o layout do Figma**. Só `motion`; **não** usar GSAP, Lenis nem 3D neste protótipo.
- Transição entre páginas: fade + leve deslocamento vertical (≈ 8–12 px), 200–300 ms.
- Listas e grades: entrada em cascata (stagger de 30–50 ms) ao carregar.
- Modais: overlay com fade; painel com escala sutil (0.96 → 1) e saída animada (`AnimatePresence`).
- Cards e pílulas: hover com elevação leve e `whileTap` com escala 0.97.
- Indicadores do Painel: contagem animada dos números (uma vez, na entrada).
- Mudança de status/quantidade: transição suave de cor e número; item novo entra, item removido sai.
- Easing suave (ex.: `[0.22, 1, 0.36, 1]`), durações entre 150 e 400 ms. Nada que bloqueie o uso.
- Respeitar `prefers-reduced-motion`: envolver o app em `<MotionConfig reducedMotion="user">`.
- Animar só `transform` e `opacity` quando possível, para manter fluidez.

## 5. Qualidade e acabamento
- Estados completos: vazio, carregando (skeleton ou spinner curto simulando latência), erro e sucesso (toast discreto após ações).
- Formulários com validação visível (quantidade > 0, não exceder estoque, campos obrigatórios) e foco gerenciado nos modais.
- Responsivo: layout desktop primeiro (back-office), mas legível em tablet e celular (sidebar vira menu recolhível).
- Acessibilidade: elementos semânticos, `button` de verdade, `aria-label` em ícones, foco visível, contraste suficiente nas cores de status, modais com `role="dialog"` e fechamento por Esc.
- Tipografia e números: `tabular-nums` em valores monetários e tabelas; truncar textos longos com elegância.
- Sem erros ou avisos no console. Sem dependências não aprovadas.

## 6. Deploy (Vercel)
- App estático (SPA). Criar `vercel.json` para as rotas do React Router funcionarem ao recarregar a página:
  `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
- Build: `npm run build`, saída `dist/`, framework "Vite". Conectar o repositório do GitHub na Vercel e fazer deploy a cada `push` na `main`.
- Antes do deploy: `npm run build` e `npm run lint` sem erros; abrir `npm run preview` e percorrer a jornada de demonstração.

## 7. Checklist de pronto (por tela)
- [ ] Confere com o PNG do Figma (espaçamento, cores, tipografia).
- [ ] Usa só tokens do `@theme`.
- [ ] Dados vêm do store e atualizam as outras telas.
- [ ] Estados vazio/erro/loading tratados.
- [ ] Animações aplicadas e respeitando reduced motion.
- [ ] Teclado e leitor de tela razoáveis.
- [ ] `npm run build` passa.