// Regras de segurança que valem para todas as páginas HTML do site:
// CSP via <meta> (o GitHub Pages não deixa configurar cabeçalhos), referrer, nada de script/estilo inline
// nem de terceiros (tudo servido do próprio site, em vendor/ e assets/).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { RAIZ } = require('./apoio');

const RAIZ_REPO = path.join(RAIZ, '..');

function paginas() {
  const lista = [];
  for (const pasta of fs.readdirSync(RAIZ, { withFileTypes: true })) {
    if (!pasta.isDirectory() || ['vendor', 'assets', 'lib', 'ui', 'dados'].includes(pasta.name)) continue;
    for (const arq of fs.readdirSync(path.join(RAIZ, pasta.name))) {
      if (arq.endsWith('.html')) lista.push(path.join(pasta.name, arq));
    }
  }
  return lista;
}

const POLITICA = /<meta http-equiv="Content-Security-Policy" content="([^"]+)">/;

test('há páginas para verificar', () => {
  assert.ok(paginas().length >= 7);
});

for (const pagina of paginas()) {
  const html = fs.readFileSync(path.join(RAIZ, pagina), 'utf8');

  test(`${pagina}: CSP restritiva no <head>, antes de qualquer recurso`, () => {
    const csp = html.match(POLITICA);
    assert.ok(csp, 'tem a meta de CSP');
    const diretivas = Object.fromEntries(csp[1].split(';').map((d) => d.trim().split(/\s+/)).map(([nome, ...valores]) => [nome, valores]));
    assert.deepEqual(diretivas['default-src'], ["'self'"]);
    assert.deepEqual(diretivas['script-src'], ["'self'"]);
    assert.deepEqual(diretivas['style-src'], ["'self'"]);
    assert.deepEqual(diretivas['object-src'], ["'none'"]);
    assert.deepEqual(diretivas['base-uri'], ["'self'"]);
    assert.ok(html.indexOf(csp[0]) < html.search(/<link|<script/), 'a CSP vem antes de links e scripts');
  });

  test(`${pagina}: política de referrer e nenhum script ou estilo inline`, () => {
    assert.match(html, /<meta name="referrer" content="strict-origin-when-cross-origin">/);
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/, 'script inline');
    assert.doesNotMatch(html, /<style[\s>]/, 'bloco <style> inline');
    assert.doesNotMatch(html, /\sstyle="/, 'atributo style');
    assert.doesNotMatch(html, /\son[a-z]+="/, 'handler inline');
  });

  test(`${pagina}: scripts, estilos e ícones servidos do próprio site`, () => {
    const externos = [...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="(https?:)?\/\/[^"]+"/g)].map((m) => m[0]);
    assert.deepEqual(externos, []);
  });
}
