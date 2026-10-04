// Edição do perfil do usuário logado, gravando no mesmo modelo `users` do cadastro (localStorage).
// As regras de validação e de troca de senha ficam em lib/perfil.js.
(function () {
  const logado = GigArmazenamento.lerJSON(sessionStorage, 'loggedInUser');

  // Exige login: guarda esta página para o login voltar para cá
  if (!logado) {
    sessionStorage.setItem(GigArmazenamento.CHAVE_DESTINO, '../EdicaoPerfil/EdicaoPerfil.html');
    window.location.href = '../Login/login.html';
    return;
  }

  const $ = (id) => document.getElementById(id);
  const form = $('editForm');
  const caixasGenero = () => Array.from(document.querySelectorAll('#genres input[type="checkbox"]'));
  const CAMPOS_TEXTO = ['profilePicLink', 'bannerPicLink', 'name', 'email', 'phone', 'role', 'state', 'city', 'songLink'];

  function usuarioAtual() {
    return GigArmazenamento.lerUsuarios(localStorage).find((u) => u.username === logado.username);
  }

  function atualizarPrevias() {
    $('profilePreview').src = $('profilePicLink').value.trim() || GigPerfil.FOTO_PADRAO;
    $('bannerPreview').src = $('bannerPicLink').value.trim() || GigPerfil.BANNER_PADRAO;
  }

  function limparErros() {
    form.querySelector('[data-erro-formulario]').textContent = '';
    form.querySelectorAll('.is-invalid').forEach((campo) => campo.classList.remove('is-invalid'));
    form.querySelectorAll('.invalid-feedback').forEach((aviso) => {
      aviso.textContent = '';
      aviso.classList.remove('d-block');
    });
  }

  function mostrarErros(erros) {
    erros.forEach(({ campo, mensagem }) => {
      const entrada = $(campo);
      if (entrada) entrada.classList.add('is-invalid');
      const aviso = form.querySelector(`.invalid-feedback[data-campo="${campo}"]`);
      if (aviso) {
        aviso.textContent = mensagem;
        aviso.classList.add('d-block');
      }
    });
  }

  // Valor gravado que não está entre as opções (ex.: estado "GH" do usuário de exemplo Sonic)
  // vira uma opção extra, para não ser apagado ao salvar
  function garantirOpcao(select, valor) {
    if (!valor || Array.from(select.options).some((opcao) => opcao.value === valor)) return;
    select.add(new Option(valor, valor));
  }

  // Preenche o formulário com os dados gravados (também usado por "Desfazer alterações")
  function preencher() {
    const usuario = usuarioAtual();
    if (!usuario) {
      alert('Usuário não encontrado!');
      window.location.href = '../Home/home.html';
      return;
    }
    limparErros();
    $('username').value = usuario.username;
    garantirOpcao($('role'), usuario.role);
    garantirOpcao($('state'), usuario.state);
    CAMPOS_TEXTO.forEach((campo) => { $(campo).value = usuario[campo] || ''; });
    const generos = usuario.genres || [];
    caixasGenero().forEach((caixa) => { caixa.checked = generos.includes(caixa.value); });
    $('senhaAtual').value = '';
    atualizarPrevias();
  }

  async function salvar(event) {
    event.preventDefault();
    limparErros();

    const dados = {};
    CAMPOS_TEXTO.forEach((campo) => { dados[campo] = $(campo).value; });
    dados.genres = caixasGenero().filter((caixa) => caixa.checked).map((caixa) => caixa.value);

    let resultado;
    try {
      resultado = await GigPerfil.atualizarPerfil(GigArmazenamento.lerUsuarios(localStorage), logado.username, dados, $('senhaAtual').value);
    } catch (erro) {
      alert(erro.message);
      return;
    }
    if (!resultado.ok) {
      mostrarErros(resultado.erros);
      return;
    }

    // Grava só este usuário sobre a lista atual (outra aba pode ter mudado outros usuários no meio tempo)
    let gravado;
    try {
      gravado = GigArmazenamento.substituirUsuario(localStorage, resultado.usuario);
    } catch (erro) {
      if (!GigArmazenamento.ehErroDeCota(erro)) throw erro;
      form.querySelector('[data-erro-formulario]').textContent = 'Não há espaço no navegador para gravar as alterações. Use links de imagem mais curtos ou restaure os dados de demonstração em Conta.';
      return;
    }
    if (!gravado) {
      alert('Usuário não encontrado!');
      return;
    }
    const publico = JSON.stringify(GigArmazenamento.usuarioPublico(resultado.usuario));
    sessionStorage.setItem('loggedInUser', publico);
    sessionStorage.setItem('clickedUser', publico);
    alert('Perfil atualizado com sucesso!');
    window.location.href = '../Perfil/perfil.html';
  }

  $('profilePicLink').addEventListener('input', atualizarPrevias);
  $('bannerPicLink').addEventListener('input', atualizarPrevias);
  $('clear_button').addEventListener('click', preencher);
  form.addEventListener('submit', salvar);

  preencher();
})();
