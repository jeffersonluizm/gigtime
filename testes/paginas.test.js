// Estrutura comum de todas as páginas: idioma, título, descrição, link de pular conteúdo,
// topo/rodapé montados por ui/layout.js, um único h1 e a mesma sequência de scripts base.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { RAIZ, carregarPagina } = require('./apoio');

const PAGINAS = [
  'Home/home.html', 'anuncios/anuncios.html', 'Perfil/perfil.html', 'EdicaoPerfil/EdicaoPerfil.html', 'Chat/chat.html',
  'Login/login.html', 'Registro/registro.html', 'Conta/conta.html', 'Sobre/sobre.html', 'Privacidade/privacidade.html',
  'Acesso/esqueci-senha.html', 'Acesso/saiu.html', 'Acesso/sessao-expirada.html', 'Sistema/erro.html',
];

const BASE = [
  '../vendor/bootstrap/bootstrap.bundle.min.js', '../lib/html.js', '../lib/constantes.js', '../lib/armazenamento.js', '../lib/senha.js',
  '../lib/validacao.js', '../lib/perfil.js', '../lib/sessao.js', '../lib/mensagens.js', '../dados/usuarios-exemplo.js', '../dados/demo.js',
  '../inicializacao.js', '../ui/avisos.js', '../ui/formularios.js', '../ui/cards.js', '../ui/layout.js',
];
const ESTILOS = ['../vendor/bootstrap/bootstrap.min.css', '../assets/css/tokens.css', '../assets/css/base.css', '../assets/css/componentes.css'];

for (const pagina of PAGINAS) {
  test(`${pagina}: estrutura comum`, () => {
    const html = fs.readFileSync(path.join(RAIZ, pagina), 'utf8');
    assert.match(html, /<html lang="pt-BR">/);
    assert.match(html, /<title>[^<]+ \| GigTime<\/title>/);
    assert.match(html, /<meta name="description" content="[^"]{20,}">/);
    assert.match(html, /<a class="pular-conteudo" href="#conteudo">/);
    assert.match(html, /<link rel="icon" type="image\/png" sizes="32x32" href="\.\.\/assets\/img\/favicon-32\.png">/);
    assert.match(html, /<link rel="apple-touch-icon" href="\.\.\/assets\/img\/apple-touch-icon\.png">/);
    assert.match(html, /<header id="topo"><\/header>/);
    assert.match(html, /<main id="conteudo" tabindex="-1"[^>]*>/);
    assert.match(html, /<footer id="rodape"><\/footer>/);
    const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
    assert.deepEqual(scripts.slice(0, BASE.length), BASE);
    const estilos = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map((m) => m[1]);
    assert.deepEqual(estilos.slice(0, ESTILOS.length), ESTILOS);
  });
}

test('todas as páginas montam topo e rodapé com o selo de demonstração', () => {
  for (const pagina of PAGINAS) {
    const w = carregarPagina(pagina);
    const d = w.document;
    assert.ok(d.querySelector('#topo nav'), `${pagina}: topo`);
    assert.match(d.getElementById('rodape').textContent, /Demo · dados só neste navegador/, pagina);
    assert.ok(d.querySelector('#topo img[src$="logo-claro.svg"], #topo img[src$="logo.svg"]'), `${pagina}: logo própria`);
    const h1Visiveis = [...d.querySelectorAll('h1')].filter((h) => !h.closest('[hidden]'));
    assert.equal(h1Visiveis.length, 1, `${pagina}: um h1 visível`);
  }
});
