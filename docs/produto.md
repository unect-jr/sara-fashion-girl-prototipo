# Produto — contexto, regras e fluxos

> Itens marcados com **[CONFIRMAR]** são premissas razoáveis, ainda não validadas com o cliente. Itens **[PREENCHER]** dependem de informação do time.

## 1. Contexto da Unect Jr.
- A Unect Jr. é uma empresa júnior universitária que desenvolve soluções de software para clientes reais.
- Diretorias envolvidas: Comercial (trouxe o lead e pediu o protótipo feito com IA, agentes e skills), Design (criou as telas no Figma), Desenvolvimento (implementa o front), Projetos e Presidência (alinhamento).
- [PREENCHER] Nome do contato do lead, data da reunião de alinhamento e o que a Unect quer fechar com ela (proposta, escopo de MVP etc.).
- Este protótipo **não é o produto final**: é uma prova de entendimento. Precisa parecer um sistema de verdade e contar a história do problema resolvido.

## 2. O cliente: Sarah Fashion Girl
- Marca de roupas femininas que vende por **consignação**: a peça sai do estoque central em **remessas** para **vendedoras** (revendedoras), que vendem e depois fazem o **acerto**.
- As clientes das vendedoras podem comprar parcelado (**crediário**).
- [PREENCHER] Perfil da marca, público, tom de voz e estética, a partir do Instagram (cores, estilo de fotos, linguagem). Isso orienta textos de exemplo e imagens, mas **o Figma manda no visual**.

## 3. A dor principal
O estoque está espalhado: parte na loja, parte "na rua" com várias vendedoras. Hoje o controle tende a ser manual (papel, planilha, WhatsApp) **[CONFIRMAR]**, o que causa:
1. Não saber **quantas peças existem e onde estão** (central vs. com cada vendedora).
2. Acertos **atrasados** sem ninguém perceber, e dinheiro parado.
3. Divergência entre o que foi enviado, devolvido e vendido.
4. Dificuldade de acompanhar parcelas do crediário.
O protótipo deve deixar essas respostas visíveis em segundos no **Painel**.

## 4. Glossário
- **Peça / Produto**: item de roupa, com variações de tamanho e cor.
- **Entrada de mercadoria**: chegada de peças ao estoque central (compra/produção).
- **Remessa**: envio de um conjunto de peças a uma vendedora, com data de saída e prazo de acerto.
- **Vendedora**: revendedora que recebe remessas em consignação e vende.
- **Acerto**: fechamento de uma remessa. A vendedora devolve as não vendidas e paga as vendidas, descontada a comissão.
- **Comissão**: percentual que fica com a vendedora sobre o valor vendido **[CONFIRMAR]** (usar 30% no mock).
- **Crediário**: venda parcelada ao cliente final, com parcelas e vencimentos.
- **Na rua**: peças que estão com vendedoras (remessas abertas).

## 5. Regras de negócio (mock)
- Estoque total = estoque central + peças na rua.
- Criar remessa: baixa do estoque central e soma em "na rua" daquela vendedora. Não pode exceder o estoque disponível.
- Registrar acerto de uma remessa: para cada item, informar quantidade **devolvida** (volta ao central) e **vendida** (gera valor). Devolvida + vendida ≤ enviada; o restante fica pendente.
- Valor a receber do acerto = Σ(vendidas × preço) − comissão. Remessa fecha quando tudo foi acertado.
- **Status por prazo** (usado em remessas, acertos e parcelas), comparando o prazo com "hoje":
  - prazo < hoje → **atrasado** (carmim)
  - prazo = hoje → **vence hoje** (âmbar/marrom)
  - prazo > hoje → **em dia** (azul-marinho)
- Crediário: venda dividida em N parcelas mensais; marcar parcela como paga atualiza o saldo e o status.
- Alerta de estoque baixo quando uma peça tiver ≤ 3 unidades no central **[CONFIRMAR]**.

## 6. Modelo de dados (TypeScript, em `src/data/types.ts`)
`Produto` (id, nome, categoria, preco, variacoes[{tamanho, cor, quantidadeCentral}]), `Vendedora` (id, nome, telefone, cidade, comissao, ativa), `Remessa` (id, vendedoraId, dataSaida, prazoAcerto, itens[{produtoId, variacao, enviada, devolvida, vendida}], status), `Acerto` (id, remessaId, data, valorBruto, comissao, valorAReceber, formaPagamento), `Crediario` (id, cliente, vendedoraId, valorTotal, parcelas[{numero, valor, vencimento, paga}]).
Sem `enum`: use union types de string.

## 7. Dados mock
- Seed em `src/data/` (um arquivo por entidade + `seed.ts` que monta tudo).
- Volume: ~24 produtos (roupas femininas realistas: vestidos, blusas, calças, saias), 6 vendedoras com nomes brasileiros, 8 remessas, 4 acertos, 3 crediários com parcelas.
- **Datas relativas a hoje** (ex.: -5, -1, 0, +3, +10 dias) para que a demo sempre mostre os três status, independentemente do dia em que for aberta.
- Imagens: usar as exportadas do Figma em `public/produtos/`; se não houver, placeholder neutro com a inicial do produto. Nada de imagens remotas.

## 8. Fluxos entre telas (o que "fluxo completo" significa)
1. **Painel**: indicadores (peças em estoque, na rua, acertos atrasados, a receber, crediário em aberto), lista de acertos por status, atalhos para "Nova remessa" e "Entrada de mercadoria". Cada indicador leva à tela correspondente já filtrada.
2. **Estoque**: grade de produtos (variantes do card de produto do Figma), busca, filtros (categoria, estoque baixo), modais **Entrada de mercadoria** e **Novo produto**. Salvar atualiza quantidades e o Painel.
3. **Vendedoras**: lista com status, peças na rua e saldo a pagar; detalhe da vendedora com remessas abertas e histórico; ação "Nova remessa" para ela.
4. **Remessas**: lista com status por prazo; criar remessa (escolher vendedora → itens e quantidades → prazo); abrir remessa para ver itens; botão "Registrar acerto".
5. **Acertos** (sem mockup): fluxo de registrar acerto de uma remessa, resumo do valor e opção de lançar saldo em crediário. Construir na mesma linguagem visual, reutilizando componentes. **[Sinalizar ao time como proposta, pois não existe no Figma.]**
6. **Crediário** (sem mockup): lista de vendas parceladas, parcelas por status, marcar parcela como paga.
Jornada de demonstração ideal (3 min): Painel mostra acerto atrasado → abre vendedora → vê remessa → registra acerto → estoque e Painel atualizam.

## 9. Fora de escopo
Autenticação real, backend/API, integração com pagamento, relatórios exportáveis, multiusuário, testes automatizados.