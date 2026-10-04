// Cadastro: as regras ficam em lib/perfil.js (validarCadastro, criarUsuario); aqui só a tela.
(function () {
  const $ = (id) => document.getElementById(id);
  const form = $('registerForm');
  // Nome do campo nas regras -> id do campo na tela
  const ID_DO_CAMPO = { senha: 'password', confirmacao: 'confirmPassword' };
  const CAMPOS = ['username', 'name', 'email', 'phone', 'role', 'state', 'city', 'songLink', 'profilePicLink', 'bio', 'disponibilidade'];

  GigFormulario.preencherUFs($('state'), 'UF');
  GigFormulario.montarGeneros($('genres'), 'genre', 'form-check-inline');
  GigFormulario.ligarMostrarSenha(form);

  function atualizarPrevia() {
    $('profilePic').src = GigValidacao.urlImagem($('profilePicLink').value) || GigConstantes.FOTO_PADRAO;
  }

  function lerFormulario() {
    const dados = {};
    CAMPOS.forEach((campo) => { dados[campo] = $(campo).value; });
    dados.genres = GigFormulario.marcados($('genres'));
    dados.senha = $('password').value;
    dados.confirmacao = $('confirmPassword').value;
    return dados;
  }

  async function cadastrar(event) {
    event.preventDefault();
    GigFormulario.limparErros(form);
    const dados = lerFormulario();
    const erros = GigPerfil.validarCadastro(dados, GigArmazenamento.lerUsuarios(localStorage));
    if (erros.length > 0) {
      GigFormulario.mostrarErros(form, erros, ID_DO_CAMPO);
      return;
    }

    // Guarda só o hash PBKDF2 da senha, nunca o texto puro
    const botao = $('cadastrar');
    GigFormulario.ocupado(botao, true, 'Criando conta...');
    let passwordHash;
    try {
      passwordHash = await GigSenha.gerarHash(dados.senha);
    } catch (erro) {
      GigFormulario.mostrarErroGeral(form, erro.message);
      return;
    } finally {
      GigFormulario.ocupado(botao, false);
    }

    // Relê os usuários: outra aba pode ter cadastrado alguém enquanto o hash era calculado
    const atuais = GigArmazenamento.lerUsuarios(localStorage);
    const repetidos = GigPerfil.validarCadastro(dados, atuais).filter((e) => ['username', 'email', 'phone'].includes(e.campo));
    if (repetidos.length > 0) {
      GigFormulario.mostrarErros(form, repetidos, ID_DO_CAMPO);
      GigFormulario.mostrarErroGeral(form, 'Este nome de usuário, e-mail ou telefone acabou de ser cadastrado em outra aba. Revise os dados.');
      return;
    }

    const usuario = GigPerfil.criarUsuario(dados, passwordHash);
    try {
      GigArmazenamento.salvarUsuarios(localStorage, atuais.concat([usuario]));
    } catch (erro) {
      if (!GigArmazenamento.ehErroDeCota(erro)) throw erro;
      GigFormulario.mostrarErroGeral(form, 'Não há espaço no navegador para gravar o cadastro. Restaure os dados de demonstração (em "Esqueci minha senha") para liberar espaço.');
      return;
    }

    // Cadastro feito: já entra na conta e vai para o perfil novo (ou para a página que pediu login)
    GigSessao.entrar(sessionStorage, usuario);
    GigSessao.escolherPerfil(sessionStorage, usuario);
    GigAvisos.paraProximaPagina(`Conta criada! Bem-vindo ao GigTime, ${usuario.name}.`);
    window.location.href = GigSessao.destinoDepoisDoLogin(sessionStorage) || GigCards.linkDoPerfil(usuario.username);
  }

  $('profilePicLink').addEventListener('input', atualizarPrevia);
  form.addEventListener('submit', cadastrar);
})();
