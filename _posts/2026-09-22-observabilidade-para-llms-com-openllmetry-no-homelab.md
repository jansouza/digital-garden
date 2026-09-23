---
layout: post
title: "Observabilidade para LLMs: medindo tokens antes de falar em custo"
date: 2026-09-22 10:00:00 -0300
categories: [homelab]
tags: [observabilidade, opentelemetry, openllmetry, llm, ia, ia-generativa, prometheus, grafana, tempo, homelab, devops]
stage: growing
description: "A conta da IA generativa está chegando. Um lab para medir consumo de token, latência e erros de aplicações que chamam LLMs, com OpenLLMetry, OTel Collector, Grafana Tempo e Prometheus."
---

De um tempo pra cá todo mundo fala em adotar IA generativa no trabalho, mas
pouca gente fala do que vem depois: a conta. Cada chamada para um modelo
custa token, e esse custo varia bastante conforme o modelo, o provedor e o
tamanho do prompt. Enquanto era só "testar a ferramenta", isso ficava em
segundo plano. Agora que virou parte do processo, aparece a pergunta que
quase ninguém tem resposta pronta: quanto estamos gastando com IA, em qual
modelo, para qual time? É o mesmo problema que o FinOps resolveu para cloud
há uns anos, agora em cima de token.

Foi isso que me levou a montar esse lab: um pipeline de
observabilidade que responde, para qualquer aplicação que chame um LLM,
quanto token foi gasto, em qual modelo, com que latência e para qual tarefa.

![Visão geral do dashboard de observabilidade de LLM no Grafana, com total de tokens, requisições, latência p95, erros e consumo de token por modelo e provedor](/assets/images/openllmetry-lab/dashboard-overview.png)

## Governança de IA começa com dado, não com política

"Governança de IA" virou um termo guarda-chuva, que vai de política de uso
até compliance regulatório. Mas quase toda decisão nesse assunto esbarra
numa pergunta chata de responder: o que exatamente acontece quando alguém,
ou algum sistema, chama um modelo? Sem saber quanto token a chamada
consumiu, quanto tempo levou e qual modelo respondeu, não dá para dizer qual
time está gastando mais, nem se o modelo caro entrega qualidade proporcional
ao preço. A política vem depois — primeiro precisa existir o dado.

E o motivo da lacuna é meio óbvio quando se olha de perto: chamar a API de
um provedor de IA é tão simples que vira só mais uma chamada HTTP perdida no
meio do código, sem span, sem métrica, sem log estruturado. Banco de dados,
fila e API interna qualquer time de plataforma já trata com um cuidado de
observabilidade que virou padrão há anos. Chamada de LLM, na maioria dos
lugares, ainda é best-effort — como se token não custasse nada e latência
não importasse.

O caminho para fechar isso é instrumentar com OpenTelemetry — que resolve o
transporte, mas não sabe o que é token nem o que é modelo. Quem preenche
essa parte é o [OpenLLMetry](https://github.com/traceloop/openllmetry) (SDK
da Traceloop): ele instrumenta as chamadas de LLM automaticamente e emite
**traces** (a chamada em si, com prompt, modelo e tokens) e **métricas**
(`gen_ai.client.token.usage`, `gen_ai.client.operation.duration`, erros,
timings de streaming) já no padrão que a OpenTelemetry definiu para IA
generativa.

## Instrumentar custa três linhas

Do lado da aplicação, instrumentar é isto:

```python
from traceloop.sdk import Traceloop

# OTEL_EXPORTER_OTLP_ENDPOINT aponta para o Collector (gRPC, porta 4317)
Traceloop.init(app_name="llm-benchmark")
```

O `app_name` vira o `service.name`, que é como a aplicação aparece no
dashboard e nos traces. O SDK faz monkey-patching das bibliotecas de LLM que
encontra no processo, então o código que já existia passa a emitir trace e
métrica sem ser tocado.

Só com isso, porém, dá para saber quanto cada *modelo* consumiu — não quanto
cada *time* ou *tarefa* consumiu, que é a pergunta de governança. Isso se
resolve com association properties:

```python
Traceloop.set_association_properties({
    "scenario": "prefill",
    "team": "plataforma",
})
```

Cada chave vira um label `traceloop_association_properties_<chave>` nas
métricas, consultável no Prometheus como qualquer outra dimensão. É o que
transforma "gastamos 700 mil tokens" em "gastamos 700 mil tokens, 73% deles
num único tipo de tarefa".

Um aviso que vale o parágrafo: por padrão o OpenLLMetry grava o conteúdo das
mensagens nos spans — `gen_ai.input.messages` e a resposta do modelo vão
inteiros para o backend de traces. No lab isso é inofensivo, com prompt
sintético e Tempo rodando dentro de casa. Em produção precisa ser decidido
antes de ligar, porque prompt de usuário pode conter dado pessoal e backend
de trace não costuma ser pensado para guardar esse tipo de coisa. O SDK
permite desligar a captura.

## Arquitetura do lab

Já existia no homelab uma stack de Prometheus/Alertmanager/Grafana, então
reaproveitei em vez de subir algo paralelo:

```
Aplicação
   │  instrumentada com OpenLLMetry (Traceloop SDK)
   │  exporta via OTLP/gRPC
   ▼
OpenTelemetry Collector
   ├── traces  ──────────────► Grafana Tempo
   └── métricas ─────────────► exporter Prometheus (scrape)
                                         │
                                         ▼
                                    Prometheus (stack existente)
                                         │
                                         ▼
                                     Grafana (dashboard custom)
```

A aplicação exporta via OTLP/gRPC para o Collector, que faz o papel de
roteador: traces para o Tempo, métricas para um endpoint que a stack
existente só precisa fazer scrape.

### OTel Collector

A configuração é enxuta — receiver OTLP (gRPC na 4317, HTTP na 4318), um
processor que limpa atributos e dois pipelines:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch: {}
  resource/prometheus:
    attributes:
      - key: service.instance.id
        action: delete
      - key: process.pid
        action: delete

exporters:
  otlp/tempo:
    endpoint: tempo-service.monitoring.svc.cluster.local:4317
    tls:
      insecure: true
  prometheus:
    endpoint: 0.0.0.0:8889
    # scrape de 60s; mantém as séries visíveis sob tráfego esparso
    metric_expiration: 30m

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp/tempo]
    metrics:
      receivers: [otlp]
      processors: [resource/prometheus, batch]
      exporters: [prometheus]
```

Aquele `resource/prometheus` não é cosmético. O exporter mapeia
`service.instance.id` para o label `instance`, e esse id é um UUID novo a
cada restart do processo: sem removê-lo, o Prometheus acumula uma série nova
a cada deploy em vez de continuar a mesma.

### Grafana Tempo

O Tempo guarda os traces num PVC local com 7 dias de retenção e não tem UI
própria — tudo é consultado do Grafana, com TraceQL. Três pontos da
configuração que valem registro:

- `stream_over_http_enabled: true`, sem o qual o datasource do Grafana falha
  com erro de frame HTTP/2 grande demais ao fazer streaming de resultados
  parciais.
- O `metrics_generator` deriva métricas RED e o service graph dos spans e
  faz remote-write para o Prometheus, que precisa estar rodando com
  `--web.enable-remote-write-receiver` — senão o Tempo escreve para ninguém,
  sem erro visível em lugar nenhum.
- O processor `local-blocks` habilita consultas de métricas via TraceQL,
  tipo `{span."gen_ai.usage.output_tokens" > 1000}`.

Também subi o `max_duration` da query-frontend para 24h: a janela padrão de
3h é menor que o intervalo do meu dashboard, e o sintoma era painel vazio
sem explicação.

## As métricas que chegam no Prometheus

O exporter Prometheus anexa a unidade ao nome de cada métrica, então elas
aparecem como `gen_ai_client_token_usage_sum`,
`gen_ai_client_operation_duration_seconds_bucket` e
`gen_ai_client_generation_choices_choice_total`. As dimensões —
`gen_ai_response_model`, `gen_ai_provider_name`, `gen_ai_token_type`
(`input`/`output`), `server_address`, mais as association properties — são o
que permite quebrar o consumo por modelo e por provedor, comparando por
exemplo um modelo servido via Bedrock contra um via OpenAI atrás da mesma
plataforma.

Duas pegadinhas para quem for reproduzir:

1. **Nem tudo migrou para o prefixo `gen_ai.*`.** As métricas de streaming
   mantêm nomes legados
   (`llm_chat_completions_streaming_time_to_generate_seconds_*`), então uma
   aplicação que usa streaming produz os dois prefixos ao mesmo tempo, com a
   mesma versão do SDK.
2. **Streaming pode esvaziar o painel de tokens.** O
   `gen_ai.client.token.usage` só é registrado quando a resposta traz bloco
   de uso, e a API da OpenAI omite esse bloco em stream a menos que a
   chamada passe `stream_options={"include_usage": True}`.

## O dashboard

Não existia nada pronto para essa combinação — OpenLLMetry alimentando
Prometheus, em vez do backend nativo da Traceloop, com traces em Tempo.
Construí um do zero.

A tabela-resumo por modelo é o painel que eu mais uso:

![Tabela-resumo por modelo no Grafana, comparando requisições, tokens de entrada e saída, tokens por requisição e latência p95 de cada modelo](/assets/images/openllmetry-lab/dashboard-resumo-por-modelo.png)

Repare em duas linhas: `claude-haiku-4-5` e `claude-opus-4-6` fizeram as
mesmas 21 requisições, com os mesmos 38 mil tokens, e p95 de 19,76s contra
41,25s. Mesmo volume, o dobro do tempo, preço por token diferente. É esse
tipo de comparação que não existia antes de instrumentar.

A linha de streaming separa time-to-first-token de tempo total de geração,
que são coisas bem diferentes para quem está olhando a resposta aparecer na
tela:

![Painéis de streaming no Grafana, com percentis de time-to-first-token, tempo total de geração e chamadas de streaming por minuto](/assets/images/openllmetry-lab/dashboard-streaming.png)

E a linha de association properties é onde o `scenario` definido pela
aplicação vira análise: dá para ver que 73% do token do período foi para um
único tipo de tarefa, e que o cenário que mais consome não é o de maior
latência.

![Painéis de association properties no Grafana, com consumo de token por cenário em donut, série temporal e tabela-resumo por cenário](/assets/images/openllmetry-lab/dashboard-association-properties.png)

Os painéis por modelo têm data links que abrem o Explore com uma TraceQL já
apontando para aquele modelo e intervalo. O caminho inverso também funciona:
de dentro do trace, os links voltam para as métricas do serviço.

![Trace de uma chamada de LLM no Grafana Tempo, com os atributos do span incluindo modelo, streaming e mensagens de entrada](/assets/images/openllmetry-lab/trace-tempo.png)

A ideia é publicar esse dashboard no repositório do Grafana, para quem
montar um pipeline parecido não precisar refazer.

## Próximos passos: o custo de verdade

O lab mede token e latência, não dinheiro. E são coisas diferentes: um
modelo pode consumir menos token e ainda sair mais caro, porque
`gen_ai_client_token_usage_sum` carrega quantidade, não preço.

O próximo passo é cruzar esse volume com a tabela de preço de cada modelo —
lembrando que entrada e saída custam diferente na maioria dos provedores —
seja com uma recording rule no Prometheus, seja expondo o preço como métrica
auxiliar e deixando o Grafana fazer a conta. Hoje o dashboard responde
"quanto token esse modelo consumiu"; falta responder "quanto isso custou" e
"esse modelo caro compensa". Enquanto não responde, é metade do problema de
governança resolvido, e a outra metade é justamente a conta.