// Roda o axe-core (regras WCAG 2.1 A/AA) em todas as páginas, no Chrome instalado (headless).
// Uso: AXE_PATH=<caminho do axe.min.js> node ferramentas/verificar-acessibilidade.js <url-base>
// O axe-core não é dependência do projeto: instale à parte (npm i axe-core) e aponte AXE_PATH.
const fs = require('node:fs');
const { chromium } = require('playwright-core');

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const base = process.argv[2] || 'http://127.0.0.1:8811';
const axe = fs.readFileSync(process.env.AXE_PATH, 'utf8');

const PAGINAS = [
  ['/Home/home.html'], ['/anuncios/anuncios.html'], ['/Perfil/perfil.html?u=lia.batera'], ['/Perfil/perfil.html?u=lia.batera', 'davi.sax'],
  ['/Chat/chat.html?com=lia.batera', 'davi.sax'], ['/Login/login.html'], ['/Registro/registro.html'], ['/EdicaoPerfil/EdicaoPerfil.html', 'davi.sax'],
  ['/Conta/conta.html', 'davi.sax'], ['/Sobre/sobre.html'], ['/Privacidade/privacidade.html'], ['/Acesso/esqueci-senha.html'],
  ['/Acesso/saiu.html'], ['/Acesso/sessao-expirada.html'], ['/Sistema/erro.html'],
];

(async () => {
  const navegador = await chromium.launch({ executablePath: CHROME });
  let total = 0;
  for (const [rota, logado] of PAGINAS) {
    for (const largura of [1280, 375]) {
      const pagina = await navegador.newPage({ viewport: { width: largura, height: 800 }, bypassCSP: true });
      if (logado) await pagina.addInitScript((l) => { if (!sessionStorage.getItem('loggedInUser')) sessionStorage.setItem('loggedInUser', JSON.stringify({ username: l, name: l })); }, logado);
      await pagina.goto(base + rota, { waitUntil: 'networkidle' });
      await pagina.addScriptTag({ content: axe });
      const r = await pagina.evaluate(async () => {
        const res = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
        return res.violations.map((v) => ({ id: v.id, impacto: v.impact, alvos: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
      });
      total += r.length;
      console.log(`${largura}px ${rota}${logado ? ' (logado)' : ''}: ${r.length ? JSON.stringify(r) : 'sem violações'}`);
      await pagina.close();
    }
  }
  await navegador.close();
  console.log(`total de violações: ${total}`);
  process.exitCode = total ? 1 : 0;
})();
