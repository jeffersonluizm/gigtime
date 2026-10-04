const test = require('node:test');
const assert = require('node:assert/strict');
const { StorageMemoria, carregarPagina } = require('./apoio');
const M = require('../codigo-fonte/lib/mensagens.js');
const P = require('../codigo-fonte/lib/perfil.js');
const { CHAVE_USUARIOS, CHAVE_MENSAGENS } = require('../codigo-fonte/lib/armazenamento.js');

const msg = (de, para, texto, enviadaEm) => ({ id: `${enviadaEm}-${de}`, de, para, texto, enviadaEm });

test('enviarMensagem acrescenta a mensagem sem alterar a lista original', () => {
  const lista = [];
  const nova = M.enviarMensagem(lista, 'ana', 'bia', '  Oi, tudo bem?  ', 1000);
  assert.equal(lista.length, 0);
  assert.equal(nova.length, 1);
  assert.equal(nova[0].de, 'ana');
  assert.equal(nova[0].para, 'bia');
  assert.equal(nova[0].texto, 'Oi, tudo bem?');
  assert.equal(nova[0].enviadaEm, 1000);
  assert.ok(nova[0].id);
});

test('enviarMensagem recusa texto vazio e mensagem para si mesmo', () => {
  assert.equal(M.enviarMensagem([], 'ana', 'bia', '   ', 1), null);
  assert.equal(M.enviarMensagem([], 'ana', 'ana', 'oi', 1), null);
  assert.equal(M.enviarMensagem([], 'ana', '', 'oi', 1), null);
});

test('conversaEntre traz só as mensagens do par, nos dois sentidos, em ordem de envio', () => {
  const lista = [
    msg('bia', 'ana', 'segunda', 20),
    msg('ana', 'caio', 'outra conversa', 15),
    msg('ana', 'bia', 'primeira', 10),
  ];
  assert.deepEqual(M.conversaEntre(lista, 'ana', 'bia').map((m) => m.texto), ['primeira', 'segunda']);
  assert.deepEqual(M.conversaEntre(lista, 'bia', 'ana').map((m) => m.texto), ['primeira', 'segunda']);
});

test('listarConversas devolve uma entrada por pessoa, com a última mensagem, mais recente primeiro', () => {
  const lista = [
    msg('ana', 'bia', 'oi bia', 10),
    msg('caio', 'ana', 'oi ana', 30),
    msg('bia', 'ana', 'tudo bem', 20),
    msg('bia', 'caio', 'não é da ana', 40),
  ];
  const conversas = M.listarConversas(lista, 'ana');
  assert.deepEqual(conversas.map((c) => c.com), ['caio', 'bia']);
  assert.equal(conversas[1].ultima.texto, 'tudo bem');
});

test('ler e salvar mensagens no storage', () => {
  const local = new StorageMemoria();
  assert.deepEqual(M.lerMensagens(local), []);
  M.salvarMensagens(local, [msg('ana', 'bia', 'oi', 1)]);
  assert.equal(M.lerMensagens(local)[0].texto, 'oi');
  assert.deepEqual(M.lerMensagens(new StorageMemoria({ [CHAVE_MENSAGENS]: 'quebrado' })), []);
});

test('formatarHora mostra hora no mesmo dia e data nos outros', () => {
  const agora = new Date(2026, 9, 4, 18, 0).getTime();
  assert.equal(M.formatarHora(new Date(2026, 9, 4, 9, 5).getTime(), agora), '09:05');
  assert.equal(M.formatarHora(new Date(2026, 9, 1, 9, 5).getTime(), agora), '01/10');
});

test('"Contate-me" abre a conversa com a pessoa do perfil', () => {
  assert.equal(P.acaoDoPerfil({ username: 'ana.pereira' }, { username: 'sonic' }).href, '../Chat/chat.html?com=ana.pereira');
});

// Página do chat
const logado = (username, extra) => (win) => {
  win.sessionStorage.setItem('loggedInUser', JSON.stringify({ username }));
  if (extra) extra(win);
};

test('chat exige login e volta para a mesma conversa depois', () => {
  const w = carregarPagina('Chat/chat.html', { busca: '?com=sonic' });
  assert.equal(w.sessionStorage.getItem('depoisDoLogin'), '../Chat/chat.html?com=sonic');
});

test('chat aberto pelo perfil mostra a pessoa e envia mensagem gravada no localStorage', () => {
  const w = carregarPagina('Chat/chat.html', { busca: '?com=sonic', antes: logado('cartola') });
  const d = w.document;
  assert.equal(d.getElementById('nomeContato').textContent, 'Sonic Hedgehog');
  assert.equal(d.querySelector('.chatlist .chatBlock.active').dataset.username, 'sonic');

  d.getElementById('mensagem').value = 'Olá, Sonic!';
  d.getElementById('chatForm').dispatchEvent(new w.Event('submit', { cancelable: true }));

  const salvas = JSON.parse(w.localStorage.getItem(CHAVE_MENSAGENS));
  assert.equal(salvas.length, 1);
  assert.equal(salvas[0].de, 'cartola');
  assert.equal(salvas[0].para, 'sonic');
  const minhas = d.querySelectorAll('.chat .messagechat.myMessage p');
  assert.equal(minhas.length, 1);
  assert.match(minhas[0].textContent, /^Olá, Sonic!/);
  assert.equal(d.getElementById('mensagem').value, '');
});

test('chat lista as conversas existentes e mostra a mensagem recebida', () => {
  const w = carregarPagina('Chat/chat.html', {
    antes: logado('sonic', (win) => win.localStorage.setItem(CHAVE_MENSAGENS, JSON.stringify([
      msg('cartola', 'sonic', 'Bora tocar?', Date.now() - 1000),
    ]))),
  });
  const d = w.document;
  const blocos = d.querySelectorAll('.chatlist .chatBlock');
  assert.equal(blocos.length, 1);
  assert.equal(blocos[0].querySelector('h4').textContent, 'Cartola');
  assert.equal(blocos[0].querySelector('.message p').textContent, 'Bora tocar?');

  blocos[0].click();
  const delas = d.querySelectorAll('.chat .messagechat.friendMessage p');
  assert.equal(delas.length, 1);
  assert.match(delas[0].textContent, /^Bora tocar\?/);
});

test('chat mostra o texto da mensagem como texto, sem interpretar HTML', () => {
  const w = carregarPagina('Chat/chat.html', { busca: '?com=sonic', antes: logado('cartola') });
  const d = w.document;
  d.getElementById('mensagem').value = '<img src=x onerror="alert(1)">';
  d.getElementById('chatForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  assert.equal(d.querySelector('.chat img'), null);
  assert.match(d.querySelector('.chat .myMessage p').textContent, /<img src=x/);
});

test('chat não envia mensagem vazia', () => {
  const w = carregarPagina('Chat/chat.html', { busca: '?com=sonic', antes: logado('cartola') });
  w.document.getElementById('mensagem').value = '   ';
  w.document.getElementById('chatForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  assert.equal(w.localStorage.getItem(CHAVE_MENSAGENS), null);
});

test('chat atualiza quando outra aba grava mensagem', () => {
  const w = carregarPagina('Chat/chat.html', { busca: '?com=cartola', antes: logado('sonic') });
  w.localStorage.setItem(CHAVE_MENSAGENS, JSON.stringify([msg('cartola', 'sonic', 'Chegou?', Date.now())]));
  w.dispatchEvent(new w.StorageEvent('storage', { key: CHAVE_MENSAGENS }));
  assert.equal(w.document.querySelectorAll('.chat .friendMessage').length, 1);
});

test('a navbar do usuário logado tem o link para as mensagens', () => {
  const w = carregarPagina('Home/home.html', { antes: logado('cartola') });
  const link = w.document.querySelector('.navbar-nav a[href="../Chat/chat.html"]');
  assert.ok(link);
  assert.equal(link.textContent.trim(), 'Mensagens');
});

test('enviarMensagem aceita até 2000 caracteres e recusa acima disso', () => {
  assert.equal(M.LIMITE_TEXTO, 2000);
  assert.equal(M.enviarMensagem([], 'ana', 'bia', 'a'.repeat(2000), 1).length, 1);
  assert.equal(M.enviarMensagem([], 'ana', 'bia', 'a'.repeat(2001), 1), null);
});

class StorageCheio {
  getItem() { return null; }
  setItem() {
    const erro = new Error('cheio');
    erro.name = 'QuotaExceededError';
    throw erro;
  }
  removeItem() {}
}

test('salvarMensagens devolve false quando o armazenamento está cheio', () => {
  assert.equal(M.salvarMensagens(new StorageCheio(), [msg('ana', 'bia', 'oi', 1)]), false);
  assert.equal(M.salvarMensagens(new StorageMemoria(), [msg('ana', 'bia', 'oi', 1)]), true);
});

test('salvarMensagens não esconde erro que não seja de cota', () => {
  const quebrado = { setItem() { throw new TypeError('outro'); } };
  assert.throws(() => M.salvarMensagens(quebrado, []), TypeError);
});

test('chat limita o campo a 2000 caracteres', () => {
  const w = carregarPagina('Chat/chat.html', { busca: '?com=sonic', antes: logado('cartola') });
  assert.equal(w.document.getElementById('mensagem').maxLength, 2000);
});

test('chat avisa quando não há espaço para gravar e mantém o texto digitado', () => {
  const w = carregarPagina('Chat/chat.html', { busca: '?com=sonic', antes: logado('cartola') });
  const original = w.Storage.prototype.setItem;
  w.Storage.prototype.setItem = function () {
    const erro = new Error('cheio');
    erro.name = 'QuotaExceededError';
    throw erro;
  };
  try {
    w.document.getElementById('mensagem').value = 'Mensagem grande';
    w.document.getElementById('chatForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  } finally {
    w.Storage.prototype.setItem = original;
  }
  assert.equal(w.__alertas.length, 1);
  assert.match(w.__alertas[0], /espaço/);
  assert.equal(w.document.getElementById('mensagem').value, 'Mensagem grande');
});

test('balão de mensagem quebra palavras longas (overflow-wrap)', () => {
  const css = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'codigo-fonte', 'Chat', 'stylesheet.css'), 'utf8');
  const regras = [...css.matchAll(/\.messagechat p\s*\{([^}]*)\}/g)].map((m) => m[1]).join('');
  assert.match(regras, /overflow-wrap:\s*anywhere/);
});

test("chat sem login guarda a conversa de username com ' ( ) * ! ~ e o login volta para ela", () => {
  const A = require('../codigo-fonte/lib/armazenamento.js');
  const estranho = "o'brien(1)*!~ x";
  const w = carregarPagina('Chat/chat.html', { busca: '?com=' + encodeURIComponent(estranho) });
  const destino = A.destinoDepoisDoLogin(w.sessionStorage);
  assert.ok(destino, 'o destino passa na lista de caminhos aceitos');
  assert.equal(new URLSearchParams(destino.split('?')[1]).get('com'), estranho);
});

test('chat sem login e sem conversa escolhida volta para a lista', () => {
  const w = carregarPagina('Chat/chat.html');
  assert.equal(w.sessionStorage.getItem('depoisDoLogin'), '../Chat/chat.html');
});

function trocarUsuarios(w, transformar) {
  const { CHAVE_USUARIOS } = require('../codigo-fonte/lib/armazenamento.js');
  const lista = JSON.parse(w.localStorage.getItem(CHAVE_USUARIOS));
  w.localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(transformar(lista)));
  w.dispatchEvent(new w.StorageEvent('storage', { key: CHAVE_USUARIOS }));
}

test('chat atualiza nome e foto do contato quando outra aba edita o perfil dele', () => {
  const w = carregarPagina('Chat/chat.html', { busca: '?com=sonic', antes: logado('cartola') });
  trocarUsuarios(w, (lista) => lista.map((u) => (u.username === 'sonic' ? { ...u, name: 'Super Sonic', profilePicLink: 'novo.jpg' } : u)));
  const d = w.document;
  assert.equal(d.getElementById('nomeContato').textContent, 'Super Sonic');
  assert.match(d.getElementById('fotoContato').src, /novo\.jpg$/);
  assert.equal(d.querySelector('.chatlist .chatBlock h4').textContent, 'Super Sonic');
});

test('chat não quebra quando o contato da conversa deixa de existir', () => {
  const w = carregarPagina('Chat/chat.html', {
    busca: '?com=sonic',
    antes: logado('cartola', (win) => win.localStorage.setItem(CHAVE_MENSAGENS, JSON.stringify([msg('cartola', 'sonic', 'oi', Date.now())]))),
  });
  trocarUsuarios(w, (lista) => lista.filter((u) => u.username !== 'sonic'));
  const d = w.document;
  assert.equal(d.getElementById('nomeContato').textContent, 'Mensagens');
  assert.equal(d.getElementById('mensagem').disabled, true);
  assert.equal(d.querySelector('.chatlist .chatBlock h4').textContent, 'sonic', 'a conversa antiga continua listada pelo username');
});

test('conversa nova com contato que deixou de existir some da lista', () => {
  const w = carregarPagina('Chat/chat.html', { busca: '?com=sonic', antes: logado('cartola') });
  trocarUsuarios(w, (lista) => lista.filter((u) => u.username !== 'sonic'));
  assert.equal(w.document.querySelectorAll('.chatlist .chatBlock').length, 0);
});

// Telas estreitas: a página alterna entre lista e conversa pela classe "conversa-aberta"
const container = (w) => w.document.querySelector('body > .container');

test('chat com conversa escolhida marca a tela como conversa aberta', () => {
  const w = carregarPagina('Chat/chat.html', { busca: '?com=sonic', antes: logado('cartola') });
  assert.equal(container(w).classList.contains('conversa-aberta'), true);
});

test('chat sem conversa escolhida mostra a lista', () => {
  const w = carregarPagina('Chat/chat.html', { antes: logado('cartola') });
  assert.equal(container(w).classList.contains('conversa-aberta'), false);
});

test('"voltar" fecha a conversa e volta para a lista; abrir de novo pela lista reabre', () => {
  const w = carregarPagina('Chat/chat.html', {
    busca: '?com=sonic',
    antes: logado('cartola', (win) => win.localStorage.setItem(CHAVE_MENSAGENS, JSON.stringify([msg('cartola', 'sonic', 'oi', Date.now())]))),
  });
  const d = w.document;
  d.getElementById('voltarLista').click();
  assert.equal(container(w).classList.contains('conversa-aberta'), false);
  assert.equal(d.getElementById('nomeContato').textContent, 'Mensagens');
  assert.equal(w.location.search, '');
  d.querySelector('.chatlist .chatBlock').click();
  assert.equal(container(w).classList.contains('conversa-aberta'), true);
  assert.equal(w.location.search, '?com=sonic');
});

test('CSS do chat: em tela estreita mostra lista ou conversa e o botão voltar', () => {
  const css = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'codigo-fonte', 'Chat', 'stylesheet.css'), 'utf8');
  const estreita = css.match(/@media\s*\(max-width:\s*767\.98px\)\s*\{([\s\S]*)\}\s*$/);
  assert.ok(estreita, 'existe media query para telas estreitas');
  assert.match(estreita[1], /\.container\.conversa-aberta \.leftside\s*\{[^}]*display:\s*none/);
  assert.match(estreita[1], /\.container\.conversa-aberta \.rightside\s*\{[^}]*display:\s*block/);
  assert.match(estreita[1], /\.imgtext \.voltar\s*\{[^}]*display:\s*flex/);
});

test('CSS do chat: altura em tela estreita usa 100dvh com 100vh antes como fallback', () => {
  const css = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'codigo-fonte', 'Chat', 'stylesheet.css'), 'utf8');
  const estreita = css.match(/@media\s*\(max-width:\s*767\.98px\)\s*\{([\s\S]*)\}\s*$/)[1];
  const container = estreita.match(/\n\s*\.container\s*\{([^}]*)\}/)[1];
  assert.match(container, /height:\s*calc\(100vh - 100px\);\s*height:\s*calc\(100dvh - 100px\);/);
});
