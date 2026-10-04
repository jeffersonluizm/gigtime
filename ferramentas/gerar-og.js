// Gera a imagem de compartilhamento (Open Graph, 1200x630) usada quando o link do GigTime é colado
// no LinkedIn ou no WhatsApp. Renderiza um cartão na identidade do projeto no Chrome instalado.
// Uso: node ferramentas/gerar-og.js
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE = path.join(__dirname, '..', 'codigo-fonte');
const fonte = (arquivo) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(SITE, 'assets', 'fontes', arquivo)).toString('base64');
const logo = fs.readFileSync(path.join(SITE, 'assets', 'img', 'logo-claro.svg'), 'utf8');
const capa = 'data:image/webp;base64,' + fs.readFileSync(path.join(SITE, 'assets', 'img', 'palco-800.webp')).toString('base64');

const html = `<!DOCTYPE html><html><head><style>
  @font-face { font-family: Outfit; src: url(${fonte('outfit-latin-wght-normal.woff2')}); font-weight: 100 900; }
  @font-face { font-family: Inter; src: url(${fonte('inter-latin-wght-normal.woff2')}); font-weight: 100 900; }
  body { margin: 0; width: 1200px; height: 630px; display: grid; grid-template-columns: 640px 560px; background: #c2410c; font-family: Inter; }
  .texto { padding: 64px; color: #fcf6f3; display: flex; flex-direction: column; justify-content: center; }
  .marca { display: flex; align-items: center; gap: 16px; font-family: Outfit; font-weight: 800; font-size: 44px; }
  .marca svg { width: 64px; height: 64px; }
  h1 { font-family: Outfit; font-size: 64px; line-height: 1.05; margin: 36px 0 20px; color: #fff; }
  p { font-size: 26px; line-height: 1.4; margin: 0; color: #fde7c2; }
  .selo { margin-top: 32px; align-self: flex-start; background: #f7b801; color: #1f1410; font-weight: 700; font-size: 22px; padding: 8px 18px; border-radius: 999px; }
  .foto { background: url(${capa}) center / cover; }
</style></head><body>
  <div class="texto">
    <div class="marca">${logo}<span>GigTime</span></div>
    <h1>Encontre a atração certa para o seu palco.</h1>
    <p>Músicos e contratantes de música ao vivo: perfis, filtros e conversa direta.</p>
    <span class="selo">Demonstração · entre com um clique</span>
  </div>
  <div class="foto"></div>
</body></html>`;

(async () => {
  const navegador = await chromium.launch({ executablePath: CHROME });
  const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 } });
  await pagina.setContent(html, { waitUntil: 'load' });
  await pagina.evaluate(() => document.fonts.ready);
  const destino = path.join(SITE, 'assets', 'img', 'og-gigtime.png');
  await pagina.screenshot({ path: destino });
  await navegador.close();
  console.log(`${destino}: ${(fs.statSync(destino).size / 1024).toFixed(0)} KB`);
})();
