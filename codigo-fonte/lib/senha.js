// Senhas com hash SHA-256 (WebCrypto). Nada de senha em texto puro no storage.
// O username entra como sal ("gigtime:<username>:<senha>"), então a mesma senha gera
// hashes diferentes em usuários diferentes; por isso o username não muda na edição de perfil.
// Observação: crypto.subtle só existe em contexto seguro (https ou http://localhost/127.0.0.1).
(function (raiz, fabrica) {
  const api = fabrica(raiz);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.GigSenha = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (raiz) {
  const CHAVE_USUARIOS = 'users';

  async function hashSenha(username, senha) {
    const sutil = raiz.crypto && raiz.crypto.subtle;
    if (!sutil) {
      throw new Error('WebCrypto indisponível: abra o site por https ou por http://localhost (iniciar.bat).');
    }
    const bytes = new TextEncoder().encode('gigtime:' + username + ':' + senha);
    const resumo = await sutil.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(resumo), (b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function confere(usuario, senha) {
    if (usuario.passwordHash) return usuario.passwordHash === (await hashSenha(usuario.username, senha));
    // Usuário de versão antiga, ainda com senha em texto puro (até a migração rodar)
    if (typeof usuario.password === 'string') return usuario.password === senha;
    return false;
  }

  // Devolve o usuário se username e senha conferem; senão null
  async function autenticar(usuarios, username, senha) {
    const usuario = usuarios.find((u) => u.username === username);
    if (!usuario) return null;
    return (await confere(usuario, senha)) ? usuario : null;
  }

  // Troca `password` (texto puro) por `passwordHash` em todos os usuários antigos do storage.
  // Devolve quantos foram convertidos.
  async function migrarSenhasDoStorage(storage) {
    let usuarios;
    try {
      usuarios = JSON.parse(storage.getItem(CHAVE_USUARIOS)) || [];
    } catch (e) {
      return 0;
    }
    const antigos = usuarios.filter((u) => u && typeof u.password === 'string');
    if (antigos.length === 0) return 0;
    const hashes = new Map();
    for (const u of antigos) hashes.set(u.username, { senha: u.password, hash: await hashSenha(u.username, u.password) });

    // Relê antes de gravar para não perder alterações feitas enquanto os hashes eram calculados
    const atuais = JSON.parse(storage.getItem(CHAVE_USUARIOS)) || [];
    let convertidos = 0;
    const novos = atuais.map((u) => {
      const calculado = u && hashes.get(u.username);
      if (!calculado || u.password !== calculado.senha) return u;
      const copia = Object.assign({}, u, { passwordHash: calculado.hash });
      delete copia.password;
      convertidos++;
      return copia;
    });
    storage.setItem(CHAVE_USUARIOS, JSON.stringify(novos));
    return convertidos;
  }

  return { hashSenha, autenticar, migrarSenhasDoStorage };
});
