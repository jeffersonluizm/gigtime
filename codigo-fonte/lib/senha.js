// Senhas com PBKDF2-SHA256 (WebCrypto), sal aleatório de 16 bytes e 600 mil iterações (OWASP 2023).
// Formato guardado: "pbkdf2-sha256$<iterações>$<sal base64>$<hash base64>". Nada de senha em texto puro.
// Versões antigas guardavam SHA-256 de "gigtime:<username>:<senha>" (ou a senha pura): o login ainda
// aceita esses formatos e troca pelo PBKDF2 na hora (autenticarEAtualizar), porque só ali a senha é conhecida.
// Observação: crypto.subtle só existe em contexto seguro (https ou http://localhost/127.0.0.1).
(function (raiz, fabrica) {
  const api = fabrica(raiz);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.GigSenha = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (raiz) {
  const ITERACOES_PADRAO = 600000;
  const PREFIXO = 'pbkdf2-sha256';
  const BYTES_SAL = 16;
  const BITS_HASH = 256;
  const LEGADO_SHA256 = /^[0-9a-f]{64}$/;

  function sutil() {
    const s = raiz.crypto && raiz.crypto.subtle;
    if (!s) throw new Error('WebCrypto indisponível: abra o site por https ou por http://localhost (iniciar.bat).');
    return s;
  }

  // Os testes trocam o custo por GIGTIME_ITERACOES_PBKDF2 (com 600 mil, cada hash leva ~0,1 s no Node)
  function iteracoesAtuais(opcoes) {
    if (opcoes && opcoes.iteracoes) return opcoes.iteracoes;
    return Number(raiz.GIGTIME_ITERACOES_PBKDF2) || ITERACOES_PADRAO;
  }

  const paraBase64 = (bytes) => {
    let binario = '';
    for (const b of bytes) binario += String.fromCharCode(b);
    return raiz.btoa ? raiz.btoa(binario) : Buffer.from(binario, 'binary').toString('base64');
  };
  const deBase64 = (texto) => {
    const binario = raiz.atob ? raiz.atob(texto) : Buffer.from(texto, 'base64').toString('binary');
    return Uint8Array.from(binario, (c) => c.charCodeAt(0));
  };

  async function derivar(senha, sal, iteracoes) {
    const chave = await sutil().importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveBits']);
    const bits = await sutil().deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteracoes }, chave, BITS_HASH);
    return new Uint8Array(bits);
  }

  async function gerarHash(senha, opcoes) {
    const iteracoes = iteracoesAtuais(opcoes);
    const sal = raiz.crypto.getRandomValues(new Uint8Array(BYTES_SAL));
    const hash = await derivar(senha, sal, iteracoes);
    return [PREFIXO, iteracoes, paraBase64(sal), paraBase64(hash)].join('$');
  }

  function lerRegistro(passwordHash) {
    const partes = typeof passwordHash === 'string' ? passwordHash.split('$') : [];
    if (partes.length !== 4 || partes[0] !== PREFIXO) return null;
    const iteracoes = Number(partes[1]);
    if (!Number.isInteger(iteracoes) || iteracoes < 1) return null;
    try {
      return { iteracoes, sal: deBase64(partes[2]), hash: partes[3] };
    } catch (e) {
      return null;
    }
  }

  async function hashLegado(username, senha) {
    const bytes = new TextEncoder().encode('gigtime:' + username + ':' + senha);
    const resumo = await sutil().digest('SHA-256', bytes);
    return Array.from(new Uint8Array(resumo), (b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function conferirSenha(usuario, senha) {
    const registro = lerRegistro(usuario.passwordHash);
    if (registro) return paraBase64(await derivar(senha, registro.sal, registro.iteracoes)) === registro.hash;
    if (LEGADO_SHA256.test(usuario.passwordHash || '')) return usuario.passwordHash === (await hashLegado(usuario.username, senha));
    if (typeof usuario.password === 'string') return usuario.password === senha;
    return false;
  }

  // Devolve o usuário se username e senha conferem; senão null
  async function autenticar(usuarios, username, senha) {
    const usuario = usuarios.find((u) => u.username === username);
    if (!usuario) return null;
    return (await conferirSenha(usuario, senha)) ? usuario : null;
  }

  function precisaAtualizar(usuario, opcoes) {
    const registro = lerRegistro(usuario.passwordHash);
    return !registro || registro.iteracoes < iteracoesAtuais(opcoes);
  }

  const lerLista = (storage, chave) => {
    try {
      const lista = JSON.parse(storage.getItem(chave));
      return Array.isArray(lista) ? lista : [];
    } catch (e) {
      return [];
    }
  };

  // Login: confere a senha e, se o hash for de formato antigo, grava o PBKDF2 no lugar.
  // Relê a lista antes de gravar para não desfazer o que outra aba gravou durante o cálculo.
  async function autenticarEAtualizar(storage, chave, username, senha, opcoes) {
    const usuario = await autenticar(lerLista(storage, chave), username, senha);
    if (!usuario || !precisaAtualizar(usuario, opcoes)) return usuario;
    const passwordHash = await gerarHash(senha, opcoes);
    const atuais = lerLista(storage, chave);
    const indice = atuais.findIndex((u) => u && u.username === username);
    if (indice < 0) return usuario;
    const atualizado = Object.assign({}, atuais[indice], { passwordHash });
    delete atualizado.password;
    atuais[indice] = atualizado;
    try {
      storage.setItem(chave, JSON.stringify(atuais));
    } catch (e) {
      return usuario; // sem espaço: o login vale do mesmo jeito; a troca fica para a próxima vez
    }
    return atualizado;
  }

  // Troca `password` (texto puro) por PBKDF2 em todos os usuários antigos do storage.
  // Devolve quantos foram convertidos.
  async function migrarSenhasDoStorage(storage, chave, opcoes) {
    const antigos = lerLista(storage, chave).filter((u) => u && typeof u.password === 'string');
    if (antigos.length === 0) return 0;
    const hashes = new Map();
    for (const u of antigos) hashes.set(u.username, { senha: u.password, hash: await gerarHash(u.password, opcoes) });

    // Relê antes de gravar para não perder alterações feitas enquanto os hashes eram calculados
    let convertidos = 0;
    const novos = lerLista(storage, chave).map((u) => {
      const calculado = u && hashes.get(u.username);
      if (!calculado || u.password !== calculado.senha) return u;
      const copia = Object.assign({}, u, { passwordHash: calculado.hash });
      delete copia.password;
      convertidos++;
      return copia;
    });
    storage.setItem(chave, JSON.stringify(novos));
    return convertidos;
  }

  return { ITERACOES_PADRAO, gerarHash, hashLegado, conferirSenha, autenticar, precisaAtualizar, autenticarEAtualizar, migrarSenhasDoStorage };
});
