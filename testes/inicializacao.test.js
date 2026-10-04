// O inicializacao.js roda em todas as páginas: falha de armazenamento não pode derrubar navbar nem seed
const test = require('node:test');
const assert = require('node:assert/strict');
const { carregarPagina } = require('./apoio');

const usuario = (username) => ({ username, name: username, role: 'Músico', genres: ['Rock'], badges: [], passwordHash: 'h' });

test('inicializacao.js não quebra a página quando o armazenamento está cheio', () => {
  const avisos = [];
  const w = carregarPagina('Home/home.html', {
    antes: (win) => {
      win.localStorage.setItem('users', JSON.stringify([usuario('antigo')]));
      win.sessionStorage.setItem('users', JSON.stringify([usuario('dasessao')]));
      win.console.warn = (...a) => avisos.push(a.join(' '));
      win.Storage.prototype.setItem = function () {
        const erro = new Error('cheio');
        erro.name = 'QuotaExceededError';
        throw erro;
      };
    },
  });
  assert.match(w.document.querySelector('.navbar-nav').textContent, /Entrar/);
  assert.ok(avisos.length >= 1, 'avisa no console');
});
