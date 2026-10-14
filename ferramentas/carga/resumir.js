// Junta os resultados brutos (JSON de medir-node, medir-navegador, medir-lighthouse e medir-servidor)
// num resumo pequeno (docs/carga/<data>-medicoes.json) e desenha o gráfico antes x depois (SVG).
// Uso: node ferramentas/carga/resumir.js <pasta-dos-brutos> <data>
const fs = require('node:fs');
const path = require('node:path');

const [pasta, data] = process.argv.slice(2);
const ler = (nome) => JSON.parse(fs.readFileSync(path.join(pasta, nome), 'utf8'));
const antes = ler('navegador-antes.json');
const depois = ler('navegador-depois-final.json');
const node = ler('node.json');
const lhAntes = ler('lighthouse-antes.json');
const lhDepois = ler('lighthouse-depois.json');
const srvAntes = ler('servidor-antes.json');
const srvDepois = ler('servidor-depois.json');

const r1 = (v) => (typeof v === 'number' ? Math.round(v * 10) / 10 : v);
const med = (o) => (o ? r1(o.mediana) : null);
// maior valor das amostras (os brutos antigos chamavam esse campo de p95)
const maximo = (o) => (o ? r1(o.max !== undefined ? o.max : o.p95) : null);

// Cenários de tempo (ms): rótulo, meta, antes, depois
const cenarios = [
  { id: 'H2', rotulo: 'Explorar 5 mil perfis: resultados na tela', meta: 1000, antes: antes.H2.cardsProntosMs, depois: depois.H2.cardsProntosMs, nota: 'antes: 5 mil cards; depois: primeira página (24)' },
  { id: 'H3', rotulo: 'Explorar 5 mil: trocar o filtro', meta: 100, antes: antes.H3.trocaDeFiltroMs, depois: depois.H3.trocaDeFiltroMs },
  { id: 'H4', rotulo: 'Home com 5 mil usuários: LCP', meta: 2500, antes: antes.H4.lcpMs, depois: depois.H4.lcpMs },
  { id: 'H7', rotulo: 'Chat com 25 mil mensagens: abrir', meta: 500, antes: antes.H7.abrirChatMs, depois: depois.H7.abrirChatMs },
  { id: 'H8', rotulo: 'Chat com 25 mil: enviar uma mensagem', meta: 200, antes: antes.H8.enviarMs, depois: depois.H8.enviarMs },
  { id: 'H9', rotulo: 'Abrir conversa de 5 mil mensagens', meta: 500, antes: antes.H9.abrirConversaPelaListaMs, depois: depois.H9.abrirConversaPelaListaMs },
].map((c) => ({ ...c, antes: { mediana: med(c.antes), max: maximo(c.antes) }, depois: { mediana: med(c.depois), max: maximo(c.depois) } }));

const resumo = {
  data,
  ambiente: { maquina: antes.maquina, chrome: antes.chrome, repeticoes: antes.repeticoes, observacao: 'gerador e navegador na mesma máquina, com outros projetos rodando ao mesmo tempo; CPU média de 50 a 100% durante as medições' },
  tempos: cenarios,
  H1_node: node,
  H5: { antes: antes.H5, depois: depois.H5 },
  H6: { antes: antes.H6, depois: depois.H6 },
  H10: { antes: antes.H10, depois: depois.H10 },
  H11_lighthouse: { antes: lhAntes, depois: lhDepois },
  H12: { antes: antes.H12, depois: depois.H12 },
  // H13 inconclusivo: o python -m http.server derrubou conexões e as latências registradas são incoerentes
  // (ex.: 1 conexão, 370 req/s com p50 de 2,7 s; mais erros que requisições). Ver resultados.md.
  H13_servidor: {
    status: 'inconclusivo',
    motivo: 'o servidor de desenvolvimento (python -m http.server) recusou e derrubou conexões; o autocannon registrou mais erros que respostas e latências incoerentes com as requisições por segundo, então os números não medem o site',
    errosPorDegrau: { antes: srvAntes.degraus.map((d) => ({ conexoes: d.conexoes, erros: d.erros })), depois: srvDepois.degraus.map((d) => ({ conexoes: d.conexoes, erros: d.erros })) },
  },
  recursos: Object.fromEntries(Object.entries({ ...antes, ...Object.fromEntries(Object.entries(depois).map(([k, v]) => [k + '_depois', v])) }).filter(([k]) => k.startsWith('recursos'))),
};
const destino = path.join(__dirname, '..', '..', 'docs', 'carga');
fs.writeFileSync(path.join(destino, `${data}-medicoes.json`), JSON.stringify(resumo, null, 2) + '\n');

// ---------- Gráfico: pequenos múltiplos, um painel por cenário, cada um na sua escala ----------
// Cores validadas (dataviz/validate_palette.js): antes = índigo #484f9f, depois = laranja #c2410c.
const COR = { antes: '#484f9f', depois: '#c2410c', texto: '#2b211d', suave: '#6b5a52', grade: '#e7d8cf', fundo: '#ffffff' };
const LARG = 1000;
const COLS = 2;
const PW = 470;
const PH = 150;
const MARGEM = { topo: 92, esq: 20 };
const fmt = (v) => (v >= 1000 ? (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' s' : Math.round(v) + ' ms');
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');

let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LARG} ${MARGEM.topo + Math.ceil(cenarios.length / COLS) * (PH + 30) + 10}" font-family="Segoe UI, Helvetica, Arial, sans-serif" role="img" aria-labelledby="t d">
<title id="t">GigTime: tempos antes e depois das correções</title>
<desc id="d">Seis painéis, um por cenário, cada um na sua escala. Barra índigo: antes; barra laranja: depois; linha tracejada: meta. Mediana de 5 execuções no Chrome.</desc>
<rect width="100%" height="100%" fill="${COR.fundo}"/>
<text x="${MARGEM.esq}" y="34" font-size="22" font-weight="700" fill="${COR.texto}">Teste de carga do GigTime: antes x depois (mediana, ms)</text>
<rect x="${MARGEM.esq}" y="54" width="14" height="14" rx="3" fill="${COR.antes}"/><text x="${MARGEM.esq + 20}" y="66" font-size="14" fill="${COR.texto}">Antes (commit 5319271)</text>
<rect x="${MARGEM.esq + 200}" y="54" width="14" height="14" rx="3" fill="${COR.depois}"/><text x="${MARGEM.esq + 220}" y="66" font-size="14" fill="${COR.texto}">Depois (feat/portfolio-ui-ux)</text>
<line x1="${MARGEM.esq + 440}" y1="61" x2="${MARGEM.esq + 470}" y2="61" stroke="${COR.texto}" stroke-width="2" stroke-dasharray="5 4"/><text x="${MARGEM.esq + 478}" y="66" font-size="14" fill="${COR.texto}">Meta da hipótese</text>
`;
cenarios.forEach((c, i) => {
  const x0 = MARGEM.esq + (i % COLS) * (PW + 20);
  const y0 = MARGEM.topo + Math.floor(i / COLS) * (PH + 30);
  const max = Math.max(c.antes.mediana, c.depois.mediana, c.meta) * 1.15;
  const area = { x: x0 + 70, w: PW - 90 };
  const escala = (v) => (v / max) * area.w;
  svg += `<g>
<text x="${x0}" y="${y0 + 16}" font-size="15" font-weight="700" fill="${COR.texto}">${esc(c.id)} · ${esc(c.rotulo)}</text>
<line x1="${area.x}" y1="${y0 + 30}" x2="${area.x}" y2="${y0 + 118}" stroke="${COR.grade}" stroke-width="1"/>`;
  // a meta vai atrás das barras e dos rótulos
  const xm = area.x + escala(c.meta);
  svg += `
<line x1="${xm}" y1="${y0 + 32}" x2="${xm}" y2="${y0 + 116}" stroke="${COR.suave}" stroke-width="2" stroke-dasharray="5 4"/>
<text x="${xm}" y="${y0 + 132}" font-size="12" fill="${COR.suave}" text-anchor="middle">meta ${fmt(c.meta)}</text>`;
  [['antes', 'Antes', 40], ['depois', 'Depois', 80]].forEach(([chave, nome, dy]) => {
    const v = c[chave].mediana;
    const w = Math.max(4, escala(v));
    const passou = v <= c.meta;
    svg += `
<text x="${x0}" y="${y0 + dy + 17}" font-size="13" fill="${COR.suave}">${nome}</text>
<path d="M${area.x} ${y0 + dy} h${w - 4} a4 4 0 0 1 4 4 v20 a4 4 0 0 1 -4 4 h-${w - 4} z" fill="${COR[chave]}"/>
<text x="${area.x + w + 6}" y="${y0 + dy + 18}" font-size="13" font-weight="600" fill="${COR.texto}" stroke="${COR.fundo}" stroke-width="5" stroke-linejoin="round" paint-order="stroke">${fmt(v)} ${passou ? '✓' : '✗'}</text>`;
  });
  svg += `
</g>
`;
});
svg += `<text x="${MARGEM.esq}" y="${MARGEM.topo + Math.ceil(cenarios.length / COLS) * (PH + 30) - 6}" font-size="12" fill="${COR.suave}">✓ dentro da meta · ✗ fora da meta. Ryzen 5 5600, 16 GB, Chrome ${esc(antes.chrome)}, headless; gerador e navegador na mesma máquina.</text>
</svg>
`;
fs.writeFileSync(path.join(destino, `${data}-grafico.svg`), svg);
console.log(JSON.stringify(cenarios.map((c) => [c.id, c.antes.mediana, c.depois.mediana, c.meta])));
