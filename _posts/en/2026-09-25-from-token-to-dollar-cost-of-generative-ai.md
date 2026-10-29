---
layout: post
title: "From token to dollar: estimating the cost of generative AI"
date: 2026-09-25 10:00:00 -0300
categories: [homelab]
tags: [observabilidade, opentelemetry, openllmetry, llm, ia, ia-generativa, finops, prometheus, grafana, homelab, devops]
stage: growing
image: /assets/images/openllmetry-cost-lab/dashboard-custo-overview.png
description: "A follow-up to the LLM observability lab: combining token usage with each model's price table to answer how much generative AI is costing, on which model and for which task."
translation_key: do-token-ao-dolar-custo-da-ia-generativa
---

In the [previous post]({% post_url en/2026-09-22-llm-observability-with-openllmetry-in-the-homelab %})
I instrumented the applications that call LLMs with OpenLLMetry and sent
the traces and metrics to the observability stack I already had in the
homelab. With that I could see how many tokens each call
spends, on which model, with what latency and for which task. And I ended
with one thing left open: the lab measured tokens, not money. I still had
to answer "how much did this cost" and "is this expensive model worth it".

In this post I do that math, with one caveat: the number is an estimate. In
my case, calls go through an IBM platform (based on LiteLLM) that gives
access to the models, so I don't pay per token directly. Companies are
usually similar: the cost comes from a contract, a license, a quota or an
internal chargeback, and rarely matches the provider's price list. The goal
is to put tokens in the same unit as the budget, so models, tasks and
applications can be compared with each other.

Using each model's list price, the nine days of homelab data (2,326 calls
and 4.6 million tokens) would come to about $22.50. That total, on its own,
says little. The distribution says more: the benchmark scenario that used
the most tokens wasn't the one that cost the most, and an agent with 15% of
the calls ended up with almost half the bill.

![Overview of the LLM cost dashboard in Grafana, with estimated cost, input and output cost, average cost per request, 30-day projection, daily spend per provider and the monthly line with accumulated spend and end-of-month projection](/assets/images/openllmetry-cost-lab/dashboard-custo-overview.png)

## Tokens are not money

It sounds obvious written like this, but it's easy to forget when the only
number on the dashboard is a token count. Three things change the math:

1. **Each model has its own price.** Between the cheapest and the most
   expensive model in my table, the price per token differs by more than
   100 times.
2. **Input and output cost different amounts.** With most providers an
   output token costs 4 to 8 times as much as an input token. In my lab,
   output was 20% of the tokens and 54% of the cost.
3. **The task profile matters.** A task that sends a lot of context and asks
   for a short answer has a completely different cost from one that
   generates long text, even on the same model.

OpenLLMetry doesn't emit any cost metric, and it makes sense that it
doesn't: prices change, vary by contract and depend on discounts. What it
delivers is the quantity, split by model and by token type. The price has
to come from somewhere else.

## The price table

The price table lives in a YAML file versioned along with the rest of the
homelab configuration, one line per model:

```yaml
models:
  - {model: claude-haiku-4-5, provider: bedrock, tier: 1, input: 1, output: 5}
  - {model: claude-opus-4-6, provider: bedrock, tier: 4, input: 5, output: 25}
  - {model: gpt-5.6-luna, provider: openai, tier: 0, input: 0.2, output: 1.2}
  # ... price in dollars per million tokens, input and output
```

A Python script generates the Prometheus rules from it: the price of each
model and token type becomes a constant series,
`llm_price_usd_per_mtoken{model, token_type, provider}`, and the gateway
tier becomes another one. At first I wrote these rules by hand, but there
are two per model, and with a couple dozen models that soon became a source
of errors. With the YAML, the same script also syncs the tiers with the
gateway's model list.

The prices in the table are each provider's public list price as of
September 2026, with no promotions, no prompt cache discount and no batch.
For Anthropic models I used Anthropic's own price, which is the same as the
Bedrock global endpoint (the regional endpoints cost about 10% more). Since
these prices change often, the script also compares the table with the
price list maintained by the LiteLLM project and warns when a value
diverges. That's how I notice when a price has fallen behind. In a
corporate environment, the right place for this table would be the contract
price, not the list price.

## What the numbers showed

The lab's benchmark application sends the same set of prompts to several
models, which makes for a fair comparison: each model got the same 84
requests. The exception is Opus 5.5, which joined at the end of the period
and has only 56. Token volume varies a bit, because each model counts
tokens its own way (the same prompts turned into 85K input tokens in some
and more than 120K in others), but the task is the same. The cost:

| Model                    |    Requests | Tokens (input / output)  |    Cost  |     Cost per request |
|--------------------------|------------:|-------------------------:|---------:|---------------------:|
| `claude-opus-5`          |          84 |         121K / 34K       |   $1.46  |             $0.0174  |
| `claude-opus-4-8`        |          84 |         121K / 33K       |   $1.44  |             $0.0172  |
| `gpt-5.6-sol`            |          84 |          85K / 33K       |   $1.40  |             $0.0167  |
| `claude-opus-4-6`        |          84 |          98K / 33K       |   $1.30  |             $0.0155  |
| `claude-opus-5-5`        |          56 |          81K / 23K       |   $0.79  |             $0.0141  |
| `claude-sonnet-4-6`      |          84 |          90K / 33K       |   $0.76  |             $0.0090  |
| `gpt-5.4`                |          84 |          85K / 32K       |   $0.70  |             $0.0083  |
| `claude-sonnet-5`        |          84 |         131K / 33K       |   $0.60  |             $0.0071  |
| `gemini-3.5-flash`       |          84 |          83K / 38K       |   $0.47  |             $0.0056  |
| `claude-haiku-4-5`       |          84 |          98K / 33K       |   $0.26  |             $0.0031  |
| `llama-3-3-70b-instruct` |          84 |          85K / 16K       |   $0.07  |             $0.0009  |
| `gpt-5.6-luna`           |          84 |          85K / 33K       |   $0.06  |             $0.0007  |
| `granite-4-h-small`      |          84 |          86K / 28K       |   $0.01  |             $0.0001  |

From the most expensive to the cheapest, there's more than a hundredfold
difference for the same work. That doesn't mean the results are
equivalent, because a small model fails at tasks a large one solves. But
now the cost side of that choice has a number: you can tell how much you're
paying for the extra quality.

The dashboard also got a cost matrix by model and benchmark scenario, which
shows where each model spends. For the expensive models, more than 80% of
the cost is in two scenarios, `prefill` and `sustained`; the other five add
up to cents.

![Cost panels by benchmark scenario in Grafana, with each scenario's share, a table of requests, tokens and cost per scenario, a cost matrix by model and scenario, and the price table read from the recording rules](/assets/images/openllmetry-cost-lab/dashboard-custo-por-cenario.png)

A few other things that only showed up once there was money in the
picture:

- **The biggest line on the bill is an expensive model inside an agent.**
  `claude-opus-5` had 25% of the period's tokens and 40% of the cost. Almost
  all of that came from another instrumented application, an agent
  following the ReAct pattern, and not from the benchmark: $7.61, a third of
  the entire bill. `claude-sonnet-5`, with 19% of the tokens, ended up at
  13% of the cost.
- **Few calls, half the bill.** That agent made 15% of the period's calls
  and accounted for 48% of the cost. Inside it, the reasoning loop alone was
  46% of the service's cost. The final answer is cheap; what adds up is the
  loop going around until it gets there. That's where the context trimming
  I mentioned in the previous post pays off the most, because it repeats on
  every iteration.
- **An expensive model with little volume goes unnoticed.** `gpt-5.6-sol`
  had 2.5% of the tokens and 6% of the cost. On a token panel, it's an
  inconspicuous line.
- **The scenario that uses the most isn't the one that costs the most.** In
  the previous post I pointed out that 73% of the tokens went to a single
  benchmark scenario. That's `prefill`, which sends a lot of context and
  asks for a short answer. In money, it was 36% of the cost. The `sustained`
  scenario, which generates long answers, had 18% of the tokens and 46% of
  the cost.

## The Opus 5.5 case

In the table above, `claude-opus-5-5` can't be compared directly with the
others, because it showed up halfway through. It's Anthropic's newest Opus,
and it only joined the benchmark on the 24th, so it doesn't have the same 84
requests as the others. But filtering the dashboard to the last seven days,
a window in which every model ran the same set of prompts (56 requests, 8
per scenario), they can be compared on equal terms:

![Cost matrix by model and scenario in Grafana, filtered to the last seven days of the benchmark, comparing Opus 4.6, Opus 4.8, Opus 5, Opus 5.5, GPT-5.4 and GPT-5.6 Sol](/assets/images/openllmetry-cost-lab/dashboard-custo-matriz-opus-5-5.png)

| Model             | Tokens (input / output)  |    Cost  | Average latency |
|-------------------|-------------------------:|---------:|----------------:|
| `claude-opus-5`   |          81K / 23K       |   $0.98  |           6.6 s |
| `claude-opus-4-8` |          81K / 22K       |   $0.96  |           5.5 s |
| `gpt-5.6-sol`     |          56K / 22K       |   $0.93  |           5.9 s |
| `claude-opus-4-6` |          60K / 22K       |   $0.85  |           7.4 s |
| `claude-opus-5-5` |          81K / 23K       |   $0.79  |           5.4 s |
| `gpt-5.4`         |          56K / 22K       |   $0.46  |           4.3 s |

Opus 5.5 used practically the same token volume as Opus 5 and cost 19%
less, because the price dropped from $5/25 to $4/20 per million tokens. The
matrix shows that the savings are uniform: each scenario comes out about
20% cheaper. On top of that, average latency was 18% lower, and the tier on
the platform also dropped, from 4x to 3x. It's even cheaper than Opus 4.6,
which is much older and counted fewer input tokens for the same prompts.

That's what I find most interesting about this view. The natural intuition
is that a newer, better model costs more, and that migrating is a budget
decision. Here it's the opposite: the most recent model in the family,
which Anthropic positions above Opus 5 in quality, is the cheapest Opus in
the benchmark. Whoever stays on Opus 5 out of inertia pays more for a model
that has already been surpassed, and looking only at tokens there would be
no way to notice, because the two have identical volume.

Quality, however, I didn't measure in the lab. The benchmark measures
tokens, cost and latency, not whether the answer is right, so the "better"
here comes from Anthropic and from public evaluations, not from my
dashboard. Even so, with the numbers side by side, it's hard to justify
paying more for the older model.

## Gateway tier is not price

The platform I use exposes each model with a multiplier (0x, 1x, 1.5x, 3x
or 4x) that defines how many quota units each request consumes. This
multiplier is also in the YAML, and the dashboard shows the "gateway units"
(successful requests times tier) on a separate line: 3.7K in the period.

The two measures don't always agree. Three models have a 1x tier:
`gemini-3.5-flash`, `claude-haiku-4-5` and `llama-3-3-70b-instruct`. By
quota, they cost the same. At list price, for the same work in the
benchmark, they cost $0.47, $0.26 and $0.07, almost a sevenfold difference
within the same tier. And `gpt-5.6-luna` has a 0x tier: it's "free" on the
gateway, but it has a list price.

Both answers are right, they just answer different questions. The tier says
how much of my quota I'm using; the list price says how much it would cost
whoever pays the provider's bill. For governance both matter, and the models
where they diverge are the first ones I'd review if the billing model
changed.

## What this estimate is not

Cost estimated from telemetry has limits:

- **It's not the invoice.** List price doesn't account for contract
  discounts, prompt cache, batch or promotions, and some models in the table
  are on promotional pricing right now. The provider's invoice is still the
  source of truth; the dashboard is there to show *where* the money went,
  with a good order of magnitude.
- **Only what recorded tokens counts.** Failed calls have no tokens or model
  in the response, so they're left out of the cost. In the period there
  were 87, almost all of them invalid requests or rate limits. And the same
  warning from the previous post applies: a streamed call without
  `include_usage` doesn't record tokens and therefore has no cost.
- **Linear projection is misleading with bursty traffic.** On the panel, the
  end-of-month projection says $26.56, with an average of $0.89 per day. But
  the calculation divides spend by the days since the 1st, including two
  weeks with no data at all, and almost 90% of the requests happened on
  three days, during the benchmark runs. In production, with more regular
  traffic, the projection makes more sense.

## Next steps

The price table and the cost dashboard will go out together with the
observability dashboard when I publish them to the Grafana repository. The
next step I'm considering is closing the loop with alerts: warning when a
service's daily spend goes over a threshold, before the invoice arrives.
