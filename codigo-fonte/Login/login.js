// Entrar: confere a senha (PBKDF2; hash antigo é atualizado neste login) e volta para a página que pediu login.
(function () {
  const $ = (id) => document.getElementById(id);
  const form = $('loginForm');
  GigFormulario.ligarMostrarSenha(form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    GigFormulario.limparErros(form);
    const username = $('username').value.trim();
    const senha = $('password').value;

    const faltando = [];
    if (!username) faltando.push({ campo: 'username', mensagem: 'Informe o nome de usuário.' });
    if (!senha) faltando.push({ campo: 'password', mensagem: 'Informe a senha.' });
    if (faltando.length) {
      GigFormulario.mostrarErros(form, faltando);
      return;
    }

    const botao = $('entrar');
    GigFormulario.ocupado(botao, true, 'Entrando...');
    let usuario;
    try {
      usuario = await GigSenha.autenticarEAtualizar(localStorage, GigArmazenamento.CHAVE_USUARIOS, username, senha);
    } catch (erro) {
      GigFormulario.mostrarErroGeral(form, erro.message);
      return;
    } finally {
      GigFormulario.ocupado(botao, false);
    }

    if (!usuario) {
      // Mensagem única: não revela se o usuário existe
      GigFormulario.mostrarErroGeral(form, 'Usuário ou senha incorretos. Confira e tente de novo.');
      $('password').value = '';
      $('password').focus();
      return;
    }

    GigSessao.entrar(sessionStorage, usuario);
    GigAvisos.paraProximaPagina(`Bem-vindo de volta, ${usuario.name}!`);
    window.location.href = GigSessao.destinoDepoisDoLogin(sessionStorage) || '../anuncios/anuncios.html';
  });
})();
