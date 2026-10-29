---
layout: default
title: "Tutoriais"
description: "Guias passo a passo sobre as ferramentas e tecnologias que uso no garden."
---

# Tutoriais

Guias passo a passo sobre ferramentas e tecnologias.

{% assign lang = page.lang | default: site.lang %}
{% assign lang_tutorials = site.tutorials | where: "lang", lang %}
<ul class="doc-list">
  {% for tutorial in lang_tutorials %}
    <li>
      <a href="{{ tutorial.url | relative_url }}">{{ tutorial.title }}</a>
      {% if tutorial.description %}<p>{{ tutorial.description }}</p>{% endif %}
    </li>
  {% endfor %}
</ul>
