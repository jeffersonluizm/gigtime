// As chaves do localStorage levam o prefixo "gigtime:" porque, no GitHub Pages, o site divide
// a origem com outros repositórios do mesmo usuário. Chaves antigas sem prefixo são migradas.
const test = require('node:test');
const assert = require('node:assert/strict');
const { StorageMemoria, carregarPagina } = require('./apoio');
const A = require('../codigo-fonte/lib/armazenamento.js');
const M = require('../codigo-fonte/lib/mensagens.js');

const usuario = (username, extra = {}) => ({ username, name: username, role: 'Músico', genres: ['Rock'], badges: [], passwordHash: 'h', ...extra });
const mensagem = (id, enviadaEm = 1) => ({ id, de: 'ana', para: 'bia', texto: 'oi', enviadaEm });

test('as chaves do localStorage têm o prefixo gigtime:', () => {
  assert.equal(A.CHAVE_USUARIOS, 'gigtime:users');
  assert.equal(A.CHAVE_MENSAGENS, 'gigtime:messages');
  assert.equal(M.CHAVE_MENSAGENS, A.CHAVE_MENSAGENS);
});

test('migrarChavesAntigas move users e messages para as chaves novas', () => {
  const local = new StorageMemoria({
    users: JSON.stringify([usuario('ana')]),
    messages: JSON.stringify([mensagem('m1')]),
  });
  assert.equal(A.migrarChavesAntigas(local), true);
  assert.deepEqual(JSON.parse(local.getItem('gigtime:users')).map((u) => u.username), ['ana']);
  assert.deepEqual(JSON.parse(local.getItem('gigtime:messages')).map((m) => m.id), ['m1']);
  assert.equal(local.getItem('users'), null);
  assert.equal(local.getItem('messages'), null);
});

test('migrarChavesAntigas mescla com o que já existe e a chave nova vence', () => {
  const local = new StorageMemoria({
    users: JSON.stringify([usuario('ana', { city: 'Velha' }), usuario('bia')]),
    'gigtime:users': JSON.stringify([usuario('ana', { city: 'Nova' })]),
    messages: JSON.stringify([mensagem('m1'), mensagem('m2', 2)]),
    'gigtime:messages': JSON.stringify([mensagem('m1')]),
  });
  A.migrarChavesAntigas(local);
  const users = JSON.parse(local.getItem('gigtime:users'));
  assert.deepEqual(users.map((u) => [u.username, u.city]), [['ana', 'Nova'], ['bia', undefined]]);
  assert.deepEqual(JSON.parse(local.getItem('gigtime:messages')).map((m) => m.id), ['m1', 'm2']);
});

test('migrarChavesAntigas é idempotente', () => {
  const local = new StorageMemoria({ users: JSON.stringify([usuario('ana')]), messages: JSON.stringify([mensagem('m1')]) });
  A.migrarChavesAntigas(local);
  const depoisDaPrimeira = JSON.stringify([...local.dados]);
  assert.equal(A.migrarChavesAntigas(local), false);
  assert.equal(JSON.stringify([...local.dados]), depoisDaPrimeira);
});

test('migrarChavesAntigas não mexe em dados de outro site na mesma origem', () => {
  const alheio = JSON.stringify([{ id: 7, nome: 'outro app' }]);
  const local = new StorageMemoria({ users: alheio, messages: '"texto qualquer"' });
  assert.equal(A.migrarChavesAntigas(local), false);
  assert.equal(local.getItem('users'), alheio);
  assert.equal(local.getItem('messages'), '"texto qualquer"');
  assert.equal(local.getItem('gigtime:users'), null);
});

test('global.js migra as chaves antigas antes de semear os usuários de exemplo', () => {
  const w = carregarPagina('Home/home.html', {
    antes: (win) => {
      win.localStorage.setItem('users', JSON.stringify([usuario('antigo', { state: 'MG', city: 'BH' })]));
      win.localStorage.setItem('messages', JSON.stringify([mensagem('m1')]));
    },
  });
  assert.deepEqual(JSON.parse(w.localStorage.getItem('gigtime:users')).map((u) => u.username), ['antigo']);
  assert.equal(JSON.parse(w.localStorage.getItem('gigtime:messages')).length, 1);
  assert.equal(w.localStorage.getItem('users'), null);
});

// Dado de app vizinho na mesma origem (GitHub Pages) não pode ser mesclado nem apagado
test('migrarDaSessao ignora e preserva dado de outro app no sessionStorage["users"]', () => {
  const alheio = JSON.stringify([{ id: 1, nome: 'outro app' }]);
  const local = new StorageMemoria();
  const sessao = new StorageMemoria({ users: alheio });
  assert.equal(A.migrarDaSessao(local, sessao), false);
  assert.equal(sessao.getItem('users'), alheio);
  assert.equal(local.getItem(A.CHAVE_USUARIOS), null);
});

test('migrarDaSessao leva só os usuários válidos e deixa os outros itens na chave antiga', () => {
  const local = new StorageMemoria();
  const sessao = new StorageMemoria({ users: JSON.stringify([usuario('ana'), { id: 1 }]) });
  assert.equal(A.migrarDaSessao(local, sessao), true);
  assert.deepEqual(JSON.parse(local.getItem(A.CHAVE_USUARIOS)).map((u) => u.username), ['ana']);
  assert.deepEqual(JSON.parse(sessao.getItem('users')), [{ id: 1 }]);
});

test('migrarChavesAntigas migra os itens válidos e mantém os inválidos na chave antiga', () => {
  const local = new StorageMemoria({
    users: JSON.stringify([usuario('ana'), { id: 7 }]),
    messages: JSON.stringify([mensagem('m1'), { qualquer: true }]),
  });
  assert.equal(A.migrarChavesAntigas(local), true);
  assert.deepEqual(JSON.parse(local.getItem('gigtime:users')).map((u) => u.username), ['ana']);
  assert.deepEqual(JSON.parse(local.getItem('gigtime:messages')).map((m) => m.id), ['m1']);
  assert.deepEqual(JSON.parse(local.getItem('users')), [{ id: 7 }]);
  assert.deepEqual(JSON.parse(local.getItem('messages')), [{ qualquer: true }]);
  // idempotente: na segunda vez só sobraram itens inválidos
  assert.equal(A.migrarChavesAntigas(local), false);
  assert.deepEqual(JSON.parse(local.getItem('users')), [{ id: 7 }]);
});
