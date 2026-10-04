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
  const { JSDOM, VirtualConsole } = require('jsdom');
  // Navegação de página não existe no jsdom; esse aviso é esperado e fica fora da saída
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (e) => { if (!/navigation/.test(e.message)) console.error(e); });
  virtualConsole.on('error', (...a) => console.error(...a));
  virtualConsole.on('warn', (...a) => console.warn(...a));
  const arquivo = path.join(RAIZ, relativo);
  const html = fs.readFileSync(arquivo, 'utf8');
  const url = 'http://127.0.0.1/' + relativo.split(path.sep).join('/') + busca;
  const dom = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole });
  const { window } = dom;
  // O jsdom não traz WebCrypto nem TextEncoder; os navegadores trazem
  Object.defineProperty(window, 'crypto', { value: webcrypto, configurable: true });
  window.TextEncoder = TextEncoder;
  window.alert = (msg) => { (window.__alertas ||= []).push(msg); };
  // PBKDF2 com 600 mil iterações leva ~0,1 s por hash; nas páginas de teste o custo é reduzido
  window.GIGTIME_ITERACOES_PBKDF2 = 1000;
  // O jsdom não navega; o redirecionamento feito pelo inicializacao.js fica registrado aqui
  window.__gigNavegar = (destino) => { window.__redirecionadoPara = destino; };
  if (antes) antes(window);

  const scripts = [...window.document.querySelectorAll('script[src]')]
    .map((s) => s.getAttribute('src'))
    .filter((src) => !/^https?:/.test(src));
  for (const src of scripts) {
    const caminho = path.join(path.dirname(arquivo), src);
    try {
      window.eval(fs.readFileSync(caminho, 'utf8'));
    } catch (erro) {
      // Depois de um redirecionamento a página real já teria saído; os scripts seguintes podem falhar
      if (!window.__redirecionadoPara) throw erro;
    }
  }
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
  window.dispatchEvent(new window.Event('load'));
  return window;
}

// Espera as promessas pendentes (hash de senha etc.) terminarem
const esperar = (ms = 30) => new Promise((r) => setTimeout(r, ms));

// Espera até a condição valer (ex.: login concluído). O seed usa PBKDF2 com 600 mil iterações,
// então conferir a senha de uma persona leva ~0,1 s: um atraso fixo deixaria o teste instável.
async function esperarAte(condicao, limiteMs = 5000) {
  const inicio = Date.now();
  while (!condicao()) {
    if (Date.now() - inicio > limiteMs) throw new Error('condição não foi atendida em ' + limiteMs + ' ms');
    await esperar(10);
  }
}

module.exports = { StorageMemoria, carregarPagina, esperar, esperarAte, RAIZ };
