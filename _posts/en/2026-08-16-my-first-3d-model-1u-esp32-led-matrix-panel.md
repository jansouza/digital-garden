---
layout: post
title: "My first 3D model from scratch: a 1U panel for ESP32 and an LED matrix"
date: 2026-08-16 09:00:00 -0300
categories: [maker]
tags: [impressao-3d, maker, esp32, makerworld, homelab, labrax, max7219, dht22, bambu-lab, hardware]
stage: growing
image: /assets/images/led-matrix-panel-model/photo_cover_4x3-v2.jpeg
description: "I couldn't find a 1U panel for ESP32 on MakerWorld — only for ESP8266. So I designed my first 3D model from scratch, with room for a MAX7219, a buzzer and a DHT22."
translation_key: meu-primeiro-modelo-3d-painel-1u-esp32-matriz-de-led
---

![Workbench with an ESP32, a buzzer module, a DHT22 sensor, a digital caliper reading 22.46 mm and the freshly printed panel parts, with the print in progress on the screen in the background](/assets/images/led-matrix-panel-model/IMG_20260816_222519.jpg)

For the [Smart Matrix Clock]({% post_url en/2026-08-03-how-i-used-ibm-bob-to-build-an-arduino-esp32-firmware %}),
I used a [ready-made 10-inch 1U panel](https://makerworld.com/en/models/2043316-1u-10-inch-panel-cover-for-max7219)
I found on MakerWorld, designed to fit a MAX7219 module in the
[LabRax]({% post_url en/2026-07-12-homelab-labrax-3d-printed-rack %}).
It worked, but it never fit 100%: the model had been designed for an
ESP8266, not the ESP32-WROOM I was using. The holes didn't line up quite
right, and the ESP32 ended up sort of "resting" in there, held in place by
force.

Meanwhile the project kept growing. At the end of the previous post I was
already talking about bringing Prometheus/Alertmanager alerts to the LED
matrix. A visual alert is good, but an audible alert is even better — so a
**buzzer** joined the project. I also added a **temperature and humidity
sensor (DHT22)**, to keep track of the air inside the rack.

With these new parts, it no longer made sense to force them into a model
designed for another board. I looked for ready-made alternatives and found
nothing covering this specific combo — 10-inch 1U panel, ESP32-WROOM,
MAX7219, buzzer and temperature sensor. That was my cue to design my first
3D model from scratch.

## What the model needed to solve

- Fit the 10-inch / 1U rack standard, the same as the LabRax.
- Correct holes and fit for the ESP32-WROOM, quite different from the
  ESP8266 in size and screw positions.
- An opening for the MAX7219 LED matrix module already used in the Smart
  Matrix Clock.
- A cutout for the buzzer, positioned so the sound comes out freely from the
  panel.
- A hole for the temperature sensor, exposed to the rack's air — and not
  trapped inside the enclosure, otherwise the reading is off because of the
  heat from the electronics themselves.

## Modeling in Blender, with help from AI

I chose **Blender** to design the part — and here's the disclaimer: I had
never modeled anything in 3D before. Blender is a huge tool, built mainly
for artistic modeling, and the learning curve in the first days is steep
even for someone used to picking up new tools.

What unlocked it was using **AI as a modeling copilot**, the same way I've
been doing with code: describing what I wanted, understanding which Blender
operation solved it and adjusting as I went. The AI didn't design the part
for me, but it greatly shortened the path between "I know the measurement I
need" and "I know which button to press to get there".

## The challenges of modeling for 3D printing

Modeling a part for 3D printing is more challenging than it looks. Every
measurement has to be right for everything to fit into place, and the only
way to confirm it is by printing — each attempt takes a few hours, plus the
time to check the measurements, adjust the model and reprint. In the end it
took **five prints** until the panel came out the way I wanted.

![Workbench with a digital caliper, steel ruler, ESP32, MAX7219 modules, buzzer and DHT22 sensor, next to the printed parts, with the print progress on the screen in the background](/assets/images/led-matrix-panel-model/IMG_20260816_222439.jpg)

In the first version, I thought about running the buzzer wires over the top
of the panel, but I soon saw that wasn't a good idea: the wires went past
the edge of the part, so I had to redo the design. In v2 I went with
something much simpler — two towers to mount the buzzer and the temperature
sensor with M2 screws. As simple as that, and it fit perfectly.

## Printing and assembly

With the parts printed, the assembly confirmed what I wanted to solve: the
ESP32 and the MAX7219 modules fit snugly in their mounts, and the buzzer and
the DHT22 sit side by side, each on its own tower, without tangling the
wiring.

<div class="carousel">
  <div class="carousel-track">
    <figure class="carousel-slide">
      <img src="/assets/images/led-matrix-panel-model/IMG_20260816_162440.jpg" alt="Front of the 1U panel printed in black, with the hole grid for the LED matrix and the hexagonal grille for the buzzer sound" loading="lazy">
      <figcaption>The front of the printed panel</figcaption>
    </figure>
    <figure class="carousel-slide">
      <img src="/assets/images/led-matrix-panel-model/photo_cover_4x3-v2.jpeg" alt="LED Matrix Panel installed in the rack, with the 'Matrix Lab' label and the LED matrix lit up showing red text, above another rack module with a Raspberry Pi" loading="lazy">
      <figcaption>Panel mounted in the rack</figcaption>
    </figure>
    <figure class="carousel-slide">
      <img src="/assets/images/led-matrix-panel-model/IMG_20260817_084054.jpg" alt="Inside view of the panel with the ESP32 fitted into one of the printed mounts and the four chained MAX7219 modules along the part" loading="lazy">
      <figcaption>ESP32 and MAX7219 mounted</figcaption>
    </figure>
    <figure class="carousel-slide">
      <img src="/assets/images/led-matrix-panel-model/IMG_20260817_084534.jpg" alt="Inside view of the panel showing the DHT22 sensor and the buzzer module fitted into the printed mounts, next to the chain of MAX7219 modules" loading="lazy">
      <figcaption>Buzzer and DHT22 mounted</figcaption>
    </figure>
    <figure class="carousel-slide">
      <img src="/assets/images/led-matrix-panel-model/IMG_20260817_084542.jpg" alt="Detail of the buzzer and DHT22 sensor fitted into the printed mounts, with the wires connected to the MAX7219 modules" loading="lazy">
      <figcaption>Fit detail</figcaption>
    </figure>
  </div>
  <button type="button" class="carousel-btn carousel-prev" aria-label="Previous slide">&#8249;</button>
  <button type="button" class="carousel-btn carousel-next" aria-label="Next slide">&#8250;</button>
  <div class="carousel-dots"></div>
</div>

### What you need to build it

- 1× ESP32-WROOM
- 4× MAX7219 LED matrix modules (8×8, chained)
- 1× buzzer module
- 1× DHT22 temperature and humidity sensor
- M2 screws for the buzzer and the sensor
- A 10-inch rack with 1U of space — in my case, the LabRax

## Publishing on MakerWorld

The model is published on MakerWorld:
[LED Matrix Panel — MAX7219, ESP32, Buzzer, DHT22](https://makerworld.com/en/models/3186083-led-matrix-panel-max7219-esp32-buzzer-dht22).
The idea is to keep it public precisely to fill the gap I found: anyone with
the same ESP32 + MAX7219 + buzzer + temperature sensor combo won't need to
reinvent the wheel. If you print it — or remix it for another board — let me
know how it turned out.

## Next steps

With the panel printed, the next step is to integrate the buzzer and the
temperature sensor into the Smart Matrix Clock firmware, and then close the
loop on the Prometheus/Alertmanager alerts that were left pending in the
previous post.
