# Post LinkedIn: Saindo do Speedtest da Ookla (librespeed-exporter)

**Referente ao post:** [Saindo do Speedtest da Ookla: um exporter de Prometheus para o LibreSpeed](/_posts/2026-11-03-librespeed-exporter-saindo-do-speedtest-da-ookla.md)

> Texto abaixo em **texto puro**: o LinkedIn não renderiza markdown, então nada de `**negrito**`. Copiar e colar direto.

---

## Corpo do post

Quem trabalha de home office sabe que não dá para confiar numa internet só. Aqui em casa tenho duas e acompanho a velocidade das duas no Grafana.

No fim de outubro esse monitoramento parou: a CLI do Speedtest da Ookla começou a responder "Limit reached: Too many requests received".

Não achei comunicado da Ookla, mas na mesma semana apareceram relatos iguais no Speedtest Tracker e numa integração do Home Assistant. Dava para espaçar os testes e seguir em frente, só que o monitoramento continuaria dependendo de um binário fechado e de regras que mudam sem aviso.

Troquei pelo LibreSpeed, um teste de velocidade open source que qualquer um pode hospedar. Algumas operadoras mantêm servidores públicos. O link da Claro eu meço contra o servidor da Vivo, e o da Vivo contra o servidor público de uma operadora local. Medir cada link no servidor da própria operadora mascararia o resultado, porque o tráfego nem sairia da rede dela. Faltava a parte do Prometheus, então escrevi o librespeed-exporter, em Go.

No exporter antigo, o teste rodava quando o Prometheus fazia scrape, e um cache mal configurado virava teste a mais contando contra o limite. No novo, o teste roda num intervalo fixo, por padrão a cada 30 minutos, e o scrape só lê o último resultado. Entre um teste e outro, dá para ligar uma sondagem de uma requisição por segundo, que pega as quedas curtas que um teste a cada meia hora não vê.

No roteador, faço o teste de cada link sair pela sua operadora. O que ainda não resolvi é o servidor do link da Vivo: existem poucos servidores públicos de LibreSpeed, e o da operadora local não acompanha a velocidade contratada. Ainda não achei outro que seja bom, perto e com ping baixo, então por enquanto essa medição fica abaixo do contratado.

Teste de velocidade também tem custo. Num link de 500 Mbps, cada teste baixa e sobe uns 940 MB. A cada 30 minutos, isso dá uns 90 GB por dia por servidor, e o exporter tem uma métrica só para mostrar quanto ele mesmo já consumiu.

Escrevi os detalhes no garden, e o código está no GitHub, sob Apache 2.0. Links no primeiro comentário.

#Observabilidade #Prometheus #Homelab

---

## Primeiro comentário (postar logo em seguida)

Post completo, com as decisões de projeto e os prints do dashboard:
https://garden.jansouza.com/homelab/2026/11/03/librespeed-exporter-saindo-do-speedtest-da-ookla.html

Código:
https://github.com/jansouza/librespeed-exporter

---

**TODO antes de publicar:**
- [ ] Anexar o print do dashboard (assets/images/librespeed-exporter/dashboard.png, com os dois links e o IP público borrado)
- [ ] Conferir se a URL do post bate com o permalink gerado (data/categoria)
- [ ] Postar o primeiro comentário com os links logo após publicar
