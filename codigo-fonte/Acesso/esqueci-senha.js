// "Esqueci minha senha" honesto: sem servidor não há recuperação por e-mail; o que dá para fazer
// é restaurar a demonstração (com confirmação, porque apaga contas e conversas deste navegador).
(function () {
  document.getElementById('restaurarDemo').addEventListener('click', async () => {
    const certeza = await GigAvisos.confirmar({
      titulo: 'Restaurar a demonstração?',
      texto: 'Todas as contas criadas e todas as conversas deste navegador serão apagadas. As 10 personas de exemplo voltam.',
      confirmar: 'Restaurar',
      perigo: true,
    });
    if (!certeza) return;
    try {
      GigConta.restaurarDemo(localStorage, GigUsuariosExemplo);
    } catch (erro) {
      GigAvisos.mostrar('Não foi possível restaurar: o armazenamento deste navegador está indisponível.', 'erro');
      return;
    }
    GigSessao.sair(sessionStorage);
    GigAvisos.paraProximaPagina('Demonstração restaurada. Entre com lia.batera e a senha demo1234.');
    window.location.href = '../Login/login.html';
  });
})();
