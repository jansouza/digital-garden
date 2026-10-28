# Post LinkedIn: LLM-as-a-Judge no pipeline de observabilidade

**Referente ao post:** [LLM-as-a-Judge: avaliando as respostas dentro do pipeline de observabilidade](/_posts/2026-10-03-llm-as-a-judge-avaliando-respostas-no-pipeline-de-observabilidade.md)

> Texto abaixo em **texto puro**: o LinkedIn não renderiza markdown, então nada de `**negrito**`. Copiar e colar direto.

---

## Corpo do post

LLM-as-a-Judge: avaliando a qualidade das respostas dos agentes de IA no meu homelab.

Nos dois posts anteriores, montei a parte de tokenomics: quanto token cada aplicação consome, com que latência e quanto isso custa, por modelo e por tarefa. Para governança de IA, isso responde só metade da pergunta. Trocar para um modelo mais barato ou enxugar um prompt reduz a conta, mas sem uma medida de qualidade a economia pode estar saindo de respostas piores, e ninguém percebe até um usuário reclamar. Por isso coloquei um segundo modelo para dar nota às respostas.

E a qualidade da resposta depende mais da aplicação do que do modelo. Benchmark público mede o modelo isolado; o que chega ao usuário depende do prompt de sistema, do contexto que a aplicação monta e do histórico que ela manda junto.

O juiz roda dentro do llm-eval-otel, um serviço que construí para ler as conversas que já passam pelo OpenTelemetry Collector e devolver o resultado como telemetria ligada ao trace original. A aplicação não muda nem espera nada.

Ele dá nota de 1 a 5 e avalia só 5% das conversas, porque cada avaliação custa token. As checagens de segurança ficam com regras simples, sem LLM, que rodam em todas as conversas e procuram CPF, e-mail e credenciais nos prompts e nas respostas.

Algumas decisões que pesaram no juiz:

- Ele responde uma pergunta só: a resposta atende ao pedido? Se a mesma nota mede relevância, correção e tom, ninguém sabe o que ela mede.
- Cada nota da escala tem uma descrição. Um estudo de 2025 mediu que, sem isso, a concordância com o julgamento humano cai, e cai mais em juízes menores.
- CPF, e-mail e credenciais viram [CPF], [EMAIL] e [SECRET] antes de ir para o juiz. Nome e endereço ainda passam, e esse é o limite atual.

O juiz também é uma aplicação que chama LLM, então aparece no mesmo dashboard de custo: 105 conversas julgadas custaram US$ 0,34 a preço de lista, uns US$ 3 por mil.

Com custo e qualidade no mesmo dashboard, cada mudança de prompt ou de modelo tem um antes e um depois medidos, e dá para ver se a economia veio junto com respostas piores.

O próximo passo é um segundo juiz para aplicações de RAG, que confere se o que a resposta afirma está nos documentos que a aplicação recuperou.

Post completo, com o prompt do juiz, a arquitetura e os dashboards, no primeiro comentário.

#llmops #observabilidade #inteligenciaartificial #tokenomics

---

## Primeiro comentário (postar logo em seguida)

LLM-as-a-Judge: avaliando as respostas dentro do pipeline de observabilidade:
https://garden.jansouza.com/homelab/2026/10/03/llm-as-a-judge-avaliando-respostas-no-pipeline-de-observabilidade.html

O código do avaliador:
https://github.com/jansouza/llm-eval-otel

Posts anteriores da série:
https://garden.jansouza.com/homelab/2026/09/22/observabilidade-para-llms-com-openllmetry-no-homelab.html
https://garden.jansouza.com/homelab/2026/09/25/do-token-ao-dolar-custo-da-ia-generativa.html

---

## Aberturas alternativas

- Um dos casos de teste do meu lab é um chatbot de loja que responde "posso trocar um tênis que ficou apertado?" com um texto sobre como montar um home office. Passa em todas as checagens de segurança e não ajuda em nada quem perguntou.
- Colocar um segundo modelo para dar nota às respostas das aplicações com LLM do meu homelab custa uns US$ 3 por mil avaliações, a preço de lista.

---

**TODO antes de publicar:**
- [ ] Anexar o print da seção do juiz (dashboard-avaliacao-juiz.png); alternativa: dashboard-avaliacao-overview.png
- [ ] Conferir se a URL do post bate com o permalink gerado (data/categoria)
- [ ] Confirmar que o repositório llm-eval-otel está público antes de postar o link
- [ ] Postar o primeiro comentário com os links logo após publicar
