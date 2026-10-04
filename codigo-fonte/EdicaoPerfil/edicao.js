// Edição do perfil do usuário logado, gravando no mesmo modelo `users` do cadastro (localStorage).
// As regras (validação, senha atual obrigatória, links https, vídeo do YouTube) ficam em lib/perfil.js.
(function () {
  // Exige login: guarda esta página para o login voltar para cá
  const logado = GigSessao.exigirLogin(sessionStorage, '../EdicaoPerfil/EdicaoPerfil.html', (url) => { window.location.href = url; });
  if (!logado) return;

  const $ = (id) => document.getElementById(id);
  const form = $('editForm');
  const CAMPOS_TEXTO = ['profilePicLink', 'bannerPicLink', 'name', 'email', 'phone', 'role', 'state', 'city', 'songLink', 'bio', 'disponibilidade'];

  GigFormulario.preencherUFs($('state'), 'UF');
  GigFormulario.montarGeneros($('genres'), 'genre', 'form-check-inline');
  GigFormulario.ligarMostrarSenha(form);
  $('verMeuPerfil').href = GigCards.linkDoPerfil(logado.username);

  function usuarioAtual() {
    return GigArmazenamento.lerUsuarios(localStorage).find((u) => u.username === logado.username);
  }

  function atualizarPrevias() {
    $('profilePreview').src = GigValidacao.urlImagem($('profilePicLink').value) || GigConstantes.FOTO_PADRAO;
    $('bannerPreview').src = GigValidacao.urlImagem($('bannerPicLink').value) || GigConstantes.BANNER_PADRAO;
  }

  function atualizarContadorBio() {
    const restantes = GigPerfil.LIMITE_BIO - $('bio').value.length;
    $('contadorBio').textContent = `${restantes} de ${GigPerfil.LIMITE_BIO} caracteres restantes`;
  }

  // Valor gravado que não está entre as opções (ex.: estado de uma versão antiga) vira uma opção extra,
  // para não ser apagado ao salvar
  function garantirOpcao(select, valor) {
    if (!valor || Array.from(select.options).some((opcao) => opcao.value === valor)) return;
    select.add(new Option(valor, valor));
  }

  // Preenche o formulário com os dados gravados (também usado por "Descartar alterações")
  function preencher() {
    const usuario = usuarioAtual();
    if (!usuario) {
      GigAvisos.paraProximaPagina('Não encontramos sua conta neste navegador. Entre de novo.', 'erro');
      GigSessao.sair(sessionStorage);
      window.location.href = '../Login/login.html';
      return;
    }
    GigFormulario.limparErros(form);
    $('username').value = usuario.username;
    garantirOpcao($('role'), usuario.role);
    garantirOpcao($('state'), usuario.state);
    CAMPOS_TEXTO.forEach((campo) => { $(campo).value = usuario[campo] || ''; });
    const generos = usuario.genres || [];
    $('genres').querySelectorAll('input').forEach((caixa) => { caixa.checked = generos.includes(caixa.value); });
    $('senhaAtual').value = '';
    atualizarPrevias();
    atualizarContadorBio();
  }

  async function salvar(event) {
    event.preventDefault();
    GigFormulario.limparErros(form);
    const dados = {};
    CAMPOS_TEXTO.forEach((campo) => { dados[campo] = $(campo).value; });
    dados.genres = GigFormulario.marcados($('genres'));

    const botao = $('salvar_button');
    GigFormulario.ocupado(botao, true, 'Salvando...');
    let resultado;
    try {
      resultado = await GigPerfil.atualizarPerfil(GigArmazenamento.lerUsuarios(localStorage), logado.username, dados, $('senhaAtual').value);
    } catch (erro) {
      GigFormulario.mostrarErroGeral(form, erro.message);
      return;
    } finally {
      GigFormulario.ocupado(botao, false);
    }
    if (!resultado.ok) {
      GigFormulario.mostrarErros(form, resultado.erros);
      return;
    }

    // Grava só este usuário sobre a lista atual (outra aba pode ter mudado outros usuários no meio tempo)
    let gravado;
    try {
      gravado = GigArmazenamento.substituirUsuario(localStorage, resultado.usuario);
    } catch (erro) {
      if (!GigArmazenamento.ehErroDeCota(erro)) throw erro;
      GigFormulario.mostrarErroGeral(form, 'Não há espaço no navegador para gravar as alterações. Use links de imagem mais curtos ou restaure os dados de demonstração em Conta e dados.');
      return;
    }
    if (!gravado) {
      GigFormulario.mostrarErroGeral(form, 'Sua conta não foi encontrada neste navegador. Ela pode ter sido apagada em outra aba.');
      return;
    }
    GigSessao.entrar(sessionStorage, resultado.usuario);
    GigSessao.escolherPerfil(sessionStorage, resultado.usuario);
    GigAvisos.paraProximaPagina('Perfil atualizado.');
    window.location.href = GigCards.linkDoPerfil(resultado.usuario.username);
  }

  $('profilePicLink').addEventListener('input', atualizarPrevias);
  $('bannerPicLink').addEventListener('input', atualizarPrevias);
  $('bio').addEventListener('input', atualizarContadorBio);
  $('clear_button').addEventListener('click', preencher);
  form.addEventListener('submit', salvar);

  preencher();
})();
