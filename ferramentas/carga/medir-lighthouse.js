// H11: Lighthouse (npx lighthouse com o Chrome instalado) nas páginas Home e Explorar, desktop e celular,
// 3 execuções de cada, mediana. Uso: node ferramentas/carga/medir-lighthouse.js <antes|depois> <base> <saida.json>
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const [versao, base, saida] = process.argv.slice(2);
const RODADAS = Number(process.env.RODADAS || 3);
const PAGINAS = {
  home: '/Home/home.html',
  explorar: versao === 'antes' ? '/An%C3%BAncios/anuncios.html' : '/anuncios/anuncios.html',
};

const mediana = (v) => [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)];

const resultado = { versao, base, quando: new Date().toISOString() };
for (const [nome, rota] of Object.entries(PAGINAS)) {
  for (const perfil of ['desktop', 'celular']) {
    const rodadas = [];
    for (let i = 0; i < RODADAS; i++) {
      const arquivo = path.join(os.tmpdir(), `lh-gigtime-${versao}-${nome}-${perfil}-${i}.json`);
      // LIGHTHOUSE_BIN aponta para uma instalação local (útil quando o cache do npx está ocupado)
      const comando = process.env.LIGHTHOUSE_BIN || 'npx';
      const args = [...(process.env.LIGHTHOUSE_BIN ? [] : ['--yes', 'lighthouse@12']), base + rota, `--chrome-path="${CHROME}"`, '--chrome-flags=--headless=new',
        '--only-categories=performance,accessibility,best-practices', '--output=json', `--output-path="${arquivo}"`, '--quiet'];
      if (perfil === 'desktop') args.push('--preset=desktop');
      try {
        execFileSync(comando, args, { stdio: 'ignore', shell: true, timeout: 180000 });
      } catch (e) { /* o Lighthouse sai com erro quando a página não pinta; o JSON traz o motivo */ }
      if (!fs.existsSync(arquivo)) { rodadas.push({ erro: 'sem relatório' }); continue; }
      const r = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
      fs.unlinkSync(arquivo);
      if (r.runtimeError && r.runtimeError.code !== 'NO_ERROR') { rodadas.push({ erro: r.runtimeError.code }); continue; }
      rodadas.push({
        desempenho: Math.round(r.categories.performance.score * 100),
        acessibilidade: Math.round(r.categories.accessibility.score * 100),
        boasPraticas: Math.round(r.categories['best-practices'].score * 100),
        lcpMs: Math.round(r.audits['largest-contentful-paint'].numericValue),
        fcpMs: Math.round(r.audits['first-contentful-paint'].numericValue),
        tbtMs: Math.round(r.audits['total-blocking-time'].numericValue),
        cls: Math.round(r.audits['cumulative-layout-shift'].numericValue * 1000) / 1000,
        pesoKB: Math.round(r.audits['total-byte-weight'].numericValue / 1024),
        falhasAcessibilidade: Object.values(r.audits).filter((a) => a.score === 0 && r.categories.accessibility.auditRefs.some((ref) => ref.id === a.id)).map((a) => a.id),
      });
    }
    const chaves = ['desempenho', 'acessibilidade', 'boasPraticas', 'lcpMs', 'fcpMs', 'tbtMs', 'cls', 'pesoKB'];
    const validas = rodadas.filter((r) => !r.erro);
    resultado[`${nome}-${perfil}`] = validas.length
      ? Object.fromEntries(chaves.map((k) => [k, mediana(validas.map((r) => r[k]))]))
      : { erro: rodadas.map((r) => r.erro).join(', ') };
    resultado[`${nome}-${perfil}`].rodadasComErro = rodadas.length - validas.length;
    resultado[`${nome}-${perfil}`].falhasAcessibilidade = [...new Set(validas.flatMap((r) => r.falhasAcessibilidade))];
    console.log(versao, nome, perfil, JSON.stringify(resultado[`${nome}-${perfil}`]));
  }
}
fs.writeFileSync(saida, JSON.stringify(resultado, null, 2));
