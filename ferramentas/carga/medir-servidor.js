// H13 (referência): autocannon contra o servidor estático local (python -m http.server, como no iniciar.bat).
// Degraus de 1, 10 e 50 conexões, 10 s cada, depois de 3 s de aquecimento.
// Uso: node ferramentas/carga/medir-servidor.js <url> <saida.json>
const fs = require('node:fs');
const os = require('node:os');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const executar = promisify(execFile);

const [url, saida] = process.argv.slice(2);

// CPU média e memória livre mínima da máquina durante o degrau (servidor e gerador na mesma máquina)
function monitorar() {
  const amostras = [];
  let anterior = os.cpus();
  const timer = setInterval(() => {
    const atual = os.cpus();
    let ocioso = 0;
    let total = 0;
    atual.forEach((cpu, i) => {
      const a = anterior[i].times;
      const b = cpu.times;
      total += (b.user - a.user) + (b.nice - a.nice) + (b.sys - a.sys) + (b.irq - a.irq) + (b.idle - a.idle);
      ocioso += b.idle - a.idle;
    });
    anterior = atual;
    if (total > 0) amostras.push({ cpu: 100 * (1 - ocioso / total), livre: os.freemem() / 1048576 });
  }, 500);
  return () => {
    clearInterval(timer);
    return { cpuMediaPct: Math.round(amostras.reduce((s, a) => s + a.cpu, 0) / Math.max(1, amostras.length)), memLivreMinMB: Math.round(Math.min(...amostras.map((a) => a.livre))) };
  };
}

async function rodar(conexoes, segundos) {
  const parar = monitorar();
  const { stdout } = await executar('npx', ['--yes', 'autocannon@8', '-c', String(conexoes), '-d', String(segundos), '-j', url], { shell: true, maxBuffer: 64 * 1024 * 1024, timeout: 120000 });
  const recursos = parar();
  const r = JSON.parse(stdout.slice(stdout.indexOf('{')));
  return {
    recursos,
    conexoes,
    reqPorSegundo: Math.round(r.requests.average),
    latenciaMs: { p50: r.latency.p50, p97_5: r.latency.p97_5, p99: r.latency.p99, max: r.latency.max },
    erros: r.errors + r.timeouts + (r.non2xx || 0),
    totalRequisicoes: r.requests.total,
  };
}

(async () => {
  await rodar(10, 3); // aquecimento
  const degraus = [];
  for (const c of [1, 10, 50]) degraus.push(await rodar(c, 10));
  const resultado = { url, quando: new Date().toISOString(), maquina: { cpus: os.cpus().length, modelo: os.cpus()[0].model }, degraus };
  fs.writeFileSync(saida, JSON.stringify(resultado, null, 2));
  console.log(JSON.stringify(resultado, null, 2));
})();
