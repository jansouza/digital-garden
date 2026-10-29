# 🌱 Garden

Repositório do meu digital garden, publicado em
**[garden.jansouza.com](https://garden.jansouza.com)** via GitHub Pages.

Aqui ficam notas, posts de blog, tutoriais e documentação — conteúdo que
cresce e é revisado com o tempo.

## Rodando localmente

Pré-requisitos: Ruby 3.x e Bundler.

```bash
bundle install
bundle exec jekyll serve --force_polling
```

O site ficará disponível em `http://localhost:4000`.

O `--force_polling` faz o Jekyll checar mudanças por polling em vez de
inotify. Sem ele, o `serve` cai com `INotifyMaxWatchesExceeded` quando o
limite de inotify da máquina já está tomado (o VS Code consome boa parte).

Se o Ruby do sistema for atualizado e o `bundle` parar com
`bad interpreter: /usr/bin/ruby3.2`, reinstale o bundler e os atalhos das
gems na versão nova e rode o `bundle install` de novo:

```bash
gem install bundler
gem pristine --all --only-executables
bundle install
```

## Como adicionar conteúdo

### Post de blog

Crie um arquivo em `_posts/` no formato `YYYY-MM-DD-titulo-do-post.md`:

```markdown
---
layout: post
title: "Título do post"
date: 2026-07-19 10:00:00 -0300
---

Conteúdo do post em Markdown.
```

### Tutorial

Crie um arquivo `.md` em `_tutorials/`. A URL final será
`/tutorials/<nome-do-arquivo>/`:

```markdown
---
title: "Título do tutorial"
description: "Breve descrição."
---

Conteúdo do tutorial.
```

### Documentação

Mesmo formato dos tutoriais, mas em `_docs/` — a URL será
`/docs/<nome-do-arquivo>/`.

### Versão em inglês

A versão em inglês de um post fica em `_posts/en/`, com a mesma data do
original, e sai em `/en/<categoria>/...`. As duas versões levam o mesmo
`translation_key` no front matter, que liga uma à outra pelo link de idioma
do cabeçalho. Os textos da interface estão em `_data/i18n.yml`. As regras
completas estão no `AGENTS.md`.

## Estrutura

- `_posts/` — posts do blog
- `_tutorials/` — coleção de tutoriais
- `_docs/` — coleção de documentação
- `_layouts/` e `_includes/` — templates HTML
- `assets/` — CSS e imagens
- `_posts/en/` — versões dos posts em inglês
- `_data/i18n.yml` — textos da interface em português e inglês
- `posts/`, `tutorials/`, `docs/` — páginas de índice de cada seção
- `en/` — home, posts, tags e Sobre em inglês
