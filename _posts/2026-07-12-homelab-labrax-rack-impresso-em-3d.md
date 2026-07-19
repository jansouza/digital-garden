---
layout: post
title: "Homelab: subindo de nível com o LabRax, um rack impresso em 3D"
date: 2026-07-12 10:00:00 -0300
categories: [homelab]
tags: [homelab, kubernetes, k3s, impressao-3d, maker, devops, sre]
---

> Publicado originalmente no
> [LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7479881994135560192/).

Quando alguém pergunta "o que você faz nas horas vagas?", antigamente eu
respondia que compilava kernel do Linux pra rodar no Slackware. Hoje em
dia a resposta é: tenho um **homelab**, e ele nunca para de crescer 😄

Há quase 2 anos montei meu primeiro homelab para automações residenciais.
De lá pra cá virou hobby sério, e chegou a hora de subir de nível. Não
sei se comprei uma impressora 3D pra imprimir um rack ou se isso foi só
mais uma desculpa pra justificar a compra, mas o fato é que usei ela pra
isso.

Aprendi na prática: escolha de filamento (fui de PETG, aguenta melhor o
calor dos equipamentos), tempo e orientação de impressão, ajuste de
suporte pra não desperdiçar material. Cada peça saindo certinha da
impressora dá aquela satisfação de "deu certo".

![Rack LabRax ao lado da impressora 3D](/assets/images/homelab-labrax/labrax-rack-impressora-3d.jpeg)

O resultado foi o **LabRax**, projeto do Michael Klements: um rack 100%
modular e impresso em 3D, feito pra organizar Raspberry Pi, mini PCs e
equipamentos de rede. Com o rack montado, expandi meu cluster **K3s**
com meus mini PCs Beelink. Mais processamento, mais organização, e o
setup finalmente parece profissional.

![Rack LabRax visto de frente, com os mini PCs instalados](/assets/images/homelab-labrax/labrax-rack-frontal.jpeg)

![Vista lateral do rack LabRax, com os painéis modulares em colmeia](/assets/images/homelab-labrax/labrax-rack-lateral.jpeg)

Homelab não é só ter servidor em casa. É onde eu testo, quebro, conserto
e aprendo tecnologias que no dia a dia de trabalho nem sempre dá tempo
de explorar. Em breve trago mais detalhes técnicos da arquitetura do
cluster e do processo de impressão do rack.
