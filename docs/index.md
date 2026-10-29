---
layout: default
title: "Docs"
description: "Páginas de referência e documentação dos projetos do garden."
---

# Documentação

Páginas de referência e documentação de projetos.

{% assign lang = page.lang | default: site.lang %}
{% assign lang_docs = site.docs | where: "lang", lang %}
<ul class="doc-list">
  {% for doc in lang_docs %}
    <li>
      <a href="{{ doc.url | relative_url }}">{{ doc.title }}</a>
      {% if doc.description %}<p>{{ doc.description }}</p>{% endif %}
    </li>
  {% endfor %}
</ul>
