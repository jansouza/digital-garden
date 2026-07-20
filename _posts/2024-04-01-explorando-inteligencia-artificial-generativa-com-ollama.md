---
layout: post
title: "Explorando a Inteligência Artificial Generativa com OLLAMA"
date: 2024-04-01 10:00:00 -0300
categories: [ia]
tags: [ollama, llm, ia-generativa, docker, kubernetes, open-webui]
stage: mature
image: /assets/images/ollama/1711881847412.png
---

![Ilustração de rosto formado por caracteres, representando IA generativa](/assets/images/ollama/1711881847412.png)

## Executando modelos de LLM localmente

É possível executar modelos de LLM localmente em seu próprio computador, como
o Gemma da Google, o Llama 2 da Meta, o LLaVA para processamento de imagens,
etc.

As implicações práticas dessa capacidade são enormes, especialmente no
contexto de desenvolvimento de sistemas que interagem com inteligências
artificiais por meio de APIs.

Imagine criar uma API em seu sistema que se conecta diretamente a um modelo de
LLM hospedado localmente. Isso abriria inúmeras possibilidades, desde
assistentes virtuais personalizados até chatbots altamente especializados.

Por exemplo, em um ambiente empresarial, essa API poderia ser integrada a um
sistema de suporte ao cliente, permitindo que os clientes interajam com um
assistente virtual inteligente para obter respostas rápidas e precisas às suas
perguntas.

Além disso, ter a capacidade de executar modelos de LLM localmente também
oferece benefícios em termos de privacidade e segurança de dados. Os dados
sensíveis não precisariam ser compartilhados com servidores externos, já que
todo o processamento ocorreria dentro do ambiente controlado do próprio
computador.

## OLLAMA

O que torna possível essa execução local de modelos de LLM é o framework
**OLLAMA** (Open-source Large Language Model Accelerator), um software de
código aberto que foi desenvolvido para permitir que indivíduos e organizações
executem diversos modelos de LLM em sua própria infraestrutura,
proporcionando controle total sobre o ambiente de execução.

Com o OLLAMA, os usuários podem implantar e operar modelos de LLM em seus
próprios servidores. Isso significa que não é mais necessário depender
exclusivamente de serviços de nuvem ou provedores externos para acessar o
poder desses modelos.

É possível interagir com o OLLAMA através de sua API ou de uma interface
gráfica web (bem parecida com o já conhecido ChatGPT), chamada de
[Open-WebUI](https://github.com/open-webui/open-webui).

Nesse artigo vou disponibilizar os arquivos para implantação do OLLAMA e do
Open-WebUI, tanto para Docker como para Kubernetes.

Todos os códigos utilizados nesse artigo estão disponíveis no GitHub:
[jansouza/ollama](https://github.com/jansouza/ollama).

## Utilizando o Docker

Faça o clone do repositório:

```bash
git clone https://github.com/jansouza/ollama.git
```

Entre na pasta docker e execute o build.sh:

```bash
cd docker/
./build.sh
```

Ou execute o docker compose:

```bash
cd docker/
docker-compose build --no-cache
docker-compose up -d --force-recreate
```

## Utilizando o Kubernetes

Faça o clone do repositório:

```bash
git clone https://github.com/jansouza/ollama.git
```

Deploy dos arquivos do OLLAMA:

```bash
kubectl apply -f k8s/ollama/volume.yaml
kubectl apply -f k8s/ollama/deployment.yaml
kubectl apply -f k8s/ollama/service.yaml
```

Deploy do Open-WebUI:

```bash
kubectl apply -f k8s/open-webui/volume.yaml
kubectl apply -f k8s/open-webui/deployment.yaml
kubectl apply -f k8s/open-webui/service.yaml
```

A interface web (Open-WebUI) estará disponível no endereço:
`http://localhost:8080`

![Tela inicial do Open-WebUI](/assets/images/ollama/1711813907971.jpeg)

## Selecionando e Usando Modelos

O primeiro passo é fazer o download do modelo desejado. No exemplo utilizei o
modelo Gemma:2b. No entanto, é importante notar que também poderia ter optado
pelo Gemma:7b, que possui 7 bilhões de parâmetros. Geralmente, modelos maiores
como o Gemma:7b tendem a oferecer respostas mais precisas devido à sua
capacidade aumentada de compreensão e geração de texto.

![Download do modelo gemma:2b nas configurações do Open-WebUI](/assets/images/ollama/1711813907922.jpeg)

Ao escolher entre diferentes modelos, é importante considerar o equilíbrio
entre precisão e eficiência. Modelos maiores geralmente exigem mais recursos
computacionais e tempo de processamento para inferência, enquanto modelos
menores podem ser mais ágeis e adequados para certas aplicações em sistemas
com recursos limitados.

Com o modelo baixado, já é possível conversar com ele pela interface:

![Conversa com o modelo gemma:2b no Open-WebUI](/assets/images/ollama/1711813902640.jpeg)

## Interagindo com a API

Uma das principais vantagens do OLLAMA é sua API acessível e fácil de usar,
que permite interagir com os modelos de linguagem de grande escala (LLMs) de
forma simples e eficiente. Com a API do OLLAMA, os desenvolvedores podem
integrar facilmente a poderosa capacidade generativa dos LLMs em suas próprias
aplicações.

Interagir com a API do OLLAMA é intuitivo e direto. Os desenvolvedores podem
enviar solicitações HTTP para a API especificando o texto de entrada e
quaisquer parâmetros adicionais desejados, como o tamanho do modelo ou a
temperatura de amostragem. Em resposta, a API retorna o texto gerado pelo
modelo, permitindo que os desenvolvedores incorporem facilmente essa
funcionalidade em seus aplicativos.

Essa capacidade de interação com a API do OLLAMA abre um mundo de
possibilidades para o desenvolvimento de aplicativos baseados em IA. Desde
chatbots e assistentes virtuais até ferramentas de geração de conteúdo e
análise de texto, os desenvolvedores podem criar uma ampla gama de soluções
inovadoras e inteligentes com acesso aos LLMs do OLLAMA via API.

### Exemplos de Requisições

Exemplo básico:

```bash
curl -X POST http://localhost:11434/api/generate -d '{
  "model": "gemma:2b",
  "prompt": "Why is the sky blue?"
}'
```

Exemplo com chat:

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "mistral",
  "messages": [
    { "role": "user", "content": "why is the sky blue?" }
  ]
}'
```

## Conclusão

Em suma, a capacidade de executar modelos de LLM localmente abre novas
perspectivas emocionantes para o desenvolvimento de sistemas inteligentes e
interativos, com implicações significativas para uma ampla gama de aplicações
práticas.

---

*Publicado originalmente no
[LinkedIn](https://www.linkedin.com/pulse/explorando-intelig%C3%AAncia-artificial-generativa-com-ollama-jan-souza-5aijf/)
em 1º de abril de 2024.*
