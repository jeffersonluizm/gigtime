// Erro genérico: o motivo vem do endereço (?motivo=...), mas só vira uma das mensagens conhecidas;
// o texto do endereço nunca é mostrado na página.
(function () {
  const MOTIVOS = {
    armazenamento: 'Este navegador bloqueou o armazenamento local, e o GigTime guarda tudo nele (não há servidor).',
  };
  const motivo = new URLSearchParams(window.location.search).get('motivo');
  if (Object.prototype.hasOwnProperty.call(MOTIVOS, motivo)) {
    document.getElementById('motivoErro').textContent = MOTIVOS[motivo];
  }
})();
