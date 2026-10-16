# ADR 0003: uma chave de mensagens por autor

- **Data:** 2026-10-04
- **Status:** aceita

## Contexto

As mensagens ficavam numa lista única (`gigtime:messages`). Enviar era ler a lista, acrescentar e gravar de volta. No teste de carga (H10, `docs/carga/2026-10-04-resultados.md`), duas abas de pessoas diferentes enviando 500 mensagens cada perderam **40%** das mensagens: as duas liam a mesma lista e a última gravação vencia.

Uma trava com Web Locks (`navigator.locks`) em volta da leitura e da gravação foi testada e **não resolveu** (15 a 22% de perda): o localStorage propaga as mudanças entre abas de forma assíncrona, e a aba que pega a trava ainda pode ler uma cópia desatualizada.

## Decisão

Cada mensagem nova vai para a chave do autor, `gigtime:messages:<usuário>`. Quem envia só escreve a própria chave; a leitura junta a lista antiga (ainda lida, sem migração) e as chaves de todos os autores, sem duplicar por `id`. Conta, exportação, restauração e uso do armazenamento consideram todas essas chaves (`GigMensagens.chavesDeMensagens`).

## Consequências

- Medido de novo: **0 de 5.000** mensagens perdidas com duas abas, e enviar ficou mais barato (grava só a lista do autor: de 511 ms para 43 ms com 25 mil mensagens).
- Duas abas da **mesma** pessoa enviando ao mesmo tempo ainda podem colidir (escrevem a mesma chave). É raro e está nas limitações.
- Com um servidor, a ordenação e a gravação passariam a ser responsabilidade dele, e essa estrutura deixa de ser necessária.
