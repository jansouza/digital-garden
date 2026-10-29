# AGENTS.md

Orientações para agentes de IA que trabalham neste repositório.

## O que é

Repositório do digital garden de Jan Souza, publicado em
<https://garden.jansouza.com>. É um site Jekyll servido pelo GitHub Pages,
com build clássico a partir da branch `main` (não há GitHub Actions) e o
tema remoto `pages-themes/architect@v0.2.0`.

O conteúdo é em português do Brasil, escrito em primeira pessoa pelo autor.
Um push na `main` publica o site, então commit e push só quando o autor
pedir.

## Rodar e validar

```bash
bundle install
bundle exec jekyll serve --force_polling   # http://localhost:4000
bundle exec jekyll build                   # gera _site/, ignorado pelo git
```

- O `--force_polling` evita o erro `INotifyMaxWatchesExceeded`. Problemas de
  Ruby e Bundler estão no `README.md`.
- `--drafts` inclui o `_drafts/` e `--future` inclui posts com data futura.
- Depois de mexer em layout, include ou front matter, rode o build e confira
  o HTML gerado em `_site/`.

Limites que vêm do GitHub Pages:

- A gem `github-pages` fixa o Jekyll 3.10 e só aceita plugins da whitelist.
  Os que estão em uso são `jekyll-remote-theme`, `jekyll-feed`,
  `jekyll-seo-tag` e `jekyll-sitemap`. Plugin fora da whitelist não é
  carregado, nem no build local.
- No Liquid do Jekyll 3.10, `where_exp` não aceita `or` nem `and`. Para
  filtrar por dois valores, use dois `where` e junte com `concat`, como em
  `_includes/sidebar.html`.
- Arquivo `.md` sem front matter é copiado como arquivo estático e vai para o
  site. Arquivos de apoio na raiz (`README.md`, `AGENTS.md`) precisam estar no
  `exclude` do `_config.yml`.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `_posts/` | Posts, no formato `YYYY-MM-DD-slug.md`, com layout `post` |
| `_posts/en/` | Versões em inglês dos posts, URL `/en/<categoria>/...` |
| `_tutorials/` | Tutoriais, URL `/tutorials/<arquivo>/`, layout `doc` |
| `_docs/` | Documentação de referência, URL `/docs/<arquivo>/`, layout `doc` |
| `_drafts/` | Rascunhos e roteiros, não publicados |
| `_linkedin/` | Versões dos posts para o LinkedIn, ignoradas pelo git |
| `_layouts/` | `default`, `post` e `doc` |
| `_includes/` | `sidebar`, `stage-badge`, `related-notes`, `tag-list`, `header`, `footer`, `translation`, as listas compartilhadas pelos dois idiomas (`post-list`, `tag-index`, `stage-section`) e o template dos feeds (`atom-feed.xml`) |
| `_data/i18n.yml` | Textos da interface (menu, datas, stage, rótulos) em `pt-BR` e `en` |
| `_sass/` | Estilos do site (`garden-architect.scss`) |
| `assets/images/<pasta-do-post>/` | Imagens, uma pasta por post (em geral o slug) |
| `assets/videos/<pasta-do-post>/` | Vídeos, uma pasta por post |
| `assets/js/` | `carousel.js` e `lightbox.js` |
| `index.md` | Home |
| `posts/`, `tutorials/`, `docs/`, `tags/`, `about/` | Índices de cada seção e a página Sobre |
| `en/` | Home, posts, tags e Sobre em inglês, e o feed `en/feed.xml` |
| `feed.xml` | Feed dos posts em português (substitui o gerado pelo `jekyll-feed`) |
| `docs/plans/` | Planos de funcionalidades, fora do build |

## Posts

### Arquivo e URL

- O nome segue `YYYY-MM-DD-slug.md`, com slug em minúsculas, sem acento e
  com hífen entre as palavras. A data do nome do arquivo e o `date` do front
  matter precisam ser iguais.
- A URL é `/<categoria>/<ano>/<mês>/<dia>/<slug>.html`. Mudar a data ou a
  categoria de um post publicado muda a URL e quebra os links de fora
  (LinkedIn, buscadores). Só faça isso se o autor pedir.
- Post com `date` no futuro não é gerado. Como o GitHub Pages só reconstrói o
  site quando há push, o post aparece no primeiro push depois da data. Para
  ver localmente antes disso, use `--future`.

### Front matter

```yaml
---
layout: post
title: "Do token ao dólar: estimando o custo da IA generativa"
date: 2026-09-25 10:00:00 -0300
categories: [homelab]
tags: [observabilidade, llm, finops, homelab]
stage: growing
description: "Uma ou duas frases sobre o post. Vai para o SEO e para a prévia ao compartilhar."
image: /assets/images/openllmetry-cost-lab/dashboard-custo-overview.png
---
```

- `title`: em português, só a primeira letra maiúscula (fora nomes
  próprios).
- `categories`: uma só, entre as que já existem: `carreira`, `devops`,
  `geral`, `homelab`, `ia`, `maker`. A categoria entra na URL, então uma nova
  precisa ser combinada com o autor.
- `tags`: minúsculas e com hífen. Reaproveite as que já existem
  (`grep -h "^tags:" _posts/*.md`). As "Notas relacionadas" no fim de cada
  post saem das tags em comum, e uma tag que só um post usa não liga nada.
- `stage`: veja a seção [Stage](#stage).
- `description`: sem ela, o SEO usa o começo do texto.
- `image`: capa usada na prévia de compartilhamento. Sem ela, vale
  `/assets/images/social/og-image.png`.
- `translation_key`: só em post que tem versão em inglês. Veja
  [Versão em inglês](#versão-em-inglês).
- `lang: en`: só em post em inglês que fica fora de `_posts/en/`, como o
  `2022-06-21-jenkins-cicd-using-terraform-in-azure.md`, que não tem versão
  em português. Em `_posts/en/` e `en/` o `_config.yml` já põe o `lang`.
- `last_modified_at: AAAA-MM-DD`: entra quando o conteúdo de um post já
  publicado muda (seção nova, nota de atualização, mudança de stage causada
  por mudança no texto). O layout mostra "atualizado em".

### Corpo

- Link para outro post sempre com `{% post_url YYYY-MM-DD-slug %}`, nunca com
  a URL escrita à mão. Se o post não existir, o build falha, e assim o link
  quebrado aparece antes de publicar.
- Link externo é Markdown normal. O `default.html` já abre links de outro
  domínio em nova aba, então `{:target="_blank"}` não é necessário.
- Imagem com caminho absoluto: `![texto alternativo](/assets/images/<pasta>/foto.jpg)`.
  O texto alternativo descreve o que aparece na imagem. O layout acrescenta
  `loading="lazy"` e carrega o lightbox quando a página tem `<img>`.
- Vídeo:

  ```html
  <video controls width="100%" preload="metadata">
    <source src="/assets/videos/<pasta>/video.mp4" type="video/mp4">
    Seu navegador não suporta a tag de vídeo.
  </video>
  ```

- Carrossel de fotos (o `carousel.js` é carregado quando o conteúdo tem
  `class="carousel"`):

  ```html
  <div class="carousel">
    <div class="carousel-track">
      <figure class="carousel-slide">
        <img src="/assets/images/<pasta>/foto-1.jpg" alt="Descrição da foto" loading="lazy">
        <figcaption>Legenda curta</figcaption>
      </figure>
      <!-- um <figure> por foto -->
    </div>
    <button type="button" class="carousel-btn carousel-prev" aria-label="Slide anterior">&#8249;</button>
    <button type="button" class="carousel-btn carousel-next" aria-label="Próximo slide">&#8250;</button>
    <div class="carousel-dots"></div>
  </div>
  ```

- Post republicado do LinkedIn termina com o rodapé abaixo. A data do
  rodapé é a mesma do `date`.

  ```markdown
  ---

  *Publicado originalmente no
  [LinkedIn](https://www.linkedin.com/...)
  em 6 de julho de 2026.*
  ```

- Seção que depende de uma experiência do autor e ainda não foi escrita fica
  marcada com `<!-- ESPAÇO RESERVADO: o que escrever aqui -->`. O comentário
  não aparece no site, mas o título da seção aparece vazio. Por isso, post
  com espaço reservado é `seed` e não vai para a `main` antes de a seção
  estar escrita.

### Versão para o LinkedIn

Cada post pode ter um `_linkedin/linkedin-<slug>.md` com o texto para o
LinkedIn. É texto puro, porque o LinkedIn não renderiza Markdown, e o topo
do arquivo aponta para o post. Se o slug ou a data do post mudarem, atualize
essa referência.

## Tutoriais e docs

Usam `title`, `description`, `tags` e `stage`, sem `date`. O layout `doc` só
mostra o badge quando `stage` está preenchido.

## Versão em inglês

O site tem uma seção `/en/` com interface em inglês. Todo post ganha versão
em inglês: o original é escrito em português, e a tradução vai para a
`main` junto com ele. Ao criar um post, crie também a versão em inglês
seguindo as regras abaixo. Tutoriais e docs continuam só em português, a
menos que o autor peça.

### Como funciona

- Toda nota tem `lang`. O `_config.yml` põe `pt-BR` em tudo e `en` no que
  está em `_posts/en/`, `_tutorials/en/`, `_docs/en/` e `en/`.
- Layouts e includes pegam os textos da interface em `_data/i18n.yml` pelo
  `lang` da página. Texto fixo novo na interface entra lá, nos dois idiomas.
- Home, posts, tags, sidebar, notas relacionadas e feeds mostram só as notas
  do idioma da página.
- As duas versões de uma nota têm o mesmo `translation_key`. Com ele, o link
  de idioma do cabeçalho leva à outra versão e o `<head>` ganha `hreflang`.
  Sem tradução, o link leva à home do outro idioma.
- Os feeds são `feed.xml` (português) e `en/feed.xml` (inglês), feitos com
  `_includes/atom-feed.xml`. Como existe um `feed.xml` na raiz, o
  `jekyll-feed` não gera o dele.

### Arquivo e front matter

- O arquivo fica em `_posts/en/`, com a mesma data do original e slug em
  inglês: `_posts/en/2026-09-25-from-token-to-dollar.md`. A URL sai
  `/en/<categoria>/<ano>/<mês>/<dia>/<slug>.html`.
- `categories`, `tags`, `stage` e `image` são os mesmos do original.
  Categorias e tags são identificadores e continuam em português.
- `title` e `description` em inglês. A `description` é obrigatória, porque
  sem ela o SEO cai na descrição do site, que é em português.
- O `translation_key` vai nas duas versões, com o slug do post em
  português: `translation_key: do-token-ao-dolar-custo-da-ia-generativa`.
- Link para outro post: `{% post_url en/YYYY-MM-DD-slug %}` quando a versão
  em inglês existe, senão o `post_url` do original em português.
- Tutorial e doc em inglês ficam em `_tutorials/en/` e `_docs/en/`, com URL
  `/en/tutorials/<arquivo>/` e `/en/docs/<arquivo>/`. Quando o primeiro
  entrar, acrescente o item no `nav` do `en` em `_data/i18n.yml` e crie o
  índice em `en/tutorials/` ou `en/docs/`.

### Tradução

- O agente rascunha a tradução a partir do post em português. Nada vai para
  a `main` sem revisão do autor.
- Mantenha a voz do autor: primeira pessoa, tom de conversa com um colega
  técnico, frases do mesmo tamanho. Não acrescente nem tire fato, número,
  opinião ou exemplo.
- Código, comandos, nomes de arquivo e saídas de terminal ficam iguais. Só
  os comentários dentro do código são traduzidos.
- Imagens são as mesmas do original. O texto alternativo e as legendas são
  traduzidos.
- Um post em português com espaço reservado não ganha tradução até a seção
  ser escrita.
- Sigla ou termo brasileiro que um leitor de fora não conhece ganha uma
  explicação curta na primeira menção: "the LGPD (Brazil's General Data
  Protection Law)", "CPF (the Brazilian taxpayer ID)".
- Link externo para conteúdo em português leva "(in Portuguese)" depois.
- O rodapé de post republicado do LinkedIn vira:

  ```markdown
  *Originally published in Portuguese on
  [LinkedIn](https://www.linkedin.com/...)
  on July 6, 2026.*
  ```
- Nada de clichê de texto gerado por IA em inglês: "delve", "game-changer",
  "in today's fast-paced world", "it's not just X, it's Y", "let's dive in",
  frase de efeito no fim de cada parágrafo, travessão em toda frase.

### Manter as versões juntas

- Mudou o texto de um post que tem tradução: atualize a versão em inglês na
  mesma mudança, com o mesmo `last_modified_at`.
- Mudou o `stage` de um: mude o do outro.
- Mudou o slug ou a data do original: atualize o `translation_key` e os
  `post_url` que apontam para ele.

## Stage

Toda nota (post, tutorial, doc e a página Sobre) tem um `stage` que diz o
quanto o texto está acabado. Ele não indica se o post é recente: a data já
faz isso.

| Valor | Badge | Quando usar |
|---|---|---|
| `seed` | 🌱 Semente | Texto incompleto: seção vazia, espaço reservado, ideia ainda em esboço |
| `growing` | 🌿 Em crescimento | Texto completo, mas com continuação prometida ou pendência declarada no próprio texto ("Próximos passos", "O que falta", "em breve"), ou que depende de algo que muda, como preço de modelo ou regulação em discussão |
| `mature` | 🌳 Consolidada | Texto completo e sem nada prometido em aberto. Só muda se algo de fora mudar |

Sem `stage`, o badge mostra Semente.

### Regras

- Post novo entra no stage que o conteúdo justifica. Um ensaio completo
  publicado hoje já pode ser `mature`.
- Quando um post novo cumpre o "próximo passo" de um anterior, volte ao
  anterior: acrescente uma nota com link para o novo, reavalie o stage e
  preencha `last_modified_at`. Formato da nota:

  ```markdown
  > **Atualização:** esse passo virou o post seguinte,
  > [Título do post]({% post_url YYYY-MM-DD-slug %}).
  ```

- Quando as pendências de um `growing` forem resolvidas ou abandonadas, passe
  para `mature` e diga isso no texto. O post
  `2024-03-01-cluster-kubernetes-com-raspberry-pi-parte-1.md` tem um exemplo
  de continuação abandonada. Um `mature` não promete continuação.
- Mudar o stage sem mudar o texto não exige `last_modified_at`.

### Onde o stage aparece

- No badge do cabeçalho de posts e docs (`_includes/stage-badge.html`).
- Na sidebar "🌿 Em crescimento", que lista os 5 mais recentes entre `seed` e
  `growing` do idioma da página (`_includes/sidebar.html`).
- Nas seções da home, uma por stage, que somem quando não há nota
  (`_includes/stage-section.html`, usado em `index.md` e `en/index.md`).
- Em inglês, os nomes são Seedling, Growing e Evergreen
  (`_data/i18n.yml`).

### Revisar o stage de todas as notas

```bash
grep -rn "^stage:" _posts _tutorials _docs about en
grep -n -i -E "próximos passos|o que falta|em breve|pendente|ESPAÇO RESERVADO" _posts/*.md
```

## Escrita

- Português do Brasil, primeira pessoa, tom de conversa com um colega
  técnico.
- Títulos de seção com só a primeira letra maiúscula e sem emoji.
- Nada de clichê de texto gerado por IA: "virada de chave", "divisor de
  águas", "não é sobre X, é sobre Y", frase de efeito no fim de cada
  parágrafo, travessão em toda frase.
- Não invente fato, número, resultado ou experiência. Se faltar um dado,
  pergunte ao autor ou deixe um espaço reservado.
- Em revisão, mude o que foi pedido e preserve o resto do texto do autor.
- Texto em inglês segue as regras de [Versão em inglês](#versão-em-inglês).

## Git

- Mensagens de commit em inglês, no formato Conventional Commits:
  `feat: add new post on ...`, `fix: ...`.
- `_site/`, `vendor/`, `.bundle/`, `Gemfile.lock` e `_linkedin/` são
  ignorados pelo git.
- Commit e push só quando o autor pedir.
