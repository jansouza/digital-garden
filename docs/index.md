---
layout: default
title: "Docs"
---

# Documentação

Páginas de referência e documentação de projetos.

<ul class="doc-list">
  {% for doc in site.docs %}
    <li>
      <a href="{{ doc.url | relative_url }}">{{ doc.title }}</a>
      {% if doc.description %}<p>{{ doc.description }}</p>{% endif %}
    </li>
  {% endfor %}
</ul>
