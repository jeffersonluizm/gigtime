// Página de cadastro: validações, cota do armazenamento e login automático
const test = require('node:test');
const assert = require('node:assert/strict');
const { carregarPagina, esperarAte } = require('./apoio');
const { CHAVE_USUARIOS } = require('../codigo-fonte/lib/armazenamento.js');

const VALIDOS = {
  username: 'carla.gaita', name: 'Carla Souza', email: 'carla@exemplo.com', phone: '(31) 91234-5678',
  role: 'Músico', state: 'MG', city: 'Belo Horizonte', password: 'segredo123', confirmPassword: 'segredo123',
};

function preencher(w, extra = {}) {
  for (const [id, valor] of Object.entries({ ...VALIDOS, ...extra })) w.document.getElementById(id).value = valor;
  w.document.getElementById('genreRock').checked = true;
}
const enviar = (w) => w.document.getElementById('registerForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
const usuarios = (w) => JSON.parse(w.localStorage.getItem(CHAVE_USUARIOS));
const erroDe = (w, campo) => w.document.querySelector(`.invalid-feedback[data-campo="${campo}"]`).textContent;

test('cadastro recusa senha curta e mostra o erro no campo', async () => {
  const w = carregarPagina('Registro/registro.html');
  preencher(w, { password: 'curta', confirmPassword: 'curta' });
  enviar(w);
  await esperarAte(() => w.document.getElementById('password').classList.contains('is-invalid'));
  assert.match(erroDe(w, 'senha'), /8 caracteres/);
  assert.equal(usuarios(w).some((u) => u.username === 'carla.gaita'), false);
});

test('cadastro recusa link de imagem sem https e telefone sem DDD', async () => {
  const w = carregarPagina('Registro/registro.html');
  preencher(w, { profilePicLink: 'http://img.exemplo.com/a.jpg', phone: '1234-5678' });
  enviar(w);
  await esperarAte(() => w.document.getElementById('phone').classList.contains('is-invalid'));
  assert.ok(w.document.getElementById('profilePicLink').classList.contains('is-invalid'));
  assert.equal(usuarios(w).some((u) => u.username === 'carla.gaita'), false);
});

test('cadastro: apresentação e disponibilidade opcionais vão para o perfil novo', async () => {
  const w = carregarPagina('Registro/registro.html');
  preencher(w, { bio: 'Gaita e voz.', disponibilidade: 'Domingos' });
  enviar(w);
  await esperarAte(() => w.sessionStorage.getItem('loggedInUser'));
  const carla = usuarios(w).find((u) => u.username === 'carla.gaita');
  assert.equal(carla.bio, 'Gaita e voz.');
  assert.equal(carla.disponibilidade, 'Domingos');
  assert.match(JSON.parse(w.sessionStorage.getItem('gigtime:aviso')).texto, /Conta criada/);
});

test('cadastro com sucesso já entra na conta (sessão sem hash)', async () => {
  const w = carregarPagina('Registro/registro.html');
  preencher(w);
  enviar(w);
  await esperarAte(() => w.sessionStorage.getItem('loggedInUser'));
  const logado = JSON.parse(w.sessionStorage.getItem('loggedInUser'));
  assert.equal(logado.username, 'carla.gaita');
  assert.equal('passwordHash' in logado, false);
  assert.ok(usuarios(w).some((u) => u.username === 'carla.gaita'));
});

test('cadastro avisa quando o navegador não tem espaço e não entra na conta', async () => {
  const w = carregarPagina('Registro/registro.html');
  preencher(w);
  const original = w.Storage.prototype.setItem;
  w.Storage.prototype.setItem = function (chave, valor) {
    if (chave === CHAVE_USUARIOS) {
      const erro = new Error('cheio');
      erro.name = 'QuotaExceededError';
      throw erro;
    }
    return original.call(this, chave, valor);
  };
  enviar(w);
  await esperarAte(() => w.document.querySelector('[data-erro-formulario]').textContent);
  assert.match(w.document.querySelector('[data-erro-formulario]').textContent, /espaço/);
  assert.equal(w.sessionStorage.getItem('loggedInUser'), null);
});
