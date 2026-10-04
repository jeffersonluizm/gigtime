// Página Conta e dados: trocar senha, exportar, apagar conta, restaurar demonstração e sair
const test = require('node:test');
const assert = require('node:assert/strict');
const { carregarPagina, esperarAte } = require('./apoio');
const S = require('../codigo-fonte/lib/senha.js');
const { CHAVE_USUARIOS, CHAVE_MENSAGENS } = require('../codigo-fonte/lib/armazenamento.js');

const logado = (username, extra) => (win) => {
  win.sessionStorage.setItem('loggedInUser', JSON.stringify({ username }));
  if (extra) extra(win);
};
const usuarios = (w) => JSON.parse(w.localStorage.getItem(CHAVE_USUARIOS));
const confirmarDialogo = (w) => w.document.querySelector('dialog [data-resposta="sim"]').click();

test('Conta exige login', () => {
  const w = carregarPagina('Conta/conta.html');
  assert.equal(w.sessionStorage.getItem('depoisDoLogin'), '../Conta/conta.html');
});

test('Conta mostra quem está logado e quanto do armazenamento o GigTime usa', () => {
  const w = carregarPagina('Conta/conta.html', { antes: logado('lia.batera') });
  assert.match(w.document.getElementById('contaUsuario').textContent, /lia\.batera/);
  assert.match(w.document.getElementById('usoArmazenamento').textContent, /KB/);
});

test('trocar senha com a senha atual errada mostra o erro no campo', async () => {
  const w = carregarPagina('Conta/conta.html', { antes: logado('lia.batera') });
  const $ = (id) => w.document.getElementById(id);
  $('senhaAtualTroca').value = 'errada123';
  $('novaSenha').value = 'novaSenha99';
  $('confirmacaoSenha').value = 'novaSenha99';
  $('formSenha').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperarAte(() => $('senhaAtualTroca').classList.contains('is-invalid'));
  assert.ok(await S.autenticar(usuarios(w), 'lia.batera', 'demo1234'), 'a senha não mudou');
});

test('trocar senha válida grava o hash novo e avisa', async () => {
  const w = carregarPagina('Conta/conta.html', { antes: logado('lia.batera') });
  const $ = (id) => w.document.getElementById(id);
  $('senhaAtualTroca').value = 'demo1234';
  $('novaSenha').value = 'novaSenha99';
  $('confirmacaoSenha').value = 'novaSenha99';
  $('formSenha').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperarAte(() => w.document.querySelector('.aviso'));
  assert.ok(await S.autenticar(usuarios(w), 'lia.batera', 'novaSenha99'));
  assert.equal($('novaSenha').value, '', 'os campos de senha são limpos');
});

test('exportar gera um arquivo JSON com o perfil (sem hash) e as conversas', () => {
  const w = carregarPagina('Conta/conta.html', { antes: logado('lia.batera') });
  w.document.getElementById('exportar').click();
  const link = w.document.getElementById('linkExportado');
  assert.equal(link.getAttribute('download'), 'gigtime-lia.batera.json');
  const conteudo = decodeURIComponent(link.getAttribute('href').replace(/^data:application\/json;charset=utf-8,/, ''));
  const dados = JSON.parse(conteudo);
  assert.equal(dados.perfil.username, 'lia.batera');
  assert.equal('passwordHash' in dados.perfil, false);
});

test('apagar a conta pede a senha e a confirmação, apaga os dados e encerra a sessão', async () => {
  const w = carregarPagina('Conta/conta.html', {
    antes: logado('lia.batera', (win) => win.localStorage.setItem(CHAVE_MENSAGENS, JSON.stringify([
      { id: 'm1', de: 'lia.batera', para: 'davi.sax', texto: 'oi', enviadaEm: 1 },
      { id: 'm2', de: 'davi.sax', para: 'casa.lume', texto: 'oi', enviadaEm: 2 },
    ]))),
  });
  const $ = (id) => w.document.getElementById(id);
  $('senhaApagar').value = 'demo1234';
  $('formApagar').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperarAte(() => w.document.querySelector('dialog'));
  assert.match(w.document.querySelector('dialog').textContent, /Apagar sua conta/);
  confirmarDialogo(w);
  await esperarAte(() => !usuarios(w).some((u) => u.username === 'lia.batera'));
  assert.deepEqual(JSON.parse(w.localStorage.getItem(CHAVE_MENSAGENS)).map((m) => m.id), ['m2']);
  assert.equal(w.sessionStorage.getItem('loggedInUser'), null);
});

test('apagar a conta com senha errada não apaga nada', async () => {
  const w = carregarPagina('Conta/conta.html', { antes: logado('lia.batera') });
  const $ = (id) => w.document.getElementById(id);
  $('senhaApagar').value = 'errada123';
  $('formApagar').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperarAte(() => $('senhaApagar').classList.contains('is-invalid'));
  assert.equal(w.document.querySelector('dialog'), null);
  assert.ok(usuarios(w).some((u) => u.username === 'lia.batera'));
});

test('cancelar o diálogo não apaga a conta', async () => {
  const w = carregarPagina('Conta/conta.html', { antes: logado('lia.batera') });
  const $ = (id) => w.document.getElementById(id);
  $('senhaApagar').value = 'demo1234';
  $('formApagar').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperarAte(() => w.document.querySelector('dialog'));
  w.document.querySelector('dialog [data-resposta="nao"]').click();
  await esperarAte(() => !w.document.querySelector('dialog'));
  assert.ok(usuarios(w).some((u) => u.username === 'lia.batera'));
});

test('restaurar a demonstração volta as personas e apaga mensagens, depois de confirmar', async () => {
  const w = carregarPagina('Conta/conta.html', {
    antes: logado('lia.batera', (win) => win.localStorage.setItem(CHAVE_MENSAGENS, JSON.stringify([{ id: 'm1', de: 'lia.batera', para: 'davi.sax', texto: 'oi', enviadaEm: 1 }]))),
  });
  w.document.getElementById('restaurarDemo').click();
  await esperarAte(() => w.document.querySelector('dialog'));
  confirmarDialogo(w);
  await esperarAte(() => w.localStorage.getItem(CHAVE_MENSAGENS) === null);
  assert.equal(usuarios(w).length, 10);
  assert.equal(w.sessionStorage.getItem('loggedInUser'), null);
});
