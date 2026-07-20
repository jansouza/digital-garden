---
layout: default
title: "Início"
---

Bem-vindo ao meu digital garden, onde cultivo notas, tutoriais e
documentação sobre tecnologia e aprendizados do dia a dia.

Aqui o conteúdo está sempre em crescimento: notas são plantadas,
regadas e revisadas com o tempo, em vez de publicadas uma única vez
e esquecidas.

## Por onde começar

- 📝 **[Posts](/posts/)** — anotações em ordem cronológica
- 📚 **[Tutoriais](/tutorials/)** — guias passo a passo
- 📖 **[Docs](/docs/)** — documentação de referência
- 🏷️ **[Tags](/tags/)** — todas as notas agrupadas por tema

## Sementes recém-plantadas

Notas novas, ainda em elaboração — {% include stage-badge.html stage="seed" %}

{% assign all_notes = site.posts | concat: site.tutorials | concat: site.docs %}
{% assign seeds = all_notes | where: "stage", "seed" %}
<ul>
  {% for note in seeds %}
    <li><a href="{{ note.url | relative_url }}">{{ note.title }}</a></li>
  {% endfor %}
</ul>

## Crescendo

Notas em evolução, revisitadas e atualizadas com frequência — {% include stage-badge.html stage="growing" %}

{% assign growing = all_notes | where: "stage", "growing" %}
<ul>
  {% for note in growing %}
    <li><a href="{{ note.url | relative_url }}">{{ note.title }}</a></li>
  {% endfor %}
</ul>

## Notas consolidadas

Conteúdo mais maduro e estável — {% include stage-badge.html stage="mature" %}

{% assign mature = all_notes | where: "stage", "mature" %}
<ul>
  {% for note in mature %}
    <li><a href="{{ note.url | relative_url }}">{{ note.title }}</a></li>
  {% endfor %}
</ul>
