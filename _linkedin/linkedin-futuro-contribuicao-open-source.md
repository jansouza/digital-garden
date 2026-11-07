# Post LinkedIn: O futuro da contribuição open source na era da IA

**Referente ao post:** [O futuro da contribuição open source na era da IA](/_posts/2026-11-05-o-futuro-da-contribuicao-open-source-na-era-da-ia.md)

> Texto abaixo em **texto puro**: o LinkedIn não renderiza markdown, então nada de `**negrito**`. Copiar e colar direto.

---

## Corpo do post

Se você pudesse doar 1 milhão de tokens para um projeto open source, para qual seria?

Talvez, no futuro, ao lado do botão de estrela no GitHub, exista um botão para patrocinar o projeto em tokens. Em vez de "vou dedicar meu fim de semana a esse projeto", alguém vai dizer "vou bancar X milhões de tokens para ele", e os agentes fazem o trabalho pesado.

Isso já acontece em grande escala. No Project Glasswing, a Anthropic não contratou um exército de engenheiros para auditar o Linux, o OpenBSD e o FFmpeg. Ela ofereceu até US$ 100 milhões em créditos de uso, ou seja, contribuiu com tokens.

Em escala bem menor, vivi isso no SmartIR. Com o Home Assistant 2026.11.0, ele parou de criar as entidades de ar-condicionado aqui em casa, por causa do import de uma função que o Home Assistant tinha removido. Usei IA para entender o componente, achar o problema e escrever a correção, uma linha em cada um de dois arquivos. Abri a issue e o PR no mesmo minuto, e meia hora depois o mantenedor fez o merge.

Se a barreira técnica cai, o que fica escasso é o custo de rodar a IA e o tempo de quem revisa. O Linus Torvalds descreveu o 7.4-rc1 como "cheio de correções para problemas encontrados por IA", com quase 20 mil commits na janela de merge, contra os 15 mil de costume. Do outro lado, o curl fechou o programa de bug bounty depois que os relatórios válidos caíram para menos de 5%.

Ainda não sei quem vai decidir onde esses tokens são gastos, nem quem leva o crédito pela correção: quem paga a computação, quem escreveu o prompt ou quem revisou. Escrevi mais sobre isso no garden, link no primeiro comentário.

#OpenSource #InteligenciaArtificial #HomeAssistant

---

## Primeiro comentário (postar logo em seguida)

Post completo, com as fontes:
https://garden.jansouza.com/ia/2026/11/05/o-futuro-da-contribuicao-open-source-na-era-da-ia.html

O PR no SmartIR:
https://github.com/smartHomeHub/SmartIR/pull/1609

---

**TODO antes de publicar:**
- [ ] Anexar a imagem assets/images/futuro-contribuicao-open-source/patrocinar-em-tokens.png
- [ ] Conferir se a URL do post bate com o permalink gerado (data/categoria)
- [ ] Postar o primeiro comentário com os links logo após publicar
