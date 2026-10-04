// Links da navbar conforme a sessão: visitante (entrar/inscrever-se) ou logado (perfil, mensagens, sair).
// O template não leva dados do usuário; foto e nome entram por src/textContent (sem HTML).
(function () {
  window.addEventListener('load', () => document.body.classList.add('loaded'));

  document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar-nav');
    if (!navbar) return;
    const logado = GigSessao.usuarioLogado(sessionStorage);

    if (!logado) {
      navbar.innerHTML = `
      <a class="nav-link me-3" href="../Login/login.html">Entrar</a>
      <a class="nav-link me-3" href="../Registro/registro.html">Inscrever-se</a>`;
      return;
    }

    navbar.innerHTML = `
      <a class="navbar-brand" href="../Perfil/perfil.html" id="profileAvatarLink">
        <img alt="Foto de perfil" width="30" height="30" class="shadow object-fit-cover rounded-circle">
      </a>
      <span class="navbar-text text-white me-3" id="saudacaoUsuario"></span>
      <a class="nav-link me-3" href="#" id="profileLink">Perfil</a>
      <a class="nav-link me-3" href="../Chat/chat.html">Mensagens</a>
      <a class="nav-link me-3" href="#" id="logoutLink">Sair</a>`;
    navbar.querySelector('#profileAvatarLink img').src = logado.profilePicLink || GigConstantes.FOTO_PADRAO;
    document.getElementById('saudacaoUsuario').textContent = `Bem-vindo, ${logado.username}!`;

    // "Perfil" e a foto abrem o perfil do próprio usuário logado
    const abrirProprioPerfil = () => GigSessao.escolherPerfil(sessionStorage, GigSessao.usuarioLogado(sessionStorage));
    document.getElementById('profileLink').addEventListener('click', () => {
      abrirProprioPerfil();
      window.location.href = '../Perfil/perfil.html';
    });
    // A foto navega pelo próprio href (inclusive Ctrl+clique e clique do meio); só grava o perfil a exibir
    ['click', 'auxclick'].forEach((evento) => document.getElementById('profileAvatarLink').addEventListener(evento, abrirProprioPerfil));

    document.getElementById('logoutLink').addEventListener('click', () => {
      GigSessao.sair(sessionStorage);
      window.location.href = '../Home/home.html';
    });
  });
})();
