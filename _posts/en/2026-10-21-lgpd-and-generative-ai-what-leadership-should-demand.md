---
layout: post
title: "LGPD and generative AI: what leadership should demand from technology"
date: 2026-10-21 10:00:00 -0300
categories: [ia]
tags: [lgpd, privacidade, ia-generativa, llm, ia, seguranca, observabilidade, bancos]
stage: growing
image: /assets/images/lgpd-ia-generativa/diagrama-lgpd-ia.png
description: "Where personal data escapes in a generative AI application (the chat, the log and the agent's context), three controls leadership can demand from the technology team (a map of providers and countries, minimization before sending and continuous evidence) and what changes under Brazil's LGPD when the model runs in the United States."
translation_key: lgpd-e-ia-generativa-o-que-a-lideranca-deve-cobrar
---

What customer data from your company has already been sent to a language
model, and where did it go?

In many generative AI pilots, the use case and the tool come first and the
LGPD (Brazil's General Data Protection Law) comes later, when the data is
already circulating. The main flow is usually designed: the application
receives the question, calls the model and returns the answer. Personal
data escapes through paths that were left out of that design, and there are
three of them.

![Diagram of the flow of a generative AI application: the agent or customer sends text to the application, which queries the internal knowledge base (RAG), writes prompt and response to logs and traces and calls the language model. Three leak points are marked in red (copy into the chat, log for debugging, agent context) and three controls in green: provider and country map, masking before sending and continuous evaluation of responses and logs](/assets/images/lgpd-ia-generativa/diagrama-lgpd-ia.png)

## Where the data escapes

**1. The copy into the chat.** The support agent pastes a customer's email,
CPF (the Brazilian taxpayer ID) or account number into the chat to ask for
a summary of the case. Nobody planned for that use, but the tool accepts
any text, and the data goes along in the prompt to the model provider.

**2. The log "for debugging".** Prompt and response are what the team wants
to see when something goes wrong, so they end up recorded. When
[I instrumented my lab's applications with OpenLLMetry]({% post_url en/2026-09-22-llm-observability-with-openllmetry-in-the-homelab %}),
the library's default was to record the full content of the messages in
the spans. From then on the personal data follows the retention and access
rules of the logging tool, which are rarely the same as those of the source
system: someone without access to the CRM may have access to the trace
backend.

If that backend is exposed, it becomes a security incident. Under the
regulation of the ANPD, Brazil's data protection authority (Resolution
CD/ANPD 15/2024), an incident that may significantly affect data subjects
and involves, for example, financial data, data protected by secrecy or
large-scale data has to be reported to the ANPD and to the data subjects
within three business days, counted from when the controller learns that
personal data was affected (arts. 5, 6 and 9). Every incident, reported or
not, is kept on record for at least five years (art. 10). A CPF masked
before reaching the trace stays out of that leak.

**3. The agent's context.** An application with RAG fetches documents from
the internal knowledge base and resends them to the model with every
question. The context carries whatever the search brought back, and often
that's more data than the question needed: the customer's entire record
when the question was about the status of an order.

## What to demand from the technology team

### A map

Which applications send data to a model, which data, to which provider and
in which country. It sounds basic, but the answer is usually scattered,
because each team picked a provider, an SDK and a region at the time of the
pilot. The map is also the start of the record of processing operations
that the law already requires from the controller and the processor (art.
37).

Using a model hosted outside Brazil may constitute an international data
transfer (LGPD, art. 33), and the ANPD has its own regulation for that
(Resolution CD/ANPD 19/2024). In practice, the endpoint's region decides
which mechanism supports the transfer:

- **Region in the European Union.** Since January 2026 the ANPD has
  recognized the EU as having a level of protection adequate to the LGPD
  (Resolution CD/ANPD 32/2026), and the transfer can rely on that adequacy
  decision. In parallel, the European Commission recognized Brazil as
  adequate.
- **Region in the United States, or in another country without an adequacy
  decision.** The transfer needs another mechanism, usually the ANPD's
  standard contractual clauses. Companies that already used contractual
  clauses had twelve months, starting in August 2024, to incorporate the
  standard clauses into their contracts. I go into this case in detail
  [further below](#when-the-model-runs-in-the-united-states).

When the provider is American, a region in the EU doesn't solve
everything. The data can still reach the US through remote support,
through subprocessors or through features that route inference across
regions to gain capacity. The provider's contract and list of
subprocessors say whether that happens, and the map needs to record the
answer.

The same model is often available in several regions, and whoever chooses
the region is whoever configures the endpoint, almost always someone in
technology. Switching regions to gain latency or quota changes the transfer
mechanism, and that switch can happen without going through legal. If
nobody can say in which region the endpoint the application calls is
running, that's already the first finding.

The map needs a column for training: does the provider use what the company
sends to train models? The answer varies by provider and by plan, and it's
in the contract. The ANPD has already acted on AI training: in July 2024 it
ordered Meta to suspend the use of Brazilian users' data to train its
models, among other reasons because it considered the use of legitimate
interest inadequate in that case, and only lifted the measure in August,
after the company presented a compliance plan.

### Minimization before sending

CPF, name and account number can be masked before the prompt, under the
necessity principle (art. 6, III): process only the minimum needed for the
purpose. To summarize a support case, the model doesn't need the CPF
number; `[CPF]` in its place does the job. When the model is outside
Brazil, the same rule shows up in the international transfer regulation,
which limits the transfer to the minimum necessary for the purpose
(Resolution CD/ANPD 19/2024, art. 9, sole paragraph).

![Comparison of the same request from a support agent to the chat. Without minimization, the text carries the customer's name, CPF, account and email, and the CPF ends up stored at the model provider, in the trace and in the application log. With masking before sending, the text carries [NOME], [CPF], [CONTA] and [EMAIL], and the three places only store [CPF]](/assets/images/lgpd-ia-generativa/antes-depois-mascaramento.png)

Masking also needs to cover the response and the log. If the response
isn't checked, the data comes back through it; if the log records the
original text, it stays stored in the trace. In
[llm-eval-otel](https://github.com/jansouza/llm-eval-otel), the evaluation
service I built in the lab, the
[judge itself receives the conversation already masked]({% post_url en/2026-10-03-llm-as-a-judge-evaluating-answers-in-the-observability-pipeline %}):
what it reads is `Meu CPF é [CPF] e meu e-mail é [EMAIL]`. Replacing the
data with its type, instead of deleting it, keeps the sentence readable for
the judgment, and the prompt tells the judge those fields were masked.

I prefer this masking to sit in a single place, between the applications
and the model, rather than spread across each application. That way the
rule is tested and audited once, and a fix applies to every application.

### Evidence

A written policy isn't enough. It says what should happen; a continuous
evaluation that looks for personal data in responses and records shows
what actually happens.

In the lab I did this on top of the telemetry the applications already
generate. Every LLM interaction goes through a detector for CPF, CNPJ (the
Brazilian company ID), email, card, phone and PIX key. It's regex, but with
validation: check digits for CPF and CNPJ, Luhn for cards, area code for
phones. Without that, any sequence of 11 digits would become an alert. In
the load test the detector took 2 ms at p99 with 10 KB of text per
interaction, so it runs on all of them, without sampling. For security
that matters: if the detector looked at 5% of the interactions, a CPF
leaked in the other 95% would go unrecorded. The result becomes a metric
and an alert, which is what you can show in an audit.

The detector has limits. Regex doesn't recognize names or addresses, and
both go through as written; sensitive data in free text ("the customer has
been in default since March") also goes through. That needs another kind
of detector, or masking at the input, before the text reaches the log.

## When the model runs in the United States

Under the ANPD's regulation, there is an international transfer when a
processing agent passes personal data to another agent located abroad
(Resolution CD/ANPD 19/2024, arts. 3 and 5). The company that calls the API
of a model hosted in the US with customer data in the prompt is the
exporter, and the provider is the importer. The exception is international
collection: when the data subject uses a foreign service directly, there's
no transfer (art. 6). A support agent who pastes a customer's CPF into a
tool doesn't fall under that exception, because the one transferring is the
company. If the tool is a personal account, with no contract with the
company, the transfer happens with no mechanism at all.

The transfer needs a legal basis under the LGPD (art. 7 or 11) and a
transfer mechanism (art. 9). The US has no adequacy decision from the ANPD,
so the mechanism, in practice, is the standard contractual clauses. The
regulation also allows specific clauses approved by the ANPD, binding
corporate rules and the other cases in art. 33 of the LGPD.

Using the standard clauses brings three obligations:

- **Full text, unchanged.** The clauses are only valid if adopted in full,
  in a contract signed between exporter and importer (art. 16), so the
  question for the vendor is whether its contract includes that text. In
  October 2026 I read the public data processing agreements (DPAs) of five
  large model and cloud providers, and only one included the ANPD clauses;
  the other four didn't mention Brazil, the LGPD or the ANPD. That doesn't
  prove the mechanism is missing, since there may be a negotiated addendum,
  but it shows you can't assume it.
- **Public document.** The company has to publish on its website, in
  Portuguese and in plain language, a document about the transfer, with the
  destination country, the purpose and the data subject's rights (art. 17,
  §2). If the data subject asks for the full text of the clauses, the
  deadline to deliver it is 15 days (art. 17, §1).
- **Access request from an authority.** If an authority in the destination
  country demands access to the data, the provider has to notify the
  company and the data subject, unless local law prohibits the notice, and
  challenge the request when there is legal basis to do so (clause 19 of
  Annex II).

The provider remains a processor and handles the data according to the
company's instructions. If it uses the data outside them, for example to
train models without the contract allowing it, it is jointly liable for
damages and is treated as a controller (LGPD, art. 42, §1, I). If the data
leaks on the provider's side, the one who reports the incident to the ANPD
and to the data subjects within three business days is the company, which
is the controller.

## In the financial sector

The stakes are higher here: besides the LGPD, there's banking secrecy
(Complementary Law 105/2001) and the rules from the CMN (National Monetary
Council) and the Central Bank of Brazil for contracting data processing and
cloud services. For banks, the rule is CMN Resolution 4,893/2021; payment
institutions, brokers and consortium administrators follow their own
Central Bank rule.

Under Resolution 4,893, contracting a relevant processing or cloud service
has to be reported to the Central Bank within ten days (art. 15). If the
service is provided abroad, the institution needs to define beforehand the
countries and regions where the data can be stored and processed, and
there must be an information exchange agreement between the Central Bank
and the supervisor of that country; without an agreement, the contract
depends on an authorization requested 60 days in advance (art. 16). For the
US, the Central Bank's page of supervisory memoranda lists agreements with
the Federal Reserve, the OCC, the FDIC and the New York Department of
Financial Services, so the agreement requirement tends to be met; the
confirmation for the specific case is up to the institution.

A language model consumed through an API is, in practice, a contracted
data processing service. For a bank, knowing in which country and region
the model runs is a requirement of art. 16, and the map is where that
answer comes from. Financial data and data under secrecy are also among
the criteria that make an incident reportable to the ANPD, so a leak
through a log weighs more here.

## What lies ahead

If generative AI takes part in a decision about the customer, such as a
credit analysis, the data subject already has the right today to request a
review of a decision made solely on the basis of automated processing
(LGPD, art. 20). The ANPD consolidated contributions on this right in a
technical note in 2025 and covers the topic in its 2025-2026 regulatory
agenda, but has not yet published a specific rule.

Brazil's AI legal framework (Bill PL 2338/2023), approved by the Senate in
December 2024, is still under discussion in the Chamber of Deputies, with
no vote scheduled. Until it becomes law, what applies to generative AI with
personal data is the LGPD and the ANPD regulations cited here, and for
banks, the CMN and Central Bank rules.

With controls proportional to the risk, the company keeps innovating and
can demonstrate that the personal data that wasn't supposed to leave
didn't. I'm curious to know who takes care of this map in the companies
where it already exists: the technology team or the privacy team.
