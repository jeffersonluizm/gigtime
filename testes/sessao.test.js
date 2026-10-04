const test = require('node:test');
const assert = require('node:assert/strict');
const { StorageMemoria } = require('./apoio');
const Sessao = require('../codigo-fonte/lib/sessao.js');
const C = require('../codigo-fonte/lib/constantes.js');

test('constantes: UFs, gêneros e papéis têm uma fonte só', () => {
  assert.equal(C.UFS.length, 27);
  assert.ok(C.UFS.includes('MG') && C.UFS.includes('DF'));
  assert.deepEqual(C.GENEROS, ['Sertanejo', 'Rock', 'MPB', 'Pop', 'Forró', 'Jazz']);
  assert.deepEqual(C.PAPEIS, ['Músico', 'Contratante']);
});

test('entrar grava o usuário sem senha nem hash; usuarioLogado lê de volta', () => {
  const sessao = new StorageMemoria();
  Sessao.entrar(sessao, { username: 'ana', name: 'Ana', passwordHash: 'h', password: 'p' });
  const logado = Sessao.usuarioLogado(sessao);
  assert.equal(logado.username, 'ana');
  assert.equal('passwordHash' in logado || 'password' in logado, false);
});

test('usuarioLogado devolve null sem sessão ou com JSON quebrado', () => {
  assert.equal(Sessao.usuarioLogado(new StorageMemoria()), null);
  assert.equal(Sessao.usuarioLogado(new StorageMemoria({ [C.CHAVES_SESSAO.LOGADO]: '{quebrado' })), null);
  assert.equal(Sessao.usuarioLogado(new StorageMemoria({ [C.CHAVES_SESSAO.LOGADO]: '{"name":"sem username"}' })), null);
});

test('sair limpa o usuário logado, o perfil escolhido e o filtro de papel', () => {
  const sessao = new StorageMemoria({
    [C.CHAVES_SESSAO.LOGADO]: '{"username":"ana"}', [C.CHAVES_SESSAO.ESCOLHIDO]: '{"username":"bia"}', [C.CHAVES_SESSAO.PAPEL]: 'Músico',
  });
  Sessao.sair(sessao);
  assert.equal(Sessao.usuarioLogado(sessao), null);
  assert.equal(sessao.getItem(C.CHAVES_SESSAO.ESCOLHIDO), null);
  assert.equal(sessao.getItem(C.CHAVES_SESSAO.PAPEL), null);
});

test('escolherPerfil guarda o perfil sem senha e perfilEscolhido devolve', () => {
  const sessao = new StorageMemoria();
  Sessao.escolherPerfil(sessao, { username: 'bia', passwordHash: 'h' });
  assert.deepEqual(Sessao.perfilEscolhido(sessao), { username: 'bia' });
});

test('exigirLogin sem sessão guarda o destino e manda para o login', () => {
  const sessao = new StorageMemoria();
  const navegou = [];
  const logado = Sessao.exigirLogin(sessao, '../Chat/chat.html?com=ana', (url) => navegou.push(url));
  assert.equal(logado, null);
  assert.equal(sessao.getItem('depoisDoLogin'), '../Chat/chat.html?com=ana');
  assert.deepEqual(navegou, ['../Login/login.html']);
});

test('exigirLogin com sessão devolve o usuário e não navega', () => {
  const sessao = new StorageMemoria({ [C.CHAVES_SESSAO.LOGADO]: '{"username":"ana"}' });
  const navegou = [];
  assert.equal(Sessao.exigirLogin(sessao, '../x/x.html', (url) => navegou.push(url)).username, 'ana');
  assert.deepEqual(navegou, []);
});

test('destinoDepoisDoLogin só aceita páginas do próprio site e é lido uma vez', () => {
  const sessao = new StorageMemoria({ depoisDoLogin: '../Chat/chat.html?com=ana' });
  assert.equal(Sessao.destinoDepoisDoLogin(sessao), '../Chat/chat.html?com=ana');
  assert.equal(Sessao.destinoDepoisDoLogin(sessao), null);
  assert.equal(Sessao.destinoDepoisDoLogin(new StorageMemoria({ depoisDoLogin: 'https://mal.example/x.html' })), null);
  assert.equal(Sessao.destinoDepoisDoLogin(new StorageMemoria({ depoisDoLogin: 'javascript:alert(1)' })), null);
});

test('o endereço antigo com acento (Anúncios) redireciona para anuncios/', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'codigo-fonte', 'Anúncios', 'anuncios.html'), 'utf8');
  assert.match(html, /<meta http-equiv="refresh" content="0; url=\.\.\/anuncios\/anuncios\.html">/);
});
