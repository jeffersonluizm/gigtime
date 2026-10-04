// Tira prints das telas no Chrome instalado (headless), para o README e para revisão visual.
// Uso: node ferramentas/capturar-telas.js <url-base> <pasta-destino> [desktop|celular|ambos]
// Ex.: node ferramentas/capturar-telas.js http://127.0.0.1:8811 docs/img ambos
// Opcional: TELAS=home,sobre (só essas telas) e INTEIRA=1 (página inteira, não só a primeira dobra)
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const [base = 'http://127.0.0.1:8811', destino = 'docs/img', modo = 'ambos'] = process.argv.slice(2);

const TELAS = [
  { nome: 'home', url: '/Home/home.html' },
  { nome: 'explorar', url: '/anuncios/anuncios.html?papel=M%C3%BAsico' },
  { nome: 'perfil', url: '/Perfil/perfil.html?u=lia.batera', logado: 'davi.sax' },
  { nome: 'chat', url: '/Chat/chat.html?com=lia.batera', logado: 'davi.sax', conversa: true },
  { nome: 'entrar', url: '/Login/login.html' },
  { nome: 'cadastro', url: '/Registro/registro.html' },
  { nome: 'editar-perfil', url: '/EdicaoPerfil/EdicaoPerfil.html', logado: 'davi.sax' },
  { nome: 'conta', url: '/Conta/conta.html', logado: 'davi.sax' },
  { nome: 'sobre', url: '/Sobre/sobre.html' },
  { nome: 'privacidade', url: '/Privacidade/privacidade.html' },
  { nome: 'esqueci-senha', url: '/Acesso/esqueci-senha.html' },
  { nome: 'sessao-expirada', url: '/Acesso/sessao-expirada.html' },
];

const TAMANHOS = { desktop: { width: 1280, height: 800 }, celular: { width: 375, height: 812 } };

(async () => {
  fs.mkdirSync(destino, { recursive: true });
  const navegador = await chromium.launch({ executablePath: CHROME });
  const tamanhos = modo === 'ambos' ? ['desktop', 'celular'] : [modo];
  for (const tamanho of tamanhos) {
    const contexto = await navegador.newContext({ viewport: TAMANHOS[tamanho], deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const filtro = process.env.TELAS ? process.env.TELAS.split(',') : null; // ex.: TELAS=home,sobre
    for (const tela of TELAS.filter((t) => !filtro || filtro.includes(t.nome))) {
      const pagina = await contexto.newPage();
      const erros = [];
      pagina.on('pageerror', (e) => erros.push(e.message));
      pagina.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
      // Conversa de exemplo para o print do chat (gravada antes do script da página rodar)
      await pagina.addInitScript(({ logado, conversa }) => {
        if (logado && !sessionStorage.getItem('loggedInUser')) sessionStorage.setItem('loggedInUser', JSON.stringify({ username: logado, name: logado }));
        if (conversa && !localStorage.getItem('gigtime:messages')) {
          const agora = Date.now();
          const m = (de, para, texto, s) => ({ id: `${s}-${de}`, de, para, texto, enviadaEm: agora - s * 60000 });
          localStorage.setItem('gigtime:messages', JSON.stringify([
            m('davi.sax', 'lia.batera', 'Oi, Lia! Vi seu perfil. Você toparia uma participação no sábado?', 42),
            m('lia.batera', 'davi.sax', 'Oi, Davi! Topo sim. Qual o repertório e o horário?', 38),
            m('davi.sax', 'lia.batera', 'Jazz e MPB, das 21h às 23h, no Bar do Cais.', 35),
            m('lia.batera', 'davi.sax', 'Fechado. Levo a bateria compacta.', 30),
            m('casa.lume', 'davi.sax', 'Davi, temos uma data livre no fim do mês.', 12),
          ]));
        }
      }, { logado: tela.logado, conversa: tela.conversa });
      await pagina.goto(base + tela.url, { waitUntil: 'networkidle' });
      await pagina.waitForTimeout(300);
      const arquivo = path.join(destino, `${tela.nome}-${tamanho}.png`);
      await pagina.screenshot({ path: arquivo, fullPage: process.env.INTEIRA === '1' });
      console.log(`${arquivo}${erros.length ? '  ERROS: ' + erros.join(' | ') : ''}`);
      await pagina.close();
    }
    await contexto.close();
  }
  await navegador.close();
})();
