const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { RAIZ } = require('./apoio');

// O parser do navegador descarta um </div> sobrando, então o problema só aparece no código-fonte
test('ui/cards.js: o template do card abre e fecha o mesmo número de divs e articles', () => {
  const codigo = fs.readFileSync(path.join(RAIZ, 'ui', 'cards.js'), 'utf8');
  for (const tag of ['div', 'article', 'ul', 'a']) {
    const abre = (codigo.match(new RegExp('<' + tag + '[\\s>]', 'g')) || []).length;
    const fecha = (codigo.match(new RegExp('</' + tag + '>', 'g')) || []).length;
    assert.ok(abre > 0, tag);
    assert.equal(abre, fecha, tag);
  }
});
