// H1: lógica pura em Node com volumes que não cabem no localStorage (10 mil usuários, 100 mil mensagens),
// comparando a lib de antes (worktree do commit base) com a de depois.
// Uso: node ferramentas/carga/medir-node.js <pasta-codigo-fonte-antes> <saida.json>
const path = require('node:path');
const fs = require('node:fs');
const { performance } = require('node:perf_hooks');
const { gerarUsuarios, gerarMensagens } = require('./gerar-dados.js');

const [pastaAntes, saida] = process.argv.slice(2);
const pastaDepois = path.join(__dirname, '..', '..', 'codigo-fonte');
const REPETICOES = 15;

function medir(fn) {
  fn(); // aquecimento (JIT)
  const tempos = [];
  for (let i = 0; i < REPETICOES; i++) {
    const t = performance.now();
    fn();
    tempos.push(performance.now() - t);
  }
  tempos.sort((a, b) => a - b);
  return { mediana: tempos[Math.floor(tempos.length / 2)], p95: tempos[Math.ceil(tempos.length * 0.95) - 1] };
}

const usuarios = gerarUsuarios(10000, 'x.svg');
const nomes = usuarios.slice(0, 200).map((u) => u.username);
const mensagens = gerarMensagens(100000, nomes, [nomes[0], nomes[1]], 20000);
const filtro = { papel: 'Músico', estado: 'MG', avaliacaoMinima: 4, generos: ['Jazz', 'MPB'] };

const resultado = {};
for (const [versao, pasta] of [['antes', pastaAntes], ['depois', pastaDepois]]) {
  const F = require(path.join(pasta, 'lib', 'filtros.js'));
  const M = require(path.join(pasta, 'lib', 'mensagens.js'));
  resultado[versao] = {
    'filtrar 10k usuarios': medir(() => usuarios.filter((u) => F.correspondeFiltro(u, filtro))),
    'listarConversas 100k': medir(() => M.listarConversas(mensagens, nomes[0])),
    'conversaEntre 100k': medir(() => M.conversaEntre(mensagens, nomes[0], nomes[1])),
  };
  if (M.naoLidas) resultado[versao]['naoLidas 100k'] = medir(() => M.naoLidas(mensagens, nomes[0], {}));
  if (F.filtroDaUrl) resultado[versao]['filtrar 10k com busca por texto'] = medir(() => usuarios.filter((u) => F.correspondeFiltro(u, { ...filtro, texto: 'belo' })));
}

// O(n²) do filtro antigo da página: users.find por card (reproduz o laço de scriptAnuncios.js)
const Fantes = require(path.join(pastaAntes, 'lib', 'filtros.js'));
resultado.antes['laço da página: find por card, 5k'] = medir(() => {
  const cinco = usuarios.slice(0, 5000);
  for (const card of cinco) Fantes.correspondeFiltro(cinco.find((u) => u.username === card.username), filtro);
});
resultado.depois['laço da página: Map por card, 5k'] = medir(() => {
  const cinco = usuarios.slice(0, 5000);
  const mapa = new Map(cinco.map((u) => [u.username, u]));
  for (const card of cinco) Fantes.correspondeFiltro(mapa.get(card.username), filtro);
});

fs.writeFileSync(saida, JSON.stringify(resultado, null, 2));
console.log(JSON.stringify(resultado, null, 2));
