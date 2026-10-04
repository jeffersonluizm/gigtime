// Valores do domínio do GigTime com uma fonte só (antes repetidos em cada página).
(function (raiz, fabrica) {
  const api = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.GigConstantes = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
  const GENEROS = ['Sertanejo', 'Rock', 'MPB', 'Pop', 'Forró', 'Jazz'];
  const PAPEIS = ['Músico', 'Contratante'];
  const FOTO_PADRAO = '../assets/img/avatar-padrao.svg';
  const BANNER_PADRAO = '../assets/img/banner-padrao.svg';

  // Chaves do sessionStorage (sessão por aba). Os nomes vêm da versão original e foram mantidos
  // para não derrubar quem já está com uma aba aberta.
  const CHAVES_SESSAO = Object.freeze({
    LOGADO: 'loggedInUser',
    ESCOLHIDO: 'clickedUser',
    PAPEL: 'selectedRole',
    DESTINO: 'depoisDoLogin',
  });

  return { UFS, GENEROS, PAPEIS, FOTO_PADRAO, BANNER_PADRAO, CHAVES_SESSAO };
});
