---
layout: default
title: "Blog"
---

# Blog

Posts em ordem cronológica, do mais recente para o mais antigo.

<ul class="post-list">
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <small>— {{ post.date | date: "%d/%m/%Y" }}</small>
      {% if post.excerpt %}<p>{{ post.excerpt | strip_html | truncate: 160 }}</p>{% endif %}
    </li>
  {% endfor %}
</ul>
