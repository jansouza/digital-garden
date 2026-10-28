# Post LinkedIn: IBM Bob Premium Package for Java, de Spring Boot para Quarkus

**Referente ao post:** [IBM Bob Premium Package for Java: migrando um projeto Spring Boot para Quarkus](/_posts/2026-10-24-ibm-bob-premium-package-java-spring-boot-para-quarkus.md)

> Texto abaixo em **texto puro**: o LinkedIn não renderiza markdown, então nada de `**negrito**`. Copiar e colar direto.

---

## Corpo do post

IBM Bob Premium Package for Java: migrando um projeto Spring Boot para Quarkus.

O Quarkus é um framework Java, mantido pela Red Hat, que faz durante o build boa parte do trabalho que o Spring faz quando a aplicação está subindo. A promessa é uma aplicação que sobe mais rápido e usa menos memória.

O IBM Bob Premium Package for Java é um add-on pago do IBM Bob, anunciado em julho, para modernizar aplicações Java. Ele traz fluxos prontos para atualizar a versão do Java, migrar do WebSphere para o Liberty, gerar testes e corrigir vulnerabilidades, além da skill "Migrate Spring Boot to Quarkus".

Para testar essa skill, fiz um laboratório com o spring-petclinic-rest, a versão em API REST do PetClinic da comunidade Spring. Migrei o projeto para Quarkus e rodei o mesmo benchmark nas duas versões, na mesma máquina:

- Tempo de inicialização: 9,7 s no Spring Boot, 3,6 s no Quarkus (63% menos)
- Memória do processo: 436 MB contra 261 MB (40% menos)
- Tempo de resposta na mediana: 5,8 ms contra 5,6 ms, praticamente empate

Na migração, escolhi a estratégia que o Bob recomendou: "compatibilidade com o Spring", a que mantém mais código como está. Ela falhou em três partes: as rotas da API, o acesso ao banco e as regras de segurança. Em cada uma, o Bob mudou de caminho e registrou o motivo num log de decisões. No fim, do Spring sobrou só a camada de regras de negócio, e 36 das 37 operações da API respondem como antes. As regras de segurança viraram pendências: se alguém ligar o controle de acesso, a API continua aberta.

O Bob faz bem o trabalho braçal, e o que mais gostei foi ele registrar por que mudou de caminho em vez de empilhar gambiarras para manter o plano. Mas build e testes passando não provam que a API se comporta igual. Essa conferência continua sendo sua.

Quem já migrou de Spring Boot para Quarkus em produção: a economia de memória e de tempo de inicialização compensou o trabalho da migração?

#Java #Quarkus #IBMBob

---

## Primeiro comentário (postar logo em seguida)

Post completo, com vídeo, benchmark e a lista de pendências:
https://garden.jansouza.com/devops/2026/10/24/ibm-bob-premium-package-java-spring-boot-para-quarkus.html

O código e os documentos da migração:
https://github.com/jansouza/spring-petclinic-rest/tree/migration/run-01

---

**TODO antes de publicar:**
- [ ] Anexar o vídeo da migração (assets/videos/ibm-bob-premium-package-java-quarkus/ibm-bob-java-migration.mp4) ou o print da tela de boas-vindas (ibm-bob-premium-package-java-welcome.png)
- [ ] Conferir se a URL do post bate com o permalink gerado (data/categoria)
- [ ] Postar o primeiro comentário com os links logo após publicar
