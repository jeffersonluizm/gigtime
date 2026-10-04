const test = require('node:test');
const assert = require('node:assert/strict');
const V = require('../codigo-fonte/lib/validacao.js');

test('urlImagem aceita só https e devolve vazio para campo vazio', () => {
  assert.equal(V.urlImagem('  https://exemplo.com/foto.jpg '), 'https://exemplo.com/foto.jpg');
  assert.equal(V.urlImagem(''), '');
  assert.equal(V.urlImagem('   '), '');
  assert.equal(V.urlImagem('http://exemplo.com/foto.jpg'), null, 'http mistura conteúdo e vaza o acesso');
  assert.equal(V.urlImagem('javascript:alert(1)'), null);
  assert.equal(V.urlImagem('data:image/png;base64,AAAA'), null);
  assert.equal(V.urlImagem('//exemplo.com/x.jpg'), null);
  assert.equal(V.urlImagem('foto.jpg'), null);
  assert.equal(V.urlImagem('https://usuario:senha@exemplo.com/x.jpg'), null, 'sem credenciais na URL');
  assert.equal(V.urlImagem('https://exemplo.com/' + 'a'.repeat(2100)), null, 'tamanho máximo');
});

test('urlImagem aceita as ilustrações do próprio site (personas de demonstração)', () => {
  assert.equal(V.urlImagem('../assets/demo/lia.batera/avatar.svg'), '../assets/demo/lia.batera/avatar.svg');
  assert.equal(V.urlImagem('../assets/img/avatar-padrao.svg'), '../assets/img/avatar-padrao.svg');
  assert.equal(V.urlImagem('../userImages/defaultUser.jpg'), '../userImages/defaultUser.jpg', 'foto padrão de versões antigas');
  assert.equal(V.urlImagem('../assets/../../segredo.svg'), null);
  assert.equal(V.urlImagem('../Login/login.html'), null);
});

test('idYoutube extrai o ID dos formatos comuns de link', () => {
  const id = 'dQw4w9WgXcQ';
  for (const link of [
    `https://youtu.be/${id}`,
    `https://youtu.be/${id}?si=abc123`,
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&t=30s`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
  ]) assert.equal(V.idYoutube(link), id, link);
});

test('idYoutube recusa links que não são do YouTube ou com ID inválido', () => {
  assert.equal(V.idYoutube(''), null);
  assert.equal(V.idYoutube('https://vimeo.com/123'), null);
  assert.equal(V.idYoutube('https://youtube.com.mal.example/watch?v=dQw4w9WgXcQ'), null);
  assert.equal(V.idYoutube('https://youtu.be/curto'), null);
  assert.equal(V.idYoutube('https://www.youtube.com/watch?v=dQw4w9WgXcQ"><script>'), null);
  assert.equal(V.idYoutube('http://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ', 'http do próprio YouTube é aceito: o embed sai sempre em https');
  assert.equal(V.idYoutube('javascript:alert(1)//youtu.be/dQw4w9WgXcQ'), null);
});

test('emailValido exige algo@dominio.tld sem espaços', () => {
  assert.equal(V.emailValido('ana@exemplo.com'), true);
  assert.equal(V.emailValido('ana.p+gig@sub.exemplo.com.br'), true);
  assert.equal(V.emailValido('ana@exemplo'), false);
  assert.equal(V.emailValido('ana exemplo.com'), false);
  assert.equal(V.emailValido('@exemplo.com'), false);
  assert.equal(V.emailValido(''), false);
});

test('telefoneValido aceita fixo e celular brasileiros com DDD', () => {
  assert.equal(V.telefoneValido('(31) 3456-7890'), true);
  assert.equal(V.telefoneValido('(11) 91234-5678'), true);
  assert.equal(V.telefoneValido('11912345678'), true);
  assert.equal(V.telefoneValido('(01) 91234-5678'), false, 'DDD começa em 11');
  assert.equal(V.telefoneValido('1234-5678'), false, 'sem DDD');
  assert.equal(V.telefoneValido('(11) 91234-56789'), false);
  assert.equal(V.telefoneValido(''), false);
});

test('erroSenha exige 8 caracteres e não aceita a senha igual ao usuário', () => {
  assert.equal(V.erroSenha('abc12345', 'ana'), null);
  assert.match(V.erroSenha('abc123', 'ana'), /8 caracteres/);
  assert.match(V.erroSenha('ana.pereira', 'ana.pereira'), /usuário/);
  assert.match(V.erroSenha('', 'ana'), /8 caracteres/);
});

test('usernameValido aceita 3 a 30 letras, números, ponto, hífen e sublinhado', () => {
  assert.equal(V.usernameValido('lia.batera'), true);
  assert.equal(V.usernameValido('trio_serrano-2'), true);
  assert.equal(V.usernameValido('ab'), false);
  assert.equal(V.usernameValido('com espaco'), false);
  assert.equal(V.usernameValido('<script>'), false);
  assert.equal(V.usernameValido('a'.repeat(31)), false);
});
