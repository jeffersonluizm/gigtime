window.addEventListener('load', function () {
    document.body.classList.add('loaded');
});

document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'))
    const navbar = document.querySelector('.navbar-nav');

    if(navbar){
    if (loggedInUser) {
        // Personaliza a navbar para o usuário logado

        // O template não leva dados do usuário; foto e nome entram por src/textContent (sem HTML)
        navbar.innerHTML = `
        <a class="navbar-brand" href="../Perfil/perfil.html" id="profileAvatarLink">
            <img alt="Foto de perfil" width="30" height="30" class="shadow object-fit-cover rounded-circle">
        </a>
        <span class="navbar-text text-white me-3" id="saudacaoUsuario"></span>
        <a class="nav-link me-3" href="#" id="profileLink">Perfil</a>
        <a class="nav-link me-3" href="../Chat/chat.html">Mensagens</a>
        <a class="nav-link me-3" href="#" id="logoutLink">Sair</a>
          `;
        navbar.querySelector('#profileAvatarLink img').src = loggedInUser.profilePicLink || '../userImages/defaultUser.jpg';
        document.getElementById('saudacaoUsuario').textContent = `Bem-vindo, ${loggedInUser.username}!`;

        // "Perfil" e a foto abrem o perfil do próprio usuário logado
        document.getElementById('profileLink').addEventListener('click', function () {
            // Obtém o usuário logado
            const loggedInUser = sessionStorage.getItem('loggedInUser');

            // Adiciona o objeto do usuário logado à key 'clickedUser'
            sessionStorage.setItem('clickedUser', loggedInUser);

            // Redireciona para a página de perfil
            window.location.href = '../Perfil/perfil.html';
        });

        // A foto navega pelo próprio href (inclusive Ctrl+clique e clique do meio); só grava o perfil a exibir
        ['click', 'auxclick'].forEach(evento => {
            document.getElementById('profileAvatarLink').addEventListener(evento, function () {
                sessionStorage.setItem('clickedUser', sessionStorage.getItem('loggedInUser'));
            });
        });

        // Adiciona evento de logout
        document.getElementById('logoutLink').addEventListener('click', function () {
            sessionStorage.removeItem('loggedInUser'); // Remove o usuário logado
            window.location.href = '../Home/home.html'; // Redireciona para a página inicial
        });
    } else {
        // Exibe links padrão para visitantes
        navbar.innerHTML = `
      <a class="nav-link me-3" href="../Login/login.html">Entrar</a>
      <a class="nav-link me-3" href="../Registro/registro.html">Inscrever-se</a>
    `;
    }
}});

// Dados (usuários e mensagens) ficam no localStorage; o usuário logado fica no sessionStorage,
// ou seja, a sessão vale por aba. Quem vinha da versão antiga (usuários no sessionStorage) é migrado.
// Cada passo isolado: armazenamento cheio ou bloqueado não pode derrubar a navbar nem o resto da página
function tentarGravar(descricao, passo) {
    try {
        passo();
    } catch (erro) {
        console.warn(`GigTime: não foi possível ${descricao} (${erro.name}: ${erro.message})`);
    }
}
tentarGravar('migrar as chaves antigas', () => GigArmazenamento.migrarChavesAntigas(localStorage));
tentarGravar('migrar os usuários da sessão antiga', () => GigArmazenamento.migrarDaSessao(localStorage, sessionStorage));
tentarGravar('gravar os usuários de exemplo', () => GigArmazenamento.semearSeVazio(localStorage, GigUsuariosExemplo));
// Senhas em texto puro de versões antigas viram hash (assíncrono; o login aceita as duas formas)
GigSenha.migrarSenhasDoStorage(localStorage, GigArmazenamento.CHAVE_USUARIOS).catch(erro => console.warn(erro.message));

// Objetos copiados para a sessão não guardam senha (versões antigas guardavam o usuário inteiro)
['loggedInUser', 'clickedUser'].forEach(chave => {
    const salvo = GigArmazenamento.lerJSON(sessionStorage, chave);
    if (salvo && ('password' in salvo || 'passwordHash' in salvo)) {
        tentarGravar('limpar a senha da sessão', () => sessionStorage.setItem(chave, JSON.stringify(GigArmazenamento.usuarioPublico(salvo))));
    }
});
