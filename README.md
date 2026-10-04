# GigTime

`Análise e Desenvolvimento de Sistemas - PUC Minas`

`Desenvolvimento de aplicação web front-end`

`2º semestre/2024`

A GigTime é uma plataforma que busca facilitar a conexão entre músicos e contratantes, fornecendo recursos valiosos para ajudar os usuários a alcançar seus objetivos no mercado da música ao vivo.

## Integrantes

* Carlos Henrique Pereira Silva
* Jefferson Luiz Mendonça da Silva
* Kauã Eduardo Silva
* Lucas Carvalho de Oliveira
* William Rocha Leal Viana

## Orientador

* Humberto Azevedo Nigri do Carmo

# Documentação

<ol>
<li><a href="documentos/01-Documentação de Contexto.md"> Documentação de Contexto</a></li>
<li><a href="documentos/02-Especificação do Projeto.md"> Especificação do Projeto</a></li>
<li><a href="documentos/03-Metodologia.md"> Metodologia</a></li>
<li><a href="documentos/04-Projeto de Interface.md"> Projeto de Interface</a></li>
<li><a href="documentos/05-Template padrão da Aplicação.md"> Template padrão da Aplicação</a></li>
<li><a href="documentos/06-Programação de Funcionalidades.md"> Programação de Funcionalidades</a></li>
<li><a href="documentos/07-Plano de Testes de Software.md"> Plano de Testes de Software</a></li>
<li><a href="documentos/08-Registro de Testes de Software.md"> Registro de Testes de Software</a></li>
<li><a href="documentos/09-Referências Bibliográficas.md"> Referências Bibliográficas</a></li>
</ol>

# Hospedagem

* Site publicado no GitHub Pages: https://icei-puc-minas-pmv-ads.github.io/pmv-ads-2024-2-e1-proj-web-t10-pmv-ads-2024-2-e1-proj-gigtime/codigo-fonte/Home/home.html

# Código-Fonte

* <a href="codigo-fonte/Home/home.html">Código Fonte</a>: site estático (HTML, CSS e JavaScript), sem back-end.

## Como rodar localmente

No Windows, dê dois cliques em `iniciar.bat` (na raiz do projeto). Ele serve a pasta `codigo-fonte` por HTTP em `http://localhost:8000` e abre o navegador em `/Home/home.html`. Usa o Python se estiver instalado (`python` ou `py`); sem Python, usa o servidor do PowerShell em `ferramentas/servidor-local.ps1`. Para encerrar, pressione Ctrl+C ou feche a janela.

Em outros sistemas: `python -m http.server 8000 --bind 127.0.0.1 --directory codigo-fonte` e abra `http://localhost:8000/Home/home.html`.

O site precisa ser aberto por HTTP: por `file://` o navegador isola o armazenamento de cada página (o login e os dados não passam de uma página para outra) e a criptografia do navegador usada nas senhas fica indisponível. Use `localhost` ou `127.0.0.1` (ou HTTPS, como no GitHub Pages).

Contas de demonstração (criadas na primeira visita): `sonic` / `sonic`, `cartola` / `cartolinha`, `maria123` / `maria123`, `lucas98` / `lucas98`, `ana.pereira` / `ana.pereira`, `joao_souza` / `joao.souza`, `carol.martins` / `carol.martins`, `joaoshow` / `joaoshow123`, `jazzburger` / `plannerpro2024`, `operahouse` / `evento2024`.

## Onde ficam os dados

Tudo fica no navegador de quem usa o site:

* `localStorage['users']`: usuários cadastrados (inclui os de demonstração). A senha é guardada só como hash SHA-256 (WebCrypto) de `gigtime:<usuário>:<senha>`; o nome de usuário funciona como sal e por isso não pode ser alterado na edição de perfil.
* `localStorage['messages']`: mensagens do chat.
* `sessionStorage['loggedInUser']`: usuário logado, sem senha. A sessão vale por aba: fechar a aba encerra o login, e duas abas podem estar logadas com usuários diferentes (útil para testar o chat entre duas pessoas).

Quem usou a versão anterior (usuários no `sessionStorage`, senhas em texto puro) tem os dados levados para o `localStorage` e as senhas convertidas em hash automaticamente na próxima visita.

## Testes (somente desenvolvimento)

Requer Node.js 22 ou superior. Na raiz do projeto:

```
npm install
npm test
```

Os testes ficam em `testes/` (`node:test` + `jsdom`) e cobrem a lógica de `codigo-fonte/lib/` (armazenamento, senha, filtros, perfil, mensagens) e o comportamento das páginas. O site publicado não depende do Node.

# Apresentação

* <a href="apresentacao/README.md">Apresentação do Projeto</a>
