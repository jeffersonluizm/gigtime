const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { RAIZ } = require('./apoio');

// O parser do navegador descarta um </div> sobrando, então o problema só aparece no código-fonte
test('home.js: o template do card abre e fecha o mesmo número de divs', () => {
  const codigo = fs.readFileSync(path.join(RAIZ, 'Home', 'home.js'), 'utf8');
  const template = codigo.match(/const card = `([\s\S]*?)`;/)[1];
  assert.equal((template.match(/<div[\s>]/g) || []).length, (template.match(/<\/div>/g) || []).length);
});
