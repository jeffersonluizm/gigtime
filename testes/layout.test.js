// Layout no navegador real: nenhuma página pode ter rolagem lateral em 375 px (celular).
// O jsdom não calcula layout, então este teste abre as páginas no Chrome headless (playwright-core),
// servidas por um servidor estático mínimo feito aqui mesmo. Sem Chrome na máquina, o teste é pulado.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { RAIZ } = require('./apoio');

const CANDIDATOS = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const CHROME = CANDIDATOS.find((c) => fs.existsSync(c));

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

function servir() {
  const servidor = http.createServer((req, res) => {
    const caminho = path.join(RAIZ, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!caminho.startsWith(RAIZ) || !fs.existsSync(caminho) || fs.statSync(caminho).isDirectory()) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { 'content-type': TIPOS[path.extname(caminho)] || 'application/octet-stream' });
    fs.createReadStream(caminho).pipe(res);
  });
  return new Promise((resolver) => servidor.listen(0, '127.0.0.1', () => resolver(servidor)));
}

// [rota, usuário logado (ou null)]
const PAGINAS = [
  ['/Home/home.html'], ['/Home/home.html', 'davi.sax'], ['/anuncios/anuncios.html'], ['/Perfil/perfil.html?u=lia.batera'],
  ['/EdicaoPerfil/EdicaoPerfil.html', 'davi.sax'], ['/Chat/chat.html?com=lia.batera', 'davi.sax'], ['/Chat/chat.html', 'davi.sax'],
  ['/Login/login.html'], ['/Registro/registro.html'], ['/Conta/conta.html', 'davi.sax'], ['/Sobre/sobre.html'],
  ['/Privacidade/privacidade.html'], ['/Acesso/esqueci-senha.html'], ['/Acesso/saiu.html'], ['/Acesso/sessao-expirada.html'],
  ['/Sistema/erro.html'],
];

test('nenhuma página tem rolagem lateral em 375 px nem em 1280 px', { skip: CHROME ? false : 'Chrome não encontrado' }, async () => {
  const { chromium } = require('playwright-core');
  const servidor = await servir();
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const navegador = await chromium.launch({ executablePath: CHROME });
  const problemas = [];
  try {
    for (const largura of [375, 1280]) {
      for (const [rota, logado] of PAGINAS) {
        const pagina = await navegador.newPage({ viewport: { width: largura, height: 800 } });
        if (logado) await pagina.addInitScript((l) => { if (!sessionStorage.getItem('loggedInUser')) sessionStorage.setItem('loggedInUser', JSON.stringify({ username: l, name: l })); }, logado);
        await pagina.goto(base + rota, { waitUntil: 'load' });
        await pagina.waitForTimeout(150);
        const medida = await pagina.evaluate(() => ({ documento: document.documentElement.scrollWidth, janela: window.innerWidth }));
        if (medida.documento > medida.janela) problemas.push(`${largura}px ${rota}${logado ? ' (logado)' : ''}: largura ${medida.documento} > ${medida.janela}`);
        await pagina.close();
      }
    }
  } finally {
    await navegador.close();
    servidor.close();
  }
  assert.deepEqual(problemas, []);
});
