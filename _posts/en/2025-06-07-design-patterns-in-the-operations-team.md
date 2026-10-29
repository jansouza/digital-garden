---
layout: post
title: "🧠 Design patterns in the operations team: how a simple retry saved my backups"
date: 2025-06-07 10:00:00 -0300
categories: [devops]
tags: [design-patterns, python, devops, aws, resiliencia]
stage: mature
description: "How the Retry pattern, implemented in Python with tenacity, made a Bitbucket-to-S3 backup script resilient to intermittent failures."
translation_key: design-patterns-no-time-de-operacoes
---

Software design techniques are traditionally associated with application
development. But can they also benefit the work of the operations team?

Recently I ran into a situation where a simple Python script to back up
Bitbucket repositories turned out to be more complex than it looked.
Intermittent API errors and sporadic failures uploading to AWS S3 were
compromising the integrity of the backups. The solution came from an
unexpected place: the well-known design patterns from development.

## The challenge

The goal of the script was simple:

- List the Bitbucket repositories through the API
- Download each one
- Send the compressed artifact to an S3 bucket

On paper, it looked straightforward. In practice, though, sporadic failures
showed up:

- Timeouts when calling the Bitbucket API
- Momentary failures in the connection to S3
- Incomplete backups because of unhandled errors

Since the script ran linearly, any failure in one of the steps ended the
process, and the remaining repositories weren't saved.

## The solution: applying the Retry pattern

That's when I remembered my college classes, and a very well-known pattern
from the development world came to mind: the **Retry Pattern**.

This pattern basically wraps an operation that may fail and tries to run it
again a few times before giving up. With it, I rewrote critical parts of
the script, wrapping the API calls and the S3 uploads in retry blocks that
control:

- the number of attempts
- the time between attempts
- which exception types can be handled

The result? The resilience of the process went up considerably.

## Applying retry with Python (and Tenacity)

Instead of handling each error manually, I used the
[tenacity](https://tenacity.readthedocs.io/) library, which makes it easy
to implement automatic retries with control over timing and number of
failures.

```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import requests
import boto3
import botocore.exceptions

# Retry for Bitbucket API calls
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10),
       retry=retry_if_exception_type(requests.exceptions.RequestException))
def fetch_repos():
    response = requests.get("https://api.bitbucket.org/2.0/repositories/ORG", timeout=5)
    response.raise_for_status()
    return response.json()

# Retry for S3 upload
s3 = boto3.client("s3")

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=1, max=8),
       retry=retry_if_exception_type(botocore.exceptions.ClientError))
def upload_to_s3(file_path, bucket, key):
    s3.upload_file(file_path, bucket, key)
```

With just a few lines, I got:

✅ Resilience ✅ Simplicity ✅ Reliability

## What we learned from this

This episode made me think about how operating infrastructure also takes
engineering. By applying well-known development techniques, we can:

- Build more robust and reliable scripts
- Reduce operational failures caused by transient instability
- Cut down on rework and the need for manual runs

And it's not only Retry. Patterns like **Circuit Breaker**, **Bulkhead**,
**Cache** and even **Observer** can (and should) be considered in
operational solutions.

## 👀 What about you?

Have you applied good development practices in the operations team? Is
there a technique that saved you in an automation script or a critical job?

---

*Originally published in Portuguese on
[LinkedIn](https://www.linkedin.com/pulse/design-patterns-time-de-opera%C3%A7%C3%B5es-como-um-simples-retry-jan-souza-2ufyf/)
on June 7, 2025.*
