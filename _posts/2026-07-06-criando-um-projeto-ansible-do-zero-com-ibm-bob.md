---
layout: post
title: "Criando um projeto Ansible completo do zero com o IBM Bob"
date: 2026-07-06 10:00:00 -0300
categories: [devops]
tags: [ibm, devops, ansible, ia, automacao, ibm-bob]
stage: mature
---

Nos últimos meses venho testando assistentes de IA para tarefas de DevOps, e
uma das experiências que mais me chamou atenção foi usar o **IBM Bob** para
gerar um projeto Ansible completo, do zero, com apenas dois prompts. Sem
template pronto. Sem copiar e colar código de outro lugar.

<video controls width="100%" preload="metadata">
  <source src="/assets/videos/ibm-bob/bob-demo.mp4" type="video/mp4">
  Seu navegador não suporta a tag de vídeo.
</video>

## O desafio

Queria automatizar uma tarefa clássica de operações: verificação e liberação
de espaço em disco, algo que qualquer time de infraestrutura já precisou fazer
manualmente em algum servidor às três da manhã.

O objetivo era ter um projeto Ansible com:

- Uma role para **verificação** de disco (`disk_verification`)
- Uma role para **limpeza do filesystem** (`filesystem_cleanup`)
- Playbooks separados para verificação e para remediação
- Suporte a Ubuntu, CentOS e RHEL
- Modo *dry-run*, checagens de segurança e documentação

## A abordagem em duas fases

O que tornou o resultado interessante foi o fluxo de trabalho em duas etapas
do IBM Bob:

**1. Plan Mode** — antes de escrever qualquer código, o Bob gerou um plano de
implementação detalhado, seguindo boas práticas de Ansible (estrutura de
roles, separação de responsabilidades, uso de handlers e variáveis, etc.).
Isso permitiu revisar a abordagem antes de qualquer linha de código existir.

**2. Code Mode** — com o plano validado, o Bob implementou o projeto completo,
já pronto para ser executado.

Esse formato de "planejar antes de codificar" é o que dá confiança para usar
IA em automações que tocam infraestrutura real: dá para revisar o raciocínio
antes de revisar o código.

## Resultado

Com dois prompts, o projeto saiu com:

- Roles organizadas e reutilizáveis
- Playbooks de verificação e remediação desacoplados
- Suporte multi-distro (Ubuntu, CentOS, RHEL)
- Dry-run e checagens de segurança antes de qualquer ação destrutiva
- Documentação do próprio projeto

Os detalhes ficam registrados em dois links: o plano de implementação gerado
pelo Bob e o código completo publicado no GitHub.

- Plano de implementação: [link](https://github.com/jansouza/ansible_disk_space/blob/main/docs/implementation_plan.md)
- Código completo no GitHub: [link](https://github.com/jansouza/ansible_disk_space)

## Por que isso importa

Não é sobre substituir quem escreve Ansible no dia a dia — é sobre reduzir a
distância entre "temos uma tarefa operacional repetitiva" e "temos uma
automação testável, documentada e pronta para revisão". Ver um projeto inteiro
sair de dois prompts, com plano revisável antes do código, é um indicativo
forte de para onde a automação de DevOps está indo.

Para mim, o IBM Bob se mostrou um verdadeiro divisor de águas nesse processo:
automação de infraestrutura com qualidade, gerada com esforço mínimo.

---

*Publicado originalmente no
[LinkedIn](https://www.linkedin.com/posts/jansouza_ibm-devops-ansible-activity-7470147488352759808-3JBX)
em 20 de julho de 2026.*
