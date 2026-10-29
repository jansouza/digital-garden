---
layout: post
title: "LGPD e IA generativa: o que a liderança deve cobrar da tecnologia"
date: 2026-10-21 10:00:00 -0300
categories: [ia]
tags: [lgpd, privacidade, ia-generativa, llm, ia, seguranca, observabilidade, bancos]
stage: growing
image: /assets/images/lgpd-ia-generativa/diagrama-lgpd-ia.png
description: "Por onde o dado pessoal escapa numa aplicação de IA generativa (o chat, o log e o contexto do agente), três controles que a liderança pode cobrar da área de tecnologia (um mapa de provedores e países, minimização antes do envio e evidência contínua) e o que muda pela LGPD quando o modelo roda nos Estados Unidos."
translation_key: lgpd-e-ia-generativa-o-que-a-lideranca-deve-cobrar
---

Que dado de cliente da sua empresa já foi enviado a um modelo de linguagem,
e para onde ele foi?

Em muitos pilotos de IA generativa, o caso de uso e a ferramenta vêm
primeiro e a LGPD entra depois, quando o dado já está circulando. O fluxo
principal costuma estar desenhado: a aplicação recebe a pergunta, chama o
modelo e devolve a resposta. O dado pessoal escapa por caminhos que ficaram
fora desse desenho, e são três.

![Diagrama do fluxo de uma aplicação de IA generativa: o atendente ou cliente envia texto para a aplicação, que consulta a base interna (RAG), grava prompt e resposta em logs e traces e chama o modelo de linguagem. Três pontos de vazamento estão marcados em vermelho (cópia no chat, log para depurar, contexto do agente) e três controles em verde: mapa de provedor e país, mascaramento antes do envio e avaliação contínua sobre respostas e logs](/assets/images/lgpd-ia-generativa/diagrama-lgpd-ia.png)

## Onde o dado escapa

**1. A cópia no chat.** O atendente cola o e-mail, o CPF ou o número da
conta de um cliente no chat para pedir um resumo do caso. Ninguém planejou
esse uso, mas a ferramenta aceita qualquer texto, e o dado vai junto no
prompt para o provedor do modelo.

**2. O log "para depurar".** Prompt e resposta são o que a equipe quer ver
quando algo dá errado, então acabam gravados. Quando
[instrumentei as aplicações do meu lab com OpenLLMetry]({% post_url 2026-09-22-observabilidade-para-llms-com-openllmetry-no-homelab %}),
o padrão da biblioteca era gravar o conteúdo das mensagens inteiro nos
spans. A partir daí o dado pessoal segue a retenção e os acessos da
ferramenta de log, que raramente são os mesmos do sistema de origem: quem
não tem acesso ao CRM pode ter acesso ao backend de traces.

Se esse backend ficar exposto, vira incidente de segurança. Pelo
regulamento da ANPD (Resolução CD/ANPD 15/2024), um incidente que possa
afetar significativamente os titulares e envolva, por exemplo, dados
financeiros, dados protegidos por sigilo ou dados em larga escala tem que
ser comunicado à ANPD e aos titulares em três dias úteis, contados de
quando o controlador sabe que dado pessoal foi afetado (arts. 5º, 6º e
9º). Todo incidente, comunicado ou não, fica registrado por pelo menos
cinco anos (art. 10). O CPF mascarado antes de chegar ao trace fica fora
desse vazamento.

**3. O contexto do agente.** Uma aplicação com RAG busca documentos na base
interna e reenvia ao modelo a cada pergunta. O contexto leva o que a busca
trouxe, e muitas vezes isso é mais dado do que a pergunta precisava: o
cadastro inteiro do cliente quando a pergunta era sobre o status de um
pedido.

## O que cobrar da área de tecnologia

### Um mapa

Quais aplicações enviam dados a um modelo, quais dados, a qual provedor e
em que país. Parece básico, mas a resposta costuma estar espalhada, porque
cada time escolheu um provedor, um SDK e uma região na época do piloto. O
mapa também é o começo do registro das operações de tratamento que a lei
já pede ao controlador e ao operador (art. 37).

Usar um modelo hospedado fora do Brasil pode caracterizar transferência
internacional de dados (LGPD, art. 33), e a ANPD tem regulamento próprio
para isso (Resolução CD/ANPD 19/2024). Na prática, a região do endpoint
decide qual mecanismo sustenta a transferência:

- **Região na União Europeia.** Desde janeiro de 2026 a ANPD reconhece a
  UE como tendo grau de proteção adequado ao da LGPD (Resolução CD/ANPD
  32/2026), e a transferência pode se apoiar nessa decisão de adequação. Em
  paralelo, a Comissão Europeia reconheceu o Brasil como adequado.
- **Região nos Estados Unidos, ou em outro país sem decisão de
  adequação.** A transferência precisa de outro mecanismo, em geral as
  cláusulas-padrão contratuais da ANPD. Quem já usava cláusulas
  contratuais teve doze meses, a partir de agosto de 2024, para incorporar
  as cláusulas-padrão aos contratos. Detalho esse caso
  [mais abaixo](#quando-o-modelo-roda-nos-estados-unidos).

Quando o provedor é americano, a região na UE não resolve tudo. O dado
ainda pode chegar aos EUA por suporte remoto, por subprocessadores ou por
recursos que roteiam a inferência entre regiões para ganhar capacidade. O
contrato e a lista de subprocessadores do provedor dizem se isso acontece,
e o mapa precisa registrar a resposta.

O mesmo modelo costuma estar disponível em várias regiões, e quem escolhe
a região é quem configura o endpoint, quase sempre alguém da tecnologia.
Trocar de região para ganhar latência ou cota muda o mecanismo da
transferência, e essa troca pode acontecer sem passar pelo jurídico. Se
ninguém sabe dizer em que região roda o endpoint que a aplicação chama,
esse já é o primeiro achado.

O mapa precisa de uma coluna para treinamento: o provedor usa o que a
empresa envia para treinar modelos? A resposta varia por provedor e por
plano, e está no contrato. A ANPD já agiu sobre treinamento de IA: em
julho de 2024 mandou a Meta suspender o uso de dados de usuários
brasileiros para treinar seus modelos, entre outros motivos por considerar
inadequado o uso do legítimo interesse naquele caso, e só suspendeu a
medida em agosto, depois que a empresa apresentou um plano de
conformidade.

### Minimização antes do envio

CPF, nome e número de conta podem ser mascarados antes do prompt, pelo
princípio da necessidade (art. 6º, III): tratar só o mínimo necessário para
a finalidade. Para resumir um atendimento, o modelo não precisa do número
do CPF; `[CPF]` no lugar dele resolve. Quando o modelo está fora do
Brasil, a mesma regra aparece no regulamento de transferência
internacional, que limita a transferência ao mínimo necessário para a
finalidade (Resolução CD/ANPD 19/2024, art. 9º, parágrafo único).

![Comparação do mesmo pedido de um atendente ao chat. Sem minimização, o texto leva nome, CPF, conta e e-mail da cliente, e o CPF fica guardado no provedor do modelo, no trace e no log da aplicação. Com mascaramento antes do envio, o texto leva [NOME], [CPF], [CONTA] e [EMAIL], e os três lugares guardam só [CPF]](/assets/images/lgpd-ia-generativa/antes-depois-mascaramento.png)

O mascaramento precisa cobrir também a resposta e o log. Se a resposta não
é verificada, o dado volta por ela; se o log grava o texto original, ele
fica guardado no trace. No
[llm-eval-otel](https://github.com/jansouza/llm-eval-otel), o serviço de
avaliação que montei no lab, o próprio
[juiz recebe a conversa já mascarada]({% post_url 2026-10-03-llm-as-a-judge-avaliando-respostas-no-pipeline-de-observabilidade %}):
o que ele lê é `Meu CPF é [CPF] e meu e-mail é [EMAIL]`. Trocar o dado
pelo tipo, em vez de apagar, mantém a frase legível para o julgamento, e o
prompt avisa o juiz que aqueles campos foram mascarados.

Prefiro que esse mascaramento fique num ponto só, entre as aplicações e o
modelo, do que espalhado em cada aplicação. Assim a regra é testada e
auditada uma vez, e uma correção vale para todas as aplicações.

### Evidência

Política escrita não basta. Ela diz o que deveria acontecer; uma avaliação
contínua que procura dado pessoal nas respostas e nos registros mostra o
que de fato acontece.

No lab fiz isso em cima da telemetria que as aplicações já geram. Cada
interação com LLM passa por um detector de CPF, CNPJ, e-mail, cartão,
telefone e chave PIX. É regex, mas com validação: dígito verificador para
CPF e CNPJ, Luhn para cartão, DDD para telefone. Sem isso, qualquer
sequência de 11 números viraria um alerta. No teste de carga o detector
levou 2 ms no p99 com 10 KB de texto por interação, então roda em todas,
sem amostragem. Para segurança isso conta: se o detector olhasse 5% das
interações, um CPF vazado nas outras 95% passaria sem registro. O
resultado vira métrica e alerta, que é o que dá para mostrar numa
auditoria.

O detector tem limite. Regex não reconhece nome nem endereço, e os dois
passam como foram escritos; dado sensível em texto livre ("o cliente está
inadimplente desde março") também passa. Para isso é preciso outro tipo
de detector, ou mascarar na entrada, antes que o texto chegue ao log.

## Quando o modelo roda nos Estados Unidos

Pelo regulamento da ANPD, há transferência internacional quando um agente
de tratamento repassa dado pessoal a outro agente localizado no exterior
(Resolução CD/ANPD 19/2024, arts. 3º e 5º). A empresa que chama a API de
um modelo hospedado nos EUA com dado de cliente no prompt é a exportadora,
e o provedor é o importador. A exceção é a coleta internacional: quando o
próprio titular usa direto um serviço de fora, não há transferência (art.
6º). O atendente que cola o CPF de um cliente numa ferramenta não está
nessa exceção, porque quem transfere é a empresa. Se a ferramenta é uma
conta pessoal, sem contrato com a empresa, a transferência acontece sem
mecanismo nenhum.

A transferência precisa de uma base legal da LGPD (art. 7º ou 11) e de um
mecanismo de transferência (art. 9º). Os EUA não têm decisão de adequação
da ANPD, então o mecanismo, na prática, são as cláusulas-padrão
contratuais. O regulamento também admite cláusulas específicas aprovadas
pela ANPD, normas corporativas globais e as demais hipóteses do art. 33 da
LGPD.

Usar as cláusulas-padrão traz três obrigações:

- **Texto integral, sem alteração.** As cláusulas só valem se adotadas por
  inteiro, num contrato firmado entre exportador e importador (art. 16),
  então a pergunta ao fornecedor é se o contrato dele traz esse texto. Em
  outubro de 2026 li os acordos de tratamento de dados (DPA) públicos de
  cinco grandes provedores de modelo e de nuvem, e só um trazia as
  cláusulas da ANPD; os outros quatro não mencionavam Brasil, LGPD nem
  ANPD. Isso não prova que o mecanismo falta, porque pode existir aditivo
  negociado, mas mostra que não dá para presumir.
- **Documento público.** A empresa tem que publicar no site, em português
  e em linguagem simples, um documento sobre a transferência, com o país
  de destino, a finalidade e os direitos do titular (art. 17, §2º). Se o
  titular pedir a íntegra das cláusulas, o prazo para entregar é de 15
  dias (art. 17, §1º).
- **Pedido de acesso de autoridade.** Se uma autoridade do país de destino
  exigir acesso aos dados, o provedor tem que avisar a empresa e o
  titular, salvo quando a lei local proíbe o aviso, e contestar o pedido
  quando houver base jurídica para isso (cláusula 19 do Anexo II).

O provedor continua sendo operador e trata o dado conforme as instruções
da empresa. Se usar o dado fora delas, por exemplo para treinar modelos
sem que o contrato permita, responde solidariamente pelos danos e se
equipara ao controlador (LGPD, art. 42, §1º, I). Se o dado vazar do lado
do provedor, quem comunica o incidente à ANPD e aos titulares em três dias
úteis é a empresa, que é a controladora.

## No setor financeiro

O peso aqui é maior: além da LGPD, há o sigilo bancário (Lei Complementar
105/2001) e as regras do CMN e do Banco Central para contratação de
serviços de processamento de dados e de nuvem. Para bancos, a norma é a
Resolução CMN 4.893/2021; instituições de pagamento, corretoras e
administradoras de consórcio seguem regra própria do Banco Central.

Pela 4.893, a contratação de um serviço relevante de processamento ou de
nuvem tem que ser comunicada ao Banco Central em até dez dias (art. 15).
Se o serviço é prestado no exterior, a instituição precisa definir antes
os países e as regiões onde os dados podem ser armazenados e processados,
e precisa existir convênio de troca de informações entre o Banco Central
e o supervisor do país; sem convênio, a contratação depende de
autorização pedida com 60 dias de antecedência (art. 16). Para os EUA, a
página de memorandos de supervisão do Banco Central lista acordos com o
Federal Reserve, o OCC, o FDIC e o Departamento de Serviços Financeiros de
Nova York, então o requisito do convênio tende a estar atendido; a
confirmação para o caso concreto é da instituição.

Um modelo de linguagem consumido por API é, na prática, um serviço de
processamento de dados contratado. Para um banco, saber em que país e em
que região roda o modelo é exigência do art. 16, e o mapa é de onde sai
essa resposta. Dados financeiros e dados sob sigilo também estão entre os
critérios que tornam um incidente comunicável à ANPD, então um vazamento
por log pesa mais aqui.

## O que vem pela frente

Se a IA generativa participa de uma decisão sobre o cliente, como uma
análise de crédito, o titular já tem hoje o direito de pedir revisão de
decisão tomada só com base em tratamento automatizado (LGPD, art. 20). A
ANPD consolidou contribuições sobre esse direito numa nota técnica em 2025
e trata o tema na agenda regulatória de 2025-2026, mas ainda não publicou
regra específica.

O marco legal da IA (PL 2338/2023), aprovado no Senado em dezembro de
2024, segue em discussão na Câmara, sem data de votação. Até ele virar lei,
o que vale para IA generativa com dado pessoal é a LGPD e os regulamentos
da ANPD citados aqui, e para bancos, as normas do CMN e do Banco Central.

Com controles proporcionais ao risco, a empresa segue inovando e consegue
demonstrar que o dado pessoal que não podia sair não saiu. Fico curioso
para saber quem cuida desse mapa nas empresas onde isso já existe: a área
de tecnologia ou a de privacidade.
