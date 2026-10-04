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

// Usuários de exemplo, gravados no localStorage só quando ainda não há nenhum usuário.
// passwordHash = SHA-256 de "gigtime:<username>:<senha>" (ver lib/senha.js); as senhas de demonstração estão no README.
const USUARIOS_EXEMPLO = [
        {
            username: 'sonic',
            name: 'Sonic Hedgehog',
            email: 'sonic@sega.com',
            phone: '(11) 3456-7891',
            role: 'Músico',
            state: 'GH',
            city: 'Green Hills',
            rating: 5,
            genres: ["Rock", "MPB"],
            badges: ["Show Man"],
            profilePicLink: 'https://i.pinimg.com/originals/5e/0e/1f/5e0e1f83ac610406d50fa9c92296e640.jpg',
            bannerPicLink: 'https://i0.wp.com/setthetape.com/wp-content/uploads/2020/07/Sonic-the-Hedgehog-29-HEADER.jpg?fit=1200%2C460&ssl=1',
            songLink: 'https://youtu.be/G-i8HYi1QH0',
            userPicsLinks: [
                "https://64.media.tumblr.com/2d0cbe7960d6566a0792590a03a1cb5e/775f6ee57fa4919f-4b/s1280x1920/00a1fa3b9240d4449eabe387be91d15f0ff450cc.jpg",
                "https://m.gjcdn.net/fireside-post-image/900/34713876-84b2ivjg-v4.webp",
                "https://i.redd.it/astls43lldl71.jpg",
                "https://64.media.tumblr.com/556dae5389b128b1e6ea7d07d0614176/d9100601ca201b9c-64/s1280x1920/147c62ef2c22fe59989d46222888d265797350ff.png",
                "https://preview.redd.it/a-sonic-plush-holding-the-crush40-guitar-v0-msf38un6lgi91.jpg?auto=webp&s=7af1ab047d2caf047b8dcacfadf5aaded621c3ea",
                "https://pbs.twimg.com/media/FmeeQ3AWQAUkre7?format=jpg&name=4096x4096",
            ],
            passwordHash: 'ec837339f61e8a35c0a90e526c732fd87ad2a86399f44e15686b62b7359f4da0'
        },
        {
            username: 'cartola',
            name: 'Cartola',
            email: 'Cartola@comercial.com',
            phone: '(21) 9456-7891',
            role: 'Músico',
            state: 'RJ',
            city: 'Rio de Janeiro',
            rating: 5,
            genres: ["Sertanejo", "MPB"],
            badges: ["Show Man"],
            profilePicLink: 'https://i.postimg.cc/2591QbWr/pfp.jpg',
            bannerPicLink: 'https://i.postimg.cc/sXt1LkKL/highlight-6.png',
            songLink: 'https://youtu.be/xKpCkPFCmgE',
            userPicsLinks: [
                "https://i.postimg.cc/906TG4vr/imcNZI8.png",
                "https://i.postimg.cc/qBh3GLQY/highlight-2.png",
                "https://i.postimg.cc/8zDfNVDQ/highlight-3.jpg",
                "https://i.postimg.cc/L6jgc8c3/highlight-4.jpg",
                "https://i.postimg.cc/CxNBK6LZ/highlight-5.jpg",
                "https://i.postimg.cc/z3Y5w5pJ/highlight-2.jpg",
            ],
            passwordHash: 'ffcc0f73f2ff4099183563acf852fe3e1afeccf781f8b173cecb76e0f9987240'
        },
        {
            username: 'maria123',
            name: 'Maria Oliveira',
            email: 'maria@example.com',
            phone: '(98) 7654-3210',
            role: 'Contratante',
            state: 'MG',
            city: 'Belo Horizonte',
            rating: 4.5,
            genres: ["Sertanejo", "Pop"],
            badges: ["Top Contratante"],
            profilePicLink: 'https://images.pexels.com/photos/3054533/pexels-photo-3054533.jpeg?auto=compress&cs=tinysrgb&w=600',
            bannerPicLink: 'https://picsum.photos/2000/1000?x=1',
            songLink: '',
            userPicsLinks: [
                "https://picsum.photos/600/1000?x=1",
                "https://picsum.photos/600/1000?x=2",
                "https://picsum.photos/600/1000?x=3",
                "https://picsum.photos/600/1000?x=4",
                "https://picsum.photos/600/1000?x=5",
                "https://picsum.photos/600/1000?x=6",
            ],
            passwordHash: '717d0c15137e60b977e7cb8335e08dad1250ccacefe46ee6a12d2fc776c1f314'
        },
        {
            username: 'lucas98',
            name: 'Lucas Silva',
            email: 'lucas98@example.com',
            phone: '(99) 8877-6655',
            role: 'Músico',
            state: 'SP',
            city: 'São Paulo',
            rating: 4.8,
            genres: ["Rock", "MPB"],
            badges: ["Estrela em Ascensão"],
            profilePicLink: 'https://images.pexels.com/photos/379962/pexels-photo-379962.jpeg?cs=tinysrgb&w=1260&h=750&dpr=1',
            bannerPicLink: 'https://picsum.photos/1900/900?x=1',
            songLink: '',
            userPicsLinks: [
                "https://picsum.photos/600/1000?x=1",
                "https://picsum.photos/600/1000?x=2",
                "https://picsum.photos/600/1000?x=3",
                "https://picsum.photos/600/1000?x=4",
                "https://picsum.photos/600/1000?x=5",
                "https://picsum.photos/600/1000?x=6",
            ],
            passwordHash: 'f5e14504ff3269b70f2842c83323bd8af6fa936214110dd959709ad68b1ae9c4'
        },
        {
            username: 'ana.pereira',
            name: 'Ana Pereira',
            email: 'ana.pereira@example.com',
            phone: '(12) 3987-4560',
            role: 'Músico',
            state: 'PR',
            city: 'Curitiba',
            rating: 4.2,
            genres: ["Jazz", "MPB"],
            badges: ["Jazz Lover"],
            profilePicLink: 'https://images.pexels.com/photos/8191522/pexels-photo-8191522.jpeg?auto=compress&cs=tinysrgb&w=600',
            bannerPicLink: 'https://picsum.photos/2000/1000?x=1',
            songLink: '',
            userPicsLinks: [
                "https://picsum.photos/600/1000?x=1",
                "https://picsum.photos/600/1000?x=2",
                "https://picsum.photos/600/1000?x=3",
                "https://picsum.photos/600/1000?x=4",
                "https://picsum.photos/600/1000?x=5",
                "https://picsum.photos/600/1000?x=6",
            ],
            passwordHash: '3429b0e9801648cfcf9d99cee50fa1c150ccd084f5b1499df6aa955337debdf4'
        },
        {
            username: 'joao_souza',
            name: 'João Souza',
            email: 'joao.souza@example.com',
            phone: '(56) 7890-1234',
            role: 'Contratante',
            state: 'RS',
            city: 'Porto Alegre',
            rating: 5,
            genres: ["Rock", "Pop"],
            badges: ["Melhor Produtor"],
            profilePicLink: 'https://images.pexels.com/photos/2531551/pexels-photo-2531551.jpeg?auto=compress&cs=tinysrgb&w=600',
            bannerPicLink: 'https://picsum.photos/2000/1000?x=1',
            songLink: '',
            userPicsLinks: [
                "https://picsum.photos/600/1000?x=1",
                "https://picsum.photos/600/1000?x=2",
                "https://picsum.photos/600/1000?x=3",
                "https://picsum.photos/600/1000?x=4",
                "https://picsum.photos/600/1000?x=5",
                "https://picsum.photos/600/1000?x=6",
            ],
            passwordHash: '490790c6e51b3c530ac3a0763ee0d5c58628747bac6e0dda8d0d62614d4185ae'
        },
        {
            username: 'carol.martins',
            name: 'Carolina Martins',
            email: 'carol.martins@example.com',
            phone: '(78) 9456-1230',
            role: 'Músico',
            state: 'BA',
            city: 'Salvador',
            rating: 4.7,
            genres: ["Forró", "MPB"],
            badges: ["MPB Queen"],
            profilePicLink: 'https://images.pexels.com/photos/17411646/pexels-photo-17411646/free-photo-of-cidade-meio-urbano-ensolarado-moda.jpeg?auto=compress&cs=tinysrgb&w=600',
            bannerPicLink: 'https://picsum.photos/2000/1000?x=1',
            songLink: '',
            userPicsLinks: [
                "https://picsum.photos/600/1000?x=1",
                "https://picsum.photos/600/1000?x=2",
                "https://picsum.photos/600/1000?x=3",
                "https://picsum.photos/600/1000?x=4",
                "https://picsum.photos/600/1000?x=5",
                "https://picsum.photos/600/1000?x=6",
            ],
            passwordHash: 'acdcde187586742c9b28102649a5b3a6feb22738c844bb6b70d23672b69f8c29'
        },
        {
            username: 'joaoshow',
            name: 'João da Silva',
            email: 'joaoshow@example.com',
            phone: '(11) 9234-5678',
            role: 'Contratante',
            state: 'SP',
            city: 'São Paulo',
            rating: 4.7,
            genres: ["Rock", "Pop"],
            badges: ["Melhor Produtor"],
            profilePicLink: 'https://images.pexels.com/photos/1498335/pexels-photo-1498335.jpeg?auto=compress&cs=tinysrgb&w=600',
            bannerPicLink: 'https://picsum.photos/2000/1000?x=1',
            songLink: '',
            userPicsLinks: [
                "https://picsum.photos/600/1000?x=1",
                "https://picsum.photos/600/1000?x=2",
                "https://picsum.photos/600/1000?x=3",
                "https://picsum.photos/600/1000?x=4",
                "https://picsum.photos/600/1000?x=5",
                "https://picsum.photos/600/1000?x=6",
            ],
            passwordHash: 'fae2df09db1825270a9f7081215af2d57233ff21c1a96ff2e3c645783c3a647e'
        },
        {
            username: 'jazzburger',
            name: 'Jazz Burger Beer',
            email: 'jazzburger@example.com',
            phone: '(31) 9123-4567',
            role: 'Contratante',
            state: 'MG',
            city: 'Belo Horizonte',
            rating: 4.9,
            genres: ["MPB", "Jazz"],
            badges: ["Tradicional"],
            profilePicLink: 'https://images.pexels.com/photos/7317354/pexels-photo-7317354.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
            bannerPicLink: 'https://picsum.photos/2000/1000?x=1',
            songLink: '',
            userPicsLinks: [
                "https://picsum.photos/600/1000?x=1",
                "https://picsum.photos/600/1000?x=2",
                "https://picsum.photos/600/1000?x=3",
                "https://picsum.photos/600/1000?x=4",
                "https://picsum.photos/600/1000?x=5",
                "https://picsum.photos/600/1000?x=6",
            ],
            passwordHash: '3b864c16ba14a5ed022e4397fb87e9827a25f9651f1878569e23976eb156b6b9'
        },
        {
            username: 'operahouse',
            name: 'Opera House',
            email: 'operahouse@example.com',
            phone: '(41) 9988-7766',
            role: 'Contratante',
            state: 'PR',
            city: 'Curitiba',
            rating: 4.5,
            genres: ["Sertanejo", "Forró"],
            badges: ["Top Contratante"],
            profilePicLink: 'https://images.pexels.com/photos/2463016/pexels-photo-2463016.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
            bannerPicLink: 'https://picsum.photos/2000/1000?x=1',
            songLink: '',
            userPicsLinks: [
                "https://picsum.photos/600/1000?x=1",
                "https://picsum.photos/600/1000?x=2",
                "https://picsum.photos/600/1000?x=3",
                "https://picsum.photos/600/1000?x=4",
                "https://picsum.photos/600/1000?x=5",
                "https://picsum.photos/600/1000?x=6",
            ],
            passwordHash: '971c82f043ddc4bee9f338e05b610d39d9ae8fcb6e65e4aaf3068403f28811a7'
        }
];

// Dados (usuários e mensagens) ficam no localStorage; o usuário logado fica no sessionStorage,
// ou seja, a sessão vale por aba. Quem vinha da versão antiga (usuários no sessionStorage) é migrado.
GigArmazenamento.migrarDaSessao(localStorage, sessionStorage);
GigArmazenamento.semearSeVazio(localStorage, USUARIOS_EXEMPLO);
// Senhas em texto puro de versões antigas viram hash (assíncrono; o login aceita as duas formas)
GigSenha.migrarSenhasDoStorage(localStorage).catch(erro => console.warn(erro.message));

// Objetos copiados para a sessão não guardam senha (versões antigas guardavam o usuário inteiro)
['loggedInUser', 'clickedUser'].forEach(chave => {
    const salvo = GigArmazenamento.lerJSON(sessionStorage, chave);
    if (salvo && ('password' in salvo || 'passwordHash' in salvo)) {
        sessionStorage.setItem(chave, JSON.stringify(GigArmazenamento.usuarioPublico(salvo)));
    }
});
