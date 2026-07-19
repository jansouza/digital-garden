---
layout: default
title: "Início"
---

# 🌱 Garden

Bem-vindo ao meu digital garden — um espaço pessoal onde cultivo notas,
tutoriais e documentação sobre tecnologia e aprendizados do dia a dia.

Diferente de um blog tradicional, o conteúdo aqui está sempre em
crescimento: notas são plantadas, regadas e revisadas com o tempo.

## Por onde começar

- 📝 **[Blog](/blog/)** — posts e reflexões em ordem cronológica
- 📚 **[Tutoriais](/tutorials/)** — guias passo a passo
- 📖 **[Docs](/docs/)** — documentação de referência

## Últimos posts

<ul>
  {% for post in site.posts limit: 5 %}
    <li>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <small>— {{ post.date | date: "%d/%m/%Y" }}</small>
    </li>
  {% endfor %}
</ul>
