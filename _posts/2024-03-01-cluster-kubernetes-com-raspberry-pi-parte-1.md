---
layout: post
title: "Impulsionando a Automação Residencial: Criando um Cluster Kubernetes com Raspberry Pi — Parte 1"
date: 2024-03-01 10:00:00 -0300
categories: [homelab]
tags: [raspberry-pi, kubernetes, k3s, home-assistant, automacao-residencial, homelab]
stage: growing
image: /assets/images/k8s-raspberry/1709237025850.jpeg
---

## Introdução

Dedico um tempo considerável à automação residencial, com foco em
dispositivos Zigbee e tecnologia Wi-Fi Tuya. Minha rede Zigbee possui cerca de
30 componentes, incluindo sensores de presença, tomadas inteligentes e
câmeras.

![Mapa da rede Zigbee com os dispositivos conectados](/assets/images/k8s-raspberry/1709237186783.jpeg)

Para gerenciar esses dispositivos, adotei o **Home Assistant** como hub
central. Entre as integrações que utilizo estão:

- Componentes Wi-Fi Tuya
- Integração com roteador UniFi (Ubiquiti) para detecção de presença via Wi-Fi
- Broadlink para automação de equipamentos infravermelhos (ar-condicionado, TVs)

![Integrações configuradas no Home Assistant](/assets/images/k8s-raspberry/1709237360144.jpeg)

O **Node-RED** funciona como espinha dorsal para as automações
personalizadas.

![Fluxos de automação no Node-RED](/assets/images/k8s-raspberry/1709237468361.jpeg)

A infraestrutura também inclui monitoramento com Prometheus,
Alertmanager e Grafana para garantir a estabilidade e a eficiência das
conexões.

![Dashboard de monitoramento no Grafana](/assets/images/k8s-raspberry/1709237122557.jpeg)

## Infraestrutura Atual

Até então, utilizava um laptop antigo com Docker hospedando duas stacks:

**Stack de Automação:**

- Frigate
- Home Assistant
- Mosquitto
- Node-RED
- Zigbee2mqtt

**Stack de Monitoramento:**

- Alert Manager
- Blackbox Exporter
- Grafana
- InfluxDB
- Prometheus
- Speedtest-Claro
- Speedtest-Vivo
- Telegraf

O Portainer gerencia os contêineres Docker de forma eficiente.

![Dashboard do Portainer com as stacks e contêineres](/assets/images/k8s-raspberry/1709237121833.jpeg)

## Início da Jornada

Decidi evoluir para um cluster Kubernetes baseado em Raspberry Pi para
alcançar maior escalabilidade, redundância e uma operação mais confiável. A
solução é energeticamente eficiente e, de quebra, amplia meus conhecimentos em
Kubernetes.

## O Hardware

Componentes adquiridos:

- 3x Raspberry Pi 5 8GB
- 3x Cases para Raspberry Pi 5
- 3x SanDisk Extreme PLUS de 64 GB
- 3x Fonte de 27W
- 1x [Google Coral](https://coral.ai/)
- 2x Hard Disk SSD de 200 GB

![Hardware do cluster: Raspberry Pi 5, cases com cooler, cartões SanDisk e Google Coral](/assets/images/k8s-raspberry/1709237798499.jpeg)

## Instalação — Raspberry Pi

Utilizei o [Raspberry Pi Imager](https://www.raspberrypi.com/software/) para
instalar o **Raspberry Pi OS Lite (64-bit)**.

![Raspberry Pi Imager com o Raspberry Pi OS Lite 64-bit selecionado](/assets/images/k8s-raspberry/1709237899681.jpeg)

Customizações realizadas:

- Usuário: `node`
- Hostnames: `k3s-node-1`, `k3s-node-2`, `k3s-node-3`

![Customização do hostname e usuário no Raspberry Pi Imager](/assets/images/k8s-raspberry/1709237122697.jpeg)

- Chave SSH adicionada para acesso remoto seguro

![Habilitando SSH com autenticação por chave pública](/assets/images/k8s-raspberry/1709237121957.jpeg)

## Instalação — K3s

Escolhi o [K3s](https://k3s.io/) por ser uma distribuição Kubernetes leve e
otimizada para arquitetura ARM.

**Configuração de rede:** configurei o servidor DHCP para atribuir IPs fixos
aos três Raspberry Pi.

![Reserva de IPs fixos no DHCP para os três nodes](/assets/images/k8s-raspberry/1709237121743.jpeg)

### Passos de Instalação

**1. Conexão SSH com o primeiro node (master):**

```bash
ssh node@10.0.0.80
```

**2. Editar o arquivo `/boot/firmware/cmdline.txt`** para habilitar os
cgroups de memória:

```bash
sudo vi /boot/firmware/cmdline.txt

cat /boot/firmware/cmdline.txt
console=serial0,115200 console=tty1 root=PARTUUID=094c4fe6-02 rootfstype=ext4 fsck.repair=yes rootwait cgroup_memory=1 cgroup_enable=memory
```

**3. Instalação do k3s server:**

```bash
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--write-kubeconfig-mode 644 --disable=traefik --flannel-backend=host-gw --tls-san=10.0.0.80 --bind-address=10.0.0.80 --advertise-address=10.0.0.80 --node-ip=10.0.0.80 --cluster-init" sh -s -
```

Explicação das opções utilizadas:

- `--write-kubeconfig-mode 644` — modo de permissão do arquivo kubeconfig
- `--disable=traefik` — desabilita o ingress Traefik padrão
- `--flannel-backend=host-gw` — backend do Flannel com roteamento de alto desempenho
- `--tls-san=10.0.0.80` — SAN adicional para o certificado TLS
- `--bind-address=10.0.0.80` — endereço IP da API
- `--advertise-address=10.0.0.80` — IP anunciado para os outros nós
- `--node-ip=10.0.0.80` — IP para os serviços Kubernetes
- `--cluster-init` — inicializa um novo cluster Kubernetes

**4. Obter o token do master node:**

```bash
sudo cat /var/lib/rancher/k3s/server/node-token
```

O resultado será algo similar a:

```
THIS19937008cbde678aeaf200517f07c0ccd67dc80bdf4df6f746IS4780e15ebcd::server:40fc2cc2fnode81cdacc0b9bb1231token
```

**5. Instalação do k3s agent nos outros nodes:**

```bash
curl -sfL https://get.k3s.io | K3S_URL=https://10.0.0.80:6443 \
K3S_TOKEN="THIS19937008cbde678aeaf200517f07c0ccd67dc80bdf4df6f746IS4780e15ebcd::server:40fc2cc2fnode81cdacc0b9bb1231token" sh -
```

**6. Etiquetar os worker nodes:**

```bash
kubectl label nodes k3s-node-2 node-role.kubernetes.io/worker=worker
kubectl label nodes k3s-node-3 node-role.kubernetes.io/worker=worker
```

Com tudo pronto, os três nodes aparecem com status `Ready`:

![Saída do kubectl get nodes com os três nodes Ready](/assets/images/k8s-raspberry/1709237121888.jpeg)

## Conclusão

O cluster Kubernetes está instalado e operacional. Nos próximos artigos, vou
demonstrar a criação da monitoração do cluster e o deploy dos componentes para
o Home Assistant.

---

*Publicado originalmente no
[LinkedIn](https://www.linkedin.com/pulse/impulsionando-automa%C3%A7%C3%A3o-residencial-criando-um-cluster-jan-souza-yatjf/)
em 1º de março de 2024.*
