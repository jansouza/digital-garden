# Post LinkedIn: Painel 1U para ESP32 e matriz de LED (primeiro modelo 3D)

**Referente ao post:** [Meu primeiro modelo 3D do zero: um painel 1U para ESP32 e matriz de LED](/_posts/2026-08-16-meu-primeiro-modelo-3d-painel-1u-esp32-matriz-de-led.md)

> Texto abaixo em **texto puro** — o LinkedIn não renderiza markdown, então nada de `**negrito**`. Copiar e colar direto.

---

## Corpo do post

Fui procurar no MakerWorld um painel 1U pronto para encaixar um ESP32 numa matriz de LED. Achei vários — todos pensados para o ESP8266. Nenhum servia.

Isso já tinha me forçado a "apoiar" o ESP32 na marra dentro de um modelo errado, no projeto do Smart Matrix Clock que mostrei aqui há duas semanas. Aí o projeto cresceu: entrou um buzzer para alertas sonoros e um sensor DHT22 para medir a temperatura do rack. Àquela altura, forçar o encaixe deixou de ser opção.

Resolvi desenhar meu primeiro modelo 3D do zero. Nunca tinha modelado nada em 3D antes.

Usei o Blender, com IA como copiloto — do mesmo jeito que uso pra código: descrevo o que preciso, entendo qual operação do Blender resolve aquilo, ajusto. A IA não desenhou a peça por mim, mas encurtou muito a distância entre "sei a medida que eu preciso" e "sei qual botão apertar pra chegar lá".

Cada medida errada só aparece depois de imprimir — e cada tentativa custa horas. Foram 5 impressões até o painel fechar certo. Na primeira versão os fios do buzzer passavam por cima da peça e estouravam a borda. Refiz com duas torres internas fixadas por parafuso M2, uma pro buzzer, outra pro DHT22. Resolveu de primeira.

O modelo está publicado no MakerWorld, aberto pra quem tiver o mesmo combo ESP32 + MAX7219 + buzzer + DHT22 não precisar reinventar a roda.

Próximo passo: integrar buzzer e sensor ao firmware e fechar o ciclo de alertas do Prometheus/Alertmanager que ficou pendente no post anterior.

Links no primeiro comentário. 👇

#impressao3d #maker #esp32 #homelab #makerworld #blender

---

## Primeiro comentário (postar logo em seguida)

Meu primeiro modelo 3D do zero: um painel 1U para ESP32 e matriz de LED:
https://garden.jansouza.com/maker/2026/08/16/meu-primeiro-modelo-3d-painel-1u-esp32-matriz-de-led.html

Modelo publicado no MakerWorld:
https://makerworld.com/en/models/3186083-led-matrix-panel-max7219-esp32-buzzer-dht22

---

**TODO antes de publicar:**
- [ ] Anexar foto (sugestão: IMG_20260816_162440.jpg, a frente do painel impresso, ou photo_cover_4x3-v2.jpeg, montado no rack)
- [ ] Postar o primeiro comentário com os links logo após publicar
- [ ] Avaliar se vale linkar o post anterior (Smart Matrix Clock / IBM Bob) no comentário também
- [ ] Revisar tom/tamanho
- [ ] Decidir se faz versão em inglês (como no post anterior, linkedin-ibm-bob-matrix-clock-en.md)
