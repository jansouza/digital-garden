---
layout: default
title: "Tags"
---

# Tags

Todas as notas do jardim, agrupadas por tema.

{% assign all_notes = site.posts | concat: site.tutorials | concat: site.docs %}
{% assign all_tags = "" | split: "" %}
{% for note in all_notes %}
  {% for tag in note.tags %}
    {% unless all_tags contains tag %}
      {% assign all_tags = all_tags | push: tag %}
    {% endunless %}
  {% endfor %}
{% endfor %}
{% assign all_tags = all_tags | sort %}

<nav class="tag-toc">
  {% for tag in all_tags %}
    <a href="#{{ tag | slugify: 'latin' }}">#{{ tag }}</a>
  {% endfor %}
</nav>

{% for tag in all_tags %}
  <h2 id="{{ tag | slugify: 'latin' }}">#{{ tag }}</h2>
  <ul class="post-list">
    {% for note in all_notes %}
      {% if note.tags contains tag %}
        <li>
          <a href="{{ note.url | relative_url }}">{{ note.title }}</a>
          {% if note.date %}<small>— {{ note.date | date: "%d/%m/%Y" }}</small>{% endif %}
        </li>
      {% endif %}
    {% endfor %}
  </ul>
{% endfor %}
