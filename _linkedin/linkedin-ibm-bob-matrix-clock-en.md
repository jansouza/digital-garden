# LinkedIn Post: Smart Matrix Clock (IBM Bob) — English version

**Related post:** [Como utilizei o IBM Bob para criar um firmware Arduino/ESP32](/_posts/2026-08-03-como-utilizei-o-ibm-bob-para-criar-um-firmware-arduino-esp32.md)

> Plain text below — LinkedIn doesn't render markdown, so no `**bold**`. Copy and paste directly.

---

## Post body

This time the hardware was just an excuse. What I really wanted to test was how far IBM Bob, IBM's AI development assistant, could take an entire firmware project.

The video above shows the result: an ESP32 + MAX7219 LED matrix clock with weather, stock quotes and messages, all configurable from a web page served by the chip itself. Here's how Bob actually built it:

🔹 I described what was on my desk and what I wanted — and just as important, what I didn't want: no delay() freezing the display while waiting on an HTTP response. Bob respected that from the first line of code.

🔹 Instead of one big drop, Bob broke the firmware into 5 phases — clock, WiFi portal, web UI, weather, quotes — each ending in something I could flash and see working before moving to the next. That's what kept a hardware project moving at software speed.

🔹 It wrote 251 tests that run on my own machine, no ESP32 or embedded toolchain needed. Every change Bob made, I could validate in seconds before ever touching the flash button.

🔹 Docs, implementation plan and API reference came out alongside the code, with zero extra effort from me — genuinely what let me pick the project back up two weeks later without getting lost.

🔹 It also got things wrong: I asked Bob to lock the API behind a key, and the fix broke the web UI's own access to the actions it needed. Reverted, logged, moved on — the loop matters more than any single miss.

Anyone else using AI to drive firmware or embedded work? Curious what's worked for you — and what hasn't.

Full writeup and links in the first comment. 👇

#homelab #esp32 #firmware #artificialintelligence #ibmbob

---

## First comment (post right after)

How I used IBM Bob to build an Arduino/ESP32 firmware (in Portuguese):
https://garden.jansouza.com/homelab/2026/08/03/como-utilizei-o-ibm-bob-para-criar-um-firmware-arduino-esp32.html

Full source on GitHub:
https://github.com/jansouza/ibm-bob-matrix-clock

---

**TODO before publishing:**
- [ ] Attach the video
- [ ] Post the first comment with the links right after publishing
- [ ] Check whether the previous homelab post is worth linking in the comment too
- [ ] Decide how to handle the Portuguese-only blog link (translate the post, or keep the "in Portuguese" note)
- [ ] Review tone/length
