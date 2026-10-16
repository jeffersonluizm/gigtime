const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { StorageMemoria, carregarPagina, esperar, esperarAte } = require('./apoio');
const S = require('../codigo-fonte/lib/senha.js');
const { CHAVE_USUARIOS, CHAVE_MENSAGENS } = require('../codigo-fonte/lib/armazenamento.js');

const sha = (texto) => createHash('sha256').update(texto, 'utf8').digest('hex');

const RAPIDO = { iteracoes: 1000 };
const FORMATO = /^pbkdf2-sha256\$(\d+)\$([A-Za-z0-9+/=]+)\$([A-Za-z0-9+/=]+)$/;

test('gerarHash usa PBKDF2-SHA256 com 600 mil iterações por padrão', async () => {
  assert.equal(S.ITERACOES_PADRAO, 600000);
  const hash = await S.gerarHash('segredo');
  const [, iteracoes, sal] = hash.match(FORMATO);
  assert.equal(Number(iteracoes), 600000);
  assert.equal(Buffer.from(sal, 'base64').length, 16, 'sal de 16 bytes');
});

test('gerarHash sorteia o sal: a mesma senha gera hashes diferentes', async () => {
  assert.notEqual(await S.gerarHash('123', RAPIDO), await S.gerarHash('123', RAPIDO));
});

test('gerarHash aceita número de iterações injetado (testes) pelo global GIGTIME_ITERACOES_PBKDF2', async () => {
  globalThis.GIGTIME_ITERACOES_PBKDF2 = 1234;
  try {
    assert.equal(Number((await S.gerarHash('x')).match(FORMATO)[1]), 1234);
  } finally {
    delete globalThis.GIGTIME_ITERACOES_PBKDF2;
  }
});

test('conferirSenha aceita a senha certa e recusa a errada', async () => {
  const hash = await S.gerarHash('segredo', RAPIDO);
  assert.equal(await S.conferirSenha({ username: 'ana', passwordHash: hash }, 'segredo'), true);
  assert.equal(await S.conferirSenha({ username: 'ana', passwordHash: hash }, 'errada'), false);
  assert.equal(await S.conferirSenha({ username: 'ana', passwordHash: 'pbkdf2-sha256$x$y$z' }, 'segredo'), false, 'hash malformado não passa');
});

test('autenticar aceita PBKDF2, o SHA-256 legado e o texto puro legado', async () => {
  const usuarios = [
    { username: 'ana', passwordHash: await S.gerarHash('segredo', RAPIDO) },
    { username: 'bia', passwordHash: sha('gigtime:bia:legado') },
    { username: 'caio', password: 'velha' },
  ];
  assert.equal((await S.autenticar(usuarios, 'ana', 'segredo')).username, 'ana');
  assert.equal((await S.autenticar(usuarios, 'bia', 'legado')).username, 'bia');
  assert.equal((await S.autenticar(usuarios, 'caio', 'velha')).username, 'caio');
  assert.equal(await S.autenticar(usuarios, 'ana', 'errada'), null);
  assert.equal(await S.autenticar(usuarios, 'bia', 'errada'), null);
  assert.equal(await S.autenticar(usuarios, 'zeca', 'segredo'), null);
});

test('precisaAtualizar marca legado e PBKDF2 com menos iterações que o padrão', async () => {
  assert.equal(S.precisaAtualizar({ passwordHash: sha('x') }), true);
  assert.equal(S.precisaAtualizar({ password: 'x' }), true);
  assert.equal(S.precisaAtualizar({ passwordHash: await S.gerarHash('x', RAPIDO) }), true);
  assert.equal(S.precisaAtualizar({ passwordHash: 'pbkdf2-sha256$600000$c2Fs$aGFzaA==' }), false);
  assert.equal(S.precisaAtualizar({ passwordHash: 'pbkdf2-sha256$1000$c2Fs$aGFzaA==' }, { iteracoes: 1000 }), false);
});

test('autenticarEAtualizar troca o hash legado por PBKDF2 no login certo', async () => {
  const local = new StorageMemoria({
    [CHAVE_USUARIOS]: JSON.stringify([
      { username: 'ana', passwordHash: sha('gigtime:ana:segredo') },
      { username: 'bia', password: 'velha' },
    ]),
  });
  const ana = await S.autenticarEAtualizar(local, CHAVE_USUARIOS, 'ana', 'segredo', RAPIDO);
  assert.equal(ana.username, 'ana');
  const [salva] = JSON.parse(local.getItem(CHAVE_USUARIOS));
  assert.match(salva.passwordHash, FORMATO);
  assert.ok(await S.autenticar([salva], 'ana', 'segredo'));
  await S.autenticarEAtualizar(local, CHAVE_USUARIOS, 'bia', 'velha', RAPIDO);
  const bia = JSON.parse(local.getItem(CHAVE_USUARIOS))[1];
  assert.equal('password' in bia, false, 'texto puro sai no login');
  assert.match(bia.passwordHash, FORMATO);
});

test('autenticarEAtualizar com senha errada devolve null e não grava nada', async () => {
  const inicial = JSON.stringify([{ username: 'ana', passwordHash: sha('gigtime:ana:segredo') }]);
  const local = new StorageMemoria({ [CHAVE_USUARIOS]: inicial });
  assert.equal(await S.autenticarEAtualizar(local, CHAVE_USUARIOS, 'ana', 'errada', RAPIDO), null);
  assert.equal(local.getItem(CHAVE_USUARIOS), inicial);
});

test('autenticarEAtualizar relê o storage antes de gravar (não apaga o que outra aba gravou)', async () => {
  const local = new StorageMemoria({ [CHAVE_USUARIOS]: JSON.stringify([{ username: 'ana', passwordHash: sha('gigtime:ana:segredo') }]) });
  const original = local.getItem.bind(local);
  let leituras = 0;
  local.getItem = (chave) => {
    leituras++;
    if (leituras === 2) local.dados.set(CHAVE_USUARIOS, JSON.stringify(JSON.parse(original(chave)).concat([{ username: 'novo', passwordHash: 'h' }])));
    return original(chave);
  };
  await S.autenticarEAtualizar(local, CHAVE_USUARIOS, 'ana', 'segredo', RAPIDO);
  assert.deepEqual(JSON.parse(original(CHAVE_USUARIOS)).map((u) => u.username), ['ana', 'novo']);
});

test('migrarSenhasDoStorage troca senha em texto puro por PBKDF2 e mantém os demais', async () => {
  const local = new StorageMemoria({
    [CHAVE_USUARIOS]: JSON.stringify([
      { username: 'ana', password: 'velha' },
      { username: 'bia', passwordHash: 'abc' },
    ]),
  });
  assert.equal(await S.migrarSenhasDoStorage(local, CHAVE_USUARIOS, RAPIDO), 1);
  const [ana, bia] = JSON.parse(local.getItem(CHAVE_USUARIOS));
  assert.equal('password' in ana, false);
  assert.match(ana.passwordHash, FORMATO);
  assert.ok(await S.autenticar([ana], 'ana', 'velha'));
  assert.deepEqual(bia, { username: 'bia', passwordHash: 'abc' });
});

test('o seed não traz senha em texto puro e as senhas de demonstração funcionam', async () => {
  const w = carregarPagina('Home/home.html');
  const usuarios = JSON.parse(w.localStorage.getItem(CHAVE_USUARIOS));
  assert.equal(usuarios.some((u) => 'password' in u), false);
    assert.ok(usuarios.every((u) => /^pbkdf2-sha256\$600000\$/.test(u.passwordHash)), 'seed com PBKDF2 de 600 mil iterações');
  assert.ok(await S.autenticar(usuarios, 'lia.batera', 'demo1234'));
  assert.ok(await S.autenticar(usuarios, 'casa.lume', 'demo1234'));
});

test('inicializacao.js converte as senhas antigas migradas da sessão', async () => {
  const w = carregarPagina('Home/home.html', {
    antes: (win) => win.sessionStorage.setItem('users', JSON.stringify([{ username: 'antigo', role: 'Músico', genres: [], badges: [], password: 'p' }])),
  });
  await esperar();
  const [antigo] = JSON.parse(w.localStorage.getItem(CHAVE_USUARIOS));
  assert.equal('password' in antigo, false);
  assert.match(antigo.passwordHash, FORMATO);
  assert.ok(await S.autenticar([antigo], 'antigo', 'p'));
});

function preencher(w, campos) {
  for (const [id, valor] of Object.entries(campos)) w.document.getElementById(id).value = valor;
}

test('login com a senha certa grava o usuário logado (sem hash) na sessão', async () => {
  const w = carregarPagina('Login/login.html');
  preencher(w, { username: 'davi.sax', password: 'demo1234' });
  w.document.getElementById('loginForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperarAte(() => w.sessionStorage.getItem('loggedInUser'));
  const logado = JSON.parse(w.sessionStorage.getItem('loggedInUser'));
  assert.equal(logado.username, 'davi.sax');
  assert.equal('passwordHash' in logado, false);
});

test('login com senha errada não loga e avisa', async () => {
  const w = carregarPagina('Login/login.html');
  preencher(w, { username: 'davi.sax', password: 'errada123' });
  w.document.getElementById('loginForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  const erro = w.document.querySelector('[data-erro-formulario]');
  await esperarAte(() => erro.textContent);
  assert.equal(w.sessionStorage.getItem('loggedInUser'), null);
  assert.match(erro.textContent, /Usuário ou senha incorretos/);
  assert.equal(w.__alertas, undefined, 'sem alert()');
  assert.equal(w.document.getElementById('password').value, '', 'a senha digitada é apagada');
});

test('login: a página oferece as contas de demonstração e o caminho honesto para quem esqueceu a senha', () => {
  const w = carregarPagina('Login/login.html');
  const d = w.document;
  assert.match(d.getElementById('contasDemo').textContent, /lia\.batera/);
  assert.match(d.getElementById('contasDemo').textContent, /demo1234/);
  assert.ok(d.querySelector('a[href="../Acesso/esqueci-senha.html"]'));
  assert.ok(d.querySelector('a[href="../Registro/registro.html"]'));
});

test('login com sucesso deixa um aviso de boas-vindas para a próxima página', async () => {
  const w = carregarPagina('Login/login.html');
  preencher(w, { username: 'lia.batera', password: 'demo1234' });
  w.document.getElementById('loginForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperarAte(() => w.sessionStorage.getItem('gigtime:aviso'));
  assert.match(JSON.parse(w.sessionStorage.getItem('gigtime:aviso')).texto, /Lia Fontes/);
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
  const novo = JSON.parse(w.localStorage.getItem(CHAVE_USUARIOS)).find((u) => u.username === 'novo');
  assert.ok(novo, 'usuário cadastrado');
  assert.equal('password' in novo, false);
  assert.match(novo.passwordHash, FORMATO);
  assert.ok(await S.autenticar([novo], 'novo', 'minhasenha'));
});
