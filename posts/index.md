---
layout: default
title: "Posts"
description: "Todos os posts do garden de Jan Souza, do mais recente ao mais antigo: SRE, observabilidade, IA generativa, homelab e impressão 3D."
---

# Posts

Anotações em ordem cronológica, do mais recente para o mais antigo.

<ul class="post-list">
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <small>— {{ post.date | date: "%d/%m/%Y" }}</small>
      {% if post.excerpt %}<p>{{ post.excerpt | strip_html | truncate: 160 }}</p>{% endif %}
    </li>
  {% endfor %}
</ul>
