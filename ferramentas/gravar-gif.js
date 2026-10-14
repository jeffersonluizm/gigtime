// Grava o GIF do README: o fluxo de quem avalia (Home > Entrar como músico > Explorar e filtrar >
// perfil > Contate-me > mensagem) no Chrome instalado, quadro a quadro, codificado com gifenc.
// Uso: node ferramentas/gravar-gif.js <url-base> docs/img/demo.gif
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { PNG } = require('pngjs');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const [base = 'http://127.0.0.1:8800', destino = 'docs/img/demo.gif'] = process.argv.slice(2);
const LARGURA = 1100;
const ALTURA = 680;

(async () => {
  const navegador = await chromium.launch({ executablePath: CHROME });
  const pagina = await navegador.newPage({ viewport: { width: LARGURA, height: ALTURA }, reducedMotion: 'reduce' });
  const gif = GIFEncoder();
  let quadros = 0;

  // Um quadro que fica na tela por `ms` milissegundos
  async function quadro(ms) {
    const png = PNG.sync.read(await pagina.screenshot());
    const paleta = quantize(png.data, 128);
    gif.writeFrame(applyPalette(png.data, paleta), png.width, png.height, { palette: paleta, delay: ms });
    quadros++;
  }
  async function digitar(seletor, texto) {
    for (const letra of texto) {
      await pagina.type(seletor, letra);
      await quadro(70);
    }
  }

  await pagina.goto(base + '/Home/home.html', { waitUntil: 'networkidle' });
  await pagina.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await pagina.goto(base + '/Home/home.html', { waitUntil: 'networkidle' });
  await quadro(1800);
  // atalho da demonstração na primeira dobra (hero)
  await pagina.click('.hero a[href="../Login/login.html?demo=musico"]');
  await pagina.waitForURL(/anuncios/, { waitUntil: 'load' });
  await pagina.waitForTimeout(400);
  await quadro(1600);
  await pagina.click('label[for="radioContractor"]');
  await pagina.waitForTimeout(200);
  await quadro(1000);
  await digitar('#busca', 'São Paulo');
  await quadro(1400);
  // Segue o link do card (o clique simulado às vezes cai no topo fixo, que cobre o card ao rolar)
  const linkDoCard = await pagina.getAttribute('#anuncios .card-title a', 'href');
  await pagina.goto(new URL(linkDoCard, pagina.url()).href, { waitUntil: 'networkidle' });
  await pagina.waitForTimeout(400);
  await quadro(1800);
  const linkContato = await pagina.getAttribute('#acaoPerfil', 'href');
  await pagina.goto(new URL(linkContato, pagina.url()).href, { waitUntil: 'networkidle' });
  await pagina.waitForTimeout(300);
  await quadro(1000);
  await digitar('#mensagem', 'Oi! Tem data livre no sábado?');
  await pagina.press('#mensagem', 'Enter');
  await pagina.waitForTimeout(300);
  await quadro(2500);

  gif.finish();
  fs.writeFileSync(destino, gif.bytes());
  await navegador.close();
  console.log(`${destino}: ${quadros} quadros, ${(fs.statSync(destino).size / 1024).toFixed(0)} KB`);
})();
