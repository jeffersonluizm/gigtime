const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { StorageMemoria, carregarPagina, esperar, esperarAte, RAIZ } = require('./apoio');
const P = require('../codigo-fonte/lib/perfil.js');
const S = require('../codigo-fonte/lib/senha.js');
const A = require('../codigo-fonte/lib/armazenamento.js');
const { CHAVE_USUARIOS, CHAVE_MENSAGENS } = require('../codigo-fonte/lib/armazenamento.js');

const RAPIDO = { iteracoes: 1000 };

async function base() {
  return [
    {
      username: 'ana', name: 'Ana', email: 'ana@ex.com', phone: '(41) 3333-1111', role: 'Músico', state: 'PR', city: 'Curitiba',
      genres: ['Jazz'], rating: 4.2, badges: ['Jazz Lover'], profilePicLink: 'https://img.ex.com/a.jpg', bannerPicLink: '../assets/demo/ana/banner.svg',
      songLink: '', bio: '', disponibilidade: '', userPicsLinks: ['x'], passwordHash: await S.gerarHash('velha123', RAPIDO),
    },
    {
      username: 'bia', name: 'Bia', email: 'bia@ex.com', phone: '(31) 98888-2222', role: 'Contratante', state: 'MG', city: 'BH',
      genres: ['Pop'], rating: 5, badges: [], profilePicLink: 'https://img.ex.com/c.jpg', bannerPicLink: 'https://img.ex.com/d.jpg', songLink: '',
      userPicsLinks: [], passwordHash: 'h',
    },
  ];
}

const dadosDe = (u, extra = {}) => ({
  name: u.name, email: u.email, phone: u.phone, role: u.role, state: u.state, city: u.city, genres: u.genres,
  profilePicLink: u.profilePicLink, bannerPicLink: u.bannerPicLink, songLink: u.songLink, bio: u.bio, disponibilidade: u.disponibilidade, ...extra,
});
const campos = (erros) => erros.map((e) => e.campo).sort();

test('acaoDoPerfil: no próprio perfil é editar, no perfil de outro é contato', () => {
  assert.equal(P.acaoDoPerfil({ username: 'ana' }, { username: 'ana' }).tipo, 'editar');
  assert.equal(P.acaoDoPerfil({ username: 'ana' }, { username: 'ana' }).href, '../EdicaoPerfil/EdicaoPerfil.html');
  assert.equal(P.acaoDoPerfil({ username: 'bia' }, { username: 'ana' }).tipo, 'contato');
  assert.equal(P.acaoDoPerfil({ username: 'bia' }, null).tipo, 'contato');
});

test('validarDadosPerfil aponta campo obrigatório vazio e falta de gênero', async () => {
  const [ana] = await base();
  const erros = P.validarDadosPerfil(dadosDe(ana, { name: '  ', genres: [] }), await base(), 'ana');
  assert.deepEqual(campos(erros), ['genres', 'name']);
});

test('validarDadosPerfil recusa e-mail ou telefone de outro usuário, mas aceita os próprios', async () => {
  const lista = await base();
  assert.deepEqual(P.validarDadosPerfil(dadosDe(lista[0]), lista, 'ana'), []);
  const erros = P.validarDadosPerfil(dadosDe(lista[0], { email: 'bia@ex.com', phone: '(31) 98888-2222' }), lista, 'ana');
  assert.deepEqual(campos(erros), ['email', 'phone']);
});

test('validarDadosPerfil recusa e-mail e telefone em formato inválido', async () => {
  const lista = await base();
  const erros = P.validarDadosPerfil(dadosDe(lista[0], { email: 'ana@', phone: '1234' }), lista, 'ana');
  assert.deepEqual(campos(erros), ['email', 'phone']);
});

test('validarDadosPerfil aceita só imagem https (ou ilustração do próprio site) e vídeo do YouTube', async () => {
  const lista = await base();
  const erros = P.validarDadosPerfil(dadosDe(lista[0], {
    profilePicLink: 'http://img.ex.com/a.jpg', bannerPicLink: 'javascript:alert(1)', songLink: 'https://vimeo.com/123',
  }), lista, 'ana');
  assert.deepEqual(campos(erros), ['bannerPicLink', 'profilePicLink', 'songLink']);
  assert.deepEqual(P.validarDadosPerfil(dadosDe(lista[0], { songLink: 'https://youtu.be/dQw4w9WgXcQ' }), lista, 'ana'), []);
});

test('validarDadosPerfil limita bio a 280 e disponibilidade a 80 caracteres', async () => {
  const lista = await base();
  const erros = P.validarDadosPerfil(dadosDe(lista[0], { bio: 'a'.repeat(281), disponibilidade: 'b'.repeat(81) }), lista, 'ana');
  assert.deepEqual(campos(erros), ['bio', 'disponibilidade']);
});

test('atualizarPerfil exige a senha atual para salvar', async () => {
  const lista = await base();
  for (const senha of [undefined, '', 'errada']) {
    const r = await P.atualizarPerfil(lista, 'ana', dadosDe(lista[0], { city: 'Londrina' }), senha);
    assert.equal(r.ok, false);
    assert.deepEqual(campos(r.erros), ['senhaAtual']);
  }
});

test('atualizarPerfil troca os campos editáveis e preserva username, nota, selos e hash', async () => {
  const lista = await base();
  const r = await P.atualizarPerfil(lista, 'ana', dadosDe(lista[0], {
    name: 'Ana Paula', city: 'Londrina', genres: ['Jazz', 'MPB'], profilePicLink: '', bio: ' Toco jazz. ', disponibilidade: 'Sábados',
    songLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s',
  }), 'velha123');
  assert.equal(r.ok, true);
  const ana = r.usuarios[0];
  assert.equal(ana.name, 'Ana Paula');
  assert.equal(ana.city, 'Londrina');
  assert.deepEqual(ana.genres, ['Jazz', 'MPB']);
  assert.equal(ana.profilePicLink, P.FOTO_PADRAO, 'sem link volta para a foto padrão');
  assert.equal(ana.bio, 'Toco jazz.');
  assert.equal(ana.disponibilidade, 'Sábados');
  assert.equal(ana.songLink, 'https://youtu.be/dQw4w9WgXcQ', 'o vídeo é guardado pelo ID, num formato único');
  assert.equal(ana.username, 'ana');
  assert.equal(ana.rating, 4.2);
  assert.deepEqual(ana.badges, ['Jazz Lover']);
  assert.equal(ana.passwordHash, lista[0].passwordHash);
  assert.equal(r.usuarios[1], lista[1], 'os outros usuários não mudam');
  assert.equal(lista[0].name, 'Ana', 'a lista original não é alterada');
});

test('atualizarPerfil com erro de validação não devolve lista nova', async () => {
  const lista = await base();
  const r = await P.atualizarPerfil(lista, 'ana', dadosDe(lista[0], { city: '' }), 'velha123');
  assert.equal(r.ok, false);
  assert.deepEqual(campos(r.erros), ['city']);
});

test('trocarSenha exige a senha atual, a política de senha e a confirmação igual', async () => {
  const lista = await base();
  const errada = await P.trocarSenha(lista, 'ana', { atual: 'x', nova: 'novaSenha1', confirmacao: 'novaSenha1' });
  assert.deepEqual(campos(errada.erros), ['senhaAtual']);
  const curta = await P.trocarSenha(lista, 'ana', { atual: 'velha123', nova: 'curta', confirmacao: 'curta' });
  assert.deepEqual(campos(curta.erros), ['novaSenha']);
  const diferente = await P.trocarSenha(lista, 'ana', { atual: 'velha123', nova: 'novaSenha1', confirmacao: 'novaSenha2' });
  assert.deepEqual(campos(diferente.erros), ['confirmacao']);
});

test('trocarSenha válida grava um hash PBKDF2 novo', async () => {
  const lista = await base();
  const r = await P.trocarSenha(lista, 'ana', { atual: 'velha123', nova: 'novaSenha1', confirmacao: 'novaSenha1' }, RAPIDO);
  assert.equal(r.ok, true);
  assert.ok(await S.autenticar(r.usuarios, 'ana', 'novaSenha1'));
  assert.equal(await S.autenticar(r.usuarios, 'ana', 'velha123'), null);
  assert.equal('password' in r.usuarios[0], false);
});

test('validarCadastro confere usuário, senha e os dados do perfil', async () => {
  const lista = await base();
  const novo = (extra = {}) => ({
    username: 'carla', name: 'Carla', email: 'carla@ex.com', phone: '(11) 91234-5678', role: 'Músico', state: 'SP', city: 'SP',
    genres: ['Rock'], profilePicLink: '', bannerPicLink: '', songLink: '', bio: '', disponibilidade: '', senha: 'segredo12', confirmacao: 'segredo12', ...extra,
  });
  assert.deepEqual(P.validarCadastro(novo(), lista), []);
  assert.deepEqual(campos(P.validarCadastro(novo({ username: 'ana' }), lista)), ['username'], 'username já usado');
  assert.deepEqual(campos(P.validarCadastro(novo({ username: 'com espaço' }), lista)), ['username']);
  assert.deepEqual(campos(P.validarCadastro(novo({ senha: 'curta', confirmacao: 'curta' }), lista)), ['senha']);
  assert.deepEqual(campos(P.validarCadastro(novo({ confirmacao: 'outra1234' }), lista)), ['confirmacao']);
  assert.deepEqual(campos(P.validarCadastro(novo({ email: 'ana@ex.com' }), lista)), ['email']);
});

test('criarUsuario monta o usuário novo com os padrões e sem a senha em texto', () => {
  const u = P.criarUsuario({
    username: 'carla', name: ' Carla ', email: 'carla@ex.com', phone: '(11) 91234-5678', role: 'Músico', state: 'SP', city: 'SP',
    genres: ['Rock'], profilePicLink: '', bannerPicLink: '', songLink: 'https://youtu.be/dQw4w9WgXcQ', bio: '', disponibilidade: '', senha: 'segredo12', confirmacao: 'segredo12',
  }, 'HASH');
  assert.equal(u.name, 'Carla');
  assert.equal(u.passwordHash, 'HASH');
  assert.equal(u.rating, 0);
  assert.deepEqual(u.badges, ['Novato']);
  assert.deepEqual(u.userPicsLinks, []);
  assert.equal(u.profilePicLink, P.FOTO_PADRAO);
  assert.equal(u.bannerPicLink, P.BANNER_PADRAO);
  assert.equal(u.songLink, 'https://youtu.be/dQw4w9WgXcQ');
  assert.equal('senha' in u || 'confirmacao' in u, false);
});

// Página de edição
const html = fs.readFileSync(path.join(RAIZ, 'EdicaoPerfil', 'EdicaoPerfil.html'), 'utf8');

test('EdicaoPerfil.html: ids únicos, Bootstrap JS uma vez e divs balanceadas', () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids.filter((id, i) => ids.indexOf(id) !== i), []);
  assert.equal((html.match(/bootstrap\.bundle\.min\.js/g) || []).length, 1);
  assert.equal((html.match(/bootstrap\.min\.css/g) || []).length, 1);
  assert.equal((html.match(/<div[\s>]/g) || []).length, (html.match(/<\/div>/g) || []).length);
  assert.equal(/<center>/i.test(html), false);
});

function logadoComo(username) {
  return (win) => {
    win.sessionStorage.setItem('loggedInUser', JSON.stringify({ username }));
  };
}

test('EdicaoPerfil sem login manda para o login e volta depois', () => {
  const w = carregarPagina('EdicaoPerfil/EdicaoPerfil.html');
  assert.equal(w.sessionStorage.getItem('depoisDoLogin'), '../EdicaoPerfil/EdicaoPerfil.html');
});

test('EdicaoPerfil vem preenchida com os dados do usuário logado', () => {
  const w = carregarPagina('EdicaoPerfil/EdicaoPerfil.html', { antes: logadoComo('davi.sax') });
  const $ = (id) => w.document.getElementById(id);
  assert.equal($('username').value, 'davi.sax');
  assert.equal($('username').readOnly, true);
  assert.equal($('name').value, 'Davi Moraes');
  assert.equal($('state').value, 'MG');
  assert.equal($('role').value, 'Músico');
  assert.equal($('genreJazz').checked, true);
  assert.equal($('genreRock').checked, false);
});

test('EdicaoPerfil salva no modelo users e atualiza a sessão', async () => {
  const w = carregarPagina('EdicaoPerfil/EdicaoPerfil.html', { antes: logadoComo('davi.sax') });
  const $ = (id) => w.document.getElementById(id);
  $('city').value = 'Niterói';
  $('genreRock').checked = true;
  $('senhaAtual').value = 'demo1234';
  $('editForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperarAte(() => w.sessionStorage.getItem('loggedInUser').includes('Niterói'));
  const cartola = JSON.parse(w.localStorage.getItem(CHAVE_USUARIOS)).find((u) => u.username === 'davi.sax');
  assert.equal(cartola.city, 'Niterói');
  assert.deepEqual(cartola.genres, ['Rock', 'MPB', 'Jazz']);
  assert.equal(JSON.parse(w.sessionStorage.getItem('loggedInUser')).city, 'Niterói');
  assert.equal(w.localStorage.getItem('formularioData'), null, 'não usa mais o formulário solto');
});

test('EdicaoPerfil mostra erro e não salva com campo obrigatório vazio', async () => {
  const w = carregarPagina('EdicaoPerfil/EdicaoPerfil.html', { antes: logadoComo('davi.sax') });
  const $ = (id) => w.document.getElementById(id);
  $('name').value = '';
  $('senhaAtual').value = 'demo1234';
  $('editForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperarAte(() => $('name').classList.contains('is-invalid'));
  const cartola = JSON.parse(w.localStorage.getItem(CHAVE_USUARIOS)).find((u) => u.username === 'davi.sax');
  assert.equal(cartola.name, 'Davi Moraes');
});

// Página de perfil
function verPerfil(exibido, logado) {
  return (win) => {
    win.sessionStorage.setItem('clickedUser', JSON.stringify({ username: exibido, name: 'velho', city: 'velha', state: 'XX', genres: [], badges: [], userPicsLinks: [] }));
    if (logado) win.sessionStorage.setItem('loggedInUser', JSON.stringify({ username: logado }));
  };
}

test('EdicaoPerfil não salva sem a senha atual e aponta o campo', async () => {
  const w = carregarPagina('EdicaoPerfil/EdicaoPerfil.html', { antes: logadoComo('davi.sax') });
  const $ = (id) => w.document.getElementById(id);
  $('city').value = 'Niterói';
  $('editForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperarAte(() => $('senhaAtual').classList.contains('is-invalid'));
  const davi = JSON.parse(w.localStorage.getItem(CHAVE_USUARIOS)).find((u) => u.username === 'davi.sax');
  assert.equal(davi.city, 'Belo Horizonte');
});

test('EdicaoPerfil avisa quando o navegador não tem espaço e mantém o que foi digitado', async () => {
  const w = carregarPagina('EdicaoPerfil/EdicaoPerfil.html', { antes: logadoComo('davi.sax') });
  const $ = (id) => w.document.getElementById(id);
  $('city').value = 'Niterói';
  $('senhaAtual').value = 'demo1234';
  const original = w.Storage.prototype.setItem;
  w.Storage.prototype.setItem = function (chave, valor) {
    if (chave === CHAVE_USUARIOS) throw Object.assign(new Error('cheio'), { name: 'QuotaExceededError' });
    return original.call(this, chave, valor);
  };
  $('editForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperarAte(() => w.document.querySelector('[data-erro-formulario]').textContent);
  assert.match(w.document.querySelector('[data-erro-formulario]').textContent, /espaço/);
  assert.equal($('city').value, 'Niterói');
});

test('perfil monta o vídeo pelo ID do YouTube, no domínio sem cookies', () => {
  const w = carregarPagina('Perfil/perfil.html', {
    antes: (win) => {
      const lista = JSON.parse(JSON.stringify(require('../codigo-fonte/dados/usuarios-exemplo.js')));
      lista[0].songLink = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5';
      lista[1].songLink = 'https://youtu.be/curto"><b>';
      win.localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(lista));
      win.sessionStorage.setItem('clickedUser', JSON.stringify({ username: lista[0].username }));
    },
  });
  assert.equal(w.document.getElementById('songLink').getAttribute('src'), 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  const outro = carregarPagina('Perfil/perfil.html', {
    antes: (win) => {
      const lista = JSON.parse(JSON.stringify(require('../codigo-fonte/dados/usuarios-exemplo.js')));
      lista[1].songLink = 'https://youtu.be/curto"><b>';
      win.localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(lista));
      win.sessionStorage.setItem('clickedUser', JSON.stringify({ username: lista[1].username }));
    },
  });
  assert.equal(outro.document.getElementById('songLink').getAttribute('src') || '', '', 'link inválido não vira embed');
});

test('perfil do próprio usuário mostra "Editar perfil"', () => {
  const w = carregarPagina('Perfil/perfil.html', { antes: verPerfil('davi.sax', 'davi.sax') });
  const botao = w.document.getElementById('acaoPerfil');
  assert.equal(botao.textContent.trim(), 'Editar perfil');
  assert.equal(botao.dataset.href, '../EdicaoPerfil/EdicaoPerfil.html');
});

test('perfil de outra pessoa mostra "Contate-me"', () => {
  const w = carregarPagina('Perfil/perfil.html', { antes: verPerfil('lia.batera', 'davi.sax') });
  assert.equal(w.document.getElementById('acaoPerfil').textContent.trim(), 'Contate-me');
});

test('perfil mostra os dados atuais do modelo, não a cópia guardada na sessão', () => {
  const w = carregarPagina('Perfil/perfil.html', { antes: verPerfil('davi.sax', null) });
  assert.equal(w.document.getElementById('name').textContent, 'Davi Moraes');
  assert.equal(w.document.getElementById('location').textContent, 'Belo Horizonte/MG');
});

test('EdicaoPerfil mantém um estado fora da lista de UFs (ex.: "GH") e deixa salvar', async () => {
  const w = carregarPagina('EdicaoPerfil/EdicaoPerfil.html', {
    antes: (win) => {
      const lista = JSON.parse(JSON.stringify(require('../codigo-fonte/dados/usuarios-exemplo.js')));
      lista[0].state = 'GH';
      win.localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(lista));
      logadoComo('lia.batera')(win);
    },
  });
  const $ = (id) => w.document.getElementById(id);
  assert.equal($('state').value, 'GH');
  $('city').value = 'Station Square';
  $('senhaAtual').value = 'demo1234';
  $('editForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperarAte(() => w.sessionStorage.getItem('loggedInUser').includes('Station Square'));
  const lia = JSON.parse(w.localStorage.getItem(CHAVE_USUARIOS)).find((u) => u.username === 'lia.batera');
  assert.equal(lia.city, 'Station Square');
  assert.equal(lia.state, 'GH');
});

test('perfil abre pelo endereço ?u= mesmo sem nada na sessão', () => {
  const w = carregarPagina('Perfil/perfil.html', { busca: '?u=casa.lume' });
  assert.equal(w.document.getElementById('name').textContent, 'Casa Lume');
  assert.equal(w.document.title, 'Casa Lume | GigTime');
});

test('perfil inexistente mostra o estado de não encontrado, sem alert', () => {
  const w = carregarPagina('Perfil/perfil.html', { busca: '?u=ninguem' });
  assert.equal(w.document.getElementById('perfilNaoEncontrado').hidden, false);
  assert.equal(w.document.getElementById('perfil').hidden, true);
  assert.equal(w.__alertas, undefined);
});

test('perfil: e-mail e telefone só aparecem para quem está logado', () => {
  const visitante = carregarPagina('Perfil/perfil.html', { busca: '?u=casa.lume' });
  assert.equal(visitante.document.getElementById('contatoVisivel').hidden, true);
  assert.equal(visitante.document.getElementById('email').textContent, '');
  assert.equal(visitante.document.getElementById('contatoOculto').hidden, false);
  const logado = carregarPagina('Perfil/perfil.html', { busca: '?u=casa.lume', antes: logadoComo('davi.sax') });
  assert.equal(logado.document.getElementById('email').textContent, 'casa.lume@example.com');
});

test('perfil: as fotos de destaque são botões que abrem o diálogo', () => {
  const w = carregarPagina('Perfil/perfil.html', { busca: '?u=lia.batera' });
  const botoes = w.document.querySelectorAll('#galeria button');
  assert.equal(botoes.length, 3);
  botoes[1].click();
  assert.ok(w.document.getElementById('modal').hasAttribute('open'));
  assert.match(w.document.getElementById('modal-img').getAttribute('alt'), /Foto 2 de Lia Fontes/);
  w.document.getElementById('close-btn').click();
  assert.equal(w.document.getElementById('modal').hasAttribute('open'), false);
});

test('EdicaoPerfil salva apresentação e disponibilidade e avisa o sucesso sem alert', async () => {
  const w = carregarPagina('EdicaoPerfil/EdicaoPerfil.html', { antes: logadoComo('davi.sax') });
  const $ = (id) => w.document.getElementById(id);
  assert.equal($('bio').value, require('../codigo-fonte/dados/usuarios-exemplo.js').find((u) => u.username === 'davi.sax').bio);
  $('bio').value = 'Sax tenor e soprano.';
  $('disponibilidade').value = 'Sábados à noite';
  $('senhaAtual').value = 'demo1234';
  $('editForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperarAte(() => w.sessionStorage.getItem('gigtime:aviso'));
  const davi = JSON.parse(w.localStorage.getItem(CHAVE_USUARIOS)).find((u) => u.username === 'davi.sax');
  assert.equal(davi.bio, 'Sax tenor e soprano.');
  assert.equal(davi.disponibilidade, 'Sábados à noite');
  assert.match(JSON.parse(w.sessionStorage.getItem('gigtime:aviso')).texto, /atualizado/);
  assert.equal(w.__alertas, undefined);
});

test('EdicaoPerfil com sessão expirada vai para a página de sessão expirada', () => {
  const w = carregarPagina('EdicaoPerfil/EdicaoPerfil.html', {
    antes: (win) => {
      logadoComo('davi.sax')(win);
      win.sessionStorage.setItem('gigtime:atividade', String(Date.now() - 3 * 60 * 60 * 1000));
    },
  });
  assert.equal(w.sessionStorage.getItem('loggedInUser'), null);
  assert.equal(w.sessionStorage.getItem('depoisDoLogin'), '../EdicaoPerfil/EdicaoPerfil.html');
});
