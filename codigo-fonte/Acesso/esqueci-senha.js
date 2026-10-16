// "Esqueci minha senha" honesto: sem servidor não há recuperação por e-mail; o que dá para fazer
// é restaurar a demonstração (com confirmação, porque apaga contas e conversas deste navegador).
(function () {
  document.getElementById('restaurarDemo').addEventListener('click', async () => {
    const certeza = await GigAvisos.confirmar({
      titulo: 'Restaurar a demonstração?',
      texto: `Todas as contas criadas e todas as conversas deste navegador serão apagadas. As ${GigUsuariosExemplo.length} personas de exemplo e as conversas de demonstração voltam.`,
      confirmar: 'Restaurar',
      perigo: true,
    });
    if (!certeza) return;
    try {
      GigConta.restaurarDemo(localStorage, GigUsuariosExemplo, GigDemo.conversas);
    } catch (erro) {
      GigAvisos.mostrar('Não foi possível restaurar: o armazenamento deste navegador está indisponível.', 'erro');
      return;
    }
    GigSessao.sair(sessionStorage);
    GigAvisos.paraProximaPagina(`Demonstração restaurada. Entre com ${GigDemo.contas.musico} e a senha ${GigDemo.senha}.`);
    window.location.href = '../Login/login.html';
  });
})();
