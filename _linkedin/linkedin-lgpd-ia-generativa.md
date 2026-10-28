# Post LinkedIn: LGPD e IA generativa (o que a liderança deve cobrar)

**Referente ao post:** [LGPD e IA generativa: o que a liderança deve cobrar da tecnologia](/_posts/2026-10-21-lgpd-e-ia-generativa-o-que-a-lideranca-deve-cobrar.md)

**Versão anterior (publicada sem imagem):** https://www.linkedin.com/feed/update/urn:li:activity:7518760797804580864/

> Texto abaixo em **texto puro**: o LinkedIn não renderiza markdown, então nada de `**negrito**`. Copiar e colar direto.

---

## Corpo do post

Que dado de cliente da sua empresa já foi enviado a um modelo de linguagem, e para onde ele foi?

Em muitos pilotos de IA generativa, a LGPD entra depois, quando o dado já está circulando. E ele escapa por fora do fluxo desenhado: o atendente que cola o CPF do cliente no chat, o log que guarda o prompt inteiro "para depurar", o contexto que o agente recupera e reenvia ao modelo a cada pergunta.

Três coisas que a liderança pode cobrar da área de tecnologia:

1. Um mapa de quais aplicações enviam dados a um modelo, quais dados, a qual provedor e em que país. Modelo hospedado fora do Brasil pode caracterizar transferência internacional (LGPD, art. 33), e a região muda a regra: a União Europeia tem decisão de adequação da ANPD desde janeiro de 2026; para os EUA, a transferência em geral depende das cláusulas-padrão contratuais.

2. Minimização antes do envio. Para resumir um atendimento, o modelo não precisa do número do CPF; "[CPF]" no lugar dele resolve. O mesmo vale para a resposta e para o log.

3. Evidência. Política escrita não basta. No meu lab, cada interação com LLM passa por um detector de CPF, CNPJ, e-mail, cartão, telefone e chave PIX, e o resultado vira métrica e alerta.

No setor financeiro o peso é maior: há o sigilo bancário e a Resolução CMN 4.893, que, para serviço no exterior, exige definir antes os países onde o dado pode ser processado. É o mapa do item 1.

Com controles proporcionais ao risco, a empresa segue inovando e consegue demonstrar que o dado pessoal que não podia sair não saiu.

Na sua empresa, quem cuida desse mapa: a área de tecnologia ou a de privacidade?

Post completo, com as resoluções e o caso dos EUA, no primeiro comentário.

#LGPD #IAGenerativa #Bancos

---

## Primeiro comentário (postar logo em seguida)

LGPD e IA generativa: o que a liderança deve cobrar da tecnologia (com as resoluções da ANPD e do CMN citadas e o que muda quando o modelo roda nos EUA):
https://garden.jansouza.com/ia/2026/10/21/lgpd-e-ia-generativa-o-que-a-lideranca-deve-cobrar.html

O detector de dado pessoal que citei no item 3, dentro do serviço de avaliação do lab:
https://garden.jansouza.com/homelab/2026/10/03/llm-as-a-judge-avaliando-respostas-no-pipeline-de-observabilidade.html

---

## Aberturas alternativas

- Um atendente cola o CPF de um cliente no chat para pedir um resumo do caso. Esse CPF agora está no provedor do modelo, no trace da ferramenta de observabilidade e, talvez, fora do Brasil.
- Em muitos pilotos de IA generativa, a pergunta "para onde vai o dado do cliente?" só aparece depois que a ferramenta já está em uso.

---

**TODO antes de publicar:**
- [ ] Anexar as duas imagens, nesta ordem: antes-depois-mascaramento.png (aparece no feed) e diagrama-lgpd-ia.png, ambas em assets/images/lgpd-ia-generativa/
- [x] Conferir Resoluções CD/ANPD 15/2024 e 19/2024 (texto no DOU) e 32/2026 (índice de regulamentações da ANPD e página da Comissão Europeia)
- [x] Conferir a descrição da Resolução CMN 4.893/2021 (arts. 15 e 16, em vigor; alterada pelas Res. CMN 5.117/2024 e 5.274/2025 sem mudar esses artigos)
- [ ] Conferir se a URL do post bate com o permalink gerado (data/categoria)
- [ ] Postar o primeiro comentário com os links logo após publicar
- [ ] Decidir o que fazer com a versão anterior (apagar, ou deixar e publicar esta como continuação)

---

## Versão longa (2.941 caracteres, guardada para referência)

Que dado de cliente da sua empresa já foi enviado a um modelo de linguagem, e para onde ele foi?

Em muitos pilotos de IA generativa, o caso de uso e a ferramenta vêm primeiro e a LGPD entra depois, quando o dado já está circulando. O dado pessoal escapa por três caminhos que ficam fora do fluxo desenhado:

1. O atendente que cola o e-mail ou o CPF de um cliente no chat para pedir um resumo do caso.
2. O log do prompt guardado "para depurar". O OpenLLMetry, que usei no meu lab, grava prompt e resposta inteiros no trace por padrão, e o dado passa a seguir a retenção e os acessos da ferramenta de log, não os do sistema de origem.
3. O contexto que o agente recupera da base interna e reenvia ao modelo a cada pergunta, muitas vezes com mais dado do que a pergunta precisava.

Três coisas que a liderança pode cobrar da área de tecnologia:

A. Um mapa de quais aplicações enviam dados a um modelo, quais dados, a qual provedor e em que país. Usar um modelo hospedado fora do Brasil pode caracterizar transferência internacional de dados, com regras próprias (LGPD, art. 33). E a região muda o mecanismo: desde janeiro de 2026 a ANPD reconhece a União Europeia como adequada; um endpoint nos EUA, sem decisão de adequação, em geral depende das cláusulas-padrão contratuais da ANPD. Se ninguém sabe dizer em que região roda o endpoint do modelo, esse já é o primeiro achado.

B. Minimização antes do envio. CPF, nome e número de conta podem ser mascarados antes do prompt, pelo princípio da necessidade (art. 6º, III). Para resumir um atendimento, o modelo não precisa do número do CPF; "[CPF]" no lugar dele resolve. O mesmo vale para as respostas e para os logs, senão o dado volta pela resposta ou fica guardado no trace.

C. Evidência. Política escrita não basta; uma avaliação contínua que procura dado pessoal nas respostas e nos registros mostra o que de fato acontece. No meu lab de observabilidade fiz isso em cima da telemetria que as aplicações já geram: cada interação passa por um detector de CPF, CNPJ, e-mail, cartão, telefone e chave PIX, com validação de dígito verificador para não disparar com qualquer sequência de 11 números. Leva 2 ms no p99, então roda em todas as interações, sem amostragem, e o resultado vira métrica e alerta.

No setor financeiro o peso é maior: além da LGPD, há o sigilo bancário (LC 105/2001) e as regras do CMN e do Banco Central para contratação de processamento de dados e nuvem (Resolução CMN 4.893/2021). Elas pedem comunicação ao BC em até dez dias e, para serviço prestado no exterior, que a instituição defina antes os países e regiões onde o dado pode ser processado, o que é o mesmo mapa do item A.

Com controles proporcionais ao risco, a empresa segue inovando e consegue demonstrar que o dado pessoal que não podia sair não saiu.

Na sua empresa, quem cuida desse mapa: a área de tecnologia ou a de privacidade?

Post completo no primeiro comentário.

#LGPD #IAGenerativa #Bancos
