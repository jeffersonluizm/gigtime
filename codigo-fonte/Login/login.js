// Entrar: confere a senha (PBKDF2; hash antigo é atualizado neste login) e volta para a página que pediu login.
(function () {
  const $ = (id) => document.getElementById(id);
  const form = $('loginForm');
  GigFormulario.ligarMostrarSenha(form);

  async function entrar(username, senha) {
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
  }

  // "Entrar como músico/contratante": conta de demonstração com um clique (dados/demo.js)
  // Quem está logado com uma conta própria confirma antes de trocar pela conta de demonstração
  async function entrarComoDemo(papel) {
    const username = GigDemo.contas[papel];
    if (!username) return;
    const atual = GigSessao.usuarioLogado(sessionStorage);
    if (atual && atual.username !== username && !GigDemo.ehContaDemo(atual.username)) {
      const trocar = await GigAvisos.confirmar({
        titulo: 'Trocar de conta?',
        texto: `Você está conectado como ${atual.name || atual.username} (${atual.username}). Entrar na demonstração encerra essa sessão nesta aba; seus dados continuam guardados.`,
        confirmar: 'Entrar na demonstração',
      });
      if (!trocar) return;
    }
    GigFormulario.limparErros(form);
    $('username').value = username;
    $('password').value = '';
    entrar(username, GigDemo.senha);
  }
  document.querySelectorAll('[data-entrar-como]').forEach((botao) => {
    botao.addEventListener('click', () => entrarComoDemo(botao.dataset.entrarComo));
  });

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
    await entrar(username, senha);
  });

  // Link direto da Home ou do README: login.html?demo=musico ou ?demo=contratante
  const pedido = new URLSearchParams(window.location.search).get('demo');
  if (pedido) entrarComoDemo(pedido);
})();
