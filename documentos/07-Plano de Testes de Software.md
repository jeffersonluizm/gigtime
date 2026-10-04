# Plano de Testes de Software

Pré-requisitos: [Especificação do Projeto](02-Especificação%20do%20Projeto.md) e [Projeto de Interface](04-Projeto%20de%20Interface.md).

Este plano tem duas partes: os **casos de teste manuais** do projeto original (2024), revisados, e o **plano de testes automatizados** criado na revisão de portfólio (2026).

## 1. Casos de teste manuais (projeto original, revisados)

Na versão de 2024 as tabelas estavam com HTML quebrado, os títulos de CT-03 e CT-05 repetiam o de outro caso e os requisitos usavam IDs de três dígitos. A tabela abaixo mantém os mesmos casos, com o título que corresponde ao que é testado.

Requisitos: navegador Chrome, Firefox ou Edge e o site aberto por HTTP (`iniciar.bat` ou o endereço publicado).

| Caso | Requisitos | Objetivo | Passos | Critério de êxito |
|------|------------|----------|--------|-------------------|
| CT-01 Links da Home | RF-01, RF-05, RF-07, RF-09 | Os links da Home levam às páginas certas | Abrir a Home; clicar em Explorar, Como funciona, Entrar, Criar conta e nos cards | Cada link abre a página descrita |
| CT-02 Filtros de Explorar | RF-02 | Os filtros mostram só os perfis que atendem | Abrir Explorar; escolher papel, estado, avaliação e gênero; buscar por nome | Só aparecem perfis que atendem a todos os critérios; sem resultado, aparece o estado vazio |
| CT-03 Contato pelo chat | RF-03, RF-04 | Do perfil é possível abrir uma conversa | Abrir um perfil; clicar em "Contate-me"; entrar se pedido; enviar uma mensagem | A mensagem aparece na conversa e na lista de conversas |
| CT-04 Perfil cadastrado aparece | RF-06 | O cadastro aparece na categoria escolhida | Criar conta como músico; abrir Explorar com o filtro Músicos | O perfil novo aparece entre os músicos |
| CT-05 Responsividade | RF-08 | As páginas funcionam em telas pequenas | Abrir as páginas em 375 px (DevTools, Ctrl+Shift+M) | Sem rolagem horizontal; menu e filtros recolhidos funcionam |

## 2. Plano de testes automatizados (2026)

Ferramentas: `node:test` (nativo do Node 22+) e `jsdom`. Rodar com `npm install` e `npm test`. Os testes de página carregam o HTML real, executam os scripts na mesma ordem do navegador e interagem como uma pessoa (preencher, enviar, clicar).

| Arquivo | O que cobre | Requisitos |
|---------|-------------|------------|
| `senha.test.js` | PBKDF2 (formato, sal aleatório, 600 mil iterações), migração do SHA-256 legado no login, login e cadastro com hash | RF-01, RF-05, RNF-07 |
| `validacao.test.js` | Links https, ID do YouTube, e-mail, telefone, política de senha, nome de usuário | RF-01, RF-10 |
| `perfil.test.js` | Regras do perfil, senha atual obrigatória, troca de senha, página de perfil (`?u=`, contato só logado, galeria) e edição | RF-04, RF-09, RF-10 |
| `registro.test.js` | Cadastro: validações, cota cheia, entra na conta | RF-01 |
| `filtros.test.js` | Critérios combinados, busca sem acento, filtro no endereço, página Explorar | RF-02 |
| `cards.test.js`, `armazenamento.test.js` | Cards da Home e de Explorar, links acessíveis, dados no localStorage, migrações | RF-06, RF-07 |
| `chat.test.js` | Mensagens, conversas, não lidas, paginação, atualização entre abas, cota | RF-03 |
| `sessao.test.js` | Sessão, destino depois do login (anti open redirect), expiração | RF-05 |
| `conta.test.js`, `conta-pagina.test.js` | Exportar, apagar conta, restaurar demonstração, trocar senha | RF-11 |
| `paginas-sistema.test.js` | Sobre, Privacidade, esqueci a senha, saiu, sessão expirada, erro, 404 e `index.html` | RF-12 |
| `html.test.js`, `seguranca-paginas.test.js` | Escape de HTML (XSS), CSP em todas as páginas, nada inline nem de CDN | RNF-07 |
| `identidade.test.js`, `paginas.test.js` | Contraste AA dos tokens, fontes locais, ícones no sprite, estrutura comum das páginas | RNF-05, RNF-09, RNF-10 |
| `concorrencia.test.js`, `chaves.test.js`, `inicializacao.test.js` | Gravação concorrente entre abas, chaves `gigtime:`, armazenamento cheio ou bloqueado | RNF-03 |

## 3. Teste de carga

O plano, as hipóteses (escritas antes de medir) e os resultados ficam em `docs/carga/`. Ferramentas: `playwright-core` com o Chrome instalado, Lighthouse e autocannon, todos rodando contra o site servido localmente, com dados gerados.
