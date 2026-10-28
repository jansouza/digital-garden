# Post LinkedIn: Observabilidade para LLMs (OpenLLMetry)

**Referente ao post:** [Observabilidade para LLMs: medindo tokens antes de falar em custo](/_posts/2026-09-22-observabilidade-para-llms-com-openllmetry-no-homelab.md)

> Texto abaixo em **texto puro** — o LinkedIn não renderiza markdown, então nada de `**negrito**`. Copiar e colar direto.

---

## Corpo do post

703 mil tokens, 498 chamadas, 32 erros. Isso foi um dia de teste no meu homelab — e foi a primeira vez que consegui ver esse número de verdade, em vez de imaginar.

Cada chamada pra um modelo custa token, e esse custo varia bastante dependendo do modelo, do provedor, do tamanho do prompt. Enquanto era só "testar a ferramenta", ninguém olhava isso de perto. Agora que virou parte do processo, começa a aparecer uma pergunta que quase ninguém tem resposta pronta: quanto estamos gastando com IA, em qual modelo, pra qual time? É basicamente o problema que o FinOps resolveu pra cloud, só que agora em cima de token.

Fui atrás disso: montei um pipeline de observabilidade pra medir consumo de token, latência e erro de qualquer aplicação que chame um LLM. Usei OpenLLMetry pra instrumentar, um OpenTelemetry Collector roteando os dados, Grafana Tempo pros traces e Prometheus pras métricas — reaproveitando a stack de monitoração que já rodava aqui em casa.

O que mais me chamou atenção no processo:

🔹 Instrumentar custa três linhas de código. O SDK faz o trabalho pesado sozinho — o que já existia no código passa a emitir trace e métrica sem eu tocar em nada.

🔹 O dado que realmente importa pra governança não é "quanto token esse modelo consumiu", é "quanto token esse time ou essa tarefa consumiu". Isso só apareceu quando propaguei umas propriedades de contexto pro lado das métricas.

🔹 O dashboard deixou visível um trade-off que até então era só teoria: dois modelos com o mesmo número de chamadas e o mesmo volume de token, mas um é reasoning e o outro não — o de raciocínio levou o dobro do tempo pra responder. Mesmo token, propósito diferente, performance bem diferente.

🔹 Não existia nenhum dashboard pronto pra essa combinação (OpenLLMetry alimentando Prometheus, em vez do backend nativo da Traceloop). Construí um do zero — pretendo publicar ele em breve.

🔹 O ganho mais concreto não veio do dashboard, veio do trace. Abrindo o conteúdo de uma chamada, achei a aplicação mandando um monte de contexto que não servia pra nada — sobra de prompt anterior, texto duplicado. Cortei, e o prompt ficou mais enxuto: mesma tarefa, menos token gasto por chamada. Métrica mostra que tem problema, trace mostra qual é.

O que falta: hoje o lab mede volume, não dinheiro. O próximo passo é cruzar isso com o preço real de cada modelo — porque quantidade de token e custo em conta são coisas diferentes.

Quem mais por aí já parou pra medir isso na empresa? Curioso pra saber se a pergunta "quanto estamos gastando com IA" já chegou até vocês.

Post completo com a arquitetura, os configs e os prints do dashboard no primeiro comentário. 👇

#observabilidade #opentelemetry #llmops #inteligenciaartificial #finops #homelab

---

## Primeiro comentário (postar logo em seguida)

Observabilidade para LLMs: medindo tokens antes de falar em custo:
https://garden.jansouza.com/homelab/2026/09/22/observabilidade-para-llms-com-openllmetry-no-homelab.html

---

**TODO antes de publicar:**
- [ ] Anexar o print do dashboard (dashboard-resumo-por-modelo.png é o mais forte pra chamar atenção)
- [ ] Postar o primeiro comentário com o link logo após publicar
- [ ] Confirmar se o dashboard já foi publicado no repositório do Grafana antes de dizer "em breve" — ajustar o texto se ainda não saiu
- [ ] Revisar tom/tamanho
