---
title: "Como criar um site com Jekyll"
description: "Um guia passo a passo para criar seu primeiro site estático com Jekyll."
---

Neste tutorial você vai aprender a criar um site estático com Jekyll do zero.

## Pré-requisitos

- Ruby 3.x instalado
- Bundler (`gem install bundler`)

## Passo 1 — Criar o projeto

```bash
gem install jekyll
jekyll new meu-site
cd meu-site
```

## Passo 2 — Rodar localmente

```bash
bundle exec jekyll serve
```

Acesse `http://localhost:4000` no navegador para ver o resultado.

## Passo 3 — Publicar

Envie o repositório para o GitHub e ative o GitHub Pages nas
configurações do repositório. Pronto: seu site estará no ar!

## Próximos passos

- Personalize o tema no `_config.yml`
- Escreva seu primeiro post em `_posts/`
