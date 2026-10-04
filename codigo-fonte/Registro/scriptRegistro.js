// Cadastro: as regras ficam em lib/perfil.js (validarCadastro, criarUsuario); aqui só a tela.
(function () {
  const $ = (id) => document.getElementById(id);
  const form = $('registerForm');
  const erroFormulario = form.querySelector('[data-erro-formulario]');
  // Nome do campo nas regras -> id do campo na tela
  const ID_DO_CAMPO = { senha: 'password', confirmacao: 'confirmPassword' };
  const CAMPOS = ['username', 'name', 'email', 'phone', 'role', 'state', 'city', 'songLink', 'profilePicLink'];

  function atualizarPrevia() {
    const link = GigValidacao.urlImagem($('profilePicLink').value);
    $('profilePic').src = link || GigPerfil.FOTO_PADRAO;
  }

  function limparErros() {
    erroFormulario.textContent = '';
    form.querySelectorAll('.is-invalid').forEach((campo) => campo.classList.remove('is-invalid'));
    form.querySelectorAll('.invalid-feedback[data-campo]').forEach((aviso) => {
      aviso.textContent = '';
      aviso.classList.remove('d-block');
    });
  }

  function mostrarErros(erros) {
    erros.forEach(({ campo, mensagem }) => {
      const entrada = $(ID_DO_CAMPO[campo] || campo);
      if (entrada) {
        entrada.classList.add('is-invalid');
        entrada.setAttribute('aria-invalid', 'true');
      }
      const aviso = form.querySelector(`.invalid-feedback[data-campo="${campo}"]`);
      if (aviso) {
        aviso.textContent = mensagem;
        aviso.classList.add('d-block');
      }
    });
    const primeiro = erros.length && $(ID_DO_CAMPO[erros[0].campo] || erros[0].campo);
    if (primeiro && primeiro.focus) primeiro.focus();
  }

  function lerFormulario() {
    const dados = {};
    CAMPOS.forEach((campo) => { dados[campo] = $(campo).value; });
    dados.genres = Array.from(document.querySelectorAll('#genres input[type="checkbox"]:checked')).map((caixa) => caixa.value);
    dados.senha = $('password').value;
    dados.confirmacao = $('confirmPassword').value;
    return dados;
  }

  async function cadastrar(event) {
    event.preventDefault();
    limparErros();
    const dados = lerFormulario();
    const erros = GigPerfil.validarCadastro(dados, GigArmazenamento.lerUsuarios(localStorage));
    if (erros.length > 0) {
      mostrarErros(erros);
      return;
    }

    // Guarda só o hash PBKDF2 da senha, nunca o texto puro
    let passwordHash;
    try {
      passwordHash = await GigSenha.gerarHash(dados.senha);
    } catch (erro) {
      erroFormulario.textContent = erro.message;
      return;
    }

    // Relê os usuários: outra aba pode ter cadastrado alguém enquanto o hash era calculado
    const atuais = GigArmazenamento.lerUsuarios(localStorage);
    const repetidos = GigPerfil.validarCadastro(dados, atuais).filter((e) => ['username', 'email', 'phone'].includes(e.campo));
    if (repetidos.length > 0) {
      mostrarErros(repetidos);
      alert('Este nome de usuário, e-mail ou telefone acabou de ser cadastrado em outra aba. Revise os dados.');
      return;
    }

    const usuario = GigPerfil.criarUsuario(dados, passwordHash);
    try {
      GigArmazenamento.salvarUsuarios(localStorage, atuais.concat([usuario]));
    } catch (erro) {
      if (!GigArmazenamento.ehErroDeCota(erro)) throw erro;
      erroFormulario.textContent = 'Não há espaço no navegador para gravar o cadastro. Em Conta, você pode restaurar os dados de demonstração para liberar espaço.';
      return;
    }

    // Cadastro feito: já entra na conta e vai para o perfil novo (ou para a página que pediu login)
    sessionStorage.setItem('loggedInUser', JSON.stringify(GigArmazenamento.usuarioPublico(usuario)));
    sessionStorage.setItem('clickedUser', JSON.stringify(GigArmazenamento.usuarioPublico(usuario)));
    window.location.href = GigArmazenamento.destinoDepoisDoLogin(sessionStorage) || '../Perfil/perfil.html?u=' + encodeURIComponent(usuario.username);
  }

  $('profilePicLink').addEventListener('input', atualizarPrevia);
  form.addEventListener('submit', cadastrar);
})();
