---
layout: post
title: "O futuro da contribuição open source na era da IA"
date: 2026-11-05 10:00:00 -0300
categories: [ia]
tags: [open-source, ia, home-assistant, smartir]
stage: growing
description: "A IA está encurtando a distância entre achar um bug e enviar a correção. Do kernel do Linux à minha contribuição no SmartIR, o que muda para quem contribui, para quem revisa e para o que conta como contribuição."
image: /assets/images/futuro-contribuicao-open-source/patrocinar-em-tokens.png
translation_key: o-futuro-da-contribuicao-open-source-na-era-da-ia
---

Por muito tempo, contribuir com um projeto open source parecia coisa para iniciados. Você precisava entender uma base de código enorme, decifrar convenções que ninguém documentou, montar o ambiente de desenvolvimento e, depois disso tudo, ter coragem de abrir um pull request para alguém que você não conhece.

Muita gente boa ficava no meio do caminho, porque a distância entre *"achei um bug"* e *"enviei a correção"* era grande demais. Essa distância está diminuindo rápido.

## Quando a IA vira o "colega sênior" que você não tinha

Além de escrever código, a IA explica código. Você abre um repositório desconhecido e pergunta: "onde esse valor é calculado?", "por que esse estado nunca é atualizado?", "como eu testo isso?". O contexto que antes levava semanas para absorver vem numa conversa.

Isso muda quem pode contribuir. A pessoa que usa o software todo dia, conhece o problema de perto e sabe reproduzir o bug passa a conseguir levar a correção até o fim. Antes, muitas vezes, ela só conseguia abrir uma issue e torcer.

## O exemplo em escala: a Anthropic e o Linux

Em 2026, Nicholas Carlini, pesquisador da Anthropic, mostrou numa conferência de segurança um experimento simples: um script que passava o Claude Code por cada arquivo do kernel do Linux, procurando falhas. Uma delas era um *heap buffer overflow* no driver NFS que podia ser explorado remotamente e estava lá desde 2003, 23 anos sem ninguém notar. Ao todo, ele confirmou cinco vulnerabilidades, no NFS, no io_uring, no futex e no ksmbd, e todas já têm commits na árvore estável do kernel.

Em abril, a Anthropic lançou o Project Glasswing, com parceiros como Linux Foundation, Microsoft, Apple, Amazon, Cisco e CrowdStrike. A empresa comprometeu até US$ 100 milhões em créditos de uso e US$ 4 milhões em doações diretas para organizações de segurança open source. Segundo a Anthropic, o modelo usado no projeto, o Claude Mythos Preview, encontrou milhares de vulnerabilidades desconhecidas, entre elas um bug de 27 anos no OpenBSD e um de 16 anos no FFmpeg. Duas semanas depois da liberação do modelo para os parceiros, a Mozilla anunciou que tinha encontrado e corrigido 271 vulnerabilidades no Firefox com ele.

Para dimensionar: o Linux roda em servidores, celulares Android, roteadores, carros e na maior parte da infraestrutura da internet. Uma falha corrigida ali protege gente que nunca vai saber que o bug existiu. Mas achar está saindo mais rápido do que corrigir. Patrick Garrity, citado na página do Claude Mythos na Wikipedia, calculou que até setembro só 10% das falhas encontradas tinham sido divulgadas e menos de 1% tinham sido corrigidas.

## Agora em escala pequena: minha contribuição no SmartIR

Eu não sou pesquisador de segurança nem mantenedor de kernel, mas vivi uma versão pequena da mesma história.

Uso o [SmartIR](https://github.com/smartHomeHub/SmartIR), uma integração do Home Assistant que controla aparelhos por infravermelho, como ar-condicionado, TV e ventilador. Com o Home Assistant 2026.11.0, as plataformas `climate` e `fan` do SmartIR pararam de carregar, e nenhuma entidade de ar-condicionado era criada. O log mostrava um `ImportError`: o Home Assistant tinha removido a função `async_track_state_change` de `homeassistant.helpers.event`. A versão 1.18.1 do SmartIR já usava a substituta, `async_track_state_change_event`, em todo o código, mas os arquivos `climate.py` e `fan.py` ainda importavam o nome antigo, sem usar.

Antes, provavelmente eu teria aberto uma issue e esperado. Dessa vez, usei IA para entender como o componente funcionava, achar onde estava o problema e escrever a correção, que foi tirar o nome antigo do import nos dois arquivos. Abri a [issue](https://github.com/smartHomeHub/SmartIR/issues/1608) com o erro e a causa e, no mesmo minuto, o [pull request](https://github.com/smartHomeHub/SmartIR/pull/1609). Meia hora depois, o mantenedor fez o merge e respondeu com um "Thanks!".

Foi uma linha alterada em cada arquivo. Sou programador experiente, então escrever essa linha nunca foi o difícil. O difícil era achar tempo para entender um código que não é meu, e é por isso que eu provavelmente teria ficado só na issue. A IA encurtou essa parte, e a correção agora serve para todo mundo que tem o mesmo problema. E acho que hoje alguém que não programa, mas usa o SmartIR e sabe reproduzir o bug, conseguiria fazer o mesmo caminho com a ajuda da IA: entender o erro, achar a linha e abrir o PR.

## O grande debate: aceitar ou não código de IA?

Nem todo mundo recebeu essa mudança bem. Desde 2024, a comunidade open source se dividiu.

Alguns projetos fecharam a porta. O Gentoo proibiu em abril de 2024 conteúdo criado com ajuda de ferramentas de IA. O NetBSD passou a tratar código gerado por LLM como "presumidamente contaminado". O QEMU recusa qualquer contribuição que se acredite incluir ou derivar de conteúdo gerado por IA. Em 2026, o OpenJDK aprovou uma regra provisória dizendo que contribuições "não devem incluir conteúdo gerado, em parte ou no todo, por modelos de linguagem".

Outros apertaram as regras por causa do chamado *AI slop*, o fluxo de PRs e relatórios gerados sem cuidado. O curl encerrou seu programa de recompensa por bugs em janeiro de 2026, depois que a taxa de relatórios válidos caiu de cerca de 15% para menos de 5%. O Ghostty proibiu PRs feitos com IA por quem aparece de passagem, sem uma issue já aceita. O tldraw passou a fechar PRs externos automaticamente.

E houve quem aceitasse e criasse regras. A Apache permite o uso de IA e deixa com o contribuidor a responsabilidade de verificar direitos autorais e licença do que não é criação dele. O typescript-eslint escreveu que "não pode e não vai tentar banir" contribuições que usam IA. O maior projeto open source do mundo foi pelo mesmo caminho.

## Até o Linus

O kernel do Linux tem uma política oficial sobre assistentes de IA. A IA pode ajudar, mas não assina nada. Só um humano pode adicionar o `Signed-off-by`, e essa pessoa assume a responsabilidade pelo código, revisa tudo o que a IA gerou e garante que a licença é compatível. As diretrizes do kernel sobre conteúdo gerado por ferramentas pedem transparência sobre a origem do código: "na dúvida, escolha a transparência".

Em outubro de 2026, no Maintainers Summit em Praga, Sasha Levin anunciou que os mantenedores decidiram descontinuar a tag `Assisted-by`, que marcava os patches feitos com ajuda de IA. Na prática, o contribuidor não precisa mais declarar que usou IA. Pelo que entendi, a revisão passa a olhar só para o código.

Linus Torvalds, que era cético com código gerado por IA, também começou a usar. Ele desenvolveu com o Claude Code oito mudanças para resolver um problema de desempenho no kernel, e a documentação delas diz que o código, os programas de teste e a revisão foram feitos "com a ajuda de um assistente de código LLM (Claude Code) sob minha supervisão". As mudanças ainda são experimentais e não entraram no kernel oficial. Ele contou que achava que a tecnologia simplesmente não era muito boa, e que agora gosta de verdade de usar IA.

Numa nota ao colunista do The Register, ele escreveu:

> "Eu realmente acho que nós *queremos* que pessoas competentes usem IA como ferramenta."

No Open Source Summit Europe, ele disse que adora a ideia da IA como porta de entrada para a programação, com uma ressalva: quer desencorajar os patches *drive-by*, de quem só quer dizer que mandou um patch e nunca pretendeu ficar. "Todos nós começamos sem saber nada, mas algumas pessoas dedicam tempo e esforço para se tornarem algo mais."

No começo de novembro, ao lançar o 7.4-rc1, a primeira versão de testes do kernel 7.4, Linus descreveu a versão como "grande, e cheia de correções para problemas encontrados por IA (e cada vez mais os patches também são sugeridos por IA, embora muitas vezes sejam reescritos)". A janela de merge teve quase 20 mil commits, contra os cerca de 15 mil de costume.

## O lado que precisa de cuidado

Contribuir ficou mais fácil, e revisar não. Greg Kroah-Hartman contou que, meses atrás, o kernel recebia o que eles chamavam de "AI slop": relatórios de segurança gerados por IA, obviamente errados ou de baixa qualidade. Agora os mantenedores estão soterrados de relatórios bons. Bons ou ruins, alguém precisa ler cada um, e esse alguém continua sendo uma pessoa, muitas vezes voluntária.

Com a revisão virando o gargalo, a responsabilidade de quem contribui aumenta:

- Entenda o que você está enviando. A IA ajuda a escrever, mas o PR é seu. Se você não consegue explicar a mudança, ela não está pronta.
- Teste de verdade: reproduza o bug antes e confirme que ele sumiu depois.
- Leia o guia de contribuição, siga o estilo do código e explique a mudança com clareza na descrição.
- Diga que usou IA, mesmo onde não é obrigatório. Para quem revisa, é contexto.
- Depois de abrir o PR, fique por perto para responder a revisão e ajustar o que for pedido. É o contrário do patch drive-by.

## A próxima moeda da contribuição: tokens

Durante décadas, contribuía com open source quem sabia programar e tinha horas livres. Quem não tinha uma dessas duas coisas podia, no máximo, abrir uma issue ou doar algum dinheiro.

Se a barreira técnica cai, o recurso escasso passa a ser o custo de rodar a IA. Um agente que investiga um bug, escreve a correção e roda os testes consome tokens, e tokens custam dinheiro.

Acho que contribuir vai ficar cada vez mais parecido com financiar computação. Em vez de "vou dedicar meu fim de semana a esse projeto", alguém vai dizer "vou bancar X milhões de tokens para esse projeto". Os agentes fazem o trabalho pesado, e as pessoas definem as prioridades, revisam e decidem o que entra.

O Project Glasswing já funciona assim, em grande escala. A Anthropic não contratou um exército de engenheiros para auditar o Linux, o OpenBSD e o FFmpeg. Ela ofereceu até US$ 100 milhões em créditos de uso, ou seja, contribuiu com tokens.

Isso abre algumas perguntas:

- Quem decide onde os tokens são gastos? Os mantenedores, quem financia ou a comunidade votando em issues?
- Como fica o reconhecimento? Hoje o mérito vai para quem escreve o código. Amanhã, vai para quem paga a computação, para quem escreveu o prompt certo ou para quem revisou?
- Isso concentra poder? Se contribuir depende de dinheiro, empresas grandes podem ganhar ainda mais influência nos projetos.
- E o tempo humano? Acho que ele migra para o que a IA ainda não faz bem: decidir o rumo do projeto, revisar com critério e manter a comunidade saudável.

Talvez o futuro do "como posso ajudar esse projeto?" seja um botão de patrocínio em tokens ao lado do botão de estrela no GitHub. E talvez o maior gesto de quem gosta de um projeto seja apontar a sua cota de IA para a fila de bugs dele.

![Ilustração de uma página de repositório open source com os botões Star, Fork e um terceiro botão, "Patrocinar em tokens", aberto num menu com as opções apontar 1.000.000 de tokens para a fila de bugs, 500.000 para revisar PRs abertos e 250.000 para escrever testes](/assets/images/futuro-contribuicao-open-source/patrocinar-em-tokens.png)

## Para onde isso vai

Não vejo o uso de IA no desenvolvimento voltando atrás. Os projetos que hoje proíbem têm motivos legítimos, como dúvidas sobre licença e excesso de lixo para revisar. Mas a pergunta está mudando de *"vamos aceitar IA?"* para *"como garantimos que o código é bom, venha de onde vier?"*. O kernel já respondeu: a responsabilidade é sempre de uma pessoa.

A fronteira entre usuário e contribuidor vai ficar mais fina. Quem sente o problema vai poder resolvê-lo, mesmo sem conhecer o código do projeto por dentro. Projetos pequenos, que nunca tiveram muitos mantenedores, vão receber ajuda de quem antes só reclamava em silêncio, e quem cuida deles vai precisar de tempo para revisar tudo isso.

## Referências

- [Claude Code Used to Find Remotely Exploitable Linux Kernel Vulnerability Hidden for 23 Years, InfoQ](https://www.infoq.com/news/2026/04/claude-code-linux-vulnerability/)
- [Tech giants launch AI-powered 'Project Glasswing' to identify critical software vulnerabilities, CyberScoop](https://cyberscoop.com/project-glasswing-anthropic-ai-open-source-software-vulnerabilities/)
- [Claude Mythos, Wikipedia](https://en.wikipedia.org/wiki/Claude_Mythos)
- [Linus Torvalds has started using AI to develop the Linux kernel, Computerworld](https://www.computerworld.com/article/4235401/linus-torvalds-has-started-using-ai-to-develop-the-linux-kernel.html)
- [Torvalds: AI is fine for competent devs, but spare us the 'drive-by' patches, The Register](https://www.theregister.com/columnists/2026/10/23/torvalds-ai-is-fine-for-competent-devs-but-spare-us-the-drive-by-patches/5304357)
- [Linus Torvalds says Linux kernel is out of 'stabilization phase' and using 'much healthier model' for AI contributions, The Register](https://www.theregister.com/os-platforms/2026/11/01/linus-torvalds-says-linux-kernel-is-out-of-stabilization-phase-and-using-much-healthier-model-for-ai-contributions/5306852)
- [AI Coding Assistants, documentação oficial do kernel Linux](https://docs.kernel.org/process/coding-assistants.html)
- [Kernel Guidelines for Tool-Generated Content, documentação oficial do kernel Linux](https://docs.kernel.org/process/generated-content.html)
- [How OSS Contribution Policies Changed in Response to AI Slop, Codenote](https://codenote.net/en/posts/oss-ai-slop-contribution-policy-shift/)
- [OpenJDK Will Not Take AI-Generated Code. Five Projects, Five Different Lines, Builtplain](https://builtplain.com/open-source-ai-contribution-policies/)
- [SmartIR no GitHub](https://github.com/smartHomeHub/SmartIR), com a [issue #1608](https://github.com/smartHomeHub/SmartIR/issues/1608) e o [PR #1609](https://github.com/smartHomeHub/SmartIR/pull/1609)
