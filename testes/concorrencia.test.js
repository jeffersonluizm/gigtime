// Cadastro e edição gravam depois de um await (hash da senha). Se outra aba gravar usuários
// nesse meio tempo, a gravação não pode apagar o que a outra aba fez.
const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const { StorageMemoria, carregarPagina, esperar } = require('./apoio');
const A = require('../codigo-fonte/lib/armazenamento.js');

// Troca o WebCrypto da página por um que executa `efeito` (a "outra aba") durante o primeiro hash
function outraAbaDuranteOHash(w, efeito) {
  let feito = false;
  const subtle = {
    digest: async (alg, dados) => {
      if (!feito) { feito = true; efeito(); }
      return webcrypto.subtle.digest(alg, dados);
    },
  };
  Object.defineProperty(w, 'crypto', { value: { subtle }, configurable: true });
}

const usuarios = (w) => JSON.parse(w.localStorage.getItem(A.CHAVE_USUARIOS));
const outro = (username, extra = {}) => ({ username, name: username, email: username + '@ex.com', phone: username, role: 'Músico', state: 'MG', city: 'BH', genres: ['Rock'], badges: [], passwordHash: 'h', ...extra });
const adicionar = (w, u) => w.localStorage.setItem(A.CHAVE_USUARIOS, JSON.stringify(usuarios(w).concat([u])));

function preencherCadastro(w) {
  const campos = {
    username: 'novo', name: 'Novo', email: 'novo@ex.com', phone: '(31) 1111-2222',
    role: 'Músico', state: 'MG', city: 'BH', password: 'minhasenha', confirmPassword: 'minhasenha',
  };
  for (const [id, valor] of Object.entries(campos)) w.document.getElementById(id).value = valor;
  w.document.getElementById('genreRock').checked = true;
}

test('substituirUsuario troca só o usuário indicado na lista atual do storage', () => {
  const local = new StorageMemoria({ [A.CHAVE_USUARIOS]: JSON.stringify([outro('ana'), outro('bia')]) });
  assert.equal(A.substituirUsuario(local, outro('bia', { city: 'Nova' })), true);
  assert.deepEqual(A.lerUsuarios(local).map((u) => [u.username, u.city]), [['ana', 'BH'], ['bia', 'Nova']]);
  assert.equal(A.substituirUsuario(local, outro('caio')), false);
  assert.equal(A.lerUsuarios(local).length, 2);
});

test('cadastro não apaga usuário gravado por outra aba durante o hash', async () => {
  const w = carregarPagina('Registro/registro.html');
  preencherCadastro(w);
  outraAbaDuranteOHash(w, () => adicionar(w, outro('outraaba')));
  w.document.getElementById('registerForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperar();
  const nomes = usuarios(w).map((u) => u.username);
  assert.ok(nomes.includes('outraaba'));
  assert.ok(nomes.includes('novo'));
});

test('cadastro não duplica username registrado por outra aba durante o hash', async () => {
  const w = carregarPagina('Registro/registro.html');
  preencherCadastro(w);
  outraAbaDuranteOHash(w, () => adicionar(w, outro('novo', { email: 'x@ex.com', phone: 'x' })));
  w.document.getElementById('registerForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperar();
  assert.equal(usuarios(w).filter((u) => u.username === 'novo').length, 1);
  assert.equal(usuarios(w).find((u) => u.username === 'novo').email, 'x@ex.com');
  assert.equal(w.__alertas.length, 1);
});

test('edição de perfil não apaga usuário gravado por outra aba durante o hash', async () => {
  const w = carregarPagina('EdicaoPerfil/EdicaoPerfil.html', {
    antes: (win) => win.sessionStorage.setItem('loggedInUser', JSON.stringify({ username: 'cartola' })),
  });
  const $ = (id) => w.document.getElementById(id);
  $('city').value = 'Niterói';
  $('senhaAtual').value = 'cartolinha';
  $('novaSenha').value = 'nova123';
  $('confirmacao').value = 'nova123';
  outraAbaDuranteOHash(w, () => adicionar(w, outro('outraaba')));
  $('editForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperar(60);
  const lista = usuarios(w);
  assert.ok(lista.some((u) => u.username === 'outraaba'));
  assert.equal(lista.find((u) => u.username === 'cartola').city, 'Niterói');
});
