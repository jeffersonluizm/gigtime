// Modo demonstração do GigTime (fonte única). O site não tem servidor: a "demonstração" é o conjunto de
// personas fictícias de dados/usuarios-exemplo.js, que vivem só no navegador de quem visita. A senha abaixo
// é pública de propósito (aparece na tela de login) e não protege nada real; ver docs/adr/0002-modo-demo.md.
// As contas de demonstração não trocam a senha nem são apagadas, para a demonstração continuar funcionando.
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
});
