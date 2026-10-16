// Páginas de sistema, de acesso e institucionais: Sobre, Privacidade, esqueci a senha, saiu,
// sessão expirada, erro genérico e 404 (GitHub Pages)
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { carregarPagina, esperarAte, RAIZ } = require('./apoio');
const { CHAVE_USUARIOS, CHAVE_MENSAGENS } = require('../codigo-fonte/lib/armazenamento.js');

test('Sobre assume o "sem back-end", mostra o diagrama da arquitetura e as limitações', () => {
  const w = carregarPagina('Sobre/sobre.html');
  const d = w.document;
  for (const id of ['sem-back-end', 'arquitetura', 'decisoes', 'testes', 'carga', 'limitacoes', 'equipe']) assert.ok(d.getElementById(id), id);
  const diagrama = d.querySelector('#arquitetura svg');
  assert.ok(diagrama, 'diagrama em SVG');
  assert.equal(diagrama.getAttribute('role'), 'img');
  assert.ok(diagrama.querySelector('title'), 'diagrama com título acessível');
  assert.match(d.getElementById('limitacoes').textContent, /DevTools/);
});

test('Privacidade lista as chaves guardadas no navegador e como apagar', () => {
  const w = carregarPagina('Privacidade/privacidade.html');
  const texto = w.document.getElementById('conteudo').textContent;
  for (const chave of ['gigtime:users', 'gigtime:messages', 'gigtime:lidas', 'loggedInUser']) assert.match(texto, new RegExp(chave));
  assert.ok(w.document.querySelector('a[href="../Conta/conta.html"]'));
});

test('Esqueci a senha explica por que não há e-mail e permite restaurar a demonstração com confirmação', async () => {
  const w = carregarPagina('Acesso/esqueci-senha.html', {
    antes: (win) => win.localStorage.setItem(CHAVE_MENSAGENS, JSON.stringify([{ id: 'm', de: 'a', para: 'b', texto: 'x', enviadaEm: 1 }])),
  });
  const d = w.document;
  assert.match(d.getElementById('conteudo').textContent, /não existe servidor/i);
  d.getElementById('restaurarDemo').click();
  await esperarAte(() => d.querySelector('dialog'));
  d.querySelector('dialog [data-resposta="sim"]').click();
  await esperarAte(() => w.localStorage.getItem(CHAVE_MENSAGENS) === null);
  assert.equal(JSON.parse(w.localStorage.getItem(CHAVE_USUARIOS)).length, 10);
});

test('Saiu: confirma a saída e oferece entrar de novo', () => {
  const w = carregarPagina('Acesso/saiu.html');
  assert.match(w.document.querySelector('h1').textContent, /Você saiu/);
  assert.ok(w.document.querySelector('#conteudo a[href="../Login/login.html"]'));
});

test('Sessão expirada: explica e leva ao login mantendo a página de volta', () => {
  const w = carregarPagina('Acesso/sessao-expirada.html', { antes: (win) => win.sessionStorage.setItem('depoisDoLogin', '../Chat/chat.html') });
  assert.match(w.document.querySelector('h1').textContent, /sessão expirou/i);
  assert.ok(w.document.querySelector('#conteudo a[href="../Login/login.html"]'));
  assert.equal(w.sessionStorage.getItem('depoisDoLogin'), '../Chat/chat.html', 'a volta continua guardada');
});

test('Erro genérico mostra só mensagens conhecidas para o motivo (sem refletir o endereço)', () => {
  const w = carregarPagina('Sistema/erro.html', { busca: '?motivo=armazenamento' });
  assert.match(w.document.getElementById('motivoErro').textContent, /armazenamento/i);
  const estranho = carregarPagina('Sistema/erro.html', { busca: '?motivo=%3Cimg%20src%3Dx%3E' });
  assert.doesNotMatch(estranho.document.getElementById('motivoErro').textContent, /<img/);
  assert.equal(estranho.document.querySelector('#motivoErro img'), null);
});

test('armazenamento bloqueado leva para a página de erro', () => {
  const w = carregarPagina('Home/home.html', {
    antes: (win) => Object.defineProperty(win, 'localStorage', { get() { throw new win.DOMException('bloqueado', 'SecurityError'); } }),
  });
  assert.equal(w.__redirecionadoPara, '../Sistema/erro.html?motivo=armazenamento');
});

test('404.html da raiz (GitHub Pages): CSP com hash do script inline, links calculados para a base do site', () => {
  const html = fs.readFileSync(path.join(RAIZ, '..', '404.html'), 'utf8');
  const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
  assert.ok(csp);
  assert.doesNotMatch(csp[1], /unsafe-inline/);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  assert.equal(scripts.length, 1);
  const hash = "'sha256-" + crypto.createHash('sha256').update(scripts[0]).digest('base64') + "'";
  assert.ok(csp[1].includes(hash), 'o script inline é autorizado pelo hash');
  const estilos = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  for (const estilo of estilos) {
    const h = "'sha256-" + crypto.createHash('sha256').update(estilo).digest('base64') + "'";
    assert.ok(csp[1].includes(h), 'o estilo inline é autorizado pelo hash');
  }
  assert.match(html, /Página não encontrada/);
  assert.match(html, /data-destino="Home\/home\.html"/);
});

test('index.html da raiz leva para a Home do próprio site (sem o endereço antigo da PUC)', () => {
  const html = fs.readFileSync(path.join(RAIZ, '..', 'index.html'), 'utf8');
  assert.match(html, /url=codigo-fonte\/Home\/home\.html/);
  assert.doesNotMatch(html, /icei-puc-minas|github\.io/);
  assert.match(html, /<html lang="pt-BR">/);
});

test('404: links calculados ficam sempre na mesma origem (sem open redirect por //host no caminho)', () => {
  const { JSDOM } = require('jsdom');
  const html = fs.readFileSync(path.join(RAIZ, '..', '404.html'), 'utf8');
  for (const url of [
    'https://usuario.github.io//evil.example/codigo-fonte/x',
    'https://usuario.github.io//evil.example/qualquer',
    'https://usuario.github.io/repo/codigo-fonte/nao-existe.html',
    'https://usuario.github.io/repo/nada',
    'http://127.0.0.1:8000/nada',
  ]) {
    const dom = new JSDOM(html, { url, runScripts: 'dangerously' });
    const links = [...dom.window.document.querySelectorAll('a[data-destino]')];
    assert.ok(links.length >= 2);
    for (const a of links) assert.equal(new URL(a.href).origin, new URL(url).origin, `${url} -> ${a.href}`);
  }
  const certo = new JSDOM(html, { url: 'https://usuario.github.io/repo/codigo-fonte/nao-existe.html', runScripts: 'dangerously' });
  assert.equal(certo.window.document.querySelector('a[data-destino]').href, 'https://usuario.github.io/repo/codigo-fonte/Home/home.html');
});

test('página aberta dentro de um iframe de outro site fica oculta (defesa contra clickjacking)', () => {
  const w = carregarPagina('Home/home.html');
  const falsa = { top: {}, self: {}, document: { documentElement: { hidden: false } } };
  assert.equal(w.GigLayout.bloquearMoldura(falsa), true);
  assert.equal(falsa.document.documentElement.hidden, true);
  const normal = { document: { documentElement: { hidden: false } } };
  normal.top = normal; normal.self = normal;
  assert.equal(w.GigLayout.bloquearMoldura(normal), false);
  assert.equal(normal.document.documentElement.hidden, false);
});
