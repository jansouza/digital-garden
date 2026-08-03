---
layout: post
title: "Como utilizei o IBM Bob para criar um firmware Arduino/ESP32"
date: 2026-08-03 09:00:00 -0300
categories: [homelab]
tags: [esp32, iot, led, wifi, max7219, hardware, homelab, labrax, ibm-bob, ia, devops]
stage: seed
description: "Um relógio de matriz de LED com ESP32 + MAX7219 que mostra hora, clima, cotações e mensagens — com o firmware inteiro escrito junto com o IBM Bob, incluindo interface web e 251 testes."
---

![Smart Matrix Clock: relógio de matriz de LED baseado em ESP32 e MAX7219](/assets/images/ibm-bob-matrix-clock/ibm-bob-matrix-clock.png)

Navegando no site do [MakerWorld](https://makerworld.com/en/models/2043316-1u-10-inch-panel-cover-for-max7219?from=search#profileId-2204627),
esbarrei num painel 1U pensado para encaixar um módulo MAX7219 — um controlador serial que permite acionar matrizes de LEDs 8×8 encadeadas usando apenas três fios. Eu nunca
tinha ouvido falar desse tipo de display, mas fiquei curioso — e como já
tinha alguns ESP32 sobrando aqui em casa, resolvi comprar o módulo MAX7219 e
começar mais uma aventura no meu homelab.

Dessa vez, decidi ir além do hardware: escrever o firmware inteiro junto com o
**IBM Bob**, do mesmo jeito que fiz quando [criei um projeto Ansible completo do zero](/devops/2026/07/06/criando-um-projeto-ansible-do-zero-com-ibm-bob).
O resultado é o **Smart Matrix Clock**: um relógio que sincroniza a hora pela
internet, mostra o clima, cotações de ações e mensagens enviadas pela rede —
tudo configurável pelo navegador. O vídeo abaixo resume o projeto:

<video controls preload="metadata">
  <source src="/assets/videos/ibm-bob-matrix-clock/Smart_Matrix_Clock_V1.mp4" type="video/mp4">
  Seu navegador não suporta a tag de vídeo.
</video>

## Hardware

Usei um ESP32-WROOM com 4 módulos MAX7219 (FC16) encadeados, formando um
display de 32×8 LEDs, ligados via SPI com o seguinte mapeamento de pinos:

| Módulo MAX7219 | ESP32-WROOM      |
|----------------|------------------|
| DIN            | GPIO 23 (MOSI)   |
| CLK            | GPIO 18 (SCK)    |
| CS             | GPIO 5           |
| VCC            | 5V               |
| GND            | GND              |

Os 4 módulos são encadeados em série — a saída DOUT do primeiro entra no DIN
do segundo, e assim por diante.

![Montagem do ESP32 com os 4 módulos MAX7219 FC16 encadeados, vista de cima](/assets/images/ibm-bob-matrix-clock/esp32-max7219-montagem.jpg)

Rodando na mesa, já conectado e sincronizado via NTP:

![ESP32 com a matriz de LEDs MAX7219 exibindo o relógio, acesa](/assets/images/ibm-bob-matrix-clock/esp32-max7219-matriz-acesa.jpg)

## Trabalhando com o IBM Bob

Todo o código foi escrito com o **IBM Bob**, o assistente de desenvolvimento
da IBM, e está publicado no repositório
[ibm-bob-matrix-clock](https://github.com/jansouza/ibm-bob-matrix-clock).

Comecei descrevendo para o Bob o que eu tinha na mesa e o que eu queria:
o ESP32 com os 4 módulos, um relógio acertado via NTP, clima, cotações,
mensagens e uma página de configuração servida pelo próprio chip. Também
deixei claro o que eu **não** queria: nada de `delay()` travando o display —
firmware embarcado que congela enquanto espera uma resposta HTTP é uma
experiência bem ruim.

Em vez de despejar código de uma vez, o Bob propôs dividir o trabalho em 5
fases, cada uma terminando com algo que eu pudesse gravar no ESP32 e ver
funcionando de verdade antes de seguir adiante:

1. **Esqueleto do projeto + relógio funcional** — ESP32 conectado a uma rede
   WiFi fixa, sincronizando hora via NTP e mostrando `HH:MM` com dois pontos
   piscando (antes da sincronização, o display mostra `--:--`).
2. **Persistência e WiFi configurável** — quando não há rede salva, o ESP32
   vira um access point (`SmartMatrixClock-Setup`) com um portal de
   configuração. Todas as preferências — brilho, fuso horário, idioma,
   coordenadas — ficam gravadas na memória NVS e sobrevivem a reinicializações.
3. **Interface web + API REST** — painel acessível em `http://<ip>/`,
   troca de fuso horário refletida na hora exibida e mensagens enviadas pelo
   navegador aparecendo no display.
4. **Clima (Open-Meteo)** — temperatura, condição e mínima/máxima do dia
   entrando na rotação do display, com cache e um `*` indicando quando os
   dados estão desatualizados por falha de rede.
5. **Cotações (Yahoo Finance)** — múltiplos tickers configuráveis exibidos em
   rotação (`PETR4: 38.42 +1.23%`), com o mesmo esquema de cache do clima.

Esse ritmo de "algo testável no hardware a cada fase" foi o que fez o projeto
andar: cada parte nova se encaixava no que já existia sem quebrar o que estava
funcionando. No fim, o firmware ficou dividido em 13 módulos — display, WiFi,
NTP, persistência, rotas web, busca de dados externos — cada um com sua
responsabilidade.

A documentação nasceu junto: a especificação do projeto, o plano de
implementação, a referência da API e até um guia de integração com Home
Assistant estão na pasta [`docs/`](https://github.com/jansouza/ibm-bob-matrix-clock/tree/main/docs)
do repositório.

## O loop principal

O coração do firmware é um `loop()` que nunca para para esperar nada. Cada
módulo expõe uma função `tick()` que olha o relógio (`millis()`), decide se já
está na hora de fazer algo e devolve o controle imediatamente. Esse é o
`loop()` real do projeto:

```cpp
void loop() {
    wifiTick();      // reconexão e reinício adiado
    ntpTick();       // status de sincronização e re-sync periódico
    fetcherTick();   // timers de busca de clima e cotações
    displayTick();   // scroll da data, fila de mensagens e rotação de slots
}
```

O servidor HTTP nem aparece aqui: ele é assíncrono (ESPAsyncWebServer) e os
handlers só atualizam variáveis de estado — quem faz o trabalho pesado é o
`loop()` no ciclo seguinte. É isso que permite o ESP32 servir a página web,
sincronizar NTP, buscar clima e animar o display ao mesmo tempo, sem engasgar.

## A interface web

Toda a página — HTML, CSS e JavaScript — vive embutida como string C++ na
flash do ESP32. São 6 abas no navegador: **Display**, **Clock**, **Message**,
**Weather**, **Quotes** e **Network**.

<div class="carousel">
  <div class="carousel-track">
    <figure class="carousel-slide">
      <img src="/assets/images/ibm-bob-matrix-clock/screenshot_display.png" alt="Interface web mostrando a aba Display com as opções de brilho e rotação de slots" loading="lazy">
      <figcaption>Display</figcaption>
    </figure>
    <figure class="carousel-slide">
      <img src="/assets/images/ibm-bob-matrix-clock/screenshot_clock.png" alt="Interface web do firmware mostrando o modo relógio com hora e data" loading="lazy">
      <figcaption>Clock</figcaption>
    </figure>
    <figure class="carousel-slide">
      <img src="/assets/images/ibm-bob-matrix-clock/screenshot_alert.png" alt="Interface web mostrando o painel de envio de mensagens" loading="lazy">
      <figcaption>Message</figcaption>
    </figure>
    <figure class="carousel-slide">
      <img src="/assets/images/ibm-bob-matrix-clock/screenshot_weather.png" alt="Interface web mostrando o slot de clima com temperatura e condição do dia" loading="lazy">
      <figcaption>Weather</figcaption>
    </figure>
    <figure class="carousel-slide">
      <img src="/assets/images/ibm-bob-matrix-clock/screenshot_quotes.png" alt="Interface web mostrando o slot de cotações com ticker e variação percentual" loading="lazy">
      <figcaption>Quotes</figcaption>
    </figure>
  </div>
  <button type="button" class="carousel-btn carousel-prev" aria-label="Slide anterior">&#8249;</button>
  <button type="button" class="carousel-btn carousel-next" aria-label="Próximo slide">&#8250;</button>
  <div class="carousel-dots"></div>
</div>

Depois das 5 fases iniciais, fui pedindo melhorias que foram entrando uma a
uma — e algumas ficaram bem melhores do que eu esperava:

- **Ícones nas mensagens** — tags como `[heart]` viram símbolos desenhados na
  matriz, com um **preview ao vivo** na página mostrando como o texto vai
  aparecer no display antes de enviar;
- **Histórico** das últimas 20 mensagens enviadas;
- **Busca de cidade** para o clima — em vez de digitar latitude e longitude,
  a página consulta a API de geocoding do Open-Meteo pelo nome da cidade;
- **Agendamento por horário** — dá para dizer que as cotações só aparecem em
  dias úteis, das 8h às 18h, por exemplo;
- **Brilho automático** — o display escurece sozinho à noite;
- **Varredura de redes WiFi** direto na aba Network;
- Interface em **português e inglês**.

## Nem tudo saiu certo de primeira

Vale registrar o que não funcionou, porque faz parte. A melhor história é a
da autenticação da API: pedi para o Bob proteger os endpoints com uma API key
— implementou direitinho, e o resultado foi a própria página web perdendo
acesso às ações de escrita que ela precisava fazer. Acabei removendo o
mecanismo e deixando a proteção (HTTP Basic Auth) anotada como pendência no
[plano de melhorias](https://github.com/jansouza/ibm-bob-matrix-clock/blob/main/docs/enhancements-plan.md).

Fora isso, as iterações maiores foram nos detalhes do portal WiFi e no formato
de exibição das cotações no display — coisas que só aparecem quando você está
com o hardware na mão, olhando o resultado de verdade.

## Testes sem precisar da placa

Uma das partes que mais gostei: o projeto tem **251 testes** que rodam no meu
próprio computador, sem ESP32 e sem toolchain de embarcado — só `g++` e um
`make`. Stubs finos imitam os headers do Arduino, e a suíte cobre as partes
mais fáceis de errar: conversão UTF-8 ↔ Latin-1 (acentos na matriz de LED!),
tabela de fusos horários IANA → POSIX, códigos de clima da WMO, o algoritmo de
agendamento de slots e o parsing dos tickers.

```bash
cd tests && make
```

Isso muda a dinâmica de trabalhar com IA em firmware: cada mudança que o Bob
fazia podia ser validada em segundos no host, antes de gastar tempo gravando
a flash.

## API REST

Tudo que a página web faz também dá para fazer via API — o que abre caminho
para automações. Os principais endpoints:

| Método | Rota                   | O que faz                                    |
|--------|------------------------|----------------------------------------------|
| `GET`  | `/api/status`          | Hora atual, slot ativo, NTP, SSID, IP        |
| `GET`  | `/api/config`          | Todas as configurações em JSON               |
| `POST` | `/api/config`          | Atualiza configurações                        |
| `POST` | `/api/message`         | Envia uma mensagem para o display            |
| `POST` | `/api/preview`         | Força a exibição de um slot imediatamente    |
| `GET`  | `/api/messages/history`| Últimas 20 mensagens enviadas                |

Mandar uma mensagem para o painel é um `curl`:

```bash
curl -X POST http://<ip>/api/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Deploy completo!"}'
```

A referência completa está em
[`docs/api-rest.md`](https://github.com/jansouza/ibm-bob-matrix-clock/blob/main/docs/api-rest.md),
e tem até um [guia de integração com Home Assistant](https://github.com/jansouza/ibm-bob-matrix-clock/blob/main/docs/home-assistant.md).

## Próximos passos

O painel 1U já está impresso e o display instalado no LabRax, mostrando hora,
clima e cotações em rotação — dá para ver no vídeo lá do início. O próximo
post vai cobrir a integração com Prometheus + Alertmanager: quando algum
serviço do homelab disparar um alerta, ele vai aparecer direto na matriz de
LED, via `/api/message`. Na fila também estão atualização OTA do firmware e a
volta da autenticação na interface web.

O código completo está no [GitHub](https://github.com/jansouza/ibm-bob-matrix-clock).
Se quiser ver o IBM Bob num contexto mais tradicional de DevOps, tem também o
post sobre [criar um projeto Ansible completo do zero com o IBM Bob](/devops/2026/07/06/criando-um-projeto-ansible-do-zero-com-ibm-bob).
