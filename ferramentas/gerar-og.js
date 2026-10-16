// Gera, no Chrome instalado, as imagens de marca em PNG/ICO a partir dos SVG próprios:
// - og-gigtime.png (1200x630): cartão de compartilhamento (LinkedIn, WhatsApp), com a ilustração do palco;
// - favicon-32.png e favicon.ico: ícone da aba para navegadores que não usam o favicon SVG;
// - apple-touch-icon.png (180x180): ícone da tela inicial no iPhone/iPad.
// Uso: node ferramentas/gerar-og.js
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE = path.join(__dirname, '..', 'codigo-fonte');
const fonte = (arquivo) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(SITE, 'assets', 'fontes', arquivo)).toString('base64');
const logo = fs.readFileSync(path.join(SITE, 'assets', 'img', 'logo-claro.svg'), 'utf8');
const capa = 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(SITE, 'assets', 'img', 'palco.svg')).toString('base64');
const logoCor = 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(SITE, 'assets', 'img', 'logo.svg')).toString('base64');

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
  console.log(`${destino}: ${(fs.statSync(destino).size / 1024).toFixed(0)} KB`);

  // Ícones: a logo colorida sobre fundo transparente (32 px) e sobre o fundo creme (180 px, iOS)
  for (const [arquivo, tamanho, fundo] of [['favicon-32.png', 32, 'transparent'], ['apple-touch-icon.png', 180, '#fcf6f3']]) {
    const icone = await navegador.newPage({ viewport: { width: tamanho, height: tamanho } });
    await icone.setContent(`<body style="margin:0;background:${fundo}"><img src="${logoCor}" style="display:block;width:${tamanho}px;height:${tamanho}px;${tamanho > 32 ? 'padding:18px;box-sizing:border-box' : ''}"></body>`);
    await icone.waitForTimeout(200);
    await icone.screenshot({ path: path.join(SITE, 'assets', 'img', arquivo), omitBackground: fundo === 'transparent' });
    await icone.close();
  }
  // favicon.ico com o PNG de 32 px dentro (formato ICO aceita PNG embutido)
  const png = fs.readFileSync(path.join(SITE, 'assets', 'img', 'favicon-32.png'));
  const cabecalho = Buffer.alloc(22);
  cabecalho.writeUInt16LE(0, 0); cabecalho.writeUInt16LE(1, 2); cabecalho.writeUInt16LE(1, 4);
  cabecalho.writeUInt8(32, 6); cabecalho.writeUInt8(32, 7); cabecalho.writeUInt8(0, 8); cabecalho.writeUInt8(0, 9);
  cabecalho.writeUInt16LE(1, 10); cabecalho.writeUInt16LE(32, 12); cabecalho.writeUInt32LE(png.length, 14); cabecalho.writeUInt32LE(22, 18);
  fs.writeFileSync(path.join(SITE, 'assets', 'img', 'favicon.ico'), Buffer.concat([cabecalho, png]));
  await navegador.close();
  console.log('favicon-32.png, favicon.ico e apple-touch-icon.png gerados');
})();
