---
layout: post
title: "LLM-as-a-Judge: evaluating answers inside the observability pipeline"
date: 2026-10-03 10:00:00 -0300
categories: [homelab]
tags: [observabilidade, opentelemetry, openllmetry, llm, ia, ia-generativa, llm-as-a-judge, evals, seguranca, homelab, devops]
stage: growing
image: /assets/images/openllmetry-eval-lab/dashboard-avaliacao-overview.png
description: "Part three of the LLM observability lab: a service that reads GenAI spans from the OTel Collector, runs security heuristics and an LLM as a judge of answer quality, and sends the result back as telemetry linked to the original trace."
translation_key: llm-as-a-judge-avaliando-respostas-no-pipeline-de-observabilidade
---

In the two previous posts I
[instrumented the applications that call LLMs]({% post_url en/2026-09-22-llm-observability-with-openllmetry-in-the-homelab %})
and [turned token usage into estimated cost]({% post_url en/2026-09-25-from-token-to-dollar-cost-of-generative-ai %}).
The dashboard started answering how many tokens each application spends, on
which model, with what latency and how much that would cost at list price.
What was missing was the question someone using the application would ask:
was the answer any good?

That question is different from knowing which model is best. Public
benchmarks measure the model in isolation, on standardized tasks. What
reaches the user depends on what the application puts around the model: the
system prompt, the context it builds, the history it sends along, what it
does with the response. An excellent model behind a badly written prompt
answers badly, and no model ranking will show that. What I want to measure
here is the quality of the application using the model, in the
conversations it actually has.

The lack of this measure weighs on every change the application goes
through. Changing a chatbot's system prompt, cutting context to save
tokens, switching models: all of that affects the answer, and the cost
dashboard only shows the side that gets cheaper. Without a quality measure,
the savings may be coming from worse answers, and nobody notices until a
user complains.

In this post I show [llm-eval-otel](https://github.com/jansouza/llm-eval-otel),
a service I built to close this gap. It reads the LLM interactions that
already go through the telemetry pipeline, evaluates prompt and response,
and sends the result back as OpenTelemetry telemetry linked to the original
trace. It has security heuristics (PII, credentials, prompt leakage) and an
evaluator that uses the LLM-as-a-Judge technique: a second model reads the
conversation and scores the response. The focus here is that judge, because
that's where the less obvious decisions are.

For an overview of the service, from the architecture to the evaluators, I
also put together an [llm-eval-otel presentation](https://llm-eval.jansouza.com/).

![Overview of the evaluation dashboard in Grafana, with total evaluations, failures, failure rate, evaluations by result over time and failures by evaluator, by service and by model](/assets/images/openllmetry-eval-lab/dashboard-avaliacao-overview.png)

## Evaluating outside the application's path

The first decision was where the evaluation runs. Putting it inside the
application couples security rules to the product code and adds latency to
every call. But the lab's applications already send everything an evaluator
needs to the Collector: the span of each LLM call, with the prompt, the
response, the model and the service. So the evaluator became one more
consumer of the pipeline:

```
Application (instrumented with OpenLLMetry)
   │  OTLP
   ▼
OpenTelemetry Collector
   ├── traces/backend ──────────────────────────────► Tempo (as before)
   └── traces/genai (inference spans only) ─────────► llm-eval-otel
                                                          │
                                         heuristics on 100% of spans
                                         judge on 5% of traces ──► judge model
                                                          │
   Collector, otlp/eval receiver :4319 ◄──────────────────┘
   └── event + child span + metrics ────────────────► Tempo, Loki, Prometheus
```

The application doesn't change and doesn't wait for anything. The evaluator
only flags: it runs after the response has reached the user, so it doesn't
block or change anything. I chose this on purpose: to block, the check would
have to be in the request path, which is the role of a guardrail, and what I
wanted was to measure without touching the application.

In the Collector, the new pipeline is a filter that only lets inference
spans through and an exporter pointing to the service:

```yaml
processors:
  filter/genai_inference:
    error_mode: ignore
    trace_conditions:
      - >-
        not (IsMatch(span.attributes["gen_ai.operation.name"], "^(chat|text_completion|generate_content)$")
        or span.attributes["gen_ai.prompt.0.content"] != nil)
```

The second condition exists because of OpenLLMetry, which still records the
content in `gen_ai.prompt.{n}.*` instead of the current semconv attributes.
The service reads both formats.

The result comes back through a separate receiver, on port 4319, whose
pipeline only exports to the backend. Without this separation, the spans the
evaluator itself emits (including the calls to the judge, which are also LLM
calls) would come back to it and be evaluated again, in a loop. As a second
defense, the service drops any span with its own `service.name`.

For each evaluated span and each evaluator, three things come out:

- A `gen_ai.evaluation.result` event (a log record with the TraceID and
  SpanID of the original span), which is the name the GenAI semconv defined
  for evaluation results.
- An `evaluate {name}` child span, so the result shows up inside the trace
  in Tempo, right below the evaluated call.
- The `llm_eval.evaluations` metric (a counter by evaluator and result) and
  `llm_eval.evaluation.score` (a histogram from 0 to 1).

The metrics carry the service, the model and the association properties of
the original span, with the same names as the OpenLLMetry metrics. The
`scenario` I used to break down tokens and cost in the dashboard also works
to break down quality.

## Heuristics first, judge later

Not every question needs an LLM to be answered. Six evaluators come with
the service, and five are local heuristics:

| Evaluator | What it detects | How |
| --- | --- | --- |
| `pii_detection` | CPF, CNPJ, email, card, phone, PIX key | regex with validation (check digit, Luhn, area code) |
| `secret_detection` | API keys, tokens, JWT, private key, connection string | known prefixes and entropy |
| `refusal` | the model refused the request | phrases in Portuguese, English and Spanish, and `finish_reason=content_filter` |
| `system_prompt_leak` | the response copies parts of the system prompt | overlap of word 8-grams |
| `output_format` | invalid JSON when the client asked for JSON | parser |
| `relevance` | the response doesn't address what was asked | LLM-as-a-Judge |

The heuristics cover the security side and run on every span. In the load
test, with 10 KB of text per span, `pii_detection` took 2 ms at p99 and
`secret_detection` 3.7 ms, and one process evaluated 194 spans per second
with both turned on. At that cost, there's no need to sample, and for
security that matters: if PII were checked on 5% of the spans, a leaked CPF
in the other 95% would go unrecorded.

What no regex answers is whether the response makes sense for the question.
A store chatbot that answers "can I exchange sneakers that are too tight?"
with a text about working from home leaks no data, doesn't refuse, doesn't
break any format, and passes cleanly through every heuristic. To catch that
kind of response I needed a judge.

## What LLM-as-a-Judge is

A second model receives the conversation and the evaluation criteria, and
returns a score with a justification. It plays the role of a person
reviewing a sample of the responses, only in a few seconds per conversation
and without getting tired.

The name comes from the paper
[Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685)
(Zheng et al., NeurIPS 2023), from the Berkeley group behind Chatbot Arena.
They compared GPT-4's scores as a judge with the preferences of experts and
thousands of users, and agreement went above 80%, the same level of
agreement as between two people. That result is what supports the idea of
using a model in place of a human reviewer.

### One question per judge

The judge answers a single question: does the response address what the
user asked? It doesn't evaluate whether the information is correct, nor
tone, nor safety. When the same prompt asks for all of that, the score
becomes an average of mixed criteria and it's impossible to know what it
measures. If I later want to evaluate whether the response is faithful to
the documents of a RAG, that becomes another evaluator, with another prompt
and another metric.

This separation also solves a case that confuses judges: refusals. If the
user asks for someone else's account password and the model refuses, the
response is relevant. The prompt says that explicitly, and refusals are
counted by the `refusal` evaluator, which is a different metric.

### A scale with anchors

Instead of asking "give a score from 1 to 5", the prompt describes what each
score means. These descriptions are the anchors. The prompt, as it is in the
code:

```text
Rate how well the response addresses the request, from 1 to 5:
5 - addresses the request fully.
4 - addresses it, with small gaps or some unneeded content.
3 - addresses it partially.
2 - touches the topic but does not answer the request.
1 - unrelated to the request.

Judge relevance only, not factual accuracy, tone or safety. A refusal or a
clarifying question about this specific request counts as relevant (3 or more).
```

Without anchors, the judge decides on its own what separates a 3 from a 4,
and that decision changes from one call to the next. The study
[An Empirical Study of LLM-as-a-Judge](https://arxiv.org/abs/2506.13639)
(Yamauchi, Yano and Oyamada, 2025) tested several design choices for a
judge, and clear evaluation criteria were what weighed the most on
reliability. Without them, the correlation with human judgment dropped from
0.666 to 0.591 with GPT-4o as the judge, and from 0.641 to 0.555 with
Llama 3.1 70B. The weaker model lost more, and that matters for anyone
thinking about using a small, cheap judge.

The level I most wanted to catch was 2, the response that talks about the
subject without answering: "We accept several payment methods" for someone
who asked whether the store accepts PIX in installments. Generic chatbots
produce this kind of response all the time, and a keyword check would mark
it as relevant.

The score is converted with `(score - 1) / 4`, which puts the result between
0 and 1, on the same scale as the other evaluators. The `pass` cutoff is a
score of 3: a partial response still passes, and anything at 2 or 1 fails.

### Justification before the score

The judge's response is JSON validated against a schema, with
`response_format` in `strict` mode:

```python
SCHEMA = {
    "type": "object",
    "properties": {
        # Before the score, so the model justifies first and evaluates after.
        "reason": {"type": "string"},
        "score": {"type": "integer", "minimum": 1, "maximum": 5},
    },
    "required": ["reason", "score"],
    "additionalProperties": False,
}
```

The model generates the fields in schema order, so with `reason` first it
writes the argument and reaches the score afterwards. In the reverse order,
it picks the score and writes a justification for it.

The Yamauchi et al. study puts this gain in perspective: with well-described
scores, asking for explicit reasoning before the score had little effect on
agreement. I kept the field anyway, because the justification has another
use here: it becomes the event's `explanation`, and it's what lets you
understand a failure without opening the whole conversation.

Not every OpenAI-compatible server accepts strict JSON schema, so you can
fall back to `json_object` or to no format at all, and in those modes the
schema is described in the prompt. In every mode the service validates the
response before using it. A score out of range or a missing field becomes an
error event (`judge_invalid_output`), not a `fail`. If it became a `fail`, a
broken judge would show up on the panel as if the application were
answering badly.

## What goes out to the judge's provider

Every external judge means sending user conversations outside. Before
sending, everything `pii_detection` and `secret_detection` find is replaced
by its type. What the judge receives, for an interaction with a CPF and an
email:

```
<conversation>
{"context": [], "request": ["Meu CPF é [CPF] e meu e-mail é [EMAIL]"], "response": ["Obrigado, localizei seu cadastro."]}
</conversation>
```

Replacing by type, instead of deleting, keeps the sentence readable for the
judgment. The prompt warns that `[CPF]` and `[EMAIL]` are masked data.

The limit is what regex doesn't catch: names and addresses go through as
written. For anyone who can't accept that, the judge talks to any
OpenAI-compatible server, so you can point it at a vLLM or an Ollama inside
your own network and nothing leaves. In the homelab, it points to the same
LiteLLM-based platform that shows up in the previous posts.

On the way back, the judge's justification becomes the event's
`explanation`, cut to 300 characters and passed through the same sanitizer
that cleans all attributes. If the judge quotes a CPF, it reaches the
telemetry as `[REDACTED]`. And for anyone who doesn't want free text from
any model in their telemetry, a variable replaces the justification with
`score=4/5`.

## Cost and isolation

A judge costs tokens and takes seconds per call. Without care, it becomes
the service's bottleneck and a new bill at the end of the month. Four
decisions keep this in check:

- **Sampling.** `relevance` evaluates 5% of traces by default. The decision
  uses the same rule as OpenTelemetry's probabilistic sampler over the
  TraceID, so it's the same across all replicas and on Collector retries.
  The heuristics stay at 100%.
- **Its own lane.** Calls to the judge run in a separate queue, with limited
  concurrency. If the queue fills up, the evaluation is dropped and counted
  in `llm_eval.evaluations.dropped`. The judge never holds back the
  heuristics.
- **Token budget.** `LLM_EVAL_JUDGE_TOKENS_PER_MINUTE` limits spending. Each
  call reserves an estimate beforehand and settles with the actual usage
  afterwards. With no balance left, it drops and counts.
- **Required, pinned model.** There's no default model: the model defines
  cost and quality, so whoever operates the service has to choose. And the
  ID has to be a dated version, not an alias the provider can swap
  underneath you.

Each call to the judge becomes a `chat {model}` span with the `gen_ai.*`
attributes of any LLM call, tokens included, and no content at all. In
other words, the evaluator is also an application that calls an LLM, and it
shows up in the previous post's cost dashboard like any other. You can tell
how much evaluation costs with the same price table: in the lab, 105
interactions judged over seven days cost $0.34 at list price, about $3 per
thousand evaluations.

## Evaluation as a prompt management tool

With the evaluation results in Prometheus, a prompt change gets a measured
before and after. The `relevance` failure rate by service and by model comes
out of a single query:

```promql
sum by (llm_eval_source_service_name, gen_ai_request_model) (
  increase(llm_eval_evaluations_total{gen_ai_evaluation_name="relevance", gen_ai_evaluation_score_label="fail"}[1d])
)
/
sum by (llm_eval_source_service_name, gen_ai_request_model) (
  increase(llm_eval_evaluations_total{gen_ai_evaluation_name="relevance", gen_ai_evaluation_score_label=~"pass|fail"}[1d])
)
```

The same query works for other changes in the application: if it switched
models to save money, the rate shows whether the savings cost quality.

In the dashboard, the judge got its own section, with the average score by
service, the pass rate, the judge's cost and the score distribution:

![LLM-as-a-Judge section of the evaluation dashboard in Grafana, with the judge's average score, judged interactions, pass rate, judge cost, score by service, 24-hour moving average, table by service and evaluator, score distribution and the lowest scores with the judge's justification](/assets/images/openllmetry-eval-lab/dashboard-avaliacao-juiz.png)

The other metrics help read a prompt change: the `refusal` rate goes up when
a new prompt has made the model too cautious, and `system_prompt_leak`
points out when the model started repeating the system instructions to the
user. (If the system prompt has text the model is supposed to repeat, like
an FAQ, the service can be exempted from this evaluator.)

The judge's prompt also needs to be managed, and more rigorously than the
applications' prompts, because it's the yardstick. Changing one word in the
scale can move every score, and the panel would show an improvement or a
decline that didn't happen. That's why the prompt lives in the code, with a
version: a change in what is detected bumps the service's minor version, and
that version goes into `service.version` on all the telemetry, so you know
which yardstick produced each result.

## Next steps

Two evaluators are planned for the next versions of the service:

- **`faithfulness`**, another judge, for RAG applications: are the claims in
  the response supported by the retrieved documents? It's the question
  `relevance` leaves out on purpose, and the hardest one to build, because
  the documents are in the retrieval span and the response in the chat
  span. The evaluator will need to join the two spans of the same trace,
  probably with the Collector's `groupbytrace`.
- **Local classifiers** for prompt injection, toxicity and names and
  addresses, running inside the service without calling any API. The names
  one also covers what the masking before the judge lets through today.

And there's a number I've wanted to see in the dashboard since I put cost
and quality in the same Prometheus: cost per relevant response, by service.
If a prompt change cuts the cost in half and doubles the failed responses,
the application became cheaper and worse at the same time, and today I'd
only see the first half of that story in the cost dashboard.
