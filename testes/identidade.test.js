// Identidade visual: tokens num lugar só, contraste WCAG AA dos pares de texto e nenhuma cor solta nos CSS.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { RAIZ } = require('./apoio');

const tokensCss = fs.readFileSync(path.join(RAIZ, 'assets', 'css', 'tokens.css'), 'utf8');
const tokens = Object.fromEntries([...tokensCss.matchAll(/--(gig-[a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));

function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contraste(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// [texto, fundo]: todo par usado para texto na interface
const PARES = [
  ['#ffffff', 'gig-laranja'], ['#ffffff', 'gig-laranja-escuro'], ['gig-laranja', 'gig-fundo'], ['gig-laranja', 'gig-superficie'],
  ['gig-indigo', 'gig-fundo'], ['gig-indigo', 'gig-superficie'], ['#ffffff', 'gig-indigo'], ['gig-texto-forte', 'gig-amarelo'],
  ['gig-texto', 'gig-fundo'], ['gig-texto-suave', 'gig-fundo'], ['gig-texto-suave', 'gig-superficie'], ['gig-texto-suave', 'gig-superficie-2'],
  ['gig-sobre-escuro', 'gig-escuro'], ['gig-amarelo', 'gig-escuro'], ['gig-texto-forte', 'gig-amarelo-claro'],
  ['gig-sucesso-texto', 'gig-sucesso-fundo'], ['gig-erro-texto', 'gig-erro-fundo'], ['gig-erro', 'gig-superficie'],
  ['#ffffff', 'gig-indigo-escuro'], ['gig-roxo', 'gig-fundo'],
];
const cor = (nome) => (nome.startsWith('#') ? nome : tokens[nome]);

test('tokens.css define a paleta da marca', () => {
  for (const nome of ['gig-laranja', 'gig-laranja-vivo', 'gig-indigo', 'gig-amarelo', 'gig-fundo', 'gig-texto']) assert.ok(tokens[nome], nome);
  assert.equal(tokens['gig-laranja'].toLowerCase(), '#c2410c');
  assert.equal(tokens['gig-fundo'].toLowerCase(), '#fcf6f3');
});

for (const [texto, fundo] of PARES) {
  test(`contraste AA: ${texto} sobre ${fundo}`, () => {
    assert.ok(cor(texto) && cor(fundo), 'token existe');
    const razao = contraste(cor(texto), cor(fundo));
    assert.ok(razao >= 4.5, `${razao.toFixed(2)}:1 < 4.5:1`);
  });
}

test('as fontes da marca são carregadas de verdade, do próprio site', () => {
  for (const arquivo of ['outfit-latin-wght-normal.woff2', 'inter-latin-wght-normal.woff2']) {
    assert.ok(fs.existsSync(path.join(RAIZ, 'assets', 'fontes', arquivo)), arquivo);
    assert.ok(tokensCss.includes(arquivo));
  }
});

function arquivosCss(pasta) {
  return fs.readdirSync(pasta, { withFileTypes: true }).flatMap((item) => {
    const caminho = path.join(pasta, item.name);
    if (item.isDirectory()) return item.name === 'vendor' ? [] : arquivosCss(caminho);
    return item.name.endsWith('.css') ? [caminho] : [];
  });
}

test('fora do tokens.css nenhum CSS define cor em hexadecimal nem importa fonte externa', () => {
  for (const arquivo of arquivosCss(RAIZ)) {
    if (arquivo.endsWith('tokens.css')) continue;
    const css = fs.readFileSync(arquivo, 'utf8');
    assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, path.relative(RAIZ, arquivo));
    assert.doesNotMatch(css, /@import|fonts\.googleapis/, path.relative(RAIZ, arquivo));
  }
});

test('todo ícone usado nas páginas e scripts existe no sprite', () => {
  const sprite = fs.readFileSync(path.join(RAIZ, 'assets', 'icones.svg'), 'utf8');
  const existentes = new Set([...sprite.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]));
  const usados = new Set();
  const varrer = (pasta) => {
    for (const item of fs.readdirSync(pasta, { withFileTypes: true })) {
      const caminho = path.join(pasta, item.name);
      if (item.isDirectory()) { if (!['vendor', 'assets'].includes(item.name)) varrer(caminho); continue; }
      if (!/\.(html|js)$/.test(item.name)) continue;
      const texto = fs.readFileSync(caminho, 'utf8');
      for (const m of texto.matchAll(/icones\.svg#([a-z0-9-]+)/g)) usados.add(m[1]);
      for (const m of texto.matchAll(/icone\('([a-z0-9-]+)'/g)) usados.add(m[1]);
    }
  };
  varrer(RAIZ);
  assert.ok(usados.size > 5);
  for (const nome of usados) assert.ok(existentes.has(nome), `ícone "${nome}" não está no sprite`);
});
