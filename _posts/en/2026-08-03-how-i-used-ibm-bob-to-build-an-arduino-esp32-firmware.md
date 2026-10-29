---
layout: post
title: "How I used IBM Bob to build an Arduino/ESP32 firmware"
date: 2026-08-03 09:00:00 -0300
categories: [homelab]
tags: [esp32, iot, led, wifi, max7219, hardware, homelab, labrax, ibm-bob, ia, devops]
stage: growing
image: /assets/images/ibm-bob-matrix-clock/ibm-bob-matrix-clock.jpg
description: "An ESP32 + MAX7219 LED matrix clock that shows the time, weather, stock quotes and messages — with the whole firmware written together with IBM Bob, including a web interface and 251 tests."
translation_key: como-utilizei-o-ibm-bob-para-criar-um-firmware-arduino-esp32
---

![Smart Matrix Clock: LED matrix clock based on ESP32 and MAX7219](/assets/images/ibm-bob-matrix-clock/ibm-bob-matrix-clock.jpg)

Browsing [MakerWorld](https://makerworld.com/en/models/2043316-1u-10-inch-panel-cover-for-max7219?from=search#profileId-2204627),
I came across a 1U panel designed to fit a MAX7219 module — a serial controller that drives chained 8×8 LED matrices using only three wires. I had
never heard of this kind of display, but I got curious — and since I already
had a few spare ESP32 boards at home, I decided to buy the MAX7219 module and
start one more adventure in my homelab.

This time, I decided to go beyond the hardware: write the whole firmware
together with **IBM Bob**, the same way I did when I [created a complete
Ansible project from scratch]({% post_url en/2026-07-06-creating-an-ansible-project-from-scratch-with-ibm-bob %}).
The result is the **Smart Matrix Clock**: a clock that syncs the time over
the internet and shows the weather, stock quotes and messages sent over the
network — all configurable from the browser. The video below sums up the
project:

<video controls preload="metadata">
  <source src="/assets/videos/ibm-bob-matrix-clock/Smart_Matrix_Clock_V1.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

## Hardware

I used an ESP32-WROOM with 4 chained MAX7219 (FC16) modules, forming a
32×8 LED display, connected over SPI with the following pin mapping:

| MAX7219 module | ESP32-WROOM      |
|----------------|------------------|
| DIN            | GPIO 23 (MOSI)   |
| CLK            | GPIO 18 (SCK)    |
| CS             | GPIO 5           |
| VCC            | 5V               |
| GND            | GND              |

The 4 modules are chained in series — the DOUT output of the first goes into
the DIN of the second, and so on.

![ESP32 assembly with the 4 chained MAX7219 FC16 modules, seen from above](/assets/images/ibm-bob-matrix-clock/esp32-max7219-montagem.jpg)

Running on the desk, already connected and synced over NTP:

![ESP32 with the MAX7219 LED matrix showing the clock, lit up](/assets/images/ibm-bob-matrix-clock/esp32-max7219-matriz-acesa.jpg)

## Working with IBM Bob

All the code was written with **IBM Bob**, IBM's development assistant, and
is published in the
[ibm-bob-matrix-clock](https://github.com/jansouza/ibm-bob-matrix-clock)
repository.

I started by describing to Bob what I had on the desk and what I wanted: the
ESP32 with the 4 modules, a clock set over NTP, weather, quotes, messages
and a configuration page served by the chip itself. I also made clear what I
did **not** want: no `delay()` freezing the display — embedded firmware that
freezes while waiting for an HTTP response is a pretty bad experience.

Instead of dumping code all at once, Bob proposed splitting the work into 5
phases, each one ending with something I could flash to the ESP32 and see
actually working before moving on:

1. **Project skeleton + working clock** — ESP32 connected to a fixed WiFi
   network, syncing the time over NTP and showing `HH:MM` with a blinking
   colon (before syncing, the display shows `--:--`).
2. **Persistence and configurable WiFi** — when there's no saved network,
   the ESP32 becomes an access point (`SmartMatrixClock-Setup`) with a
   configuration portal. All preferences — brightness, time zone, language,
   coordinates — are stored in NVS memory and survive reboots.
3. **Web interface + REST API** — a dashboard at `http://<ip>/`, time zone
   changes reflected in the displayed time and messages sent from the
   browser showing up on the display.
4. **Weather (Open-Meteo)** — temperature, condition and the day's low/high
   joining the display rotation, with caching and a `*` marking when the
   data is stale because of a network failure.
5. **Quotes (Yahoo Finance)** — multiple configurable tickers shown in
   rotation (`PETR4: 38.42 +1.23%`), with the same caching scheme as the
   weather.

This pace of "something testable on the hardware at every phase" is what
kept the project moving: each new part fit into what already existed without
breaking what was working. In the end, the firmware was split into 13
modules — display, WiFi, NTP, persistence, web routes, external data
fetching — each with its own responsibility.

The documentation was born alongside it: the project specification, the
implementation plan, the API reference and even a Home Assistant
integration guide are in the repository's
[`docs/`](https://github.com/jansouza/ibm-bob-matrix-clock/tree/main/docs)
folder.

## The main loop

The heart of the firmware is a `loop()` that never stops to wait for
anything. Each module exposes a `tick()` function that looks at the clock
(`millis()`), decides whether it's time to do something and returns control
immediately. This is the project's actual `loop()`:

```cpp
void loop() {
    wifiTick();      // reconnection and deferred restart
    ntpTick();       // sync status and periodic re-sync
    fetcherTick();   // weather and quote fetch timers
    displayTick();   // date scroll, message queue and slot rotation
}
```

The HTTP server doesn't even show up here: it's asynchronous
(ESPAsyncWebServer) and the handlers only update state variables — the
heavy lifting is done by `loop()` on the next cycle. That's what lets the
ESP32 serve the web page, sync NTP, fetch the weather and animate the
display at the same time, without stuttering.

## The web interface

The whole page — HTML, CSS and JavaScript — lives embedded as a C++ string
in the ESP32's flash. There are 6 tabs in the browser: **Display**,
**Clock**, **Message**, **Weather**, **Quotes** and **Network**.

<div class="carousel">
  <div class="carousel-track">
    <figure class="carousel-slide">
      <img src="/assets/images/ibm-bob-matrix-clock/screenshot_display.png" alt="Web interface showing the Display tab with brightness and slot rotation options" loading="lazy">
      <figcaption>Display</figcaption>
    </figure>
    <figure class="carousel-slide">
      <img src="/assets/images/ibm-bob-matrix-clock/screenshot_clock.png" alt="Firmware web interface showing clock mode with time and date" loading="lazy">
      <figcaption>Clock</figcaption>
    </figure>
    <figure class="carousel-slide">
      <img src="/assets/images/ibm-bob-matrix-clock/screenshot_alert.png" alt="Web interface showing the message sending panel" loading="lazy">
      <figcaption>Message</figcaption>
    </figure>
    <figure class="carousel-slide">
      <img src="/assets/images/ibm-bob-matrix-clock/screenshot_weather.png" alt="Web interface showing the weather slot with the day's temperature and condition" loading="lazy">
      <figcaption>Weather</figcaption>
    </figure>
    <figure class="carousel-slide">
      <img src="/assets/images/ibm-bob-matrix-clock/screenshot_quotes.png" alt="Web interface showing the quotes slot with ticker and percentage change" loading="lazy">
      <figcaption>Quotes</figcaption>
    </figure>
  </div>
  <button type="button" class="carousel-btn carousel-prev" aria-label="Previous slide">&#8249;</button>
  <button type="button" class="carousel-btn carousel-next" aria-label="Next slide">&#8250;</button>
  <div class="carousel-dots"></div>
</div>

After the 5 initial phases, I kept asking for improvements that went in one
by one — and some turned out much better than I expected:

- **Icons in messages** — tags like `[heart]` turn into symbols drawn on the
  matrix, with a **live preview** on the page showing how the text will look
  on the display before sending;
- **History** of the last 20 messages sent;
- **City search** for the weather — instead of typing latitude and
  longitude, the page queries the Open-Meteo geocoding API by city name;
- **Time-based scheduling** — you can say that quotes only show up on
  weekdays, from 8 a.m. to 6 p.m., for example;
- **Automatic brightness** — the display dims by itself at night;
- **WiFi network scan** right in the Network tab;
- Interface in **Portuguese and English**.

## Not everything worked the first time

It's worth recording what didn't work, because it's part of the process.
The best story is the API authentication one: I asked Bob to protect the
endpoints with an API key — it implemented it properly, and the result was
the web page itself losing access to the write actions it needed. I ended
up removing the mechanism and leaving the protection (HTTP Basic Auth)
noted as pending in the
[enhancements plan](https://github.com/jansouza/ibm-bob-matrix-clock/blob/main/docs/enhancements-plan.md).

Other than that, the bigger iterations were on the details of the WiFi
portal and the format of the quotes on the display — things that only show
up when you have the hardware in hand, looking at the actual result.

## Tests without needing the board

One of the parts I liked the most: the project has **251 tests** that run
on my own computer, without an ESP32 and without an embedded toolchain —
just `g++` and `make`. Thin stubs imitate the Arduino headers, and the suite
covers the parts that are easiest to get wrong: UTF-8 ↔ Latin-1 conversion
(accents on the LED matrix!), the IANA → POSIX time zone table, WMO weather
codes, the slot scheduling algorithm and ticker parsing.

```bash
cd tests && make
```

This changes the dynamics of working with AI on firmware: every change Bob
made could be validated in seconds on the host, before spending time
flashing the board.

## REST API

Everything the web page does can also be done through the API — which opens
the door to automations. The main endpoints:

| Method | Route                  | What it does                                 |
|--------|------------------------|----------------------------------------------|
| `GET`  | `/api/status`          | Current time, active slot, NTP, SSID, IP     |
| `GET`  | `/api/config`          | All settings as JSON                         |
| `POST` | `/api/config`          | Updates settings                             |
| `POST` | `/api/message`         | Sends a message to the display               |
| `POST` | `/api/preview`         | Forces a slot to be shown immediately        |
| `GET`  | `/api/messages/history`| Last 20 messages sent                        |

Sending a message to the panel is a `curl`:

```bash
curl -X POST http://<ip>/api/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Deploy completo!"}'
```

The complete reference is in
[`docs/api-rest.md`](https://github.com/jansouza/ibm-bob-matrix-clock/blob/main/docs/api-rest.md),
and there's even a [Home Assistant integration guide](https://github.com/jansouza/ibm-bob-matrix-clock/blob/main/docs/home-assistant.md).

## Next steps

The 1U panel is already printed and the display is installed in the LabRax,
showing the time, weather and quotes in rotation — you can see it in the
video at the top. The next post will cover the integration with Prometheus +
Alertmanager: when a homelab service fires an alert, it will show up right
on the LED matrix, via `/api/message`. Also in the queue are OTA firmware
updates and bringing authentication back to the web interface.

The complete code is on [GitHub](https://github.com/jansouza/ibm-bob-matrix-clock).
If you want to see IBM Bob in a more traditional DevOps context, there's
also the post about [creating a complete Ansible project from scratch with
IBM Bob]({% post_url en/2026-07-06-creating-an-ansible-project-from-scratch-with-ibm-bob %}).
