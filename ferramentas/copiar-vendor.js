// Copia as dependências de front-end de node_modules para dentro do site (o site não tem build nem CDN):
// - Bootstrap 5.3.3 (CSS + JS com Popper) em codigo-fonte/vendor/bootstrap/
// - fontes Outfit (títulos) e Inter (texto), variáveis, subconjunto latin, em codigo-fonte/assets/fontes/
// - sprite SVG com os ícones usados (Bootstrap Icons) em codigo-fonte/assets/icones.svg
// Uso: npm install && npm run vendor
const fs = require('node:fs');
const path = require('node:path');

const MODULOS = path.join(__dirname, '..', 'node_modules');
const SITE = path.join(__dirname, '..', 'codigo-fonte');

const ICONES = [
  'arrow-counterclockwise', 'arrow-left', 'award', 'box-arrow-right', 'building', 'calendar-check', 'chat-dots', 'check-circle-fill',
  'chevron-down', 'clock', 'code-slash', 'download', 'emoji-frown', 'envelope', 'exclamation-triangle-fill', 'eye', 'eye-slash',
  'funnel', 'gear', 'geo-alt', 'hdd-stack', 'house', 'image', 'info-circle', 'list', 'lock', 'mic', 'music-note-beamed', 'people',
  'person', 'person-circle', 'play-circle', 'question-circle', 'search', 'send-fill', 'shield-lock', 'sliders', 'star-fill',
  'telephone', 'trash', 'x-lg',
];

function copiar(origem, destino) {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.copyFileSync(origem, destino);
}

// Bootstrap (arquivos idênticos aos do CDN: o hash SRI confere)
const bs = path.join(MODULOS, 'bootstrap');
copiar(path.join(bs, 'dist', 'css', 'bootstrap.min.css'), path.join(SITE, 'vendor', 'bootstrap', 'bootstrap.min.css'));
copiar(path.join(bs, 'dist', 'js', 'bootstrap.bundle.min.js'), path.join(SITE, 'vendor', 'bootstrap', 'bootstrap.bundle.min.js'));
copiar(path.join(bs, 'LICENSE'), path.join(SITE, 'vendor', 'bootstrap', 'LICENSE'));

// Fontes (SIL Open Font License)
for (const [pacote, arquivo] of [['outfit', 'outfit-latin-wght-normal.woff2'], ['inter', 'inter-latin-wght-normal.woff2']]) {
  const raiz = path.join(MODULOS, '@fontsource-variable', pacote);
  copiar(path.join(raiz, 'files', arquivo), path.join(SITE, 'assets', 'fontes', arquivo));
  copiar(path.join(raiz, 'LICENSE'), path.join(SITE, 'assets', 'fontes', `LICENSE-${pacote}.txt`));
}

// Sprite de ícones: cada ícone vira um <symbol id="nome">, usado com <svg><use href="../assets/icones.svg#nome"/></svg>
const simbolos = ICONES.map((nome) => {
  const svg = fs.readFileSync(path.join(MODULOS, 'bootstrap-icons', 'icons', `${nome}.svg`), 'utf8');
  const viewBox = svg.match(/viewBox="([^"]+)"/)[1];
  const corpo = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
  return `  <symbol id="${nome}" viewBox="${viewBox}">${corpo}</symbol>`;
});
const sprite = `<svg xmlns="http://www.w3.org/2000/svg">
  <!-- Bootstrap Icons 1.11.3 (MIT, https://icons.getbootstrap.com). Gerado por ferramentas/copiar-vendor.js -->
${simbolos.join('\n')}
</svg>
`;
fs.writeFileSync(path.join(SITE, 'assets', 'icones.svg'), sprite);
copiar(path.join(MODULOS, 'bootstrap-icons', 'LICENSE'), path.join(SITE, 'assets', 'LICENSE-bootstrap-icons.txt'));

module.exports = { ICONES };
console.log(`vendor copiado: Bootstrap, 2 fontes e ${ICONES.length} ícones`);
