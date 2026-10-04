// Teste de carga no navegador real (Chrome instalado, headless, via playwright-core).
// Mede as hipóteses H2-H10 e H12 numa versão do site (antes ou depois) servida em <base>.
// Uso: node ferramentas/carga/medir-navegador.js <antes|depois> <base> <saida.json> [H2,H3,...]
// Os dados são gerados por gerar-dados.js e gravados no localStorage antes de abrir cada página.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { gerarUsuarios, gerarMensagens } = require('./gerar-dados.js');

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const [versao, base, saida, filtro] = process.argv.slice(2);
const REPETICOES = Number(process.env.REPETICOES || 5);
const VENDOR = path.join(__dirname, '..', '..', 'codigo-fonte', 'vendor', 'bootstrap');

const ROTAS = {
  antes: { home: '/Home/home.html', explorar: '/An%C3%BAncios/anuncios.html', chat: '/Chat/chat.html', registro: '/Registro/registro.html', foto: '../userImages/defaultUser.jpg' },
  depois: { home: '/Home/home.html', explorar: '/anuncios/anuncios.html', chat: '/Chat/chat.html', registro: '/Registro/registro.html', foto: '../assets/img/avatar-padrao.svg' },
}[versao];

const estatistica = (valores) => {
  const ordenados = valores.filter((v) => typeof v === 'number').sort((a, b) => a - b);
  if (!ordenados.length) return null;
  return { mediana: ordenados[Math.floor(ordenados.length / 2)], p95: ordenados[ordenados.length - 1], amostras: ordenados.map((v) => Math.round(v * 10) / 10) };
};

// Amostra de CPU e memória da máquina durante o cenário (gerador e "servidor" dividem a máquina)
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
      const t = (b.user - a.user) + (b.nice - a.nice) + (b.sys - a.sys) + (b.irq - a.irq) + (b.idle - a.idle);
      total += t;
      ocioso += b.idle - a.idle;
    });
    anterior = atual;
    if (total > 0) amostras.push({ cpu: 100 * (1 - ocioso / total), livreMB: os.freemem() / 1048576 });
  }, 500);
  return () => {
    clearInterval(timer);
    if (!amostras.length) return null;
    return {
      cpuMediaPct: Math.round(amostras.reduce((s, a) => s + a.cpu, 0) / amostras.length),
      cpuMaxPct: Math.round(Math.max(...amostras.map((a) => a.cpu))),
      memLivreMinMB: Math.round(Math.min(...amostras.map((a) => a.livreMB))),
    };
  };
}

async function novaPagina(navegador) {
  const contexto = await navegador.newContext({ viewport: { width: 1280, height: 800 } });
  // Isola a rede: Bootstrap de CDN (versão antes) vem da cópia local idêntica; ícones de CDN são bloqueados
  await contexto.route(/cdn\.jsdelivr\.net\/npm\/bootstrap@[^/]+\/dist\/(css|js)\/(bootstrap\.min\.css|bootstrap\.bundle\.min\.js)/, (rota) => {
    const arquivo = rota.request().url().endsWith('.css') ? 'bootstrap.min.css' : 'bootstrap.bundle.min.js';
    rota.fulfill({ path: path.join(VENDOR, arquivo) });
  });
  await contexto.route(/(cdnjs\.cloudflare\.com|unpkg\.com|flaticons\.net|picsum\.photos|images\.pexels\.com|i\.postimg\.cc)/, (rota) => rota.abort());
  const pagina = await contexto.newPage();
  pagina.__dialogos = [];
  pagina.__erros = [];
  pagina.on('dialog', (d) => { pagina.__dialogos.push(d.message()); d.dismiss().catch(() => {}); });
  pagina.on('pageerror', (e) => pagina.__erros.push(e.message));
  return { contexto, pagina };
}

// Grava os dados na origem antes de abrir a página medida (o seed não roda porque já há usuários)
async function prepararDados(pagina, { usuarios, mensagens, logado }) {
  await pagina.goto(base + '/lib/html.js');
  await pagina.evaluate(({ u, m, l }) => {
    localStorage.clear();
    sessionStorage.clear();
    if (u) localStorage.setItem('gigtime:users', u);
    if (m) localStorage.setItem('gigtime:messages', m);
    if (l) sessionStorage.setItem('loggedInUser', JSON.stringify({ username: l, name: l }));
  }, { u: usuarios && JSON.stringify(usuarios), m: mensagens && JSON.stringify(mensagens), l: logado });
}

// Instala, antes dos scripts da página, um laço por frame que marca quando `seletor` chega a `minimo` elementos
async function marcarPronto(pagina, seletor, minimo) {
  await pagina.addInitScript(({ seletor, minimo }) => {
    window.__pronto = null;
    const verificar = () => {
      if (document.querySelectorAll(seletor).length >= minimo) { window.__pronto = performance.now(); return; }
      requestAnimationFrame(verificar);
    };
    requestAnimationFrame(verificar);
    new PerformanceObserver((lista) => { for (const e of lista.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  }, { seletor, minimo });
}

async function esperarPronto(pagina, limite = 60000) {
  await pagina.waitForFunction(() => window.__pronto !== null, null, { timeout: limite, polling: 50 });
  return pagina.evaluate(() => window.__pronto);
}

// "Até o próximo frame": requestAnimationFrame + setTimeout(0) depois da ação síncrona (aproximação do INP).
// Sem eval: a CSP do site (script-src 'self') bloquearia.

const CENARIOS = {
  // H2 e H3: Explorar com 5 mil usuários
  async H2(navegador) {
    const usuarios = gerarUsuarios(5000, ROTAS.foto);
    const prontos = [];
    const filtros = [];
    for (let i = 0; i < REPETICOES; i++) {
      const { contexto, pagina } = await novaPagina(navegador);
      await prepararDados(pagina, { usuarios });
      // antes: desenha os 5 mil cards de uma vez; depois: desenha a primeira página (24) e pagina o resto
      await marcarPronto(pagina, '#anuncios .card', versao === 'antes' ? 5000 : 24);
      await pagina.goto(base + ROTAS.explorar);
      prontos.push(await esperarPronto(pagina));
      // H3: troca o estado 5 vezes e mede cada troca até o próximo frame
      const trocas = await pagina.evaluate(async () => {
        const tempos = [];
        for (const uf of ['MG', 'SP', 'RJ', 'BA', '']) {
          const select = document.getElementById('state');
          const t = performance.now();
          select.value = uf;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
          tempos.push(performance.now() - t);
        }
        return tempos;
      });
      filtros.push(...trocas);
      await contexto.close();
    }
    return { H2: { cardsProntosMs: estatistica(prontos) }, H3: { trocaDeFiltroMs: estatistica(filtros) } };
  },

  // H4: Home com 5 mil usuários
  async H4(navegador) {
    const usuarios = gerarUsuarios(5000, ROTAS.foto);
    const lcps = [];
    const prontos = [];
    for (let i = 0; i < REPETICOES; i++) {
      const { contexto, pagina } = await novaPagina(navegador);
      await prepararDados(pagina, { usuarios });
      await marcarPronto(pagina, '#anunciosMusic .card', 1);
      await pagina.goto(base + ROTAS.home, { waitUntil: 'load' });
      prontos.push(await esperarPronto(pagina));
      await pagina.waitForTimeout(1500);
      lcps.push(await pagina.evaluate(() => window.__lcp));
      await contexto.close();
    }
    return { H4: { lcpMs: estatistica(lcps), primeirosCardsMs: estatistica(prontos) } };
  },

  // H5: cota de usuários (busca binária) e cadastro com o armazenamento cheio
  async H5(navegador) {
    const { contexto, pagina } = await novaPagina(navegador);
    await prepararDados(pagina, {});
    const modelo = gerarUsuarios(1, ROTAS.foto)[0];
    if (versao === 'depois') Object.assign(modelo, { bio: 'Baterista com 8 anos de estrada em bares e festivais. Toca covers de rock nacional e pop.', disponibilidade: 'Fins de semana' });
    const capacidade = await pagina.evaluate((modelo) => {
      const lista = (n) => JSON.stringify(Array.from({ length: n }, (_, i) => ({ ...modelo, username: 'c' + i, email: `c${i}@example.com`, phone: String(i) })));
      const cabe = (n) => { try { localStorage.setItem('gigtime:users', lista(n)); return true; } catch (e) { return false; } };
      let baixo = 0; let alto = 20000;
      while (alto - baixo > 1) { const meio = (baixo + alto) >> 1; if (cabe(meio)) baixo = meio; else alto = meio; }
      cabe(baixo);
      return { usuarios: baixo, caracteresPorUsuario: Math.round(lista(1).length) };
    }, modelo);
    // Cadastro com o armazenamento cheio: a página avisa?
    await pagina.evaluate(() => {
      // completa o espaço que sobrou com uma chave de enchimento
      let tamanho = 1 << 20;
      while (tamanho >= 16) {
        try { localStorage.setItem('enchimento-' + Math.random(), 'x'.repeat(tamanho)); } catch (e) { tamanho >>= 1; }
      }
    });
    await pagina.goto(base + ROTAS.registro);
    const campos = { username: 'novo.carga', name: 'Novo Carga', email: 'novo.carga@example.com', phone: '(31) 98765-4321', city: 'BH', password: 'senhaLonga123', confirmPassword: 'senhaLonga123' };
    for (const [id, valor] of Object.entries(campos)) await pagina.fill('#' + id, valor);
    await pagina.selectOption('#role', 'Músico');
    await pagina.selectOption('#state', 'MG');
    await pagina.check('#genreRock');
    await pagina.click('button[type="submit"]');
    await pagina.waitForTimeout(3000);
    const aviso = await pagina.evaluate(() => {
      const el = document.querySelector('[data-erro-formulario]');
      return el ? el.textContent.trim() : '';
    });
    const resultado = { capacidade, cadastroCheio: { avisoNaTela: aviso, alertas: pagina.__dialogos.slice(), errosNaoTratados: pagina.__erros.slice() } };
    await contexto.close();
    return { H5: resultado };
  },

  // H6: cota de mensagens de 50 caracteres e envio no chat com o armazenamento cheio
  async H6(navegador) {
    const usuarios = gerarUsuarios(10, ROTAS.foto);
    const { contexto, pagina } = await novaPagina(navegador);
    await prepararDados(pagina, { usuarios });
    const capacidade = await pagina.evaluate((nomes) => {
      const msg = (i) => ({ id: `${1700000000000 + i}-${i.toString(36)}`, de: nomes[i % 2], para: nomes[(i + 1) % 2], texto: `m${String(i).padStart(5, '0')} ` + 'x'.repeat(44), enviadaEm: 1700000000000 + i * 1000 });
      const cabe = (n) => { try { localStorage.setItem('gigtime:messages', JSON.stringify(Array.from({ length: n }, (_, i) => msg(i)))); return true; } catch (e) { return false; } };
      let baixo = 0; let alto = 60000;
      while (alto - baixo > 1) { const meio = (baixo + alto) >> 1; if (cabe(meio)) baixo = meio; else alto = meio; }
      cabe(baixo);
      return { mensagens: baixo };
    }, usuarios.map((u) => u.username));
    await pagina.evaluate((logado) => sessionStorage.setItem('loggedInUser', JSON.stringify({ username: logado, name: logado })), usuarios[0].username);
    await pagina.goto(base + ROTAS.chat + '?com=' + encodeURIComponent(usuarios[1].username));
    await pagina.waitForTimeout(500);
    await pagina.fill('#mensagem', 'Mensagem que não cabe mais'.repeat(20));
    // submit direto: na versão antes o botão é só um ícone de CDN (bloqueado aqui), sem área visível
    await pagina.evaluate(() => document.getElementById('chatForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })));
    await pagina.waitForTimeout(500);
    const depois = await pagina.evaluate(() => ({
      gravadas: JSON.parse(localStorage.getItem('gigtime:messages')).length,
      avisoNaTela: (document.getElementById('erroEnvio') || {}).textContent || '',
      campo: document.getElementById('mensagem').value.length,
    }));
    await contexto.close();
    return { H6: { capacidade, envioCheio: { ...depois, alertas: pagina.__dialogos.slice(), perdeuAnteriores: depois.gravadas < capacidade.mensagens } } };
  },

  // H7, H8 e H9: chat com 25 mil mensagens (5 mil na conversa principal)
  async H7(navegador) {
    const usuarios = gerarUsuarios(50, ROTAS.foto);
    const nomes = usuarios.map((u) => u.username);
    const mensagens = gerarMensagens(25000, nomes, [nomes[0], nomes[1]], 5000);
    const esperado = versao === 'antes' ? 5000 : 100;
    const aberturas = [];
    const envios = [];
    const cliques = [];
    for (let i = 0; i < REPETICOES; i++) {
      const { contexto, pagina } = await novaPagina(navegador);
      await prepararDados(pagina, { usuarios, mensagens, logado: nomes[0] });
      await marcarPronto(pagina, '.messagechat', esperado);
      await pagina.goto(base + ROTAS.chat + '?com=' + encodeURIComponent(nomes[1]));
      aberturas.push(await esperarPronto(pagina));
      // H8: enviar 3 mensagens, cada uma medida até o próximo frame
      const tempos = await pagina.evaluate(async () => {
        const tempos = [];
        for (let j = 0; j < 3; j++) {
          const campo = document.getElementById('mensagem');
          campo.value = 'Mensagem de carga ' + j;
          const t = performance.now();
          document.getElementById('chatForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
          tempos.push(performance.now() - t);
        }
        return tempos;
      });
      envios.push(...tempos);
      // H9: volta para a lista e abre a conversa grande pelo clique
      await pagina.goto(base + ROTAS.chat);
      await pagina.waitForSelector(`.chatBlock[data-username="${nomes[1]}"]`);
      cliques.push(await pagina.evaluate(async ({ alvo }) => {
        const bloco = document.querySelector(`.chatBlock[data-username="${alvo}"]`);
        const t = performance.now();
        bloco.click();
        await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
        return performance.now() - t;
      }, { alvo: nomes[1] }));
      await contexto.close();
    }
    return { H7: { abrirChatMs: estatistica(aberturas), baloesDesenhados: esperado }, H8: { enviarMs: estatistica(envios) }, H9: { abrirConversaPelaListaMs: estatistica(cliques) } };
  },

  // H10: duas abas do mesmo navegador conversando, 500 envios cada, a cada 10 ms
  async H10(navegador) {
    const usuarios = gerarUsuarios(10, ROTAS.foto);
    const [a, b] = usuarios.map((u) => u.username);
    const resultados = [];
    for (let i = 0; i < REPETICOES; i++) {
      const contexto = await navegador.newContext();
      await contexto.route(/(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|unpkg\.com|flaticons\.net|picsum\.photos|images\.pexels\.com|i\.postimg\.cc)/, (rota) => {
        const url = rota.request().url();
        if (/bootstrap/.test(url)) return rota.fulfill({ path: path.join(VENDOR, url.endsWith('.css') ? 'bootstrap.min.css' : 'bootstrap.bundle.min.js') });
        return rota.abort();
      });
      const abas = [await contexto.newPage(), await contexto.newPage()];
      await prepararDados(abas[0], { usuarios, logado: a });
      await abas[1].goto(base + '/lib/html.js');
      await abas[1].evaluate((l) => sessionStorage.setItem('loggedInUser', JSON.stringify({ username: l, name: l })), b);
      await abas[0].goto(base + ROTAS.chat + '?com=' + b);
      await abas[1].goto(base + ROTAS.chat + '?com=' + a);
      const enviar = (aba, rotulo) => aba.evaluate(async (rotulo) => {
        for (let j = 0; j < 500; j++) {
          document.getElementById('mensagem').value = `${rotulo}-${j}`;
          document.getElementById('chatForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          await new Promise((r) => setTimeout(r, 10));
        }
      }, rotulo);
      await Promise.all([enviar(abas[0], 'A'), enviar(abas[1], 'B')]);
      await abas[0].waitForTimeout(500);
      // soma a lista única (antes) e as chaves por autor (depois: gigtime:messages:<usuário>)
      const gravadas = await abas[0].evaluate(() => Object.keys(localStorage)
        .filter((k) => k === 'gigtime:messages' || k.startsWith('gigtime:messages:'))
        .reduce((total, k) => total + JSON.parse(localStorage.getItem(k) || '[]').length, 0));
      resultados.push({ enviadas: 1000, gravadas, perdidas: 1000 - gravadas });
      await contexto.close();
    }
    return { H10: { rodadas: resultados, perdidasTotal: resultados.reduce((s, r) => s + r.perdidas, 0) } };
  },

  // H12: custo do hash da senha no Chrome, pela lib de cada versão
  async H12(navegador) {
    const { contexto, pagina } = await novaPagina(navegador);
    await pagina.goto(base + ROTAS.home);
    const tempos = await pagina.evaluate(async (repeticoes) => {
      const lista = [];
      for (let i = 0; i < repeticoes; i++) {
        const t = performance.now();
        if (GigSenha.gerarHash) await GigSenha.gerarHash('demo1234');
        else await GigSenha.hashSenha('carga.0', 'demo1234');
        lista.push(performance.now() - t);
      }
      return lista;
    }, REPETICOES);
    await contexto.close();
    return { H12: { algoritmo: versao === 'antes' ? 'SHA-256 (sal = username)' : 'PBKDF2-SHA256, 600 mil iterações', hashMs: estatistica(tempos) } };
  },
};

(async () => {
  const navegador = await chromium.launch({ executablePath: CHROME });
  const escolhidos = filtro ? filtro.split(',') : Object.keys(CENARIOS);
  const resultado = { versao, base, quando: new Date().toISOString(), chrome: navegador.version(), repeticoes: REPETICOES, maquina: { cpus: os.cpus().length, modelo: os.cpus()[0].model, memoriaGB: Math.round(os.totalmem() / 1073741824) } };
  for (const nome of escolhidos) {
    const parar = monitorar();
    const inicio = Date.now();
    try {
      Object.assign(resultado, await CENARIOS[nome](navegador));
    } catch (erro) {
      resultado[nome] = { erro: erro.message };
    }
    resultado[`recursos_${nome}`] = { ...parar(), duracaoS: Math.round((Date.now() - inicio) / 1000) };
    console.log(`${versao} ${nome} ok (${Math.round((Date.now() - inicio) / 1000)} s)`);
  }
  await navegador.close();
  fs.writeFileSync(saida, JSON.stringify(resultado, null, 2));
})();
