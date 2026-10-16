# ADR 0001: site estático, sem back-end

- **Data:** 2026-10-04
- **Status:** aceita

## Contexto

O GigTime nasceu na disciplina de desenvolvimento web front-end da PUC Minas (2024), com escopo de HTML, CSS e JavaScript, e foi publicado no GitHub Pages. Na revisão de portfólio a pergunta foi: criar uma API agora ou manter o site estático?

## Decisão

Manter o site **estático e sem servidor**, com os dados no Web Storage do navegador, e deixar o caminho para uma API preparado:

- as regras de negócio ficam em `codigo-fonte/lib/`, sem DOM, e recebem o `storage` como parâmetro;
- as páginas só falam com `lib/` e `ui/`, nunca com o formato bruto do armazenamento;
- tudo o que depende de "não ter servidor" é assumido na interface (selo de demonstração, Privacidade, esqueci a senha honesto).

## Consequências

- **A favor:** hospedagem gratuita e sem manutenção (GitHub Pages), demonstração que nunca "dorme", zero segredo para guardar, testes rápidos em Node com o mesmo código.
- **Contra:** a autenticação é demonstrativa (quem controla o navegador pode forjar a sessão), os dados não saem do navegador, a cota do localStorage limita o volume (medido em `docs/carga/`) e a concorrência entre abas exige cuidado (ADR 0003).
- **Reversão:** trocar `lib/armazenamento.js`, `lib/senha.js` e `lib/mensagens.js` por chamadas a uma API, mantendo as assinaturas.
