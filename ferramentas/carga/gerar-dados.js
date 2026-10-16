// Dados sintéticos e determinísticos para o teste de carga (nunca dados reais).
// Funciona no Node e também é serializado para dentro da página (page.evaluate) pelo medidor.
const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
const GENEROS = ['Sertanejo', 'Rock', 'MPB', 'Pop', 'Forró', 'Jazz'];
const CIDADES = ['São Paulo', 'Belo Horizonte', 'Recife', 'Curitiba', 'Salvador', 'Porto Alegre', 'Goiânia', 'Rio de Janeiro'];

function aleatorio(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// foto: caminho de uma imagem local da versão medida (as duas versões têm imagens diferentes)
function gerarUsuarios(n, foto, semente = 42) {
  const r = aleatorio(semente);
  const escolher = (lista) => lista[Math.floor(r() * lista.length)];
  const usuarios = [];
  for (let i = 0; i < n; i++) {
    const g1 = escolher(GENEROS);
    let g2 = escolher(GENEROS);
    if (g2 === g1) g2 = GENEROS[(GENEROS.indexOf(g1) + 1) % GENEROS.length];
    usuarios.push({
      username: `carga.${i}`,
      name: `Pessoa de Carga ${i}`,
      email: `carga.${i}@example.com`,
      phone: `(31) 9${String(10000000 + i).slice(-8, -4)}-${String(i).padStart(4, '0').slice(-4)}`,
      role: r() < 0.5 ? 'Músico' : 'Contratante',
      state: escolher(UFS),
      city: escolher(CIDADES),
      rating: Math.round((3 + r() * 2) * 10) / 10,
      genres: [g1, g2],
      badges: ['Pontual'],
      profilePicLink: foto,
      bannerPicLink: foto,
      songLink: '',
      userPicsLinks: [foto, foto, foto],
      passwordHash: 'x',
    });
  }
  return usuarios;
}

// total mensagens; naPrincipal delas entre principal[0] e principal[1]; o resto espalhado entre pares
function gerarMensagens(total, usernames, principal, naPrincipal, tamanhoTexto = 50, semente = 7) {
  const r = aleatorio(semente);
  const texto = 'x'.repeat(Math.max(1, tamanhoTexto - 6));
  const inicio = 1700000000000;
  const mensagens = [];
  for (let i = 0; i < total; i++) {
    let de;
    let para;
    if (i < naPrincipal) {
      [de, para] = i % 2 ? [principal[1], principal[0]] : principal;
    } else {
      de = usernames[Math.floor(r() * usernames.length)];
      para = usernames[Math.floor(r() * usernames.length)];
      if (de === para) para = usernames[(usernames.indexOf(de) + 1) % usernames.length];
    }
    mensagens.push({ id: `${inicio + i}-${i.toString(36)}`, de, para, texto: `m${String(i).padStart(5, '0')} ${texto}`, enviadaEm: inicio + i * 1000 });
  }
  return mensagens;
}

module.exports = { gerarUsuarios, gerarMensagens, aleatorio };
