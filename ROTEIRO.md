# Roteiro do protótipo — Sarah Fashion Girl

> Gestão de estoque em consignação · protótipo navegável feito pela **Unect Jr.**
> Este documento explica o fluxo completo, o raciocínio por trás de cada funcionalidade e como apresentar o protótipo na reunião de alinhamento.

---

## 1. Por que este protótipo existe

A Sarah Fashion Girl vende por **consignação**: as peças saem do estoque central em **remessas** para as **vendedoras**, que vendem para as clientes delas e depois voltam para fazer o **acerto** (devolvem o que não vendeu e pagam o que vendeu, já descontada a comissão). Parte das clientes compra **parcelado no crediário**.

O resultado é um estoque espalhado: uma parte na loja, outra "na rua", dividida entre várias vendedoras. Quando esse controle fica no papel, na planilha ou no WhatsApp, quatro perguntas ficam difíceis de responder:

| # | Pergunta do dia a dia | Onde o protótipo responde |
|---|---|---|
| 1 | **Quantas peças eu tenho e onde elas estão?** | Painel → "Onde está o estoque"; Estoque (central × na rua por modelo) |
| 2 | **Quem está com acerto atrasado e quanto dinheiro está parado?** | Painel → "Acertos pendentes" e "Precisa de atenção"; Vendedoras; Remessas |
| 3 | **O que saiu, o que voltou e o que foi vendido bate?** | Remessa (romaneio item a item) e o acerto, que não aceita número que não feche |
| 4 | **Quais parcelas do crediário estão vencendo ou vencidas?** | Painel → "A receber das clientes" e alerta de parcelas vencidas |

**Princípio que guiou tudo:** abrindo o Painel, a dona da marca tem essas respostas **em poucos segundos**, sem precisar somar nada.

Este protótipo **não é o produto final**. É uma prova de que entendemos o negócio: tem dados de exemplo, roda só no navegador e não tem login nem servidor. Mesmo assim, ele se comporta como um sistema de verdade: as ações mudam os números em todas as telas.

---

## 2. Jornada de demonstração (≈ 3 minutos)

Sequência sugerida para a reunião. Os dados de exemplo são gerados **a partir da data de hoje**, então em qualquer dia em que a demo for aberta haverá remessa atrasada, remessa vencendo hoje e remessa em dia.

1. **Painel** — "Aqui está o estoque inteiro: tantas peças no central, tantas na rua com as vendedoras, quanto isso vale." Mostrar a faixa central × rua e as medidas do mês (vendido, comissão, a receber).
2. **Acertos pendentes** — apontar a linha **carmim** da Rosângela: "esse acerto está atrasado há 7 dias; sem o sistema, ninguém perceberia."
3. **Abrir a vendedora** (clicar no nome) — ver as peças em poder dela, o valor consignado, as remessas abertas e o histórico.
4. **Abrir a remessa** — ver o romaneio: cada modelo, a grade de tamanhos enviada, quantidade e subtotal.
5. **Fazer acerto** — informar quantas peças de cada item foram vendidas. O sistema mostra na hora: valor vendido − comissão = **valor a receber**. Escolher a forma de pagamento e confirmar.
6. **Ver o efeito** — voltar ao Painel: a remessa saiu da lista de pendentes, as peças devolvidas voltaram ao central, "vendido no mês" e "comissão" subiram. No **Estoque**, as quantidades dos modelos mudaram.
7. (Se houver tempo) **Nova remessa** — escolher vendedora, peças e prazo; o estoque central baixa e a vendedora passa a ter as peças "em poder dela".
8. (Se houver tempo) **Entrada de mercadoria** a partir do alerta "Repor" do Painel — a grade do produto já vem selecionada.

> **Dica para a demo:** o estado fica salvo no navegador durante o dia. Para recomeçar do zero, basta abrir em uma aba anônima. Em outro dia, os dados de exemplo são refeitos automaticamente.

---

## 3. Conceitos (glossário rápido)

- **Peça / Produto**: um modelo de roupa (ex.: Vestido midi floral), com código (SKU), preço de venda, preço de custo e variações de **tamanho** (PP a GG) e **cor**.
- **Estoque central**: o que está fisicamente na loja/depósito.
- **Na rua**: o que está com as vendedoras, em remessas ainda não acertadas.
- **Entrada de mercadoria**: chegada de peças ao central (compra ou produção).
- **Remessa**: envio de um conjunto de peças a uma vendedora, com data de saída e **prazo de acerto**.
- **Acerto**: prestação de contas de uma remessa. Pode ser parcial.
- **Comissão**: percentual da vendedora sobre o que ela vendeu (25% nos dados de exemplo).
- **Crediário**: venda parcelada para a cliente final, com parcelas mensais.

---

## 4. Regras de negócio que o protótipo segue

Escolhemos regras simples e visíveis, para que o sistema **impeça erros em vez de só registrá-los**.

| Regra | Como funciona no protótipo | Por que pensamos assim |
|---|---|---|
| Estoque total | central + na rua | É a resposta para "quanto eu tenho" sem esquecer o que está com as vendedoras. |
| Criar remessa | as peças saem do central e passam a contar "na rua" para aquela vendedora | Uma peça nunca está em dois lugares ao mesmo tempo. |
| Limite da remessa | não dá para enviar mais do que existe no central; só aparecem variações com saldo | Evita prometer peça que não existe. |
| Prazo de acerto | padrão de 30 dias, editável, sempre depois de hoje | Todo envio já nasce com uma data de cobrança. |
| Acerto | para cada item: vendida + devolvida nunca passa do que está com a vendedora | É assim que "o que saiu, voltou e vendeu" sempre fecha. |
| Valor do acerto | Σ(vendidas × preço) − comissão = valor a receber | O cálculo aparece antes de confirmar, para conferir junto com a vendedora. |
| Fechamento da remessa | **aberta** (nada acertado) → **parcial** → **fechada** (tudo acertado) | Permite acertos em etapas sem perder o controle. |
| Status por prazo | prazo passou = **atrasado** (carmim); é hoje = **vence hoje** (âmbar); falta = **em dia** (azul-marinho) | Mesma regra e mesmas cores em remessas, vendedoras e parcelas: aprende-se uma vez. |
| Estoque baixo | alerta quando uma variação tem **3 unidades ou menos** no central | Sinaliza reposição antes de faltar. |
| Crediário | parcelas mensais; vencida há mais de 15 dias vira alerta no Painel | Separa "atrasou um pouco" de "precisa cobrar". |
| Remessa parada | peças fora há mais de 30 dias sem acerto viram alerta | Dinheiro parado é tão importante quanto atraso. |

---

## 5. Tela a tela: o que tem e o que pensamos

### 5.1 Painel (tela inicial)

**Objetivo:** ser a "tela de abrir o dia". Tudo que exige ação aparece aqui, já priorizado.

- **Cabeçalho com a data de hoje por extenso** (ex.: "segunda-feira, 19 de outubro") e três atalhos: **Entrada de mercadoria**, **Registrar recebimento** e **Nova remessa** (ação principal, em destaque).
- **Onde está o estoque**
  - Uma faixa dividida mostra a proporção **central × na rua**, com quantidade de peças e valor (o central em preço de **custo**, a rua em valor **consignado**, que é o que deveria voltar em dinheiro ou peça).
  - Tira de medidas do mês: **vendido no mês** (peças e R$), **comissão a pagar** e **a receber das clientes** (com o valor em atraso destacado em carmim).
  - *Por quê:* responde à pergunta nº 1 com um olhar, e separa custo de valor de venda para não inflar a percepção do estoque parado.
- **Acertos pendentes**
  - Lista de remessas abertas ordenada **pela mais urgente**, com vendedora, peças, valor, prazo ("atrasado há 7 dias", "vence hoje", "faltam 5 dias") e um botão **Fazer acerto** cuja cor acompanha a urgência.
  - O nome da vendedora leva ao detalhe dela; o rodapé leva à tela de Remessas.
  - *Por quê:* a ordem por prazo transforma a lista em uma fila de trabalho: comece de cima.
- **Precisa de atenção**
  - Alertas calculados automaticamente: parcelas vencidas há mais de 15 dias, peças fora há mais de 30 dias e tamanhos zerados no central (com o modelo que mais tem peças na rua em destaque).
  - Cada alerta tem uma ação direta: *Ver no crediário*, *Ver peças*, *Repor* (que abre a Entrada de mercadoria já com aquele produto).
  - Quando não há nada, aparece "Tudo em ordem".
  - *Por quê:* o sistema aponta o problema e já oferece o próximo passo, sem obrigar a pessoa a procurar.

### 5.2 Estoque

**Objetivo:** ver cada modelo, quanto há de cada tamanho e onde está.

- Subtítulo com o resumo: total de peças, número de modelos, quanto no central e quanto na rua.
- **Grade de cards de produto** (fiel às variantes do card no Figma), cada um com foto (ou placeholder com a inicial), SKU, preço, barra central × rua, **grade por tamanho** (tamanhos zerados aparecem apagados) e o **giro** (vendidas nos últimos 30 dias).
- **Etiquetas automáticas:** **TUDO NA RUA** (nada no central, mas há peças com vendedoras) e **REPOR** (algum tamanho esgotado no central).
- **Busca** por nome ou SKU (ignora acentos), **filtros** por categoria e tamanho, e o atalho **só estoque baixo**.
- **Modal Entrada de mercadoria:** fornecedor, nota fiscal, data, volumes recebidos e uma lista de peças, cada uma com cor e quantidade por tamanho. Valida campos obrigatórios e exige ao menos uma peça.
- **Modal Novo produto:** nome, categoria, custo, preço de venda, cores e grade inicial. O **SKU é gerado sozinho** pela categoria (ex.: VST-0313 para vestido). O produto novo aparece no topo da grade.
- *Por quê:* em roupa, o que falta quase nunca é "o modelo", e sim "o tamanho M do modelo". Por isso a grade por tamanho fica visível no próprio card, sem precisar abrir nada.

### 5.3 Vendedoras

**Objetivo:** saber quem está com o quê e quem precisa ser cobrada.

- Subtítulo: vendedoras ativas, peças em poder delas e valor consignado.
- **Card por vendedora:** iniciais, nome, região, **em poder dela** (peças e R$), **vendido no mês**, **comissão do mês**, último acerto e um traço colorido com o status da remessa mais urgente.
- **Filtros:** busca por nome, região, situação (acerto atrasado, vence hoje, em dia, sem remessa aberta) e o atalho **só com acerto vencido**. A tela também pode ser aberta já filtrada pelos atrasos.
- **Exportar CSV** da lista filtrada (abre no Excel).
- **Nova vendedora** (nome, região, telefone, comissão) e **Nova remessa** direto da tela.
- **Detalhe da vendedora:** resumo, **remessas abertas** (com botão de acerto) e **histórico** das remessas acertadas. O botão **Nova remessa** já vem com ela selecionada.
- *Por quê:* a relação com cada vendedora é pessoal; a tela foi pensada para a conversa de cobrança ("você está com 23 peças, R$ 2.180 consignados, e o prazo venceu na semana passada").

### 5.4 Remessas

**Objetivo:** acompanhar cada envio do começo ao fim.

- Subtítulo: remessas em aberto, peças na rua e valor consignado.
- **Lista** com as abertas primeiro (pela urgência do prazo) e depois as acertadas mais recentes. Etiquetas: **ATRASADA**, **VENCE HOJE**, **EM ABERTO**, **ACERTADA**.
- Cada remessa **expande** e mostra o **romaneio**: modelo, grade por tamanho, quantidade e subtotal.
- **Filtros:** busca por número ou vendedora, vendedora, mês e "só em aberto". Rodapé com o resumo do período.
- **Imprimir romaneios** (para a vendedora conferir e assinar na saída) e **Nova remessa**.
- **Modal Nova remessa:** vendedora → peças (só as que têm saldo no central, mostrando quanto há) e quantidades → prazo. O rodapé mostra em tempo real o total de peças e o valor consignado. Mensagens claras quando algo não fecha (ex.: "Só há 2 de Vestido midi floral · M · Floral no central").
- **Detalhe da remessa:** romaneio aberto, datas de saída e prazo, link para a vendedora e a lista de acertos registrados.
- *Por quê:* a remessa é o "documento" da consignação. Ter o romaneio sempre à mão substitui o papel e acaba com a dúvida sobre o que foi entregue.

### 5.5 Acerto (modal, a partir do Painel, da vendedora ou da remessa)

> Não havia tela de acerto no Figma: **é uma proposta da Unect**, construída na mesma linguagem visual.

- Mostra a vendedora, a remessa, quantas peças ela ainda tem e a situação do prazo.
- Para cada item, informa-se **quantas foram vendidas**; o restante é tratado como **devolvido** e volta ao estoque central.
- O rodapé calcula na hora: *peças vendidas · valor bruto − comissão = valor a receber*.
- Forma de pagamento: Pix, dinheiro, cartão ou crediário.
- Ao confirmar: a remessa é fechada, o estoque central é atualizado, o acerto entra no histórico e todas as telas recalculam.
- *Por quê:* na prática, o acerto acontece com a vendedora na frente. Por isso pedimos o mínimo (só as vendidas) e mostramos o valor antes de confirmar, para os dois conferirem juntos.

### 5.6 Acertos e Crediário (telas próprias)

- **Status atual:** as rotas existem no menu, mas as telas próprias de **Acertos** (histórico de todos os acertos) e **Crediário** (lista de vendas parceladas e parcelas por status) ainda estão marcadas como *"em construção"*.
- A lógica já está pronta por trás: os dados de crediário alimentam o Painel (valor a receber, valor em atraso, alerta de parcelas vencidas) e a ação de **marcar parcela como paga** já existe no estado do sistema.
- **Proposta para a tela de Crediário:** lista de vendas parceladas por cliente e vendedora, parcelas com as mesmas cores de status, botão "marcar como paga" que atualiza o saldo e o Painel na hora.
- **Na demo:** evitar clicar em *Registrar recebimento* e *Ver no crediário*, ou apresentá-los como "próximo passo", até essas telas ficarem prontas.

---

## 6. Tudo conectado: o que cada ação muda

O pedido principal era que as telas **conversem entre si**. Toda ação passa por um único "cérebro" do sistema, e todas as telas leem dele.

| Ação | Painel | Estoque | Vendedoras | Remessas |
|---|---|---|---|---|
| **Entrada de mercadoria** | sobe "central" e o custo; alertas de reposição somem se o tamanho for reposto | quantidades por tamanho e etiquetas (REPOR) atualizam | — | novas peças ficam disponíveis para envio |
| **Novo produto** | entra na contagem do central | aparece no topo da grade, com SKU gerado | — | disponível para remessa |
| **Nova vendedora** | — | — | aparece na lista, pronta para receber remessa | disponível no filtro e no modal |
| **Nova remessa** | central ↓, na rua ↑, nova linha em "Acertos pendentes" | central do modelo ↓, "na rua" ↑ | "em poder dela" ↑, traço de status atualizado | nova remessa no topo das abertas |
| **Registrar acerto** | sai dos pendentes; vendido e comissão do mês ↑; devolvidas voltam ao central | devolvidas voltam; giro de 30 dias ↑ | em poder ↓, vendido e comissão do mês ↑, último acerto | vira ACERTADA, acerto aparece no detalhe |

Os números grandes do Painel **sobem ou descem com animação** quando mudam, para deixar claro que algo aconteceu.

---

## 7. Qualidade: nada de tela quebrada na demo

- **Carregamento simulado:** as listas mostram um esqueleto rápido ao abrir, como um sistema online faria.
- **Salvando…:** os botões dos modais mostram o estado de envio por um instante, e depois aparece uma **mensagem de confirmação** discreta (ex.: "Remessa RM-0154 criada · 12 peças com Cleide Antunes").
- **Estados vazios com orientação:** "Nenhum modelo encontrado" com botão *Limpar filtros*; "Nenhuma remessa aberta" com botão *Criar remessa*; "Tudo em ordem" quando não há alertas.
- **Erros tratados:** validação visível nos formulários (campos obrigatórios, quantidade maior que zero, sem exceder o estoque, prazo depois de hoje); páginas de vendedora ou remessa inexistentes mostram aviso com caminho de volta; endereço inválido cai em "Página não encontrada".
- **Dados resilientes:** se o navegador bloquear o armazenamento (aba privada, por exemplo), a demo continua funcionando em memória.

---

## 8. Design e experiência

- **Fiel ao Figma** feito pela diretoria de Design da Unect: cores, fontes, espaçamentos, raios e sombras foram extraídos do arquivo e viraram tokens únicos usados em todas as telas.
- **Linguagem visual:** fundo off-white, cards brancos arredondados, menu lateral com a marca, botões em pílula (carmim para a ação principal), rótulos pequenos em caixa alta.
- **Cores com significado, sempre as mesmas:** carmim = atrasado, âmbar = vence hoje, azul-marinho = em dia / na rua.
- **Animações sutis** (biblioteca *motion*): entrada suave das páginas, listas que aparecem em cascata, modais que abrem com leve escala, números que contam ao mudar. Quem prefere menos movimento (configuração do sistema operacional) recebe a versão sem animação.
- **Português do Brasil em tudo:** moeda `R$ 1.234,56`, datas por extenso, plurais corretos ("1 peça", "12 peças").
- **Acessibilidade:** botões de verdade, foco visível, modais que fecham com Esc, rótulos para leitores de tela e números alinhados em colunas.
- **Imagens locais** dos produtos, exportadas do Figma; sem dependência de imagens externas.

---

## 9. Por trás das telas (resumo técnico)

Para quem quiser saber como foi construído:

- **React 19 + TypeScript + Vite**, estilização com **Tailwind CSS v4**; publicado na **Vercel**.
- **Estado único** (Context + useReducer): cada ação (entrada, remessa, acerto…) é uma função pura que valida as regras de negócio antes de mudar qualquer número. Se a regra não fecha, nada muda.
- **Dados de exemplo relativos a hoje:** ~24 produtos, 6 vendedoras, remessas abertas com prazos de −7, 0, +5, +14 e +17 dias, acertos de histórico e 3 crediários. Assim a demo sempre mostra os três status.
- **Persistência leve no navegador**, válida no mesmo dia.
- Código organizado por domínio (`Remessa`, `Vendedora`, `Acerto`, `Crediario`), o que facilita evoluir para o produto final com backend.

---

## 10. Premissas para validar na reunião

Assumimos algumas coisas razoáveis que precisam da confirmação da Sarah Fashion Girl:

1. Hoje o controle é feito em papel, planilha ou WhatsApp?
2. A comissão é **a mesma para todas** as vendedoras (25%) ou varia por vendedora, por peça ou por meta?
3. O prazo padrão de acerto é **30 dias**?
4. O acerto costuma ser **de uma vez** ou em partes ao longo do mês?
5. **3 unidades** é um bom limite para o alerta de estoque baixo? Varia por modelo?
6. Quem vende no crediário: a marca ou a vendedora? Quem assume o risco da parcela não paga?
7. Quantas vendedoras e quantos modelos ativos existem hoje, em média?
8. Há necessidade de as próprias vendedoras acessarem o sistema (pelo celular, por exemplo)?

---

## 11. Próximos passos sugeridos

**No protótipo (antes ou logo após a reunião):**
- Telas de **Acertos** (histórico, filtros por período e vendedora) e **Crediário** (parcelas por status, marcar como paga, lançar saldo do acerto no crediário).
- Menu recolhível no celular.

**Para o produto final (MVP), a discutir:**
- Login e perfis de acesso (dona, gerente, vendedora).
- Banco de dados e acesso de vários aparelhos ao mesmo tempo.
- Acesso da vendedora pelo celular para conferir a remessa e informar vendas.
- Envio do romaneio e lembrete de prazo pelo WhatsApp.
- Relatórios: giro por modelo, ranking de vendedoras, inadimplência do crediário.
- Leitura de código de barras/etiqueta na entrada e no acerto.

---

*Feito pela Unect Jr.: Comercial, Design, Desenvolvimento, Projetos e Presidência.*
