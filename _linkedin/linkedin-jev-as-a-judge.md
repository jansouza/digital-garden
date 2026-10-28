# Post LinkedIn: Jev-as-a-Judge

**Referente ao post:** [Jev-as-a-Judge: um modelo de decisão como juiz das respostas](/_posts/2026-10-12-jev-as-a-judge-um-modelo-de-decisao-como-juiz.md)

> Texto abaixo em **texto puro**: o LinkedIn não renderiza markdown, então nada de `**negrito**`. Copiar e colar direto.

---

## Corpo do post

Jev-as-a-Judge: testando um modelo de decisão como juiz das respostas de LLM no meu homelab.

As últimas semanas foram de muito hype em cima do Jev, o modelo de decisão System One que a TypeSafe AI lançou em setembro, e resolvi testar no meu avaliador. O Jev não escreve texto: recebe um estado em JSON e uma lista de perguntas tipadas (sim ou não, múltipla escolha, nota numa rubrica) e devolve probabilidades. Para decidir se uma resposta passa ou reprova, uma probabilidade basta. E sem justificativa em texto livre, não preciso mais cortar e sanitizar o que o juiz diz antes de virar telemetria.

Coloquei quatro avaliadores com ele no llm-eval-otel: relevância, recusa, toxicidade e prompt injection. O Jev cobra só a entrada (US$ 0,042 por milhão de tokens) e lê o estado uma vez por requisição, não importa quantas perguntas venham junto. Por isso o serviço junta numa chamada só todos os avaliadores sorteados para o mesmo span. No lab foram 84 avaliações em 25 requisições, US$ 0,0010 no total, ou pouco mais de US$ 0,00001 por avaliação. O LLM que eu já usava como juiz custa uns US$ 0,003 por avaliação. A comparação com o juiz generativo não é exata, porque o tráfego dos dois períodos é outro. Mas mesmo com spans de 10 KB, uma requisição com as quatro perguntas sai mais de vinte vezes mais barata que uma avaliação do LLM.

O p95 de latência ficou em 2,11 s, longe dos 70 a 500 ms do anúncio. Com 25 requisições esse número diz pouco, mas vou acompanhar. E ainda não medi como ele se sai em português, que é boa parte do tráfego do lab. A própria TypeSafe diz que outras línguas funcionam, "mas não igualmente bem". Meu critério: o jev_relevance só deixa de ser experimental se concordar com rótulos humanos em pelo menos 80% dos itens em português. Até lá, o juiz generativo continua sendo a referência.

#observabilidade #LLM #OpenTelemetry

---

## Primeiro comentário (postar logo em seguida)

Escrevi os detalhes, com código e o dashboard no Grafana:
https://garden.jansouza.com/homelab/2026/10/12/jev-as-a-judge-um-modelo-de-decisao-como-juiz.html

O código do avaliador:
https://github.com/jansouza/llm-eval-otel

Post anterior da série, com o juiz generativo:
https://garden.jansouza.com/homelab/2026/10/03/llm-as-a-judge-avaliando-respostas-no-pipeline-de-observabilidade.html

---

**TODO antes de publicar:**
- [ ] Anexar o print da seção do Jev (dashboard-avaliacao-jev.png)
- [ ] Conferir se a URL do post bate com o permalink gerado (data/categoria)
- [ ] Postar o primeiro comentário com os links logo após publicar
