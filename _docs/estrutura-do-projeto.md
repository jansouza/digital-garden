---
title: "Estrutura do projeto"
description: "Referência da organização de pastas e arquivos deste site."
tags: [jekyll, docs-as-code]
stage: mature
last_modified_at: 2026-10-29
---

Esta página documenta como o repositório do Garden está organizado.

| Pasta / arquivo | Função |
|---|---|
| `_config.yml` | Configuração global do Jekyll |
| `_posts/` | Posts do blog (formato `YYYY-MM-DD-titulo.md`) |
| `_posts/en/` | Versões dos posts em inglês (URLs em `/en/...`) |
| `_tutorials/` | Coleção de tutoriais (URLs em `/tutorials/...`) |
| `_docs/` | Coleção de documentação (URLs em `/docs/...`) |
| `_layouts/` | Templates HTML das páginas |
| `_includes/` | Fragmentos reutilizáveis (header, footer) |
| `_data/i18n.yml` | Textos da interface em português e em inglês |
| `en/` | Home, posts, tags e Sobre em inglês |
| `assets/` | CSS, imagens e outros arquivos estáticos |

## Convenções

- Todo conteúdo é escrito em Markdown com front matter YAML.
- Posts usam o layout `post`; tutoriais e docs usam o layout `doc`.
- Imagens ficam em `assets/images/`, referenciadas com caminho absoluto
  a partir da raiz (ex.: `/assets/images/foto.png`).
- Cada nota tem um idioma (`lang`), `pt-BR` por padrão. As listas e os
  feeds mostram só as notas do idioma da página, e as duas versões de uma
  nota se ligam pelo `translation_key`.
