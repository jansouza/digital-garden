---
layout: post
title: "🧠 Design Patterns no Time de Operações: Como um simples Retry salvou meus backups"
date: 2025-06-07 10:00:00 -0300
categories: [devops]
tags: [design-patterns, python, devops, aws, resiliencia]
stage: mature
---

Tradicionalmente, técnicas de design de software são associadas ao
desenvolvimento de aplicações. Mas será que elas também podem beneficiar o
trabalho do time de operações?

Recentemente, me deparei com uma situação onde um simples script Python para
fazer backup de repositórios do Bitbucket se mostrou mais complexo do que
parecia. Erros intermitentes na API e falhas esporádicas no upload para o S3
da AWS estavam comprometendo a integridade dos backups. A solução veio de um
lugar inesperado: os famosos design patterns de desenvolvimento.

## O Desafio

O objetivo do script era simples:

- Listar os repositórios do Bitbucket via API
- Fazer download de cada um
- Enviar o artefato compactado para um bucket S3

No papel, parecia direto. Porém, na prática, surgiram falhas esporádicas:

- Timeouts ao acessar a API do Bitbucket
- Falhas momentâneas na conexão com o S3
- Backups incompletos por conta de erros não tratados

Como o script era executado de forma linear, qualquer falha em uma das etapas
encerrava o processo, e os repositórios restantes não eram salvos.

## A Solução: Aplicando o Pattern de Retry

Foi aí que lembrei de minhas aulas na faculdade, e me veio à mente um pattern
muito conhecido no mundo do desenvolvimento: o **Retry Pattern**.

Esse padrão basicamente encapsula uma operação com possibilidade de falha, e
tenta reexecutá-la algumas vezes antes de desistir. Com isso, consegui
reescrever partes críticas do script, envolvendo as chamadas à API e os
uploads ao S3 em blocos de retry com controle de:

- número de tentativas
- tempo entre tentativas
- tipos de exceções tratáveis

Resultado? A resiliência do processo aumentou consideravelmente.

## Aplicando Retry com Python (e Tenacity)

Em vez de tratar erro por erro manualmente, usei a biblioteca
[tenacity](https://tenacity.readthedocs.io/), que facilita a implementação de
tentativas automáticas com controle de tempo e número de falhas.

```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import requests
import boto3
import botocore.exceptions

# Retry para chamadas à API Bitbucket
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10),
       retry=retry_if_exception_type(requests.exceptions.RequestException))
def fetch_repos():
    response = requests.get("https://api.bitbucket.org/2.0/repositories/ORG", timeout=5)
    response.raise_for_status()
    return response.json()

# Retry para upload no S3
s3 = boto3.client("s3")

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=1, max=8),
       retry=retry_if_exception_type(botocore.exceptions.ClientError))
def upload_to_s3(file_path, bucket, key):
    s3.upload_file(file_path, bucket, key)
```

Com poucas linhas, ganhei:

✅ Resiliência ✅ Simplicidade ✅ Confiabilidade

## O que aprendemos com isso

Esse episódio me fez refletir sobre como operar infraestrutura também exige
engenharia. Ao aplicar técnicas bem conhecidas do desenvolvimento,
conseguimos:

- Criar scripts mais robustos e confiáveis
- Reduzir falhas operacionais causadas por instabilidades transitórias
- Diminuir o retrabalho e a necessidade de execuções manuais

E não é só o Retry. Padrões como **Circuit Breaker**, **Bulkhead**, **Cache**
e até **Observer** podem (e devem) ser considerados em soluções operacionais.

## 👀 E você?

Já aplicou boas práticas de desenvolvimento no time de operações? Tem alguma
técnica que te salvou em um script de automação ou job crítico?

---

*Publicado originalmente no
[LinkedIn](https://www.linkedin.com/pulse/design-patterns-time-de-opera%C3%A7%C3%B5es-como-um-simples-retry-jan-souza-2ufyf/)
em 7 de junho de 2025.*
