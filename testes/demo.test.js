// Modo demonstração: entrar com um clique como músico ou contratante; contas de demonstração protegidas
const test = require('node:test');
const assert = require('node:assert/strict');
const { carregarPagina, esperarAte } = require('./apoio');
const Demo = require('../codigo-fonte/dados/demo.js');
const S = require('../codigo-fonte/lib/senha.js');
const exemplos = require('../codigo-fonte/dados/usuarios-exemplo.js');

test('demo.js é a fonte única das contas de demonstração e da senha delas', async () => {
  assert.equal(Demo.contas.musico, 'lia.batera');
  assert.equal(Demo.contas.contratante, 'casa.lume');
  assert.ok(await S.autenticar(exemplos, Demo.contas.musico, Demo.senha), 'a senha confere com o hash do seed');
  assert.equal(Demo.ehContaDemo('lia.batera'), true);
  assert.equal(Demo.ehContaDemo('casa.lume'), true);
  assert.equal(Demo.ehContaDemo('arraia.do.sol'), true, 'todas as personas são de demonstração');
  assert.equal(Demo.ehContaDemo('carla.nova'), false);
});

for (const [papel, username] of [['musico', 'lia.batera'], ['contratante', 'casa.lume']]) {
  test(`login: "Entrar como ${papel}" entra com um clique`, async () => {
    const w = carregarPagina('Login/login.html');
    w.document.querySelector(`[data-entrar-como="${papel}"]`).click();
    await esperarAte(() => w.sessionStorage.getItem('loggedInUser'));
    assert.equal(JSON.parse(w.sessionStorage.getItem('loggedInUser')).username, username);
  });
}

test('Home oferece "Entrar como músico" e "Entrar como contratante"', () => {
  const w = carregarPagina('Home/home.html');
  assert.ok(w.document.querySelector('a[href="../Login/login.html?demo=musico"]'));
  assert.ok(w.document.querySelector('a[href="../Login/login.html?demo=contratante"]'));
});

test('login com ?demo=contratante entra direto como contratante', async () => {
  const w = carregarPagina('Login/login.html', { busca: '?demo=contratante' });
  await esperarAte(() => w.sessionStorage.getItem('loggedInUser'));
  assert.equal(JSON.parse(w.sessionStorage.getItem('loggedInUser')).username, 'casa.lume');
});

const logado = (username) => (win) => win.sessionStorage.setItem('loggedInUser', JSON.stringify({ username }));

test('conta de demonstração não troca a senha nem é apagada (mas pode restaurar a demonstração)', async () => {
  const w = carregarPagina('Conta/conta.html', { antes: logado('lia.batera') });
  const $ = (id) => w.document.getElementById(id);
  $('senhaAtualTroca').value = Demo.senha;
  $('novaSenha').value = 'outraSenha99';
  $('confirmacaoSenha').value = 'outraSenha99';
  $('formSenha').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperarAte(() => w.document.querySelector('#formSenha [data-erro-formulario]').textContent);
  assert.match(w.document.querySelector('#formSenha [data-erro-formulario]').textContent, /demonstração/);
  assert.ok(await S.autenticar(JSON.parse(w.localStorage.getItem('gigtime:users')), 'lia.batera', Demo.senha));
  $('senhaApagar').value = Demo.senha;
  $('formApagar').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperarAte(() => $('senhaApagar').classList.contains('is-invalid'));
  assert.equal(w.document.querySelector('dialog'), null);
  assert.ok(JSON.parse(w.localStorage.getItem('gigtime:users')).some((u) => u.username === 'lia.batera'));
});

test('o atalho da demonstração está na primeira dobra da Home e na navbar de quem não está logado', () => {
  const w = carregarPagina('Home/home.html');
  const d = w.document;
  for (const papel of ['musico', 'contratante']) {
    assert.ok(d.querySelector(`.hero a[href="../Login/login.html?demo=${papel}"]`), `hero: ${papel}`);
    assert.ok(d.querySelector(`#topo a[href="../Login/login.html?demo=${papel}"]`), `navbar: ${papel}`);
  }
  const logado = carregarPagina('Home/home.html', { antes: (win) => win.sessionStorage.setItem('loggedInUser', JSON.stringify({ username: 'davi.sax' })) });
  assert.equal(logado.document.querySelector('#topo a[href*="?demo="]'), null, 'logado não vê o atalho na navbar');
});

// Conversas de demonstração: o chat das contas demo já começa com mensagens (e não lidas)
const M = require('../codigo-fonte/lib/mensagens.js');

test('demo.js traz conversas que envolvem as duas contas de demonstração, só entre personas', () => {
  const nomes = exemplos.map((u) => u.username);
  assert.ok(Demo.conversas.length >= 5);
  for (const m of Demo.conversas) {
    assert.ok(nomes.includes(m.de) && nomes.includes(m.para), `${m.de} -> ${m.para}`);
    assert.ok(typeof m.texto === 'string' && m.texto.length > 0 && m.minutosAtras > 0);
  }
  for (const conta of Object.values(Demo.contas)) assert.ok(Demo.conversas.some((m) => m.para === conta), conta);
});

test('semearConversas grava cada mensagem na chave do autor, com horário relativo a agora', () => {
  const { StorageMemoria } = require('./apoio');
  const local = new StorageMemoria();
  const agora = 1800000000000;
  assert.equal(M.semearConversas(local, [{ de: 'ana', para: 'bia', texto: 'oi', minutosAtras: 10 }, { de: 'bia', para: 'ana', texto: 'olá', minutosAtras: 5 }], agora), 2);
  assert.deepEqual(JSON.parse(local.getItem('gigtime:messages:ana')).map((m) => [m.texto, m.enviadaEm]), [['oi', agora - 600000]]);
  assert.deepEqual(M.conversaEntre(M.lerMensagens(local), 'ana', 'bia').map((m) => m.texto), ['oi', 'olá']);
});

test('primeira visita: o chat da conta de músico já tem conversas e mensagens não lidas', () => {
  const w = carregarPagina('Home/home.html');
  const msgs = M.lerMensagens(w.localStorage);
  assert.equal(msgs.length, Demo.conversas.length);
  assert.ok(M.naoLidas(msgs, Demo.contas.musico, {}) >= 2);
  assert.ok(M.naoLidas(msgs, Demo.contas.contratante, {}) >= 2);
});

test('quem já tem dados não recebe as conversas de demonstração por cima', () => {
  const w = carregarPagina('Home/home.html', {
    antes: (win) => win.localStorage.setItem('gigtime:users', JSON.stringify(exemplos)),
  });
  assert.equal(M.lerMensagens(w.localStorage).length, 0);
});

test('login.html?demo= com uma conta própria logada pede confirmação antes de trocar', async () => {
  const minha = (win) => win.sessionStorage.setItem('loggedInUser', JSON.stringify({ username: 'carla.nova', name: 'Carla' }));
  const w = carregarPagina('Login/login.html', { busca: '?demo=musico', antes: minha });
  await esperarAte(() => w.document.querySelector('dialog'));
  assert.match(w.document.querySelector('dialog').textContent, /carla\.nova|Carla/);
  w.document.querySelector('dialog [data-resposta="nao"]').click();
  await esperarAte(() => !w.document.querySelector('dialog'));
  assert.equal(JSON.parse(w.sessionStorage.getItem('loggedInUser')).username, 'carla.nova', 'cancelar mantém a sessão');

  const w2 = carregarPagina('Login/login.html', { busca: '?demo=musico', antes: minha });
  await esperarAte(() => w2.document.querySelector('dialog'));
  w2.document.querySelector('dialog [data-resposta="sim"]').click();
  await esperarAte(() => JSON.parse(w2.sessionStorage.getItem('loggedInUser')).username === 'lia.batera');
});

test('login.html?demo= com outra conta de demonstração logada troca direto', async () => {
  const w = carregarPagina('Login/login.html', {
    busca: '?demo=musico',
    antes: (win) => win.sessionStorage.setItem('loggedInUser', JSON.stringify({ username: 'casa.lume' })),
  });
  await esperarAte(() => JSON.parse(w.sessionStorage.getItem('loggedInUser')).username === 'lia.batera');
  assert.equal(w.document.querySelector('dialog'), null);
});
