// Validações de entrada do cadastro e da edição de perfil.
// Links de imagem só em https (sem http, que mistura conteúdo, nem javascript:/data:), vídeo só do YouTube
// (o perfil monta o embed a partir do ID de 11 caracteres, nunca do link digitado).
(function (raiz, fabrica) {
  const api = fabrica(raiz);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.GigValidacao = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (raiz) {
  const TAMANHO_MAXIMO_URL = 2000;
  const ID_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;
  const HOSTS_YOUTUBE = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'];

  const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '');

  function analisar(valor) {
    try {
      return new raiz.URL(valor);
    } catch (e) {
      return null;
    }
  }

  // '' = campo vazio (usa o padrão); null = inválido; senão o link normalizado
  function urlImagem(valor) {
    const limpo = texto(valor);
    if (!limpo) return '';
    if (limpo.length > TAMANHO_MAXIMO_URL || !/^https:\/\//i.test(limpo)) return null;
    const url = analisar(limpo);
    if (!url || url.protocol !== 'https:' || url.username || url.password || !url.hostname) return null;
    return url.href;
  }

  // ID de 11 caracteres de um link do YouTube, ou null
  function idYoutube(valor) {
    const url = analisar(texto(valor));
    if (!url || (url.protocol !== 'https:' && url.protocol !== 'http:')) return null;
    let candidato = null;
    if (url.hostname === 'youtu.be') {
      candidato = url.pathname.slice(1);
    } else if (HOSTS_YOUTUBE.includes(url.hostname)) {
      const caminho = url.pathname.split('/').filter(Boolean);
      if (caminho[0] === 'watch') candidato = url.searchParams.get('v');
      else if (caminho[0] === 'embed' || caminho[0] === 'shorts' || caminho[0] === 'live') candidato = caminho[1];
    }
    return candidato && ID_YOUTUBE.test(candidato) ? candidato : null;
  }

  const emailValido = (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(texto(valor));

  // Fixo (10 dígitos) ou celular (11 dígitos, começando em 9), com DDD de 11 a 99
  function telefoneValido(valor) {
    const digitos = texto(valor).replace(/\D/g, '');
    if (!/^[1-9][1-9]/.test(digitos)) return false;
    return digitos.length === 10 || (digitos.length === 11 && digitos[2] === '9');
  }

  const TAMANHO_MINIMO_SENHA = 8;

  // Mensagem de erro, ou null se a senha serve
  function erroSenha(senha, username) {
    if (typeof senha !== 'string' || senha.length < TAMANHO_MINIMO_SENHA) {
      return `A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`;
    }
    if (username && senha.toLowerCase() === String(username).toLowerCase()) return 'A senha não pode ser igual ao nome de usuário.';
    return null;
  }

  const usernameValido = (valor) => /^[A-Za-z0-9._-]{3,30}$/.test(typeof valor === 'string' ? valor : '');

  return { TAMANHO_MINIMO_SENHA, urlImagem, idYoutube, emailValido, telefoneValido, erroSenha, usernameValido };
});
