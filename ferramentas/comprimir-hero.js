// Gera as versões leves da foto de capa da Home (o original tinha 5000x3513 px e 2,4 MB),
// usando o Chrome instalado (canvas -> WebP e JPEG). Uso: node ferramentas/comprimir-hero.js <original.jpeg>
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DESTINO = path.join(__dirname, '..', 'codigo-fonte', 'assets', 'img');
const LARGURAS = [800, 1400];

(async () => {
  const original = process.argv[2];
  if (!original) throw new Error('informe o caminho da imagem original');
  const base64 = fs.readFileSync(original).toString('base64');
  const navegador = await chromium.launch({ executablePath: CHROME });
  const pagina = await navegador.newPage();
  for (const largura of LARGURAS) {
    for (const [tipo, extensao, qualidade] of [['image/webp', 'webp', 0.78], ['image/jpeg', 'jpg', 0.8]]) {
      const dados = await pagina.evaluate(async ({ base64, largura, tipo, qualidade }) => {
        const img = new Image();
        img.src = 'data:image/jpeg;base64,' + base64;
        await img.decode();
        const altura = Math.round((img.naturalHeight / img.naturalWidth) * largura);
        const canvas = document.createElement('canvas');
        canvas.width = largura;
        canvas.height = altura;
        canvas.getContext('2d').drawImage(img, 0, 0, largura, altura);
        return { url: canvas.toDataURL(tipo, qualidade), altura };
      }, { base64, largura, tipo, qualidade });
      const arquivo = path.join(DESTINO, `palco-${largura}.${extensao}`);
      fs.writeFileSync(arquivo, Buffer.from(dados.url.split(',')[1], 'base64'));
      console.log(`${path.basename(arquivo)}: ${largura}x${dados.altura}, ${(fs.statSync(arquivo).size / 1024).toFixed(0)} KB`);
    }
  }
  await navegador.close();
})();
