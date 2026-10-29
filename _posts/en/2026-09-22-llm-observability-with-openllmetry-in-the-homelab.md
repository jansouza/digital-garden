---
layout: post
title: "Observability for LLMs: measuring tokens before talking about cost"
date: 2026-09-22 10:00:00 -0300
categories: [homelab]
tags: [observabilidade, opentelemetry, openllmetry, llm, ia, ia-generativa, prometheus, grafana, tempo, homelab, devops]
stage: mature
last_modified_at: 2026-10-28
image: /assets/images/openllmetry-lab/dashboard-overview.png
description: "The generative AI bill is coming. A lab to measure token usage, latency and errors of applications that call LLMs, with OpenLLMetry, the OTel Collector, Grafana Tempo and Prometheus."
translation_key: observabilidade-para-llms-com-openllmetry-no-homelab
---

Adopting generative AI at work is on the agenda of almost every company,
but the conversation rarely gets to the bill. Every call to a model costs
tokens, and that cost varies a lot depending on the model, the provider and
the size of the prompt. While it was just "trying out the tool", this stayed
in the background. Now that it has become part of the process, a question
comes up that almost nobody has a ready answer for: how much are we
spending on AI, on which model, for which team? It's the same problem
FinOps solved for the cloud a few years ago, now on top of tokens.

That's what led me to build this lab: an observability pipeline that
answers, for any application that calls an LLM, how many tokens were spent,
on which model, with what latency and for which task.

![Overview of the LLM observability dashboard in Grafana, with total tokens, requests, p95 latency, errors and token usage by model and provider](/assets/images/openllmetry-lab/dashboard-overview.png)

## The missing data for AI governance

"AI governance" has become an umbrella term, ranging from usage policy to
regulatory compliance. But almost every decision on the subject runs into a
question that's annoying to answer: what exactly happens when someone, or
some system, calls a model? Without knowing how many tokens the call
consumed, how long it took and which model answered, you can't say which
team is spending the most, or whether the expensive model delivers quality
proportional to its price. You can write a policy without this data, but it
will be a guess.

This gap exists because calling an AI provider's API is so simple that it
becomes just another HTTP call lost in the middle of the code, with no span,
no metric, no structured log. Databases, queues and internal APIs are
things any platform team has handled with a level of observability care
that became standard years ago. LLM calls, in most places, are still
best-effort, as if tokens cost nothing and latency didn't matter.

The way to close this is to instrument with OpenTelemetry. It solves the
transport, but it doesn't know what a token or a model is. What fills that
part is [OpenLLMetry](https://github.com/traceloop/openllmetry), Traceloop's
SDK that instruments LLM calls automatically and emits traces (the call
itself, with prompt, model and tokens) and metrics
(`gen_ai.client.token.usage`, `gen_ai.client.operation.duration`, errors,
streaming timings) already following the standard OpenTelemetry defined for
generative AI.

## Instrumenting takes three lines

On the application side, instrumenting is this:

```python
from traceloop.sdk import Traceloop

# OTEL_EXPORTER_OTLP_ENDPOINT points to the Collector (gRPC, port 4317)
Traceloop.init(app_name="llm-benchmark")
```

The `app_name` becomes the `service.name`, which is how the application
shows up in the dashboard and in the traces. The SDK monkey-patches the LLM
libraries it finds in the process, so code that already existed starts
emitting traces and metrics without being touched.

With just that you can tell how much each *model* consumed. The governance
question is a different one: how much each *team* or each *task* consumed.
That's what association properties are for:

```python
Traceloop.set_association_properties({
    "scenario": "prefill",
    "team": "plataforma",
})
```

Each key becomes a `traceloop_association_properties_<key>` label on the
metrics, queryable in Prometheus like any other dimension. That's what turns
"we spent 700K tokens" into "we spent 700K tokens, 73% of them on a single
type of task".

By default OpenLLMetry records the content of the messages in the spans:
`gen_ai.input.messages` and the model's response go in full to the trace
backend. In the lab that's harmless, with synthetic prompts and Tempo
running at home. In production it has to be decided before turning it on,
because user prompts may contain personal data and trace backends aren't
usually designed to store that kind of thing. Capture is turned off with
`TRACELOOP_TRACE_CONTENT=false`.

## Lab architecture

The homelab already had a Prometheus/Alertmanager/Grafana stack, so I reused
it instead of standing up something parallel:

```
Application
   │  instrumented with OpenLLMetry (Traceloop SDK)
   │  exports via OTLP/gRPC
   ▼
OpenTelemetry Collector
   ├── traces  ──────────────► Grafana Tempo
   └── metrics ──────────────► Prometheus exporter (scrape)
                                         │
                                         ▼
                                    Prometheus (existing stack)
                                         │
                                         ▼
                                     Grafana (custom dashboard)
```

The application exports via OTLP/gRPC to the Collector, which acts as a
router: traces go to Tempo, metrics go to an endpoint that the existing
stack only needs to scrape.

### OTel Collector

The configuration is short. It has the OTLP receiver (gRPC on 4317, HTTP on
4318), a processor that cleans up attributes and two pipelines:

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
    # 60s scrape; keeps the series visible under sparse traffic
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

The `resource/prometheus` is there because the exporter maps
`service.instance.id` to the `instance` label, and that id is a new UUID on
every process restart: without removing it, Prometheus piles up a new series
on every deploy instead of continuing the same one.

### Grafana Tempo

Tempo stores the traces on a local PVC with 7 days of retention and has no
UI of its own. Everything is queried through Grafana, with TraceQL. Three
points of the configuration worth noting:

- `stream_over_http_enabled: true`, without which the Grafana datasource
  fails with an HTTP/2 frame too large error when streaming partial
  results.
- The `metrics_generator` derives RED metrics and the service graph from the
  spans and remote-writes to Prometheus, which needs to be running with
  `--web.enable-remote-write-receiver`. Without that flag, Tempo writes to
  nobody, with no visible error anywhere.
- The `local-blocks` processor enables metrics queries via TraceQL, like
  `{span."gen_ai.usage.output_tokens" > 1000}`.

I also raised the query-frontend's `max_duration` to 24h: the default 3h
window is shorter than my dashboard's range, and the symptom was an empty
panel with no explanation.

## The metrics that reach Prometheus

The Prometheus exporter appends the unit to each metric name, so they show
up as `gen_ai_client_token_usage_sum`,
`gen_ai_client_operation_duration_seconds_bucket` and
`gen_ai_client_generation_choices_choice_total`. The dimensions that let you
break down usage by model and by provider are `gen_ai_response_model`,
`gen_ai_provider_name`, `gen_ai_token_type` (`input`/`output`),
`server_address` and the association properties. With them you can compare,
for example, a model served via Bedrock with another via OpenAI behind the
same platform.

Two gotchas for anyone reproducing this:

1. **Not everything moved to the `gen_ai.*` prefix.** The streaming metrics
   keep legacy names
   (`llm_chat_completions_streaming_time_to_generate_seconds_*`), so an
   application that uses streaming produces both prefixes at the same time,
   with the same SDK version.
2. **Streaming can empty the tokens panel.** `gen_ai.client.token.usage` is
   only recorded when the response includes a usage block, and the OpenAI
   API omits that block in streams unless the call passes
   `stream_options={"include_usage": True}`.

## The dashboard

I didn't find anything ready-made for this combination (OpenLLMetry feeding
Prometheus instead of Traceloop's native backend, with traces in Tempo), so
I built one from scratch.

The per-model summary table is the panel I use the most:

![Per-model summary table in Grafana, comparing requests, input and output tokens, tokens per request and p95 latency for each model](/assets/images/openllmetry-lab/dashboard-resumo-por-modelo.png)

Look at two rows: `claude-haiku-4-5` and `claude-opus-4-6` made the same 21
requests, with the same 38K tokens, and a p95 of 19.76s versus 41.25s. I
know they're models with different purposes. Haiku exists to answer fast
and cheap, and Opus for tasks that need more elaborate reasoning, so it was
expected to be slower and more expensive per token. What interests me is
having that as a number. With the same volume, Opus took a bit more than
twice as long, and now you can ask, task by task, whether the extra
reasoning is worth that wait and that price. Before instrumenting, this
conversation was based on impressions.

The streaming row separates time-to-first-token from total generation time,
which are very different things for someone watching the answer appear on
the screen:

![Streaming panels in Grafana, with time-to-first-token percentiles, total generation time and streaming calls per minute](/assets/images/openllmetry-lab/dashboard-streaming.png)

And the association properties row is where the `scenario` set by the
application turns into analysis: you can see that 73% of the period's tokens
went to a single type of task, and that the scenario that consumes the most
isn't the one with the highest latency.

![Association properties panels in Grafana, with token usage by scenario in a donut, a time series and a per-scenario summary table](/assets/images/openllmetry-lab/dashboard-association-properties.png)

The per-model panels have data links that open Explore with a TraceQL query
already pointing at that model and time range. The reverse path works too:
from inside the trace, the links go back to the service's metrics.

![Trace of an LLM call in Grafana Tempo, with the span attributes including model, streaming and input messages](/assets/images/openllmetry-lab/trace-tempo.png)

It was while inspecting one of these traces that the lab's first practical
gain came. `gen_ai.input.messages` showed that part of the context sent by
the application served no purpose: leftovers from a previous prompt,
duplicated text, information that didn't influence the answer. The call
works, the answer comes back right, and nobody looks at what's being paid
for to get there. I cut that excess, and the same task started spending
fewer tokens per call. No panel would have pointed this out: the metric
counts the tokens, but what shows what was sent in them is the trace.

The plan is to publish this dashboard to the Grafana repository, so anyone
building a similar pipeline doesn't have to redo it.

## Next steps: the real cost

The lab measures tokens and latency, but not money. A model can consume
fewer tokens and still come out more expensive, because
`gen_ai_client_token_usage_sum` only carries quantity.

The next step is to combine this volume with each model's price table
(input and output cost different amounts with most providers), either with
a recording rule in Prometheus or by exposing the price as an auxiliary
metric and letting Grafana do the math. Today the dashboard answers "how
many tokens did this model consume"; it still needs to answer "how much did
that cost" and "is this expensive model worth it".

> **Update:** that step became the next post,
> [From token to dollar: estimating the cost of generative AI]({% post_url en/2026-09-25-from-token-to-dollar-cost-of-generative-ai %}).
