---
layout: post
title: "Meu primeiro modelo 3D do zero: um painel 1U para ESP32 e matriz de LED"
date: 2026-08-16 09:00:00 -0300
categories: [maker]
tags: [impressao-3d, maker, esp32, makerworld, homelab, labrax, max7219, dht22, bambu-lab, hardware]
stage: seed
image: /assets/images/led-matrix-panel-model/photo_cover_4x3-v2.jpeg
description: "Não achei no MakerWorld um painel 1U para ESP32 — só para ESP8266. Desenhei meu primeiro modelo 3D do zero, com espaço para MAX7219, buzzer e DHT22."
---

![Bancada com ESP32, módulo buzzer, sensor DHT22, paquímetro digital marcando 22,46 mm e as peças do painel recém-impressas, com a impressão em andamento na tela ao fundo](/assets/images/led-matrix-panel-model/IMG_20260816_222519.jpg)

Para o [Smart Matrix Clock]({% post_url 2026-08-03-como-utilizei-o-ibm-bob-para-criar-um-firmware-arduino-esp32 %}),
usei um [painel 1U de 10 polegadas pronto](https://makerworld.com/en/models/2043316-1u-10-inch-panel-cover-for-max7219)
que encontrei no MakerWorld, pensado para encaixar um módulo MAX7219 no
[LabRax]({% post_url 2026-07-12-homelab-labrax-rack-impresso-em-3d %}).
Funcionou, mas nunca encaixou 100%: o modelo tinha sido desenhado pensando em
um ESP8266, não no ESP32-WROOM que eu estava usando. As furações não batiam
certinho, e o ESP32 acabou ficando meio "apoiado" ali dentro, preso na marra.

Enquanto isso o projeto foi crescendo. No fim do post anterior eu já falava em
levar os alertas do Prometheus/Alertmanager para a matriz de LED. Um alerta
visual é bom, mas um alerta sonoro é melhor ainda — então entrou um **buzzer**
no projeto. Também adicionei um **sensor de temperatura e umidade (DHT22)**,
para acompanhar como está o ar dentro do rack.

Com essas peças novas, não fazia mais sentido forçar o encaixe em um modelo
pensado para outra placa. Procurei alternativas prontas e não achei nada que
cobrisse esse combo específico — painel 1U de 10 polegadas, ESP32-WROOM,
MAX7219, buzzer e sensor de temperatura. Foi a deixa para desenhar meu
primeiro modelo 3D do zero.

## O que o modelo precisava resolver

- Caber no padrão de rack de 10 polegadas / 1U, o mesmo do LabRax.
- Furação e encaixe corretos para o ESP32-WROOM, bem diferente do ESP8266 em
  tamanho e posição dos parafusos.
- Abertura para o módulo de matriz de LED MAX7219 já usado no Smart Matrix
  Clock.
- Um recorte para o buzzer, posicionado para o som sair livre para fora do
  painel.
- Um furo para o sensor de temperatura, exposto ao ar do rack — e não preso
  dentro da carcaça, senão a leitura fica errada por causa do calor da própria
  eletrônica.

## Modelando no Blender, com ajuda de IA

Escolhi o **Blender** para desenhar a peça — e aqui vale o disclaimer: eu nunca
tinha modelado nada em 3D antes. O Blender é uma ferramenta enorme, pensada
principalmente para modelagem artística, e a curva de aprendizado nos primeiros
dias é íngreme mesmo para quem está acostumado a mexer em ferramenta nova.

O que destravou foi usar **IA como copiloto de modelagem**, do mesmo jeito que
venho fazendo com código: descrever o que eu queria, entender qual operação do
Blender resolvia aquilo e ir ajustando. A IA não desenhou a peça por mim, mas
encurtou muito o caminho entre "sei a medida que preciso" e "sei qual botão
apertar para chegar lá".

## Os desafios de modelar para impressão 3D

Modelar uma peça para impressão 3D é mais desafiador do que parece. Cada
medida precisa estar certa para tudo encaixar no lugar, e a única forma de
confirmar isso é imprimindo — cada tentativa leva algumas horas, fora o tempo
de verificar as medidas, ajustar o modelo e reimprimir. No fim foram **cinco
impressões** até o painel fechar do jeito que eu queria.

![Bancada de trabalho com paquímetro digital, régua de aço, ESP32, módulos MAX7219, buzzer e sensor DHT22, ao lado das peças impressas, com o progresso da impressão na tela ao fundo](/assets/images/led-matrix-panel-model/IMG_20260816_222439.jpg)

Na primeira versão, pensei em deixar os fios do buzzer passando por cima do
painel, mas logo vi que não era uma boa ideia: os fios ultrapassavam a borda
da peça, então tive que refazer o design. Na v2 optei por algo bem mais
simples — duas torres para fixar o buzzer e o sensor de temperatura com
parafusos M2. Simples assim, mas encaixou perfeito.

## Impressão e montagem

Com as peças impressas, a montagem confirmou o que eu queria resolver: o
ESP32 e os módulos MAX7219 encaixam certinho nos suportes, e o buzzer e o
DHT22 ficaram lado a lado, cada um na sua torre, sem embolar a fiação.

<div class="carousel">
  <div class="carousel-track">
    <figure class="carousel-slide">
      <img src="/assets/images/led-matrix-panel-model/IMG_20260816_162440.jpg" alt="Frente do painel 1U impresso em preto, com a grade de furos para a matriz de LED e a grelha hexagonal de saída do som do buzzer" loading="lazy">
      <figcaption>A frente do painel impresso</figcaption>
    </figure>
    <figure class="carousel-slide">
      <img src="/assets/images/led-matrix-panel-model/photo_cover_4x3-v2.jpeg" alt="Painel LED Matrix Panel instalado no rack, com a etiqueta 'Matrix Lab' e a matriz de LED acesa exibindo texto em vermelho, acima de outro módulo do rack com um Raspberry Pi" loading="lazy">
      <figcaption>Painel montado no rack</figcaption>
    </figure>
    <figure class="carousel-slide">
      <img src="/assets/images/led-matrix-panel-model/IMG_20260817_084054.jpg" alt="Vista interna do painel com o ESP32 encaixado em um dos suportes impressos e os quatro módulos MAX7219 encadeados ao longo da peça" loading="lazy">
      <figcaption>ESP32 e MAX7219 montados</figcaption>
    </figure>
    <figure class="carousel-slide">
      <img src="/assets/images/led-matrix-panel-model/IMG_20260817_084534.jpg" alt="Vista interna do painel mostrando o sensor DHT22 e o módulo buzzer encaixados nos suportes impressos, ao lado da cadeia de módulos MAX7219" loading="lazy">
      <figcaption>Buzzer e DHT22 montados</figcaption>
    </figure>
    <figure class="carousel-slide">
      <img src="/assets/images/led-matrix-panel-model/IMG_20260817_084542.jpg" alt="Detalhe do encaixe do buzzer e do sensor DHT22 nos suportes impressos, com os fios conectados aos módulos MAX7219" loading="lazy">
      <figcaption>Detalhe do encaixe</figcaption>
    </figure>
  </div>
  <button type="button" class="carousel-btn carousel-prev" aria-label="Slide anterior">&#8249;</button>
  <button type="button" class="carousel-btn carousel-next" aria-label="Próximo slide">&#8250;</button>
  <div class="carousel-dots"></div>
</div>

### O que você precisa para montar

- 1× ESP32-WROOM
- 4× módulos de matriz de LED MAX7219 (8×8, encadeados)
- 1× módulo buzzer
- 1× sensor de temperatura e umidade DHT22
- Parafusos M2 para o buzzer e o sensor
- Um rack de 10 polegadas com espaço de 1U — no meu caso, o LabRax

## Publicação no MakerWorld

O modelo está publicado no MakerWorld:
[LED Matrix Panel — MAX7219, ESP32, Buzzer, DHT22](https://makerworld.com/en/models/3186083-led-matrix-panel-max7219-esp32-buzzer-dht22).
A ideia é deixá-lo público justamente para preencher essa lacuna que
encontrei: quem tiver o mesmo combo ESP32 + MAX7219 + buzzer + sensor de
temperatura não vai precisar reinventar a roda. Se você imprimir — ou fizer um
remix para outra placa —, me conta como ficou.

## Próximos passos

Com o painel impresso, o próximo passo é integrar o buzzer e o sensor de
temperatura ao firmware do Smart Matrix Clock, e então fechar o ciclo dos
alertas do Prometheus/Alertmanager que tinha ficado pendente no post anterior.
