// Fonte única da contagem de testes: roda a suíte e grava o número real em todo lugar que o cita
// (README, página Sobre e documentos 02 e 08), entre os marcadores <!-- testes -->N<!-- /testes -->.
// Uso: node ferramentas/atualizar-contagem-testes.js
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = path.join(__dirname, '..');
const ARQUIVOS = [
  'README.md',
  'codigo-fonte/Sobre/sobre.html',
  ...fs.readdirSync(path.join(RAIZ, 'documentos')).filter((f) => /^0[28]-.*\.md$/.test(f)).map((f) => 'documentos/' + f),
];

const execucao = spawnSync(process.execPath, ['--test', '--test-reporter=tap', 'testes/**/*.test.js'], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const total = Number((execucao.stdout.match(/^# tests (\d+)$/m) || [])[1]);
const falhas = Number((execucao.stdout.match(/^# fail (\d+)$/m) || [])[1]);
if (!total) throw new Error('não consegui ler o total de testes da saída do node --test');
if (falhas) throw new Error(`${falhas} teste(s) falhando: corrija antes de publicar a contagem`);

for (const relativo of ARQUIVOS) {
  const caminho = path.join(RAIZ, relativo);
  const bruto = fs.readFileSync(caminho);
  const texto = bruto.toString('utf8');
  const novo = texto.replace(/<!-- testes -->\d+<!-- \/testes -->/g, `<!-- testes -->${total}<!-- /testes -->`);
  if (novo !== texto) fs.writeFileSync(caminho, novo);
  console.log(`${relativo}: ${(texto.match(/<!-- testes -->/g) || []).length} marcador(es)`);
}
console.log(`total de testes: ${total}`);
