---
layout: post
title: "Boosting home automation: building a Kubernetes cluster with Raspberry Pi — Part 1"
date: 2024-03-01 10:00:00 -0300
categories: [homelab]
tags: [raspberry-pi, kubernetes, k3s, home-assistant, automacao-residencial, homelab]
stage: mature
last_modified_at: 2026-10-28
description: "Part 1 of a K3s cluster with three Raspberry Pi 5 boards for home automation with Home Assistant and Node-RED: hardware and step-by-step installation."
image: /assets/images/k8s-raspberry/1709237025850.jpeg
translation_key: cluster-kubernetes-com-raspberry-pi-parte-1
---

## Introduction

I spend a considerable amount of time on home automation, focusing on
Zigbee devices and Tuya Wi-Fi technology. My Zigbee network has about 30
components, including presence sensors, smart plugs and cameras.

![Map of the Zigbee network with the connected devices](/assets/images/k8s-raspberry/1709237186783.jpeg)

To manage these devices, I adopted **Home Assistant** as the central hub.
Among the integrations I use are:

- Tuya Wi-Fi components
- Integration with a UniFi (Ubiquiti) router for presence detection via Wi-Fi
- Broadlink for automating infrared equipment (air conditioners, TVs)

![Integrations configured in Home Assistant](/assets/images/k8s-raspberry/1709237360144.jpeg)

**Node-RED** works as the backbone for the custom automations.

![Automation flows in Node-RED](/assets/images/k8s-raspberry/1709237468361.jpeg)

The infrastructure also includes monitoring with Prometheus, Alertmanager
and Grafana to keep the connections stable and efficient.

![Monitoring dashboard in Grafana](/assets/images/k8s-raspberry/1709237122557.jpeg)

## Current infrastructure

Until now, I used an old laptop running Docker to host two stacks:

**Automation stack:**

- Frigate
- Home Assistant
- Mosquitto
- Node-RED
- Zigbee2mqtt

**Monitoring stack:**

- Alert Manager
- Blackbox Exporter
- Grafana
- InfluxDB
- Prometheus
- Speedtest-Claro
- Speedtest-Vivo
- Telegraf

Portainer manages the Docker containers efficiently.

![Portainer dashboard with the stacks and containers](/assets/images/k8s-raspberry/1709237121833.jpeg)

## Starting the journey

I decided to move to a Kubernetes cluster based on Raspberry Pi to get more
scalability, redundancy and a more reliable operation. The solution is
energy efficient and, as a bonus, expands my Kubernetes knowledge.

## The hardware

Components I bought:

- 3x Raspberry Pi 5 8GB
- 3x Cases for Raspberry Pi 5
- 3x SanDisk Extreme PLUS 64 GB
- 3x 27W power supply
- 1x [Google Coral](https://coral.ai/)
- 2x 200 GB SSD drives

![Cluster hardware: Raspberry Pi 5 boards, cases with cooler, SanDisk cards and Google Coral](/assets/images/k8s-raspberry/1709237798499.jpeg)

## Installation — Raspberry Pi

I used the [Raspberry Pi Imager](https://www.raspberrypi.com/software/) to
install **Raspberry Pi OS Lite (64-bit)**.

![Raspberry Pi Imager with Raspberry Pi OS Lite 64-bit selected](/assets/images/k8s-raspberry/1709237899681.jpeg)

Customizations:

- User: `node`
- Hostnames: `k3s-node-1`, `k3s-node-2`, `k3s-node-3`

![Customizing the hostname and user in Raspberry Pi Imager](/assets/images/k8s-raspberry/1709237122697.jpeg)

- SSH key added for secure remote access

![Enabling SSH with public key authentication](/assets/images/k8s-raspberry/1709237121957.jpeg)

## Installation — K3s

I chose [K3s](https://k3s.io/) because it's a lightweight Kubernetes
distribution optimized for the ARM architecture.

**Network setup:** I configured the DHCP server to assign fixed IPs to the
three Raspberry Pi boards.

![Fixed IP reservations in DHCP for the three nodes](/assets/images/k8s-raspberry/1709237121743.jpeg)

### Installation steps

**1. SSH into the first node (master):**

```bash
ssh node@10.0.0.80
```

**2. Edit the `/boot/firmware/cmdline.txt` file** to enable the memory
cgroups:

```bash
sudo vi /boot/firmware/cmdline.txt

cat /boot/firmware/cmdline.txt
console=serial0,115200 console=tty1 root=PARTUUID=094c4fe6-02 rootfstype=ext4 fsck.repair=yes rootwait cgroup_memory=1 cgroup_enable=memory
```

**3. Install the k3s server:**

```bash
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--write-kubeconfig-mode 644 --disable=traefik --flannel-backend=host-gw --tls-san=10.0.0.80 --bind-address=10.0.0.80 --advertise-address=10.0.0.80 --node-ip=10.0.0.80 --cluster-init" sh -s -
```

What each option does:

- `--write-kubeconfig-mode 644` — permission mode of the kubeconfig file
- `--disable=traefik` — disables the default Traefik ingress
- `--flannel-backend=host-gw` — Flannel backend with high-performance routing
- `--tls-san=10.0.0.80` — additional SAN for the TLS certificate
- `--bind-address=10.0.0.80` — IP address of the API
- `--advertise-address=10.0.0.80` — IP advertised to the other nodes
- `--node-ip=10.0.0.80` — IP for the Kubernetes services
- `--cluster-init` — initializes a new Kubernetes cluster

**4. Get the token from the master node:**

```bash
sudo cat /var/lib/rancher/k3s/server/node-token
```

The result will look like this:

```
THIS19937008cbde678aeaf200517f07c0ccd67dc80bdf4df6f746IS4780e15ebcd::server:40fc2cc2fnode81cdacc0b9bb1231token
```

**5. Install the k3s agent on the other nodes:**

```bash
curl -sfL https://get.k3s.io | K3S_URL=https://10.0.0.80:6443 \
K3S_TOKEN="THIS19937008cbde678aeaf200517f07c0ccd67dc80bdf4df6f746IS4780e15ebcd::server:40fc2cc2fnode81cdacc0b9bb1231token" sh -
```

**6. Label the worker nodes:**

```bash
kubectl label nodes k3s-node-2 node-role.kubernetes.io/worker=worker
kubectl label nodes k3s-node-3 node-role.kubernetes.io/worker=worker
```

With everything in place, the three nodes show up with status `Ready`:

![Output of kubectl get nodes with the three nodes Ready](/assets/images/k8s-raspberry/1709237121888.jpeg)

## Conclusion

The Kubernetes cluster is installed and running. In the next articles, I'll
show how to set up the cluster monitoring and deploy the components for
Home Assistant.

> **Update (October 2026):** the next parts never came out. The cluster has
> changed since then: it got Beelink mini PCs and moved to a 3D printed rack,
> as I described in
> [Homelab: leveling up with LabRax]({% post_url en/2026-07-12-homelab-labrax-3d-printed-rack %}).

---

*Originally published in Portuguese on
[LinkedIn](https://www.linkedin.com/pulse/impulsionando-automa%C3%A7%C3%A3o-residencial-criando-um-cluster-jan-souza-yatjf/)
on March 1, 2024.*
