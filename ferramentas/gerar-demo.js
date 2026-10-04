// Gera os dados de demonstração do GigTime: personas fictícias, ilustrações SVG próprias
// (avatar, banner e destaques) e o arquivo codigo-fonte/dados/usuarios-exemplo.js.
// Uso (na raiz do projeto): node ferramentas/gerar-demo.js
// É determinístico: o sal do PBKDF2 sai do username, então rodar de novo gera os mesmos arquivos.
const fs = require('node:fs');
const path = require('node:path');
const { createHash, pbkdf2Sync } = require('node:crypto');

const RAIZ = path.join(__dirname, '..', 'codigo-fonte');
const SENHA_DEMO = 'demo1234';
const ITERACOES = 600000;

const PERSONAS = [
  { username: 'lia.batera', name: 'Lia Fontes', role: 'Músico', state: 'SP', city: 'São Paulo', ddd: '11', rating: 4.9, genres: ['Rock', 'Pop'], badges: ['Pontual', 'Estrela em ascensão'],
    bio: 'Baterista com 8 anos de estrada em bares e festivais. Toca covers de rock nacional e pop dos anos 2000.', disponibilidade: 'Quinta a domingo, à noite', cores: ['#c2410c', '#f7b801'] },
  { username: 'trio.serrano', name: 'Trio Serrano', role: 'Músico', state: 'PE', city: 'Recife', ddd: '81', rating: 4.7, genres: ['Forró', 'MPB'], badges: ['Pé de serra'],
    bio: 'Sanfona, zabumba e triângulo. Repertório de forró tradicional para festas, casamentos e arraiás.', disponibilidade: 'Fins de semana', cores: ['#5d3a76', '#f7b801'] },
  { username: 'davi.sax', name: 'Davi Moraes', role: 'Músico', state: 'MG', city: 'Belo Horizonte', ddd: '31', rating: 4.8, genres: ['Jazz', 'MPB'], badges: ['Show completo'],
    bio: 'Saxofonista. Formações de duo a quarteto para jantares, eventos corporativos e bares de jazz.', disponibilidade: 'Terça a sábado', cores: ['#484f9f', '#ff5629'] },
  { username: 'nina.voz', name: 'Nina Rocha', role: 'Músico', state: 'GO', city: 'Goiânia', ddd: '62', rating: 4.5, genres: ['Sertanejo', 'Pop'], badges: ['Voz e violão'],
    bio: 'Cantora e violonista. Voz e violão para aniversários, bares e cerimônias.', disponibilidade: 'Sexta e sábado', cores: ['#ff5629', '#5d3a76'] },
  { username: 'banda.aurora', name: 'Banda Aurora', role: 'Músico', state: 'RS', city: 'Porto Alegre', ddd: '51', rating: 5, genres: ['Rock', 'MPB'], badges: ['Banda completa', 'Pontual'],
    bio: 'Quinteto de rock e MPB autoral, com estrutura de som própria para casas de até 300 pessoas.', disponibilidade: 'Fins de semana', cores: ['#2f3470', '#f7b801'] },
  { username: 'bar.do.cais', name: 'Bar do Cais', role: 'Contratante', state: 'RJ', city: 'Rio de Janeiro', ddd: '21', rating: 4.6, genres: ['MPB', 'Jazz'], badges: ['Paga em dia'],
    bio: 'Bar à beira da baía com música ao vivo de quarta a domingo. Procuramos duos e trios acústicos.', disponibilidade: 'Quarta a domingo', cores: ['#484f9f', '#f7b801'] },
  { username: 'casa.lume', name: 'Casa Lume', role: 'Contratante', state: 'SP', city: 'São Paulo', ddd: '11', rating: 5, genres: ['Rock', 'Pop'], badges: ['Top contratante'],
    bio: 'Casa de shows para 400 pessoas, com palco, luz e técnico de som. Agenda aberta para bandas autorais.', disponibilidade: 'Agenda mensal', cores: ['#070200', '#ff5629'] },
  { username: 'bistro.alecrim', name: 'Bistrô Alecrim', role: 'Contratante', state: 'PR', city: 'Curitiba', ddd: '41', rating: 4.3, genres: ['Jazz', 'MPB'], badges: ['Ambiente intimista'],
    bio: 'Bistrô com jantar e música instrumental às sextas. Preferimos repertório leve e volume baixo.', disponibilidade: 'Sextas-feiras', cores: ['#3f5f3a', '#f7b801'] },
  { username: 'ipe.eventos', name: 'Ipê Eventos', role: 'Contratante', state: 'MG', city: 'Belo Horizonte', ddd: '31', rating: 4.8, genres: ['Sertanejo', 'Pop'], badges: ['Casamentos'],
    bio: 'Assessoria de casamentos e formaturas. Contratamos voz e violão, duos e bandas para cerimônia e festa.', disponibilidade: 'Sábados', cores: ['#9d174d', '#f7b801'] },
  { username: 'arraia.do.sol', name: 'Arraiá do Sol', role: 'Contratante', state: 'BA', city: 'Salvador', ddd: '71', rating: 4.2, genres: ['Forró', 'Sertanejo'], badges: ['Festival'],
    bio: 'Festival junino com três palcos. Seleção de atrações de forró e sertanejo de maio a julho.', disponibilidade: 'Maio a julho', cores: ['#c2410c', '#5d3a76'] },
];

// Gerador pseudoaleatório com semente (mulberry32), para as ilustrações saírem iguais a cada execução
function aleatorio(semente) {
  let a = createHash('sha256').update(semente).digest().readUInt32LE(0);
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// "Lia Fontes" -> "LF"; "Bar do Cais" -> "BC" (ignora preposições curtas)
const iniciais = (nome) => nome.split(/\s+/).filter((p) => p.length > 2).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
const FONTE = "font-family='Segoe UI, Helvetica, Arial, sans-serif'";
const n = (x) => Math.round(x * 10) / 10;

function avatar(p) {
  const [a, b] = p.cores;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240' width='240' height='240'>
<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs>
<rect width='240' height='240' fill='url(#g)'/>
<circle cx='190' cy='50' r='70' fill='#ffffff' opacity='.12'/><circle cx='40' cy='210' r='60' fill='#000000' opacity='.12'/>
<text x='120' y='148' text-anchor='middle' ${FONTE} font-size='84' font-weight='700' fill='#ffffff'>${iniciais(p.name)}</text>
</svg>
`;
}

function ondas(r, largura, altura, cor, quantas) {
  let saida = '';
  for (let i = 0; i < quantas; i++) {
    const base = altura * (0.35 + 0.5 * r());
    const amp = 20 + 60 * r();
    const freq = 1 + 3 * r();
    let d = `M0 ${n(base)}`;
    for (let x = 25; x <= largura; x += 25) d += ` L${x} ${n(base + amp * Math.sin((x / largura) * Math.PI * 2 * freq + i))}`;
    saida += `<path d='${d}' fill='none' stroke='${cor}' stroke-width='${n(2 + 4 * r())}' stroke-linecap='round' opacity='${n(0.25 + 0.5 * r())}'/>\n`;
  }
  return saida;
}

function banner(p) {
  const [a, b] = p.cores;
  const r = aleatorio(p.username + ':banner');
  let barras = '';
  for (let x = 40; x < 1500; x += 34) {
    const h = 20 + 140 * r();
    barras += `<rect x='${x}' y='${n(500 - h)}' width='18' height='${n(h)}' rx='4' fill='#ffffff' opacity='.10'/>`;
  }
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1500 500' width='1500' height='500' preserveAspectRatio='xMidYMid slice'>
<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs>
<rect width='1500' height='500' fill='url(#g)'/>
${barras}
${ondas(r, 1500, 500, '#ffffff', 4)}</svg>
`;
}

function destaque(p, indice) {
  const [a, b] = p.cores;
  const r = aleatorio(`${p.username}:destaque:${indice}`);
  const legenda = [`Ao vivo em ${p.city}`, p.genres.join(' · '), p.role === 'Músico' ? 'No palco' : 'Nosso palco'][indice];
  let motivo = '';
  if (indice === 0) {
    // feixes de luz de palco
    for (let i = 0; i < 6; i++) {
      const x = 80 + i * 120 + 30 * r();
      motivo += `<path d='M${n(x)} 0 L${n(x - 120 - 60 * r())} 600 L${n(x + 120 + 60 * r())} 600 Z' fill='#ffffff' opacity='${n(0.06 + 0.1 * r())}'/>`;
      motivo += `<circle cx='${n(x)}' cy='8' r='14' fill='${b}'/>`;
    }
  } else if (indice === 1) {
    // equalizador
    for (let x = 30; x < 780; x += 46) {
      const h = 60 + 320 * r();
      motivo += `<rect x='${x}' y='${n(470 - h)}' width='30' height='${n(h)}' rx='6' fill='${b}' opacity='.85'/>`;
    }
  } else {
    // disco de vinil
    motivo += `<circle cx='400' cy='260' r='220' fill='#0b0b0f' opacity='.9'/>`;
    for (let raio = 80; raio < 220; raio += 18) motivo += `<circle cx='400' cy='260' r='${raio}' fill='none' stroke='#ffffff' stroke-opacity='.08' stroke-width='2'/>`;
    motivo += `<circle cx='400' cy='260' r='70' fill='${b}'/><circle cx='400' cy='260' r='8' fill='#0b0b0f'/>`;
  }
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600' width='800' height='600'>
<defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='#140a05'/></linearGradient></defs>
<rect width='800' height='600' fill='url(#g)'/>
${motivo}
<rect x='0' y='500' width='800' height='100' fill='#000000' opacity='.35'/>
<text x='32' y='562' ${FONTE} font-size='36' font-weight='700' fill='#ffffff'>${legenda}</text>
</svg>
`;
}

function hashDemo(username) {
  const sal = createHash('sha256').update('gigtime-demo:' + username).digest().subarray(0, 16);
  const hash = pbkdf2Sync(SENHA_DEMO, sal, ITERACOES, 32, 'sha256');
  return ['pbkdf2-sha256', ITERACOES, sal.toString('base64'), hash.toString('base64')].join('$');
}

const usuarios = PERSONAS.map((p, i) => {
  const pasta = path.join(RAIZ, 'assets', 'demo', p.username);
  fs.mkdirSync(pasta, { recursive: true });
  fs.writeFileSync(path.join(pasta, 'avatar.svg'), avatar(p));
  fs.writeFileSync(path.join(pasta, 'banner.svg'), banner(p));
  for (let d = 0; d < 3; d++) fs.writeFileSync(path.join(pasta, `destaque-${d + 1}.svg`), destaque(p, d));
  const rel = `../assets/demo/${p.username}`;
  return {
    username: p.username,
    name: p.name,
    email: `${p.username}@example.com`,
    phone: `(${p.ddd}) 90000-${String(i + 1).padStart(4, '0')}`,
    role: p.role,
    state: p.state,
    city: p.city,
    rating: p.rating,
    genres: p.genres,
    badges: p.badges,
    bio: p.bio,
    disponibilidade: p.disponibilidade,
    profilePicLink: `${rel}/avatar.svg`,
    bannerPicLink: `${rel}/banner.svg`,
    songLink: '',
    userPicsLinks: [1, 2, 3].map((d) => `${rel}/destaque-${d}.svg`),
    passwordHash: hashDemo(p.username),
  };
});

const cabecalho = `// Personas fictícias de demonstração, gravadas no localStorage só quando ainda não há nenhum usuário.
// Arquivo GERADO por ferramentas/gerar-demo.js (não edite à mão). Ilustrações em assets/demo/<username>/.
// Senha de todas as contas: "${SENHA_DEMO}". passwordHash = PBKDF2-SHA256, ${ITERACOES} iterações (ver lib/senha.js).
`;
const corpo = `(function (raiz, dados) {
  if (typeof module === 'object' && module.exports) module.exports = dados;
  else raiz.GigUsuariosExemplo = dados;
})(typeof globalThis !== 'undefined' ? globalThis : this, ${JSON.stringify(usuarios, null, 2)});
`;
fs.mkdirSync(path.join(RAIZ, 'dados'), { recursive: true });
fs.writeFileSync(path.join(RAIZ, 'dados', 'usuarios-exemplo.js'), cabecalho + corpo);
console.log(`${usuarios.length} personas geradas em codigo-fonte/dados/usuarios-exemplo.js e codigo-fonte/assets/demo/`);
