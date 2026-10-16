# Teste de carga do GigTime: hipóteses (escritas antes de medir)

Data: 2026-10-04. Este arquivo foi escrito e versionado **antes** de qualquer medição; os resultados ficam em `2026-10-04-resultados.md`.

## O que faz sentido estressar num site sem servidor

O GigTime não tem back-end: o "servidor" é o próprio navegador. O que pode ficar lento ou quebrar é:

1. **A lógica em JavaScript** (filtros, lista de conversas) com muitos dados.
2. **O desenho da tela** (milhares de cards ou de balões de mensagem no DOM).
3. **O localStorage**: leitura e gravação síncronas do JSON inteiro e a cota de cerca de 5 MB por origem.
4. **O carregamento das páginas** (peso, recursos que bloqueiam a renderização, LCP).
5. **A concorrência entre abas**, que leem e gravam a mesma chave.

O servidor HTTP local (Python ou PowerShell) só entrega arquivos estáticos; é medido apenas como referência (H13).

## Restrição de cota (cálculo feito antes de medir)

Com o formato atual, um usuário de exemplo ocupa ~785 caracteres de JSON e uma mensagem de 50 caracteres ocupa ~158. Numa cota de ~5 Mi unidades UTF-16:

- **10 mil usuários não cabem** (~7,9 milhões de caracteres) e **100 mil mensagens não cabem** (~15,8 milhões).
- Por isso: 10 mil e 100 mil ficam para o teste de **lógica em Node**; no navegador o teto realista é **5 mil usuários** e **25 mil mensagens**.

## Hipóteses

| # | Cenário | Meta | Expectativa antes das correções |
|---|---|---|---|
| H1 | Node: `correspondeFiltro` em 10 mil usuários; `listarConversas` e `conversaEntre` em 100 mil mensagens | < 5 ms; < 50 ms; < 50 ms | passa (O(n) e O(n log n)) |
| H2 | Explorar com 5 mil usuários: da navegação até os cards prontos | < 1000 ms | incerta: 5 mil `insertAdjacentHTML` |
| H3 | Explorar com 5 mil: trocar o filtro de estado até o próximo frame (INP) | < 100 ms | **falha**: `users.find` por card é O(n²), ~12,5 milhões de comparações |
| H4 | Home com 5 mil usuários: LCP | < 2500 ms | **falha**: desenha todos os cards e esconde a página até o `load` |
| H5 | Cota de usuários: quantos cabem até `QuotaExceededError`; cadastro com o armazenamento cheio | estoura entre 5 e 7 mil; cadastro avisa | estoura nessa faixa; **cadastro falha sem aviso** (erro não tratado) |
| H6 | Cota de mensagens de 50 caracteres; chat com o armazenamento cheio | estoura entre 30 e 36 mil; chat avisa e não perde as anteriores | passa |
| H7 | Chat com 25 mil mensagens no total (~4 MB) e 5 mil na conversa aberta: abrir a página | < 500 ms | **falha**: desenha as 5 mil e relê o JSON de usuários por contato |
| H8 | Chat com 25 mil: enviar uma mensagem até o próximo frame | < 200 ms | **falha**: regrava 4 MB e redesenha a conversa inteira |
| H9 | Abrir pela lista uma conversa de 5 mil mensagens | < 500 ms | **falha** (sem paginação) |
| H10 | 2 abas × 500 envios automáticos (intervalo de 10 ms) | 0 mensagens perdidas | incerta: leitura e gravação sem trava entre abas |
| H11 | Lighthouse (Home e Explorar; desktop e celular) | Desempenho ≥ 80 desktop e ≥ 60 celular; Acessibilidade ≥ 90; LCP < 2,5 s desktop | **falha**: capa de 2,4 MB, CSS de CDN bloqueante, contraste 1,84:1 |
| H12 | Custo do hash da senha no Chrome: SHA-256 (antes) x PBKDF2 600 mil (depois) | SHA-256 < 5 ms; PBKDF2 < 1000 ms | passa |
| H13 | autocannon em `/Home/home.html` no servidor local (referência), 10 conexões | > 500 req/s e p99 < 50 ms | passa |

## Protocolo

- **Antes** = commit `5319271` (branch `main`), servido de uma worktree temporária na porta 8812. **Depois** = branch `feat/portfolio-ui-ux`, porta 8811. Portas do GigTime: 8800-8899.
- Dados gerados de forma determinística (`ferramentas/carga/gerar-dados.js`), com imagens locais para isolar a rede. Nada de dados reais.
- Navegador: Chrome instalado, headless, via `playwright-core`; cada cenário roda 5 vezes; registro a mediana e o p95 (o maior das 5).
- Lighthouse via `npx lighthouse`, 3 execuções por página e perfil, mediana.
- Máquina: Ryzen 5 5600 (6 núcleos/12 threads), 16 GB. Gerador e "servidor" dividem a máquina: os números servem para comparar antes e depois, não como valor absoluto.
- Trava de carga: pasta `.carga-lock` na raiz da oficina enquanto mede.
