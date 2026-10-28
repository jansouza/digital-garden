# Post LinkedIn: Smart Matrix Clock (IBM Bob)

**Referente ao post:** [Como utilizei o IBM Bob para criar um firmware Arduino/ESP32](/_posts/2026-08-03-como-utilizei-o-ibm-bob-para-criar-um-firmware-arduino-esp32.md)

> Texto abaixo em **texto puro** — o LinkedIn não renderiza markdown, então nada de `**negrito**`. Copiar e colar direto.

---

## Corpo do post

Dessa vez o hardware foi só a desculpa.

Tinha um ESP32 e uma matriz de LED MAX7219 na mesa, mas o que eu queria mesmo era testar até onde dá pra ir escrevendo um firmware inteiro com o IBM Bob, o assistente de desenvolvimento com IA da IBM.

(No meu último post sobre o homelab, alguém comentou que isso é um caminho sem volta. E realmente é. 🙂)

Comecei descrevendo o que eu tinha na mesa e o que eu queria — relógio via NTP, clima, cotações, mensagens, tudo configurável por uma página web servida pelo próprio chip. Também deixei claro o que eu NÃO queria: nada de código travando o display enquanto espera uma resposta HTTP.

O que me chamou atenção no processo:

🔹 Em vez de despejar tudo de uma vez, o Bob propôs dividir o trabalho em 5 fases, cada uma terminando com algo que eu pudesse gravar no ESP32 e ver funcionando de verdade antes de seguir. Foi esse ritmo que fez o projeto andar.

🔹 O Bob também escreveu 251 testes que rodam no meu computador, sem precisar do ESP32 nem de toolchain de embarcado. Cada mudança virava validação em segundos, antes de gastar tempo gravando a flash.

🔹 Documentação, plano de implementação e referência da API nasceram junto com o código, sem esforço extra da minha parte. Na prática, foi o que me deixou voltar ao projeto depois de duas semanas sem me perder.

🔹 Nem tudo deu certo de primeira — pedi para proteger a API com uma chave, o Bob implementou certinho, e o resultado foi a interface web perder acesso às ações que ela mesma precisava fazer. Reverti e anotei como pendência. Faz parte do processo.

Alguém mais por aqui está usando IA para firmware ou embarcado? Curioso pra saber o que funcionou — e principalmente o que não funcionou.

Links no primeiro comentário. 👇

#homelab #esp32 #firmware #inteligenciaartificial #ibmbob

---

## Primeiro comentário (postar logo em seguida)

Como utilizei o IBM Bob para criar um firmware Arduino/ESP32:
https://garden.jansouza.com/homelab/2026/08/03/como-utilizei-o-ibm-bob-para-criar-um-firmware-arduino-esp32.html

Código completo no GitHub:
https://github.com/jansouza/ibm-bob-matrix-clock

---

**TODO antes de publicar:**
- [ ] Anexar o vídeo ou uma imagem do painel (post com mídia tem mais alcance)
- [ ] Postar o primeiro comentário com os links logo após publicar
- [ ] Conferir se o link do post anterior sobre homelab vale a pena citar no comentário também
- [ ] Revisar tom/tamanho
