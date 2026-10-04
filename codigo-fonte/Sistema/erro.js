// Erro genérico: o motivo vem do endereço (?motivo=...), mas só vira uma das mensagens conhecidas;
// o texto do endereço nunca é mostrado na página.
(function () {
  const MOTIVOS = {
    armazenamento: 'Este navegador bloqueou o armazenamento local, e o GigTime guarda tudo nele (não há servidor).',
    criptografia: 'A criptografia do navegador (WebCrypto) não está disponível, então não dá para conferir senhas.',
  };
  const motivo = new URLSearchParams(window.location.search).get('motivo');
  if (Object.prototype.hasOwnProperty.call(MOTIVOS, motivo)) {
    document.getElementById('motivoErro').textContent = MOTIVOS[motivo];
  }
})();
