const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { StorageMemoria, carregarPagina, esperar } = require('./apoio');
const S = require('../codigo-fonte/lib/senha.js');

const sha = (texto) => createHash('sha256').update(texto, 'utf8').digest('hex');

test('hashSenha calcula SHA-256 em hexadecimal com o username como sal', async () => {
  assert.equal(await S.hashSenha('ana', 'segredo'), sha('gigtime:ana:segredo'));
});

test('hashSenha dá resultados diferentes para a mesma senha em usuários diferentes', async () => {
  assert.notEqual(await S.hashSenha('ana', '123'), await S.hashSenha('bia', '123'));
});

test('autenticar aceita a senha certa e recusa a errada ou usuário inexistente', async () => {
  const usuarios = [{ username: 'ana', passwordHash: sha('gigtime:ana:segredo') }];
  assert.equal((await S.autenticar(usuarios, 'ana', 'segredo')).username, 'ana');
  assert.equal(await S.autenticar(usuarios, 'ana', 'errada'), null);
  assert.equal(await S.autenticar(usuarios, 'bia', 'segredo'), null);
});

test('autenticar ainda aceita usuário antigo com senha em texto puro', async () => {
  const usuarios = [{ username: 'ana', password: 'velha' }];
  assert.equal((await S.autenticar(usuarios, 'ana', 'velha')).username, 'ana');
  assert.equal(await S.autenticar(usuarios, 'ana', 'outra'), null);
});

test('migrarSenhasDoStorage troca senha em texto puro por hash e mantém os demais', async () => {
  const local = new StorageMemoria({
    users: JSON.stringify([
      { username: 'ana', password: 'velha' },
      { username: 'bia', passwordHash: 'abc' },
    ]),
  });
  assert.equal(await S.migrarSenhasDoStorage(local), 1);
  const [ana, bia] = JSON.parse(local.getItem('users'));
  assert.equal('password' in ana, false);
  assert.equal(ana.passwordHash, sha('gigtime:ana:velha'));
  assert.deepEqual(bia, { username: 'bia', passwordHash: 'abc' });
});

test('o seed não traz senha em texto puro e as senhas de demonstração funcionam', async () => {
  const w = carregarPagina('Home/home.html');
  const usuarios = JSON.parse(w.localStorage.getItem('users'));
  assert.equal(usuarios.some((u) => 'password' in u), false);
  assert.ok(usuarios.every((u) => /^[0-9a-f]{64}$/.test(u.passwordHash)));
  assert.ok(await S.autenticar(usuarios, 'sonic', 'sonic'));
  assert.ok(await S.autenticar(usuarios, 'jazzburger', 'plannerpro2024'));
});

test('global.js converte as senhas antigas migradas da sessão', async () => {
  const w = carregarPagina('Home/home.html', {
    antes: (win) => win.sessionStorage.setItem('users', JSON.stringify([{ username: 'antigo', role: 'Músico', genres: [], badges: [], password: 'p' }])),
  });
  await esperar();
  const [antigo] = JSON.parse(w.localStorage.getItem('users'));
  assert.equal('password' in antigo, false);
  assert.equal(antigo.passwordHash, sha('gigtime:antigo:p'));
});

function preencher(w, campos) {
  for (const [id, valor] of Object.entries(campos)) w.document.getElementById(id).value = valor;
}

test('login com a senha certa grava o usuário logado (sem hash) na sessão', async () => {
  const w = carregarPagina('Login/login.html');
  preencher(w, { username: 'cartola', password: 'cartolinha' });
  w.document.getElementById('loginForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperar();
  const logado = JSON.parse(w.sessionStorage.getItem('loggedInUser'));
  assert.equal(logado.username, 'cartola');
  assert.equal('passwordHash' in logado, false);
});

test('login com senha errada não loga e avisa', async () => {
  const w = carregarPagina('Login/login.html');
  preencher(w, { username: 'cartola', password: 'cartola' });
  w.document.getElementById('loginForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperar();
  assert.equal(w.sessionStorage.getItem('loggedInUser'), null);
  assert.deepEqual(w.__alertas, ['Usuário ou senha inválidos!']);
});

test('cadastro guarda o hash da senha e não a senha', async () => {
  const w = carregarPagina('Registro/registro.html');
  preencher(w, {
    username: 'novo', name: 'Novo', email: 'novo@ex.com', phone: '(31) 1111-2222',
    role: 'Músico', state: 'MG', city: 'BH', password: 'minhasenha', confirmPassword: 'minhasenha',
  });
  w.document.getElementById('genreRock').checked = true;
  w.document.getElementById('registerForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperar();
  const novo = JSON.parse(w.localStorage.getItem('users')).find((u) => u.username === 'novo');
  assert.ok(novo, 'usuário cadastrado');
  assert.equal('password' in novo, false);
  assert.equal(novo.passwordHash, sha('gigtime:novo:minhasenha'));
});
