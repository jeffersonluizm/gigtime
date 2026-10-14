// Gera a ilustração da capa da Home (assets/img/palco.svg): palco com feixes de luz, painel de LEDs,
// banda e plateia em silhueta, nas cores da marca. Ilustração própria, determinística (mesma saída a
// cada execução), no lugar da foto de origem desconhecida usada antes.
// Uso: node ferramentas/gerar-capa.js
const fs = require('node:fs');
const path = require('node:path');

function aleatorio(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const L = 800;
const A = 562;
const r = aleatorio(2026);
const n = (x) => Math.round(x * 10) / 10;
let s = '';

// Fundo: noite em roxo, com névoa laranja subindo do palco
s += `<defs>
  <linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f1410"/><stop offset=".55" stop-color="#5d3a76"/><stop offset="1" stop-color="#c2410c"/></linearGradient>
  <radialGradient id="nevoa" cx=".5" cy=".72" r=".6"><stop offset="0" stop-color="#ff5629" stop-opacity=".75"/><stop offset="1" stop-color="#ff5629" stop-opacity="0"/></radialGradient>
  <linearGradient id="feixe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde7c2" stop-opacity=".55"/><stop offset="1" stop-color="#f7b801" stop-opacity="0"/></linearGradient>
</defs>
<rect width="${L}" height="${A}" fill="url(#ceu)"/>
<rect width="${L}" height="${A}" fill="url(#nevoa)"/>
`;

// Painel de LEDs ao fundo
for (let col = 0; col < 26; col++) {
  const x = 40 + col * 28.5;
  const altura = 3 + Math.floor(r() * 6);
  const inicio = 70 + r() * 120;
  for (let i = 0; i < altura; i++) s += `<circle cx="${n(x)}" cy="${n(inicio + i * 13)}" r="2.6" fill="#f7b801" opacity="${n(0.35 + r() * 0.5)}"/>`;
}
s += '\n';

// Treliça com refletores e feixes de luz cruzados
s += `<rect x="60" y="28" width="680" height="10" rx="5" fill="#140a05" opacity=".8"/>\n`;
for (let i = 0; i < 7; i++) {
  const x = 95 + i * 101;
  const alvo = 400 + (r() - 0.5) * 520;
  const largura = 70 + r() * 60;
  s += `<path d="M${n(x)} 40 L${n(alvo - largura)} 420 L${n(alvo + largura)} 420 Z" fill="url(#feixe)" opacity="${n(0.35 + r() * 0.35)}"/>`;
  s += `<circle cx="${n(x)}" cy="40" r="9" fill="#fde7c2"/><circle cx="${n(x)}" cy="40" r="16" fill="#f7b801" opacity=".25"/>`;
}
s += '\n';

// Palco e banda em silhueta (bateria, baixo, voz)
const tinta = '#140a05';
s += `<rect x="150" y="372" width="500" height="22" rx="4" fill="${tinta}" opacity=".9"/>
<g fill="${tinta}">
  <circle cx="400" cy="352" r="22"/><rect x="368" y="356" width="64" height="16" rx="3"/>
  <ellipse cx="350" cy="336" rx="18" ry="5"/><rect x="348" y="336" width="4" height="36"/>
  <ellipse cx="452" cy="330" rx="20" ry="5"/><rect x="450" y="330" width="4" height="42"/>
  <circle cx="400" cy="312" r="11"/><path d="M386 324 h28 l6 30 h-40 z"/>
  <circle cx="290" cy="300" r="12"/><path d="M276 314 h28 l4 58 h-36 z"/><path d="M268 334 l64 -26 l3 7 l-63 26 z"/>
  <circle cx="512" cy="296" r="12"/><path d="M498 310 h28 l4 62 h-36 z"/><rect x="540" y="292" width="3" height="80"/><circle cx="541" cy="292" r="5"/>
</g>
`;

// Plateia: cabeças e mãos levantadas, em três fileiras
for (let fila = 0; fila < 3; fila++) {
  const base = 470 + fila * 38;
  const tamanho = 22 + fila * 6;
  for (let x = -10; x < L + 20; x += tamanho * 1.15 + r() * 8) {
    const y = base + (r() - 0.5) * 10;
    s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(tamanho / 2)}" fill="${tinta}"/>`;
    s += `<rect x="${n(x - tamanho / 2)}" y="${n(y + tamanho / 3)}" width="${n(tamanho)}" height="${A}" rx="${n(tamanho / 3)}" fill="${tinta}"/>`;
    if (r() < 0.32) {
      const lado = r() < 0.5 ? -1 : 1;
      const mx = x + lado * tamanho * 0.6;
      const topo = y - 46 - r() * 20;
      const giro = n(lado * (8 + r() * 12));
      // braço levantado; às vezes com um celular gravando o show na ponta
      s += `<g transform="rotate(${giro} ${n(mx)} ${n(y)})"><rect x="${n(mx - 4)}" y="${n(topo)}" width="9" height="56" rx="4.5" fill="${tinta}"/>`;
      if (r() < 0.3) s += `<rect x="${n(mx - 7)}" y="${n(topo - 18)}" width="15" height="24" rx="3" fill="${tinta}"/><rect x="${n(mx - 5)}" y="${n(topo - 16)}" width="11" height="18" rx="2" fill="#fde7c2" opacity=".85"/>`;
      s += '</g>';
    }
  }
  s += '\n';
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${A}" width="${L}" height="${A}">
<!-- Ilustração própria do GigTime, gerada por ferramentas/gerar-capa.js -->
${s}</svg>
`;
const destino = path.join(__dirname, '..', 'codigo-fonte', 'assets', 'img', 'palco.svg');
fs.writeFileSync(destino, svg);
console.log(`${destino}: ${(fs.statSync(destino).size / 1024).toFixed(1)} KB`);
