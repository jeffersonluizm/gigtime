// Modo demonstração do GigTime (fonte única). O site não tem servidor: a "demonstração" é o conjunto de
// personas fictícias de dados/usuarios-exemplo.js, que vivem só no navegador de quem visita. A senha abaixo
// é pública de propósito (aparece na tela de login) e não protege nada real; ver docs/adr/0002-modo-demo.md.
// As contas de demonstração não trocam a senha nem são apagadas, para a demonstração continuar funcionando.
// `conversas`: o chat das contas demo já começa vivo (com mensagens não lidas). O horário de cada mensagem
// é relativo ao momento em que a demonstração é gravada no navegador (minutosAtras).
(function (raiz, dados) {
  const usernames = () => {
    const exemplos = typeof module === 'object' && module.exports ? require('./usuarios-exemplo.js') : raiz.GigUsuariosExemplo;
    return (exemplos || []).map((u) => u.username);
  };
  const api = Object.assign({}, dados, {
    ehContaDemo: (username) => usernames().includes(username),
  });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.GigDemo = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, {
  senha: 'demo1234',
  contas: { musico: 'lia.batera', contratante: 'casa.lume' },
  conversas: [
    { de: 'lia.batera', para: 'bar.do.cais', texto: 'Oi! Vi que vocês procuram duos acústicos. Toco bateria e faço dupla com a Nina Rocha (voz e violão).', minutosAtras: 2900 },
    { de: 'bar.do.cais', para: 'lia.batera', texto: 'Oi, Lia! Manda um vídeo do duo? Nossas noites de quinta estão abertas.', minutosAtras: 2850 },
    { de: 'casa.lume', para: 'lia.batera', texto: 'Oi, Lia! Abrimos uma data para bandas autorais no dia 25. Você toca com alguém?', minutosAtras: 180 },
    { de: 'lia.batera', para: 'casa.lume', texto: 'Oi! Toco com a Banda Aurora às vezes. Qual seria o horário?', minutosAtras: 150 },
    { de: 'casa.lume', para: 'lia.batera', texto: 'Das 21h às 23h, com técnico de som da casa. Podemos falar do cachê amanhã?', minutosAtras: 20 },
    { de: 'trio.serrano', para: 'casa.lume', texto: 'Boa tarde! Somos um trio de forró pé de serra. Vocês fazem noite de forró?', minutosAtras: 90 },
    { de: 'davi.sax', para: 'lia.batera', texto: 'Lia, topa uma participação no sábado no Bar do Cais? Jazz e MPB, das 21h às 23h.', minutosAtras: 45 },
  ],
});
