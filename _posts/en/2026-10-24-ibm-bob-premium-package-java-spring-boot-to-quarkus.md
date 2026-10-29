---
layout: post
title: "IBM Bob Premium Package for Java: migrating a Spring Boot project to Quarkus"
date: 2026-10-24 10:00:00 -0300
categories: [devops]
tags: [ibm, ibm-bob, java, spring-boot, quarkus, modernizacao, ia, devops]
stage: growing
image: /assets/images/ibm-bob-premium-package-java-quarkus/ibm-bob-premium-package-java-welcome.png
description: "I used the IBM Bob Premium Package for Java to migrate a Spring Boot API to Quarkus: how the process went, what changed along the way, the benchmark results and what's still pending."
translation_key: ibm-bob-premium-package-java-spring-boot-para-quarkus
---

![IBM Bob Premium Package for Java welcome screen in the IDE, with the workflows and the Migrate Spring Boot to Quarkus skill](/assets/images/ibm-bob-premium-package-java-quarkus/ibm-bob-premium-package-java-welcome.png)

This is the third post in the series where I use IBM Bob on real projects.
In the first one, [I created an Ansible project from scratch]({% post_url en/2026-07-06-creating-an-ansible-project-from-scratch-with-ibm-bob %});
in the second, [I wrote the firmware for an ESP32 LED clock]({% post_url en/2026-08-03-how-i-used-ibm-bob-to-build-an-arduino-esp32-firmware %}).
Both were new projects. This one is a migration: an existing Spring Boot
application, moved to Quarkus.

The post has two parts. First, what the **Premium Package for Java** is and
what comes in it. Then, the practical case: migrating
[spring-petclinic-rest](https://github.com/spring-petclinic/spring-petclinic-rest)
from Spring Boot to Quarkus, with what worked, what didn't and a benchmark
comparing the two versions.

## What the IBM Bob Premium Package for Java is

The Premium Package for Java Modernization is a paid IBM Bob add-on, aimed
at upgrading, migrating and modernizing enterprise Java applications. IBM
[announced the package in July 2026](https://www.ibm.com/new/announcements/announcing-ibm-bob-premium-package-for-java-modernization).
In practice, they're workflows that show up inside Bob itself, split into
steps, with validations and points where it stops and asks for your
approval.

### What comes in the package

After installing, Bob opens the welcome screen in the image above, with
these options:

- *Analyze and suggest modernization*: analyzes the project and suggests
  what to upgrade and improve;
- *Java Upgrade*: takes the project from Java 8 or 11 to 17, 21 or 25;
- *Liberty Modernization*: migrates applications from traditional WebSphere
  to Liberty;
- *UI Modernization*: replaces old UI frameworks, component by component;
- *Unit Test Generation*: generates unit tests and measures coverage;
- *Java Vulnerability Remediation*: finds and fixes vulnerabilities;
- *Migrate Spring Boot to Quarkus*: the one I used in this post. The
  [documentation](https://bob.ibm.com/docs/ide/premium-packages/java-modernization/java-modernization-index)
  describes the skill as a phased migration, in which the project has to
  compile at the end of each phase before moving on.

### How to enable it

According to IBM's [prerequisites](https://bob.ibm.com/docs/ide/premium-packages/java-modernization/prerequisites),
you need IBM Bob 2.0.0 or later and a license for the package. It's sold as
an add-on to a Bob plan (Pro, Pro+ or Ultra for individuals; in enterprise,
it's enabled by the administrator), and
[trial plans don't accept add-ons](https://bob.ibm.com/blog/pp_for_java_announcement).
The project needs to use Maven or Gradle and be in a Git repository with no
pending changes; the documentation itself suggests creating a branch before
starting.

With the license active, Bob detects the package on startup and offers to
install it. Each option is triggered by a button on the welcome screen.

## The starting project

[spring-petclinic-rest](https://github.com/spring-petclinic/spring-petclinic-rest)
is the REST API version of the Spring community's classic PetClinic: the
system of a veterinary clinic, with owners, pets, visits, vets and
specialties. I used a [fork](https://github.com/jansouza/spring-petclinic-rest)
kept up to date with the original, on Spring Boot 4.1.1.

For a migration test, it's a good size: small enough to review everything
and with a few parts that tend to complicate a migration. It has three
different database access implementations, chosen by configuration; it
supports four databases (H2, HSQLDB, MySQL and PostgreSQL); it has access
control that can be turned on or off; and a quality rule that breaks the
build if the tests cover less than 85% of the code.

## Why Quarkus

Quarkus does at build time a good part of the work Spring does while the
application is starting up. The result is an application that starts faster
and uses less memory, and that can also be compiled as a native executable.
That matters in Kubernetes, where containers come and go all the time, and
in a homelab, where the machines are short on memory.

Quarkus usage has been growing. In November 2024, Red Hat, which maintains
the project,
[reported](https://developers.redhat.com/articles/2024/11/29/quarkus-has-surpassed-1000-contributor-milestone)
more than a million downloads per month, a number that had been doubling
every year, and more than a thousand contributors, about the same as Spring
Boot.

In the [usage analysis](https://quarkus.io/blog/quarkus-insights-253-build-analytics/)
the project presented in June 2026, comparing May 2025 with May 2026,
monthly active users went up 16% and total builds, 26%. The number of new
users stayed stable, so the growth came from people who already used
Quarkus and started using it more. (This data only comes from those who
agree to send telemetry, which is why the project doesn't publish the
absolute numbers.)

On the enterprise side, an [IDC study](https://quarkus.io/blog/idc-customer-case-studies/)
with three unnamed customers (a telecom operator, a transportation company
and a European bank) reports up to 10 times lower processing costs at the
operator and 85% faster startup at the bank, which went on to host 30% more
applications on the same infrastructure.

The downside is that everything Spring decides with the application running
(which database to use, which implementation to load, whether access control
is on) has to be decided at build time. That came up several times in the
migration.

## Migrating with Bob

### Analysis and choosing the strategy

I created the `migration/run-01` branch and ran the migration. Before
touching the code, Bob generates an
[analysis of the project](https://github.com/jansouza/spring-petclinic-rest/blob/migration/run-01/docs/quarkus-migration-analysis.md)
with the versions, the dependencies and the difficulty level of each area.
The API layer, database access and security came out as the hardest, and
they were indeed the ones that took work.

The video below shows that beginning: the skill running in the IDE, the
analysis being generated and Bob asking for the choice of strategy.

<video controls width="100%" preload="metadata">
  <source src="/assets/videos/ibm-bob-premium-package-java-quarkus/ibm-bob-java-migration.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

The analysis ends with two strategies and stops, waiting for a decision:

1. **Spring compatibility** (the recommended one): Quarkus has extensions
   that understand part of the code written for Spring, so you can keep a
   good part of the code as it is.
2. **Full Quarkus**: rewrite the Spring parts with Quarkus's own tools, with
   many more changes.

I went with the recommended one. From there, Bob followed the migration
phases (Java, build, code, UI, tests and cleanup), validating each one
before moving to the next. The UI phase was skipped, because the project is
API only.

During the run, Bob kept a
[decision log](https://github.com/jansouza/spring-petclinic-rest/blob/migration/run-01/docs/quarkus-migration-decisions.md)
with 18 entries, each with the reason and the cost of the choice. It was
the document I used the most to understand the result. In the end, the
migration touched 71 files and left six documents in the
[`docs/`](https://github.com/jansouza/spring-petclinic-rest/tree/migration/run-01/docs)
folder.

### What was left of the Spring compatibility

The plan was to keep the Spring code running on top of the compatibility
extensions. In three parts of the project that didn't work, and Bob changed
course, recording the reason:

- **API:** the PetClinic routes are generated from an OpenAPI contract, in a
  format the compatibility extension doesn't recognize. Instead of copying
  the routes by hand into eight classes, Bob switched to generating the API
  code in the Quarkus format.
- **Database access:** the extension didn't accept the way the project
  organizes its repositories. The log says that "all the variants tried
  failed". The way out was to use one of the other implementations the
  project already had, which passes the same tests.
- **Security:** the permission rules use a Spring feature the extension
  doesn't support. They became comments marked as pending.

Only the business rules layer was left from Spring. In practice, the
"compatibility" strategy ended up as a hybrid much closer to full Quarkus.

### Configuration

Besides translating the Spring configuration into the Quarkus one, Bob
remembered a detail I'd expect to see breaking in production: the two
frameworks name database columns differently by default, and it set
Quarkus to use the same names as Spring. An excerpt of the migrated
`application.properties`:

```properties
quarkus.http.port=9966
quarkus.http.host=${PETCLINIC_HTTP_HOST:127.0.0.1}
quarkus.http.root-path=/petclinic/

# Spring Boot used snake_case for columns; Hibernate in Quarkus keeps the Java name
quarkus.hibernate-orm.physical-naming-strategy=org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy

quarkus.http.cors.enabled=true
quarkus.http.cors.origins=${PETCLINIC_CORS_ORIGINS:http://localhost:4200}
```

Two changes alter the application's behavior. The original accepted calls
from any site and listened on all network interfaces. Citing the project's
security rules, Bob limited the sites that can call the API
(`cors.origins`) and made the application accept only connections from the
machine itself (`http.host`), unless an environment variable says
otherwise. Both changes make sense, but anyone running it in a container
needs to set `PETCLINIC_HTTP_HOST`, or the application becomes
unreachable.

And switching databases became more rigid. In Spring, you just picked the
database when starting the application. In Quarkus, that choice is made at
build time: to use MySQL or PostgreSQL, you have to build the package with
the right database already in it. And HSQLDB was left out, because Quarkus
has no extension for that database.

### Tests

This was the part where Bob worked the most: it rewrote the API and
business rules tests in the Quarkus format. The
[coverage report](https://github.com/jansouza/spring-petclinic-rest/blob/migration/run-01/docs/test-coverage.md)
compares the two versions:

| Metric                  | Spring Boot | Quarkus, 1st attempt  | Quarkus, final |
|-------------------------|-------------|-----------------------|----------------|
| Tests run               | 237         | 126                   | 127            |
| Failed tests            | 0           | 0                     | 0              |
| Code coverage           | 85.5%       | 10%                   | 88.8%          |
| Build passed the rule   | yes         | no                    | yes            |

Of the 237 original tests, 111 stopped running because they tested the
database access implementations that were left out. The tests for the
implementation that stayed are all still there, and the 127th is a new
test, which I explain below.

The first attempt passed all the tests, but the build failed because the
coverage tool measured only 10%. The problem was in the measurement:
Quarkus loads the application in a way the tool couldn't see. Bob fixed the
configuration, got to 84.9% and was still below 85%. To close the gap, it
wrote a simple test over automatically generated code. The report itself
calls this test a "stopgap" of "limited value", and explains that it
preferred this to lowering the minimum, because lowering it would silently
weaken a rule that already existed.

## Is the API still the same?

Bob also
[compared the API contract](https://github.com/jansouza/spring-petclinic-rest/blob/migration/run-01/docs/api-contract-comparison.md):
a script called each operation on the migrated application, with valid
data, invalid data and nonexistent records. Of the 37 operations, 36 respond
the same way as before. The remaining one didn't work in the original
project either.

The differences it found are small:

- the automatically generated API documentation (Swagger) got poorer, which
  affects anyone who generates client code from it, but not anyone who
  calls the API;
- the validation error message changed a text field, keeping the same error
  code and the same format;
- the application's root address, which used to lead to the documentation,
  now returns "not found".

The report also says what it didn't do: the Spring version wasn't run in
this comparison, so the "before" came from the contract and the original
tests, not from a measurement.

## Spring Boot vs. Quarkus: the benchmark

To have my own numbers, I put together some scripts that download both
versions, build them, start each application and measure startup time,
memory usage and the response time of seven endpoints, with 50 calls to
each one. Both ran on the same machine, one after the other, with the
default settings. Quarkus ran the usual way, without native compilation.

| Metric                          | Spring Boot 4.1.1 | Quarkus 3.40.1 | Difference |
|---------------------------------|-------------------|----------------|------------|
| Time until ready                | 9.74 s            | 3.59 s         | −63%       |
| Memory used by the process      | 435.8 MB          | 260.7 MB       | −40%       |
| Typical response time           | 5.80 ms           | 5.57 ms        | −4%        |
| 95% of responses under          | 13.69 ms          | 10.87 ms       | −21%       |

Startup and memory are where the difference shows: the application is ready
in a little over a third of the time and uses 175 MB less memory, which
counts in a small cluster like the homelab's.

In response time, the two versions are practically tied. Looking endpoint
by endpoint confuses more than it helps with a small sample: in one of
them, the Quarkus average came out 49% worse because of a single slow call,
which tends to happen on the first requests after the application starts.
Without that call, Quarkus was faster there too.

The test has limits: it was a single run, with one call at a time. It works
for comparing startup and memory; it doesn't say how the two versions
behave with many users at the same time.

## What's still pending

Bob left an
[inventory of pending items](https://github.com/jansouza/spring-petclinic-rest/blob/migration/run-01/docs/todo-inventory.md)
with 57 comments in the code and 30 files that were left out of the build.
The ones that matter:

- **Security:** the project ships with access control turned off, and that
  stays the same. But if someone turns the setting on, nothing happens: the
  API stays open. The inventory marks this as high priority and takes the
  chance to point out a problem that already existed in the original: user
  registration stores the password without encryption.
- **Database access:** of the three implementations, only one was left. The
  other two are still in the repository, not compiling, waiting for a
  decision: rewrite or delete.
- **Monitoring:** a component that measured call times was left out and
  needs to be redone.

## What I thought

Bob does the grunt work well: swapping dependencies, translating
configuration, remembering details like column names, rewriting dozens of
tests.

What I liked more was the way it handles what doesn't work. When Spring
compatibility didn't work, it changed course and recorded the reason,
instead of piling up hacks to keep the original plan. When the coverage
rule failed, it investigated the measurement instead of removing the rule.
And the documents say what wasn't verified, like the Spring version that
wasn't run in the API comparison.

The caution I'd have: "Spring compatibility" is the name of the strategy,
but the result was a rewritten API, a single way to access the database and
no access control. Anyone who picks this option expecting few changes will
get something else. And Bob's validations look at build, tests and startup;
what shows whether the API behaves the same is comparing the two versions
running, ideally with an automated test running against both.

## Next steps

- Run the project's regression tests (a Postman collection) against both
  versions.
- Solve access control in Quarkus, with tests for each user profile.
- Publish the original contract as the API documentation, instead of the
  generated one.
- Decide what to do with the database implementations that were left out.
- Repeat the benchmark with Quarkus native compilation and with many users
  at the same time.
- Deploy it to the homelab cluster.

The code and the migration documents are in the
[`migration/run-01`](https://github.com/jansouza/spring-petclinic-rest/tree/migration/run-01)
branch of my fork.
