// Página Conta: exportar os próprios dados, apagar a conta, restaurar a demonstração e uso do armazenamento
const test = require('node:test');
const assert = require('node:assert/strict');
const { StorageMemoria } = require('./apoio');
const Conta = require('../codigo-fonte/lib/conta.js');
const { CHAVE_USUARIOS, CHAVE_MENSAGENS, CHAVE_LIDAS } = require('../codigo-fonte/lib/armazenamento.js');

const usuario = (username) => ({ username, name: username, role: 'Músico', genres: ['Rock'], passwordHash: 'pbkdf2-sha256$1$c2Fs$aGFzaA==' });
const msg = (id, de, para) => ({ id, de, para, texto: id, enviadaEm: 1 });

function local() {
  return new StorageMemoria({
    [CHAVE_USUARIOS]: JSON.stringify([usuario('ana'), usuario('bia')]),
    [CHAVE_MENSAGENS]: JSON.stringify([msg('m1', 'ana', 'bia'), msg('m2', 'bia', 'ana'), msg('m3', 'bia', 'caio')]),
    [CHAVE_LIDAS]: JSON.stringify({ ana: { bia: 5 }, bia: { ana: 7 } }),
    'outro-app': 'intocado',
  });
}

test('exportarDados traz o perfil sem hash e só as conversas da pessoa', () => {
  const dados = Conta.exportarDados(local(), 'ana', 1700000000000);
  assert.equal(dados.perfil.username, 'ana');
  assert.equal('passwordHash' in dados.perfil, false);
  assert.deepEqual(dados.mensagens.map((m) => m.id), ['m1', 'm2']);
  assert.equal(dados.exportadoEm, new Date(1700000000000).toISOString());
  assert.match(dados.aviso, /senha não é exportada/i);
});

test('apagarConta tira o usuário, as mensagens dele e as leituras, e preserva o resto', () => {
  const storage = local();
  assert.equal(Conta.apagarConta(storage, 'ana'), true);
  assert.deepEqual(JSON.parse(storage.getItem(CHAVE_USUARIOS)).map((u) => u.username), ['bia']);
  assert.deepEqual(JSON.parse(storage.getItem(CHAVE_MENSAGENS)).map((m) => m.id), ['m3']);
  assert.deepEqual(JSON.parse(storage.getItem(CHAVE_LIDAS)), { bia: {} }, 'some a leitura de ana e a leitura que outros tinham da conversa com ana');
  assert.equal(storage.getItem('outro-app'), 'intocado');
  assert.equal(Conta.apagarConta(storage, 'zeca'), false);
});

test('restaurarDemo volta os usuários de exemplo, apaga mensagens e leituras e não toca em outros apps', () => {
  const storage = local();
  Conta.restaurarDemo(storage, [usuario('seed1'), usuario('seed2')]);
  assert.deepEqual(JSON.parse(storage.getItem(CHAVE_USUARIOS)).map((u) => u.username), ['seed1', 'seed2']);
  assert.equal(storage.getItem(CHAVE_MENSAGENS), null);
  assert.equal(storage.getItem(CHAVE_LIDAS), null);
  assert.equal(storage.getItem('outro-app'), 'intocado');
});

test('usoDoArmazenamento soma só as chaves do GigTime, em caracteres e em relação à cota estimada', () => {
  const storage = local();
  const uso = Conta.usoDoArmazenamento(storage);
  const esperado = [CHAVE_USUARIOS, CHAVE_MENSAGENS, CHAVE_LIDAS].reduce((total, chave) => total + chave.length + storage.getItem(chave).length, 0);
  assert.equal(uso.caracteres, esperado);
  assert.equal(uso.cotaEstimada, 5 * 1024 * 1024);
  assert.ok(uso.percentual > 0 && uso.percentual < 1);
});

test('conta: apagar, exportar, restaurar e medir consideram também as mensagens gravadas por autor', () => {
  const storage = local();
  storage.setItem('gigtime:messages:ana', JSON.stringify([msg('a1', 'ana', 'bia')]));
  storage.setItem('gigtime:messages:bia', JSON.stringify([msg('b1', 'bia', 'ana'), msg('b2', 'bia', 'caio')]));
  assert.deepEqual(Conta.exportarDados(storage, 'ana', 1).mensagens.map((m) => m.id).sort(), ['a1', 'b1', 'm1', 'm2']);
  const uso = Conta.usoDoArmazenamento(storage).caracteres;
  assert.ok(uso > Conta.usoDoArmazenamento(local()).caracteres);
  Conta.apagarConta(storage, 'ana');
  assert.equal(storage.getItem('gigtime:messages:ana'), null);
  assert.deepEqual(JSON.parse(storage.getItem('gigtime:messages:bia')).map((m) => m.id), ['b2']);
  Conta.restaurarDemo(storage, []);
  assert.equal(storage.getItem('gigtime:messages:bia'), null);
  assert.equal(storage.getItem('outro-app'), 'intocado');
});
