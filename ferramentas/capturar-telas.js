// Tira prints das telas no Chrome instalado (headless), para o README e para revisão visual.
// Nada é injetado: o navegador começa vazio, o site grava a própria demonstração (personas e conversas)
// e as telas logadas usam o "Entrar como músico" de verdade.
// Uso: node ferramentas/capturar-telas.js <url-base> <pasta-destino> [desktop|celular|ambos]
// Ex.: node ferramentas/capturar-telas.js http://127.0.0.1:8800 docs/img ambos
// Opcional: TELAS=home,sobre (só essas telas) e INTEIRA=1 (página inteira, não só a primeira dobra)
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const [base = 'http://127.0.0.1:8800', destino = 'docs/img', modo = 'ambos'] = process.argv.slice(2);

// Na ordem em que são visitadas: primeiro como visitante, depois logado como a conta de músico da demo
const TELAS = [
  { nome: 'home', url: '/Home/home.html' },
  { nome: 'explorar', url: '/anuncios/anuncios.html?papel=M%C3%BAsico' },
  { nome: 'entrar', url: '/Login/login.html' },
  { nome: 'cadastro', url: '/Registro/registro.html' },
  { nome: 'sobre', url: '/Sobre/sobre.html' },
  { nome: 'privacidade', url: '/Privacidade/privacidade.html' },
  { nome: 'esqueci-senha', url: '/Acesso/esqueci-senha.html' },
  { nome: 'sessao-expirada', url: '/Acesso/sessao-expirada.html' },
  { entrarComo: 'musico' },
  { nome: 'perfil', url: '/Perfil/perfil.html?u=casa.lume' },
  { nome: 'chat', url: '/Chat/chat.html?com=casa.lume' },
  { nome: 'editar-perfil', url: '/EdicaoPerfil/EdicaoPerfil.html' },
  { nome: 'conta', url: '/Conta/conta.html' },
];

const TAMANHOS = { desktop: { width: 1280, height: 800 }, celular: { width: 375, height: 812 } };

(async () => {
  fs.mkdirSync(destino, { recursive: true });
  const navegador = await chromium.launch({ executablePath: CHROME });
  const tamanhos = modo === 'ambos' ? ['desktop', 'celular'] : [modo];
  const filtro = process.env.TELAS ? process.env.TELAS.split(',') : null;
  for (const tamanho of tamanhos) {
    // Um contexto limpo e uma aba só por tamanho: a sessão (sessionStorage) é da aba
    const contexto = await navegador.newContext({ viewport: TAMANHOS[tamanho], deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const pagina = await contexto.newPage();
    const erros = [];
    pagina.on('pageerror', (e) => erros.push(e.message));
    pagina.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
    for (const tela of TELAS) {
      if (tela.entrarComo) {
        await pagina.goto(`${base}/Login/login.html?demo=${tela.entrarComo}`);
        await pagina.waitForURL(/anuncios/, { waitUntil: 'networkidle' });
        continue;
      }
      if (filtro && !filtro.includes(tela.nome)) continue;
      await pagina.goto(base + tela.url, { waitUntil: 'networkidle' });
      await pagina.waitForTimeout(300);
      const arquivo = path.join(destino, `${tela.nome}-${tamanho}.png`);
      await pagina.screenshot({ path: arquivo, fullPage: process.env.INTEIRA === '1' });
      console.log(arquivo);
    }
    if (erros.length) console.log('ERROS NO CONSOLE: ' + erros.join(' | '));
    await contexto.close();
  }
  await navegador.close();
})();
