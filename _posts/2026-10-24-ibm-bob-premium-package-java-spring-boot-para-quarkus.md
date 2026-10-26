---
layout: post
title: "IBM Bob Premium Package for Java: migrando um projeto Spring Boot para Quarkus"
date: 2026-10-24 10:00:00 -0300
categories: [devops]
tags: [ibm, ibm-bob, java, spring-boot, quarkus, modernizacao, ia, devops]
stage: seed
image: /assets/images/ibm-bob-premium-package-java-quarkus/ibm-bob-premium-package-java-welcome.png
description: "Usei o IBM Bob Premium Package for Java para migrar uma API Spring Boot para Quarkus: como foi o processo, o que mudou no caminho, o resultado do benchmark e o que ainda ficou pendente."
---

![Tela de boas-vindas do IBM Bob Premium Package for Java no IDE, com os workflows e a skill Migrate Spring Boot to Quarkus](/assets/images/ibm-bob-premium-package-java-quarkus/ibm-bob-premium-package-java-welcome.png)

Este é o terceiro post da série em que uso o IBM Bob em projetos reais. No
primeiro, [criei um projeto Ansible do zero]({% post_url 2026-07-06-criando-um-projeto-ansible-do-zero-com-ibm-bob %});
no segundo, [escrevi o firmware de um relógio de LED com ESP32]({% post_url 2026-08-03-como-utilizei-o-ibm-bob-para-criar-um-firmware-arduino-esp32 %}).
Os dois eram projetos novos. Este é uma migração: uma aplicação Spring Boot
que já existe, levada para Quarkus.

O post tem duas partes. Primeiro, o que é o **Premium Package for Java** e o
que vem nele. Depois, o caso prático: a migração do
[spring-petclinic-rest](https://github.com/spring-petclinic/spring-petclinic-rest)
de Spring Boot para Quarkus, com o que deu certo, o que não deu e um
benchmark comparando as duas versões.

## O que é o IBM Bob Premium Package for Java

O Premium Package for Java Modernization é um add-on pago do IBM Bob, voltado
para atualizar, migrar e modernizar aplicações Java corporativas. A IBM
[anunciou o pacote em julho de 2026](https://www.ibm.com/new/announcements/announcing-ibm-bob-premium-package-for-java-modernization).
Na prática, são fluxos de trabalho que aparecem dentro do próprio Bob,
divididos em etapas, com validações e pontos em que ele para e pede a sua
aprovação.

### O que vem no pacote

Ao instalar, o Bob abre a tela de boas-vindas da imagem acima, com estas
opções:

- *Analyze and suggest modernization*: analisa o projeto e sugere o que
  atualizar e melhorar;
- *Java Upgrade*: leva o projeto do Java 8 ou 11 para o 17, 21 ou 25;
- *Liberty Modernization*: migra aplicações do WebSphere tradicional para o
  Liberty;
- *UI Modernization*: troca frameworks de interface antigos, componente por
  componente;
- *Unit Test Generation*: gera testes unitários e mede a cobertura;
- *Java Vulnerability Remediation*: encontra e corrige vulnerabilidades;
- *Migrate Spring Boot to Quarkus*: a que usei neste post. A
  [documentação](https://bob.ibm.com/docs/ide/premium-packages/java-modernization/java-modernization-index)
  descreve a skill como uma migração em fases, em que o projeto precisa
  compilar ao fim de cada uma antes de seguir.

### Como habilitar

Pelos [pré-requisitos](https://bob.ibm.com/docs/ide/premium-packages/java-modernization/prerequisites)
da IBM, você precisa do IBM Bob 2.0.0 ou mais recente e de uma licença do
pacote. Ele é vendido como complemento de um plano do Bob (Pro, Pro+ ou Ultra
no individual; no enterprise, é liberado pelo administrador), e
[planos de trial não aceitam add-ons](https://bob.ibm.com/blog/pp_for_java_announcement).
O projeto precisa usar Maven ou Gradle e estar num repositório Git sem
alterações pendentes; a própria documentação sugere criar uma branch antes de
começar.

Com a licença ativa, o Bob detecta o pacote ao iniciar e oferece a instalação.
Cada opção é disparada por um botão na tela de boas-vindas.

## O projeto de partida

O [spring-petclinic-rest](https://github.com/spring-petclinic/spring-petclinic-rest)
é a versão em API REST do clássico PetClinic da comunidade Spring: o sistema
de uma clínica veterinária, com donos, pets, visitas, veterinários e
especialidades. Usei um [fork](https://github.com/jansouza/spring-petclinic-rest)
atualizado com a versão original, em Spring Boot 4.1.1.

Para um teste de migração, é um bom tamanho: pequeno o bastante para revisar
tudo e com algumas partes que costumam complicar uma migração. Ele tem três
implementações diferentes de acesso ao banco, escolhidas por configuração;
suporta quatro bancos de dados (H2, HSQLDB, MySQL e PostgreSQL); tem controle
de acesso que pode ser ligado ou desligado; e uma regra de qualidade que
derruba o build se os testes cobrirem menos de 85% do código.

## Por que Quarkus

O Quarkus faz durante o build boa parte do trabalho que o Spring faz quando a
aplicação está subindo. O resultado é uma aplicação que sobe mais rápido e usa
menos memória, e que ainda pode ser compilada como executável nativo. Isso
pesa em Kubernetes, onde contêineres sobem e descem o tempo todo, e num
homelab, onde a memória das máquinas é curta.

O uso do Quarkus vem crescendo. Em novembro de 2024, a Red Hat, que mantém o
projeto,
[informou](https://developers.redhat.com/articles/2024/11/29/quarkus-has-surpassed-1000-contributor-milestone)
mais de um milhão de downloads por mês, número que vinha dobrando a cada ano,
e mais de mil contribuidores, mais ou menos o mesmo que o Spring Boot.

Na [análise de uso](https://quarkus.io/blog/quarkus-insights-253-build-analytics/)
que o projeto apresentou em junho de 2026, comparando maio de 2025 com maio de
2026, os usuários ativos por mês subiram 16% e o total de builds, 26%. O número
de usuários novos ficou estável, então o crescimento veio de quem já usava
Quarkus e passou a usar mais. (Esses dados vêm só de quem aceita enviar
telemetria, por isso o projeto não divulga os números absolutos.)

Do lado das empresas, um [estudo da IDC](https://quarkus.io/blog/idc-customer-case-studies/)
com três clientes que não são identificados (uma operadora de telecom, uma
empresa de transporte e um banco europeu) relata custo de processamento até
10 vezes menor na operadora e subida 85% mais rápida no banco, que passou a
hospedar 30% mais aplicações na mesma infraestrutura.

A desvantagem é que tudo o que o Spring decide com a aplicação rodando (qual
banco usar, qual implementação carregar, se o controle de acesso está ligado)
precisa estar decidido no build. Isso apareceu várias vezes na migração.

## Migrando com o Bob

### Análise e escolha da estratégia

Criei a branch `migration/run-01` e rodei a migração. Antes de mexer no
código, o Bob gera uma
[análise do projeto](https://github.com/jansouza/spring-petclinic-rest/blob/migration/run-01/docs/quarkus-migration-analysis.md)
com as versões, as dependências e o nível de dificuldade de cada área. A
camada de API, o acesso ao banco e a segurança saíram como as mais difíceis,
e foram mesmo as que deram trabalho.

O vídeo abaixo mostra esse começo: a skill rodando no IDE, a análise sendo
gerada e o Bob pedindo a escolha da estratégia.

<video controls width="100%" preload="metadata">
  <source src="/assets/videos/ibm-bob-premium-package-java-quarkus/ibm-bob-java-migration.mp4" type="video/mp4">
  Seu navegador não suporta a tag de vídeo.
</video>

A análise termina com duas estratégias e para, esperando uma decisão:

1. **Compatibilidade com o Spring** (a recomendada): o Quarkus tem extensões
   que entendem parte do código escrito para o Spring, então dá para manter
   boa parte do código como está.
2. **Quarkus completo**: reescrever as partes do Spring com as ferramentas
   próprias do Quarkus, com bem mais mudanças.

Fiquei com a recomendada. A partir daí, o Bob seguiu as fases da migração
(Java, build, código, interface, testes e limpeza), validando cada uma antes
de passar à próxima. A fase de interface foi pulada, porque o projeto é só
API.

Durante a execução, o Bob manteve um
[registro de decisões](https://github.com/jansouza/spring-petclinic-rest/blob/migration/run-01/docs/quarkus-migration-decisions.md)
com 18 entradas, cada uma com o motivo e o custo da escolha. Foi o documento
que mais usei para entender o resultado. No fim, a migração mexeu em 71
arquivos e deixou seis documentos na pasta
[`docs/`](https://github.com/jansouza/spring-petclinic-rest/tree/migration/run-01/docs).

### O que sobrou da compatibilidade com o Spring

O plano era manter o código do Spring rodando sobre as extensões de
compatibilidade. Em três partes do projeto isso não funcionou, e o Bob mudou
de caminho, registrando o motivo:

- **API:** as rotas do PetClinic são geradas a partir de um contrato OpenAPI,
  num formato que a extensão de compatibilidade não reconhece. Em vez de
  copiar as rotas à mão para oito classes, o Bob passou a gerar o código da
  API no formato do Quarkus.
- **Acesso ao banco:** a extensão não aceitou o jeito como o projeto organiza
  seus repositórios. O registro diz que "todas as variantes tentadas
  falharam". A saída foi usar uma das outras implementações que o projeto já
  tinha, que passa nos mesmos testes.
- **Segurança:** as regras de permissão usam um recurso do Spring que a
  extensão não suporta. Elas viraram comentários marcados como pendentes.

Do Spring ficou só a camada de regras de negócio. Na prática, a estratégia de
"compatibilidade" terminou num híbrido bem mais perto do Quarkus completo.

### Configuração

Além de traduzir a configuração do Spring para a do Quarkus, o Bob se lembrou
de um detalhe que eu esperaria ver quebrando em produção: os dois frameworks
dão nomes diferentes às colunas do banco por padrão, e ele ajustou o Quarkus
para usar os mesmos nomes do Spring. Um trecho do `application.properties`
migrado:

```properties
quarkus.http.port=9966
quarkus.http.host=${PETCLINIC_HTTP_HOST:127.0.0.1}
quarkus.http.root-path=/petclinic/

# Spring Boot usava snake_case nas colunas; o Hibernate no Quarkus mantém o nome Java
quarkus.hibernate-orm.physical-naming-strategy=org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy

quarkus.http.cors.enabled=true
quarkus.http.cors.origins=${PETCLINIC_CORS_ORIGINS:http://localhost:4200}
```

Duas mudanças alteram o comportamento da aplicação. O original aceitava
chamadas de qualquer site e escutava em todas as interfaces de rede. Citando
as regras de segurança do projeto, o Bob limitou os sites que podem chamar a
API (`cors.origins`) e fez a aplicação aceitar só conexões da própria máquina
(`http.host`), a menos que uma variável de ambiente diga outra coisa. As duas
mudanças fazem sentido, mas quem roda em contêiner precisa definir
`PETCLINIC_HTTP_HOST`, senão a aplicação fica inacessível.

E a troca de banco ficou mais rígida. No Spring, bastava escolher o banco ao
subir a aplicação. No Quarkus, essa escolha é feita no build: para usar MySQL
ou PostgreSQL, é preciso gerar o pacote já com o banco certo. E o HSQLDB
ficou de fora, porque o Quarkus não tem extensão para esse banco.

### Testes

Esta foi a parte em que o Bob mais trabalhou: reescreveu os testes da API e
das regras de negócio para o formato do Quarkus. O
[relatório de cobertura](https://github.com/jansouza/spring-petclinic-rest/blob/migration/run-01/docs/test-coverage.md)
compara as duas versões:

| Métrica                 | Spring Boot | Quarkus, 1ª tentativa | Quarkus, final |
|-------------------------|-------------|-----------------------|----------------|
| Testes executados       | 237         | 126                   | 127            |
| Testes com falha        | 0           | 0                     | 0              |
| Cobertura do código     | 85,5%       | 10%                   | 88,8%          |
| Build passou na regra   | sim         | não                   | sim            |

Dos 237 testes originais, 111 deixaram de rodar porque testavam as
implementações de acesso ao banco que ficaram de fora. Os testes da
implementação que ficou continuam todos lá, e o 127º é um teste novo, que
explico abaixo.

A primeira tentativa passou em todos os testes, mas o build falhou porque a
ferramenta de cobertura mediu só 10%. O problema era de medição: o Quarkus
carrega a aplicação de um jeito que a ferramenta não enxergava. O Bob
corrigiu a configuração, chegou a 84,9% e ainda ficou abaixo dos 85%. Para
fechar a conta, escreveu um teste simples sobre código gerado
automaticamente. O próprio relatório chama esse teste de "paliativo" e de
"valor limitado", e explica que preferiu isso a baixar o mínimo, porque
baixar seria enfraquecer em silêncio uma regra que já existia.

## A API continua igual?

O Bob também
[comparou o contrato da API](https://github.com/jansouza/spring-petclinic-rest/blob/migration/run-01/docs/api-contract-comparison.md):
um script chamou cada operação na aplicação migrada, com dados válidos,
inválidos e registros inexistentes. Das 37 operações, 36 respondem do mesmo
jeito que antes. A que falta também não funcionava no projeto original.

As diferenças que ele encontrou são pequenas:

- a documentação da API gerada automaticamente (o Swagger) ficou mais pobre,
  o que afeta quem gera código de cliente a partir dela, mas não quem chama a
  API;
- a mensagem de erro de validação mudou um campo de texto, mantendo o mesmo
  código de erro e o mesmo formato;
- o endereço raiz da aplicação, que antes levava para a documentação, agora
  devolve "não encontrado".

O relatório também diz o que não fez: a versão Spring não foi executada nessa
comparação, então o "antes" saiu do contrato e dos testes originais, não de
uma medição.

## Spring Boot x Quarkus: o benchmark

Para ter números meus, montei uns scripts que baixam as duas versões, fazem
o build, sobem cada aplicação e medem o tempo de subida, o uso de memória e o
tempo de resposta de sete endpoints, com 50 chamadas em cada um. As duas
rodaram na mesma máquina, uma depois da outra, com as configurações padrão. O
Quarkus rodou da forma comum, sem a compilação nativa.

| Métrica                         | Spring Boot 4.1.1 | Quarkus 3.40.1 | Diferença |
|---------------------------------|-------------------|----------------|-----------|
| Tempo até ficar pronto          | 9,74 s            | 3,59 s         | −63%      |
| Memória usada pelo processo     | 435,8 MB          | 260,7 MB       | −40%      |
| Tempo de resposta típico        | 5,80 ms           | 5,57 ms        | −4%       |
| 95% das respostas abaixo de     | 13,69 ms          | 10,87 ms       | −21%      |

Subida e memória são onde a diferença aparece: a aplicação fica pronta em
pouco mais de um terço do tempo e usa 175 MB a menos de memória, o que conta
num cluster pequeno como o do homelab.

No tempo de resposta, as duas versões ficam praticamente empatadas. Olhar
endpoint por endpoint confunde mais do que ajuda com uma amostra pequena: em
um deles, a média do Quarkus saiu 49% pior por causa de uma única chamada
lenta, que costuma acontecer nas primeiras requisições depois que a
aplicação sobe. Sem essa chamada, o Quarkus foi mais rápido também ali.

O teste tem limites: foi uma execução só, com uma chamada por vez. Serve para
comparar subida e memória; não diz como as duas versões se comportam com
muitos usuários ao mesmo tempo.

## O que ficou pendente

O Bob deixou um
[inventário de pendências](https://github.com/jansouza/spring-petclinic-rest/blob/migration/run-01/docs/todo-inventory.md)
com 57 comentários no código e 30 arquivos que ficaram fora do build. Os que
importam:

- **Segurança:** o projeto vem com o controle de acesso desligado, e isso
  continua igual. Mas, se alguém ligar a configuração, nada acontece: a API
  continua aberta. O inventário marca como prioridade alta e aproveita para
  apontar um problema que já existia no original: o cadastro de usuários
  grava a senha sem criptografia.
- **Acesso ao banco:** das três implementações, só uma sobrou. As outras duas
  continuam no repositório, sem compilar, esperando uma decisão: reescrever
  ou apagar.
- **Monitoramento:** um componente que media o tempo das chamadas ficou de
  fora e precisa ser refeito.

## O que achei

O Bob faz bem o trabalho braçal: trocar dependências, traduzir configuração,
lembrar de detalhes como o nome das colunas, reescrever dezenas de testes.

Gostei mais da forma como ele lida com o que não dá certo. Quando a
compatibilidade com o Spring não funcionou, ele mudou de caminho e registrou
o motivo, em vez de empilhar gambiarras para manter o plano original. Quando
a regra de cobertura falhou, ele investigou a medição em vez de remover a
regra. E os documentos dizem o que não foi verificado, como a versão Spring
que não foi executada na comparação da API.

O cuidado que eu teria: "compatibilidade com o Spring" é o nome da
estratégia, mas o resultado foi uma API reescrita, uma única forma de acessar
o banco e nenhum controle de acesso. Quem escolher essa opção esperando
poucas mudanças vai receber outra coisa. E as validações do Bob olham para
build, testes e subida; o que mostra se a API se comporta igual é comparar as
duas versões funcionando, de preferência com um teste automatizado rodando
contra as duas.

## Próximos passos

- Rodar os testes de regressão do projeto (uma coleção do Postman) contra as
  duas versões.
- Resolver o controle de acesso no Quarkus, com testes para cada perfil de
  usuário.
- Publicar o contrato original como documentação da API, no lugar do gerado.
- Decidir o destino das implementações de banco que ficaram de fora.
- Repetir o benchmark com a compilação nativa do Quarkus e com vários
  usuários ao mesmo tempo.
- Fazer o deploy no cluster do homelab.

O código e os documentos da migração estão na branch
[`migration/run-01`](https://github.com/jansouza/spring-petclinic-rest/tree/migration/run-01)
do meu fork.
