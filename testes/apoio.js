// Utilitários só de teste: storage em memória e carregamento de páginas no jsdom.
const fs = require('node:fs');
const path = require('node:path');
const { webcrypto } = require('node:crypto');

const RAIZ = path.join(__dirname, '..', 'codigo-fonte');

class StorageMemoria {
  constructor(inicial = {}) {
    this.dados = new Map(Object.entries(inicial));
  }
  getItem(chave) {
    return this.dados.has(chave) ? this.dados.get(chave) : null;
  }
  setItem(chave, valor) {
    this.dados.set(chave, String(valor));
  }
  removeItem(chave) {
    this.dados.delete(chave);
  }
}

// Carrega o HTML de uma página e executa, na ordem, os scripts locais que ela referencia
// (os de CDN são ignorados). `antes(window)` roda antes dos scripts, para preparar o storage.
function carregarPagina(relativo, { busca = '', antes } = {}) {
  const { JSDOM } = require('jsdom');
  const arquivo = path.join(RAIZ, relativo);
  const html = fs.readFileSync(arquivo, 'utf8');
  const url = 'http://127.0.0.1/' + relativo.split(path.sep).join('/') + busca;
  const dom = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom;
  Object.defineProperty(window, 'crypto', { value: webcrypto, configurable: true });
  window.alert = (msg) => { (window.__alertas ||= []).push(msg); };
  if (antes) antes(window);

  const scripts = [...window.document.querySelectorAll('script[src]')]
    .map((s) => s.getAttribute('src'))
    .filter((src) => !/^https?:/.test(src));
  for (const src of scripts) {
    const caminho = path.join(path.dirname(arquivo), src);
    window.eval(fs.readFileSync(caminho, 'utf8'));
  }
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
  window.dispatchEvent(new window.Event('load'));
  return window;
}

// Espera as promessas pendentes (hash de senha etc.) terminarem
const esperar = (ms = 30) => new Promise((r) => setTimeout(r, ms));

module.exports = { StorageMemoria, carregarPagina, esperar, RAIZ };
