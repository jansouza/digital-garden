---
layout: post
title: "Do token ao dólar: estimando o custo da IA generativa"
date: 2026-09-25 10:00:00 -0300
categories: [homelab]
tags: [observabilidade, opentelemetry, openllmetry, llm, ia, ia-generativa, finops, prometheus, grafana, homelab, devops]
stage: growing
description: "Continuação do lab de observabilidade para LLMs: cruzando o consumo de token com a tabela de preço de cada modelo para responder quanto a IA generativa está custando, em qual modelo e para qual tarefa."
---

No [post anterior]({% post_url 2026-09-22-observabilidade-para-llms-com-openllmetry-no-homelab %})
instrumentei com OpenLLMetry as aplicações que chamam LLMs e levei os traces
e as métricas para a stack de observabilidade que já existia no homelab. Com
isso passei a enxergar quanto token cada chamada gasta, em qual modelo, com
que latência e para qual tarefa. E terminei com uma pendência: o lab media
token, não dinheiro. Faltava responder "quanto isso custou" e "esse modelo
caro compensa".

Neste post eu fecho essa conta, mas com uma ressalva: o valor é uma
estimativa. No meu caso, as chamadas passam por uma plataforma da IBM
(baseada no LiteLLM) que dá acesso aos modelos, então eu não pago por token
diretamente. E nas
empresas costuma ser parecido: o custo vem de contrato, licença, cota ou
rateio interno, e raramente bate com a tabela de preço do provedor. A ideia
aqui não é reproduzir a fatura, e sim traduzir tokens em dinheiro, a
unidade que todo mundo entende.

Usando o preço de lista de cada modelo, os nove dias de dados do homelab —
2.326 chamadas e 4,6 milhões de tokens — dariam uns US$ 22,50. O que me pegou foi outra coisa: quando coloquei
preço em cima dos tokens, boa parte das conclusões que eu tinha tirado
olhando só o volume caiu por terra.

![Visão geral do dashboard de custo de LLM no Grafana, com custo estimado, custo de entrada e saída, custo médio por requisição, projeção de 30 dias, gasto por dia por provedor e a linha mensal com gasto acumulado e projeção de fechamento](/assets/images/openllmetry-cost-lab/dashboard-custo-overview.png)

## Token não é dinheiro

Parece óbvio escrito assim, mas é fácil esquecer quando o único número no
dashboard é quantidade de token. Três coisas mudam a conta:

1. **Cada modelo tem seu preço.** Entre o modelo mais barato e o mais caro
   da minha tabela, a diferença de preço por token passa de 100 vezes.
2. **Entrada e saída custam diferente.** Na maioria dos provedores o token
   de saída custa de 4 a 8 vezes o de entrada. No meu lab, a saída foi 20%
   dos tokens e **54% do custo**.
3. **Quem define o volume é a tarefa, não o modelo.** Uma tarefa que manda
   muito contexto e pede resposta curta tem um perfil de custo completamente
   diferente de uma que gera texto longo.

O OpenLLMetry não emite nenhuma métrica de custo — e faz sentido que não
emita, porque preço é coisa que muda, varia por contrato e depende de
desconto. O que ele entrega é a quantidade, separada por modelo e por tipo
de token. O preço tem que vir de outro lugar.

## A tabela de preço

A tabela de preço fica num YAML versionado junto com o resto da
configuração do homelab, uma linha por modelo:

```yaml
models:
  - {model: claude-haiku-4-5, provider: bedrock, tier: 1, input: 1, output: 5}
  - {model: claude-opus-4-6, provider: bedrock, tier: 4, input: 5, output: 25}
  - {model: gpt-5.6-luna, provider: openai, tier: 0, input: 0.2, output: 1.2}
  # ... preço em dólar por milhão de tokens, entrada e saída
```

Um script em Python gera a partir dele as regras do Prometheus: o preço de
cada modelo e tipo de token vira uma série constante,
`llm_price_usd_per_mtoken{model, token_type, provider}`, e o tier do
gateway vira outra. No começo eu escrevia essas regras à mão, mas são duas
por modelo, e com duas dezenas de modelos isso logo virou fonte de erro.
Com o YAML, o mesmo script também consegue sincronizar os tiers com a lista
de modelos do gateway e comparar os preços com a tabela que o LiteLLM
mantém, o que ajuda a perceber quando algum preço ficou para trás.

Os preços são uma estimativa genérica: preço de lista público de setembro
de 2026, sem promoção, sem desconto de prompt cache e sem batch. Para os
modelos da Anthropic usei o preço de lista da própria Anthropic, que é o
mesmo do endpoint global do Bedrock — os endpoints regionais custam cerca de
10% a mais. Em ambiente corporativo, o lugar certo dessa tabela seria o
preço do contrato, não o de lista.

## O que os números mostraram

A aplicação de benchmark do lab manda a mesma bateria de prompts para
vários modelos, o que cria uma comparação justa: cada modelo recebeu as
mesmas 84 requisições. A exceção é o Opus 5.5, que entrou no fim do
período e tem só 56. O volume de token varia um pouco, porque cada modelo
conta token do seu jeito — os mesmos prompts viraram 85 mil tokens de
entrada em uns e mais de 120 mil em outros —, mas a tarefa é a mesma. O
custo:

| Modelo                   | Requisições | Tokens (entrada / saída) |    Custo | Custo por requisição |
|--------------------------|------------:|-------------------------:|---------:|---------------------:|
| `claude-opus-5`          |          84 |       121 mil / 34 mil   | US$ 1,46 |          US$ 0,0174  |
| `claude-opus-4-8`        |          84 |       121 mil / 33 mil   | US$ 1,44 |          US$ 0,0172  |
| `gpt-5.6-sol`            |          84 |        85 mil / 33 mil   | US$ 1,40 |          US$ 0,0167  |
| `claude-opus-4-6`        |          84 |        98 mil / 33 mil   | US$ 1,30 |          US$ 0,0155  |
| `claude-opus-5-5`        |          56 |        81 mil / 23 mil   | US$ 0,79 |          US$ 0,0141  |
| `claude-sonnet-4-6`      |          84 |        90 mil / 33 mil   | US$ 0,76 |          US$ 0,0090  |
| `gpt-5.4`                |          84 |        85 mil / 32 mil   | US$ 0,70 |          US$ 0,0083  |
| `claude-sonnet-5`        |          84 |       131 mil / 33 mil   | US$ 0,60 |          US$ 0,0071  |
| `gemini-3.5-flash`       |          84 |        83 mil / 38 mil   | US$ 0,47 |          US$ 0,0056  |
| `claude-haiku-4-5`       |          84 |        98 mil / 33 mil   | US$ 0,26 |          US$ 0,0031  |
| `llama-3-3-70b-instruct` |          84 |        85 mil / 16 mil   | US$ 0,07 |          US$ 0,0009  |
| `gpt-5.6-luna`           |          84 |        85 mil / 33 mil   | US$ 0,06 |          US$ 0,0007  |
| `granite-4-h-small`      |          84 |        86 mil / 28 mil   | US$ 0,01 |          US$ 0,0001  |

Do mais caro para o mais barato, mais de cem vezes de diferença para o
mesmo trabalho. Não quer dizer que o resultado seja equivalente — um modelo
pequeno falha em tarefas que um grande resolve —, mas é exatamente essa
pergunta que o dashboard agora permite responder com números: a qualidade
a mais vale quanto?

Lembra da comparação do post anterior, em que `claude-haiku-4-5` e
`claude-opus-4-6` fizeram o mesmo volume de trabalho e o Opus levou o dobro
do tempo? Com preço, a comparação fica completa: o Opus custou **5 vezes
mais**. Dobro da latência e cinco vezes o custo, para a mesma tarefa. Pode
compensar — depende da tarefa —, mas agora é uma decisão, não um palpite.

O dashboard também ganhou uma matriz de custo por modelo e cenário do
benchmark, que mostra onde cada modelo gasta. Nos modelos caros, mais de
80% do custo está em dois cenários, `prefill` e `sustained`; os outros
cinco somam centavos.

![Painéis de custo por cenário do benchmark no Grafana, com participação de cada cenário, tabela de requisições, tokens e custo por cenário, matriz de custo por modelo e cenário, e a tabela de preço lida das recording rules](/assets/images/openllmetry-cost-lab/dashboard-custo-por-cenario.png)

Algumas outras coisas que só apareceram com dinheiro na conta:

- **A maior linha da conta é um modelo caro dentro de um agente.** O
  `claude-opus-5` teve 25% dos tokens do período e 40% do custo. Quase
  tudo isso veio de outra aplicação instrumentada, um agente no padrão
  ReAct, e não do benchmark: US$ 7,61, um terço da conta inteira. O
  `claude-sonnet-5`, com 19% dos tokens, ficou em 13% do custo.
- **Poucas chamadas, metade da conta.** Esse agente fez 15% das chamadas do
  período e respondeu por 48% do custo. Dentro dele, o loop de raciocínio
  sozinho foi 46% do custo do serviço. Não é a resposta final que custa, é
  o caminho até ela — e é aí que o corte de contexto que comentei no post
  anterior rende mais, porque se repete a cada iteração.
- **Modelo caro com pouco volume passa despercebido.** O `gpt-5.6-sol` teve
  2,5% dos tokens e 6% do custo. Num painel de token, é uma linha discreta.
- **O cenário que mais consome não é o que mais custa.** No post anterior
  eu destaquei que 73% dos tokens foram para um único cenário do benchmark.
  É o `prefill`, que manda muito contexto e pede resposta curta. Em
  dinheiro, ele foi 36% do custo. O cenário `sustained`, que gera respostas
  longas, teve 18% dos tokens e **46% do custo**. Token de saída pesa.

## O caso do Opus 5.5

Na tabela lá de cima, o `claude-opus-5-5` não dá para comparar direto com
os outros, porque ele chegou no meio do caminho. É o Opus mais novo da
Anthropic, e só entrou no benchmark no dia 24, então não tem as mesmas 84
requisições dos outros. Mas filtrando o dashboard nos últimos sete dias,
janela em que todos os modelos rodaram a mesma bateria — 56 requisições, 8
por cenário —, dá para comparar de igual para igual:

![Matriz de custo por modelo e cenário no Grafana, filtrada no benchmark dos últimos sete dias, comparando Opus 4.6, Opus 4.8, Opus 5, Opus 5.5, GPT-5.4 e GPT-5.6 Sol](/assets/images/openllmetry-cost-lab/dashboard-custo-matriz-opus-5-5.png)

| Modelo            | Tokens (entrada / saída) |    Custo | Latência média |
|-------------------|-------------------------:|---------:|---------------:|
| `claude-opus-5`   |        81 mil / 23 mil   | US$ 0,98 |          6,6 s |
| `claude-opus-4-8` |        81 mil / 22 mil   | US$ 0,96 |          5,5 s |
| `gpt-5.6-sol`     |        56 mil / 22 mil   | US$ 0,93 |          5,9 s |
| `claude-opus-4-6` |        60 mil / 22 mil   | US$ 0,85 |          7,4 s |
| `claude-opus-5-5` |        81 mil / 23 mil   | US$ 0,79 |          5,4 s |
| `gpt-5.4`         |        56 mil / 22 mil   | US$ 0,46 |          4,3 s |

O Opus 5.5 gastou praticamente o mesmo volume de token que o Opus 5 e
custou 19% menos, porque o preço caiu de US$ 5/25 para US$ 4/20 por milhão
de tokens. Na matriz dá para ver que a economia é uniforme: cada cenário
sai uns 20% mais barato. De quebra, a latência média foi 18% menor, e na
plataforma o tier também caiu, de 4x para 3x. Ele sai mais barato até que
o Opus 4.6, que é bem mais antigo e contou menos tokens de entrada para os
mesmos prompts.

É isso que eu acho mais interessante nessa visão. A intuição natural é que
modelo mais novo e melhor custa mais, e que migrar é uma decisão de
orçamento. Aqui é o contrário: o modelo mais recente da família, que a
Anthropic posiciona acima do Opus 5 em qualidade, é o Opus mais barato do
benchmark. Quem continua no Opus 5 por inércia paga mais por um modelo que
já foi superado — e, olhando só token, não teria como perceber, porque o
volume dos dois é idêntico.

Uma ressalva honesta: qualidade eu não medi no lab. O benchmark mede
token, custo e latência, não se a resposta está certa, então o "melhor"
aqui vem da Anthropic e das avaliações públicas, não do meu dashboard. Mas
é justamente esse tipo de decisão que a visão em dinheiro facilita: a
pergunta deixa de ser "vale pagar mais pelo modelo novo?" e vira "por que
ainda estou pagando mais pelo antigo?".

## Tier do gateway não é preço

A plataforma que uso expõe cada modelo com um multiplicador — 0x, 1x, 1,5x,
3x, 4x — que define quantas unidades da cota cada requisição consome. Esse
multiplicador também está no YAML, e o dashboard mostra as "unidades de
gateway" (requisições com sucesso vezes tier) numa linha separada: 3,7 mil
no período.

Comparar as duas medidas foi revelador, porque elas nem sempre concordam.
Três modelos têm tier 1x: `gemini-3.5-flash`, `claude-haiku-4-5` e
`llama-3-3-70b-instruct`. Pela cota, custam o mesmo. A preço de lista, para
o mesmo trabalho no benchmark, custaram US$ 0,47, US$ 0,26 e US$ 0,07 — quase
sete vezes de diferença dentro do mesmo tier. E o `gpt-5.6-luna` tem tier 0x, é
"grátis" no gateway, mas tem custo de lista.

As duas respostas estão certas, só respondem perguntas diferentes. O tier
diz quanto da minha cota eu estou gastando; o preço de lista diz quanto
isso custaria para quem paga a conta do provedor. Para governança, as duas
importam — e é justamente quando elas divergem que vale olhar de perto.

## O que essa estimativa não é

Custo estimado a partir de telemetria é útil, mas tem limites que vale
deixar explícitos:

- **Não é a fatura.** Preço de lista não considera desconto de contrato,
  prompt cache, batch nem promoção — e alguns modelos da tabela estão com
  preço promocional agora. A fatura do provedor continua sendo a fonte da
  verdade; o dashboard serve para saber *onde* o dinheiro foi, com uma
  ordem de grandeza boa.
- **Só entra o que registrou token.** Chamadas com erro não têm token nem
  modelo na resposta, então ficam fora do custo — no período foram 87,
  quase todas por requisição inválida ou rate limit. E vale o mesmo aviso
  do post anterior: chamada em stream sem `include_usage` não registra
  token e, portanto, não tem custo.
- **Projeção linear engana com tráfego em rajada.** No painel, a projeção de
  fechamento do mês diz US$ 26,56, com média de US$ 0,89 por dia. Só que a
  conta divide o gasto pelos dias desde o dia 1º, incluindo duas semanas
  sem nenhum dado, e quase 90% das requisições aconteceram em três
  dias, nas execuções do benchmark. Em produção, com tráfego mais regular,
  a projeção faz mais sentido.

## Fechando a conta

No post anterior eu disse que medir token era metade do problema de
governança, e que a outra metade era a conta. Com a tabela de preço dentro
do Prometheus, o dashboard agora responde às duas perguntas que faltavam:
quanto a IA generativa está custando, e onde.

O que mais me surpreendeu foi o quanto a visão por token enganava. O
cenário que mais consumia não era o que mais custava, uma aplicação com
poucas chamadas era metade da conta, e o gateway e o preço de lista
discordavam sobre qual modelo era barato.

A tabela de preço e o dashboard de custo vão junto com o dashboard de
observabilidade quando eu publicar no repositório do Grafana. O próximo
passo que estou considerando é fechar o ciclo com alerta: avisar quando o
gasto diário de um serviço passar de um limite, antes de a fatura chegar.
