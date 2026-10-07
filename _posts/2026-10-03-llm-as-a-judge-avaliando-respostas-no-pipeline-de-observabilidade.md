---
layout: post
title: "LLM-as-a-Judge: avaliando as respostas dentro do pipeline de observabilidade"
date: 2026-10-03 10:00:00 -0300
categories: [homelab]
tags: [observabilidade, opentelemetry, openllmetry, llm, ia, ia-generativa, llm-as-a-judge, evals, seguranca, homelab, devops]
stage: growing
image: /assets/images/openllmetry-eval-lab/dashboard-avaliacao-overview.png
description: "Terceira parte do lab de observabilidade para LLMs: um serviço que lê os spans de GenAI no OTel Collector, roda heurísticas de segurança e um LLM como juiz da qualidade das respostas, e devolve o resultado como telemetria ligada ao trace original."
---

Nos dois posts anteriores eu
[instrumentei as aplicações que chamam LLMs]({% post_url 2026-09-22-observabilidade-para-llms-com-openllmetry-no-homelab %})
e [transformei o consumo de token em custo estimado]({% post_url 2026-09-25-do-token-ao-dolar-custo-da-ia-generativa %}).
O dashboard passou a responder quanto token cada aplicação gasta, em qual
modelo, com que latência e quanto isso custaria a preço de lista. Faltava a
pergunta que quem usa a aplicação faria: a resposta serviu?

Essa pergunta é diferente de saber qual modelo é melhor. Benchmark público
mede o modelo isolado, em tarefas padronizadas. O que chega ao usuário
depende do que a aplicação põe em volta do modelo: o prompt de sistema, o
contexto que ela monta, o histórico que manda junto, o que ela faz com a
resposta. Um modelo excelente atrás de um prompt mal escrito responde mal, e
nenhum ranking de modelos vai mostrar isso. O que eu quero medir aqui é a
qualidade da aplicação usando o modelo, nas conversas que ela de fato tem.

A falta dessa medida pesa em toda mudança que a aplicação sofre. Mudar o prompt
de sistema de um chatbot, cortar contexto para economizar token, trocar de
modelo: tudo isso mexe na resposta, e o dashboard de custo mostra só o lado
que fica mais barato. Sem uma medida de qualidade, a economia pode estar
saindo de respostas piores, e ninguém percebe até um usuário reclamar.

Neste post eu mostro o [llm-eval-otel](https://github.com/jansouza/llm-eval-otel),
um serviço que construí para fechar essa parte. Ele lê as interações com LLM
que já passam pelo pipeline de telemetria, avalia prompt e resposta e devolve
o resultado como telemetria OpenTelemetry ligada ao trace original. Tem
heurísticas de segurança (PII, credenciais, vazamento de prompt) e um
avaliador que usa a técnica de LLM-as-a-Judge: um segundo modelo lê a
conversa e dá uma nota para a resposta. O foco aqui é esse juiz, porque é
onde estão as decisões menos óbvias.

Para uma visão geral do serviço, da arquitetura aos avaliadores, montei
também uma [apresentação do llm-eval-otel](https://llm-eval.jansouza.com/).

![Visão geral do dashboard de avaliação no Grafana, com total de avaliações, reprovações, taxa de reprovação, avaliações por resultado ao longo do tempo e reprovações por avaliador, por serviço e por modelo](/assets/images/openllmetry-eval-lab/dashboard-avaliacao-overview.png)

## Avaliar fora do caminho da aplicação

A primeira decisão foi onde a avaliação roda. Colocar dentro da aplicação
acopla regra de segurança ao código do produto e soma latência em cada
chamada. Só que as aplicações do lab já mandam tudo de que um avaliador
precisa para o Collector: o span de cada chamada ao LLM, com o prompt, a
resposta, o modelo e o serviço. Então o avaliador virou mais um consumidor do
pipeline:

```
Aplicação (instrumentada com OpenLLMetry)
   │  OTLP
   ▼
OpenTelemetry Collector
   ├── traces/backend ──────────────────────────────► Tempo (como antes)
   └── traces/genai (só spans de inferência) ───────► llm-eval-otel
                                                          │
                                         heurísticas em 100% dos spans
                                         juiz em 5% dos traces ──► modelo juiz
                                                          │
   Collector, receptor otlp/eval :4319 ◄──────────────────┘
   └── evento + span filho + métricas ──────────────► Tempo, Loki, Prometheus
```

A aplicação não muda e não espera nada. O avaliador só sinaliza: ele roda
depois de a resposta ter chegado ao usuário, então não bloqueia nem altera
coisa nenhuma. Escolhi assim de propósito: para bloquear, a checagem teria
que estar no caminho da requisição, que é o papel de um guardrail, e o que eu
queria era medir sem encostar na aplicação.

No Collector, o pipeline novo é um filtro que deixa passar só os spans de
inferência e um exporter apontando para o serviço:

```yaml
processors:
  filter/genai_inference:
    error_mode: ignore
    trace_conditions:
      - >-
        not (IsMatch(span.attributes["gen_ai.operation.name"], "^(chat|text_completion|generate_content)$")
        or span.attributes["gen_ai.prompt.0.content"] != nil)
```

A segunda condição existe por causa do OpenLLMetry, que ainda grava o
conteúdo em `gen_ai.prompt.{n}.*` em vez dos atributos da semconv atual. O
serviço lê os dois formatos.

O resultado volta por um receptor separado, na porta 4319, cujo pipeline só
exporta para o backend. Sem essa separação, os spans que o próprio avaliador
emite (inclusive as chamadas ao juiz, que também são chamadas de LLM) voltariam
para ele e seriam avaliados de novo, em loop. Como segunda defesa, o serviço
descarta qualquer span com o próprio `service.name`.

Para cada span avaliado e para cada avaliador saem três coisas:

- Um evento `gen_ai.evaluation.result` (um log record com o TraceID e o
  SpanID do span original), que é o nome que a semconv de GenAI definiu para
  resultado de avaliação.
- Um span filho `evaluate {nome}`, para o resultado aparecer dentro do trace
  no Tempo, logo abaixo da chamada avaliada.
- As métricas `llm_eval.evaluations` (contador por avaliador e resultado) e
  `llm_eval.evaluation.score` (histograma de 0 a 1).

As métricas carregam o serviço, o modelo e as association properties do span
original, com os mesmos nomes das métricas do OpenLLMetry. O `scenario` que
eu usava para quebrar token e custo no dashboard serve também para quebrar
qualidade.

## Heurística primeiro, juiz depois

Nem toda pergunta precisa de um LLM para ser respondida. Seis avaliadores
vêm com o serviço, e cinco são heurísticas locais:

| Avaliador | O que detecta | Como |
| --- | --- | --- |
| `pii_detection` | CPF, CNPJ, e-mail, cartão, telefone, chave PIX | regex com validação (dígito verificador, Luhn, DDD) |
| `secret_detection` | chaves de API, tokens, JWT, chave privada, string de conexão | prefixos conhecidos e entropia |
| `refusal` | o modelo recusou o pedido | frases em português, inglês e espanhol, e `finish_reason=content_filter` |
| `system_prompt_leak` | a resposta copia trechos do prompt de sistema | sobreposição de 8-gramas de palavras |
| `output_format` | JSON inválido quando o cliente pediu JSON | parser |
| `relevance` | a resposta não atende ao que foi perguntado | LLM-as-a-Judge |

As heurísticas cobrem a parte de segurança e rodam em todos os spans. No
teste de carga, com 10 KB de texto por span, o `pii_detection` levou 2 ms no
p99 e o `secret_detection` 3,7 ms, e um processo avaliou 194 spans por
segundo com os dois ligados. Com esse custo, não é preciso amostrar, e para
segurança isso conta: se o PII fosse checado em 5% dos spans, um CPF vazado
nos outros 95% passaria sem registro.

O que nenhuma regex responde é se a resposta faz sentido para a pergunta. Um
chatbot de loja que responde "posso trocar um tênis apertado?" com um texto
sobre home office não vaza dado nenhum, não recusa, não quebra formato, e
passa limpo em todas as heurísticas. Para pegar esse tipo de resposta eu
precisei de um juiz.

## O que é LLM-as-a-Judge

Um segundo modelo recebe a conversa e os critérios de avaliação, e devolve
uma nota com justificativa. Ele faz o papel de uma pessoa revisando uma
amostra das respostas, só que em poucos segundos por conversa e sem cansar.

O nome vem do paper
[Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685)
(Zheng et al., NeurIPS 2023), do grupo de Berkeley por trás do Chatbot
Arena. Eles compararam as notas do GPT-4 como juiz com as preferências de
especialistas e de milhares de usuários, e a concordância passou de 80%, o
mesmo nível de concordância entre duas pessoas. É esse resultado que
sustenta a ideia de usar um modelo no lugar de um revisor humano.

### Uma pergunta por juiz

O juiz responde uma pergunta só: a resposta atende ao que o usuário pediu?
Não avalia se a informação está correta, nem tom, nem segurança. Quando um
mesmo prompt pede tudo isso, a nota vira uma média de critérios misturados e
fica impossível saber o que ela mede. Se depois eu quiser avaliar se a
resposta é fiel aos documentos de um RAG, isso vira outro avaliador, com
outro prompt e outra métrica.

Essa separação também resolve um caso que confunde juízes: a recusa. Se o
usuário pede a senha da conta de outra pessoa e o modelo recusa, a resposta é
relevante. O prompt diz isso explicitamente, e quem conta recusas é o
avaliador `refusal`, que é outra métrica.

### Escala com âncoras

Em vez de pedir "dê uma nota de 1 a 5", o prompt descreve o que cada nota
significa. Essas descrições são as âncoras. O prompt, em inglês como está no
código:

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

Sem âncora, o juiz decide sozinho o que separa um 3 de um 4, e essa decisão
muda de uma chamada para outra. O estudo
[An Empirical Study of LLM-as-a-Judge](https://arxiv.org/abs/2506.13639)
(Yamauchi, Yano e Oyamada, 2025) testou várias escolhas de projeto de um
juiz, e critérios de avaliação claros foram o que mais pesou na
confiabilidade. Sem eles, a correlação com o julgamento humano caiu de 0,666
para 0,591 com o GPT-4o como juiz, e de 0,641 para 0,555 com o Llama 3.1
70B. O modelo mais fraco perdeu mais, e isso importa para quem pensa em usar
um juiz pequeno e barato.

O nível que eu mais queria pegar era o 2, a resposta que fala do assunto sem
responder: "Aceitamos várias formas de pagamento" para quem perguntou se a
loja aceita PIX parcelado. Chatbot genérico produz esse tipo de resposta o
tempo todo, e uma checagem por palavra-chave a daria como relevante.

A nota vira score pela conta `(nota - 1) / 4`, que põe o resultado entre 0 e
1, na mesma escala dos outros avaliadores. O corte de `pass` é a nota 3:
resposta parcial ainda passa, e reprova o que fica em 2 ou 1.

### Justificativa antes da nota

A resposta do juiz é JSON validado contra um schema, com `response_format`
em modo `strict`:

```python
SCHEMA = {
    "type": "object",
    "properties": {
        # Antes da nota, para o modelo justificar primeiro e depois avaliar.
        "reason": {"type": "string"},
        "score": {"type": "integer", "minimum": 1, "maximum": 5},
    },
    "required": ["reason", "score"],
    "additionalProperties": False,
}
```

O modelo gera os campos na ordem do schema, então com `reason` primeiro ele
escreve o argumento e chega na nota depois. Na ordem inversa, ele escolhe a
nota e escreve uma justificativa para ela.

O estudo de Yamauchi et al. relativiza esse ganho: com as notas bem
descritas, pedir raciocínio explícito antes da nota teve pouco efeito na
concordância. Mesmo assim mantive o campo, porque a justificativa tem outro
uso aqui: ela vira o `explanation` do evento, e é o que permite entender uma
reprovação sem abrir a conversa inteira.

Nem todo servidor compatível com a API da OpenAI aceita JSON schema estrito,
então dá para cair para `json_object` ou para nenhum formato, e nesses modos
o schema vai descrito no prompt. Em todos os modos o serviço valida a
resposta antes de usar. Nota fora da faixa ou campo faltando vira um evento
de erro (`judge_invalid_output`), e não um `fail`. Se virasse `fail`, um
juiz com defeito apareceria no painel como se a aplicação estivesse
respondendo mal.

## O que sai para o provedor do juiz

Todo juiz externo significa mandar conversa de usuário para fora. Antes do
envio, tudo que o `pii_detection` e o `secret_detection` encontram é trocado
pelo tipo. O que o juiz recebe, para uma interação com CPF e e-mail:

```
<conversation>
{"context": [], "request": ["Meu CPF é [CPF] e meu e-mail é [EMAIL]"], "response": ["Obrigado, localizei seu cadastro."]}
</conversation>
```

Trocar pelo tipo, em vez de apagar, mantém a frase legível para o
julgamento. O prompt avisa que `[CPF]` e `[EMAIL]` são dados mascarados.

O limite é o que a regex não pega: nome e endereço passam como foram
escritos. Para quem não pode aceitar isso, o juiz fala com qualquer servidor
compatível com a API da OpenAI, então dá para apontar para um vLLM ou um
Ollama dentro da própria rede e nada sai. No homelab, ele aponta para a mesma
plataforma baseada no LiteLLM que aparece nos posts anteriores.

Na volta, a justificativa do juiz vira o `explanation` do evento, cortada
em 300 caracteres e passada pelo mesmo
sanitizador que limpa todos os atributos. Se o juiz citar um CPF, ele chega
na telemetria como `[REDACTED]`. E para quem não quer texto livre de modelo
nenhum na telemetria, uma variável troca a justificativa por `score=4/5`.

## Custo e isolamento

Um juiz custa token e leva segundos por chamada. Sem cuidado, ele vira
o gargalo do serviço e uma conta nova no fim do mês. Quatro decisões seguram
isso:

- **Amostragem.** O `relevance` avalia 5% dos traces por padrão. A decisão
  usa a mesma regra do sampler probabilístico do OpenTelemetry sobre o
  TraceID, então é a mesma em todas as réplicas e em reenvios do Collector.
  As heurísticas continuam em 100%.
- **Faixa própria.** As chamadas ao juiz rodam numa fila separada, com
  concorrência limitada. Se a fila enche, a avaliação é descartada e contada
  em `llm_eval.evaluations.dropped`. O juiz nunca segura as heurísticas.
- **Orçamento de tokens.** `LLM_EVAL_JUDGE_TOKENS_PER_MINUTE` limita o
  gasto. Cada chamada reserva uma estimativa antes e acerta com o uso real
  depois. Sem saldo, descarta e conta.
- **Modelo obrigatório e fixo.** Não existe modelo padrão: o modelo define
  custo e qualidade, então quem opera tem que escolher. E o ID tem que ser
  uma versão datada, não um alias que o provedor pode trocar por baixo.

Cada chamada ao juiz vira um span `chat {modelo}` com os atributos
`gen_ai.*` de qualquer chamada de LLM, tokens incluídos, e sem conteúdo
nenhum. Ou seja, o avaliador também é uma aplicação que chama LLM, e
aparece no dashboard de custo do post anterior como
qualquer outra. Dá para saber quanto a avaliação custa com a mesma tabela de
preço: no lab, 105 interações julgadas em sete dias custaram, a preço de
lista, US$ 0,34, uns US$ 3 por mil avaliações.

## Avaliação como ferramenta de gestão de prompt

Com o resultado das avaliações no Prometheus, uma mudança de prompt passa a
ter um antes e um depois medidos. A taxa de reprovação do `relevance` por
serviço e por modelo sai numa consulta:

```promql
sum by (llm_eval_source_service_name, gen_ai_request_model) (
  increase(llm_eval_evaluations_total{gen_ai_evaluation_name="relevance", gen_ai_evaluation_score_label="fail"}[1d])
)
/
sum by (llm_eval_source_service_name, gen_ai_request_model) (
  increase(llm_eval_evaluations_total{gen_ai_evaluation_name="relevance", gen_ai_evaluation_score_label=~"pass|fail"}[1d])
)
```

A mesma consulta serve para outras mudanças na aplicação: se ela trocou de
modelo para economizar, a taxa mostra se a economia custou qualidade.

No dashboard, o juiz ganhou uma seção própria, com a nota média por
serviço, a taxa de aprovação, o custo do juiz e a distribuição das notas:

![Seção LLM-as-a-Judge do dashboard de avaliação no Grafana, com nota média do juiz, interações julgadas, taxa de aprovação, custo do juiz, nota por serviço, média móvel de 24 horas, tabela por serviço e avaliador, distribuição das notas e as notas mais baixas com a justificativa do juiz](/assets/images/openllmetry-eval-lab/dashboard-avaliacao-juiz.png)

As outras métricas ajudam a ler uma mudança de prompt: a taxa de `refusal`
sobe quando um prompt novo deixou o modelo cauteloso demais, e o
`system_prompt_leak` aponta quando o modelo começou a repetir as instruções
de sistema para o usuário. (Se o prompt de sistema tem texto que o modelo
deve repetir, como uma FAQ, o serviço pode ser liberado desse avaliador.)

O prompt do juiz também precisa ser gerenciado, e com mais rigor que o das
aplicações, porque ele é a régua. Mudar uma palavra na escala pode mover
todas as notas, e o painel mostraria uma melhora ou piora que não aconteceu.
Por isso o prompt mora no código, com versão: mudança no que é detectado
sobe a versão minor do serviço, e essa versão vai em `service.version` em
toda a telemetria, para saber qual régua produziu cada resultado.

## Próximos passos

Dois avaliadores estão planejados para as próximas versões do serviço:

- **`faithfulness`**, outro juiz, para aplicações de RAG: as afirmações da
  resposta estão apoiadas nos documentos recuperados? É a pergunta que o
  `relevance` deixa de fora de propósito, e a mais difícil de montar, porque
  os documentos ficam no span de retrieval e a resposta no span de chat. O
  avaliador vai precisar juntar os dois spans do mesmo trace, provavelmente
  com o `groupbytrace` do Collector.
- **Classificadores locais** de prompt injection, toxicidade e nomes e
  endereços, rodando dentro do serviço sem chamar API nenhuma. O de nomes
  também cobre o que o mascaramento antes do juiz hoje deixa passar.

E tem uma conta que quero ver no dashboard desde que juntei custo e
qualidade no mesmo Prometheus: custo por resposta relevante, por serviço.
Se uma mudança de prompt corta o custo pela metade e dobra as respostas
reprovadas, a aplicação ficou mais barata e pior ao mesmo tempo, e hoje eu
só veria a primeira metade dessa história no dashboard de custo.
