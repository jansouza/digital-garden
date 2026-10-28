# Post LinkedIn: Do token ao dólar (custo da IA generativa)

**Referente ao post:** [Do token ao dólar: estimando o custo da IA generativa](/_posts/2026-09-25-do-token-ao-dolar-custo-da-ia-generativa.md)

> Texto abaixo em **texto puro** — o LinkedIn não renderiza markdown, então nada de `**negrito**`. Copiar e colar direto.

---

## Corpo do post

O Opus 5.5, modelo mais novo da Anthropic, custou 19% menos que o Opus 5 no benchmark do meu homelab, com latência média 18% menor. Só enxerguei essa diferença depois de colocar estimativa de custo no lab, porque em volume de token os dois eram idênticos.

No post anterior montei a observabilidade pra medir o consumo de token de qualquer aplicação que chama um LLM, mas o lab media token, não dinheiro. Agora o Prometheus aplica o preço de lista de cada modelo e o dashboard mostra custo por modelo, por aplicação e por tarefa.

Rodando a mesma bateria de prompts por sete dias, o Opus 5.5 e o Opus 5 consumiram 81 mil tokens de entrada e 23 mil de saída cada um. O que mudou foi o preço, que caiu de US$ 5/25 pra US$ 4/20 por milhão de tokens. Ele saiu mais barato até que o Opus 4.6, bem mais antigo.

Eu esperava que o modelo novo custasse mais e que migrar fosse uma decisão de orçamento. Aqui foi o contrário: quem continua no Opus 5 paga mais caro por um modelo mais lento.

Nos nove dias de dados (2.326 chamadas, 4,6 milhões de tokens, uns US$ 22,50 a preço de lista), o dinheiro se concentrou em dois lugares:

- Token de saída foi 20% do volume e 54% do custo.
- Um agente ReAct fez 15% das chamadas e ficou com 48% da conta. A resposta final sai barata, o que pesa são as voltas do loop de raciocínio até chegar nela.

Duas ressalvas. Não medi qualidade, então se o Opus 5.5 é melhor, isso vem da Anthropic e das avaliações públicas, não do meu dashboard. E o valor é estimativa com preço de lista, sem desconto de contrato nem cache; a fatura continua sendo a fonte da verdade.

Se tem Opus 5 rodando na sua empresa só porque ninguém revisou desde que foi configurado, vale conferir.

Post completo, com a tabela de preço, os dashboards e os números, no primeiro comentário.

#inteligenciaartificial #finops #llmops

---

## Primeiro comentário (postar logo em seguida)

Do token ao dólar: estimando o custo da IA generativa:
https://garden.jansouza.com/homelab/2026/09/25/do-token-ao-dolar-custo-da-ia-generativa.html

Post anterior, com a instrumentação e o dashboard de tokens:
https://garden.jansouza.com/homelab/2026/09/22/observabilidade-para-llms-com-openllmetry-no-homelab.html

---

## Aberturas alternativas

- Mesmo volume de token, 19% mais barato. Foi o que deu quando comparei o Opus 5.5 com o Opus 5 no benchmark do meu homelab.
- No post anterior eu medi token. Desta vez coloquei preço em cima, e a primeira coisa que apareceu foi que o Opus mais novo da Anthropic é também o mais barato do meu benchmark.

---

**TODO antes de publicar:**
- [ ] Anexar o print da matriz filtrada no Opus 5.5 (dashboard-custo-matriz-opus-5-5.png), que conversa direto com a abertura; alternativa: dashboard-custo-overview.png
- [ ] Conferir se a URL do post bate com o permalink gerado (data/categoria)
- [ ] Postar o primeiro comentário com os links logo após publicar
- [x] Revisar tamanho (cortados os dois últimos itens da lista; mantidos saída 54% e agente 48%)
