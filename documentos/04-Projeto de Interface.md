
# Projeto de Interface

O projeto foi desenvolvido estabelecendo que a interface do sistema atenderia a todos os requisitos previamente definidos nos requisitos não funcionais e funcionais. Este projeto também teve como objetivo proporcionar uma compreensão detalhada da usabilidade do sistema, com foco principal na área de desktop.

## User Flow

Elaboramos um fluxograma para demonstrar o fluxo de interação do usuário pelas telas do sistema, utilizando a ferramenta Figma. A Figura 1, apresentada em anexo, proporciona uma compreensão mais aprofundada da usabilidade do sistema. Para obter mais detalhes sobre a usabilidade, acesse o link fornecido: [Projeto de baixa fidelidade](https://www.figma.com/design/onmbViV0CZKPLkAwXNwSYa/GigTime-(Prot%C3%B3tipo-Baixa-Fidelidade)?node-id=0-1&t=uz7gUVQyMQYzQ7yD-1)


![Frame 11 (3)](https://github.com/user-attachments/assets/7f8df6e0-70ef-4200-a3d4-ee171e229f8b)

### Wireframe

Com base no fluxo do usuário, apresentamos, em sequência, as telas que compõem o sistema. A estrutura principal do sistema é dividida em três blocos, descritos da seguinte forma:

Cabeçalho: contém os elementos fixos que representam a identidade do projeto, como o logotipo, a barra de pesquisa e a navegação principal do site (menu de navegação). Esses elementos seguem em todas as páginas do projeto.

Conteúdo: exibe os elementos que fazem referência à tela atual do usuário, também baseados nas ações do mesmo.

Rodapé: inclui os elementos de direitos autorais do projeto.

![image](https://github.com/user-attachments/assets/6df98a49-64e2-423d-a1bf-e342ed5ed7d1)


### Tela - Landing Page

Página inicial com informações do site e opções para navegação de músicos e contratantes.

![Entrada](https://github.com/user-attachments/assets/d37e46a3-bb13-4fc1-9bfe-d7aee0ab2872)


### Tela - Registro

Formulário para novos usuários se cadastrarem como músicos ou contratantes.

![Registro](https://github.com/user-attachments/assets/a140b587-be27-4705-a67c-eb27f9d488fe)


### Tela - Login

Tela onde usuários entram no sistema usando suas credenciais.

![Login](https://github.com/user-attachments/assets/ce7793e9-c504-4617-bbd2-9b626437a386)


### Tela - Anúncios

Espaço onde contratantes e músicos publicam seus anúncios.

![Anúncios](https://github.com/user-attachments/assets/d979cbc0-aa8b-4274-b67d-1516b1b0d039)


### Tela - Visualização de Perfil

Exibe informações públicas dos perfis de músicos ou contratantes.

![Frame 9](https://github.com/user-attachments/assets/17afc8c8-77d9-4b22-afba-3c2a80dfd898)

### Tela - Chat

Sistema de mensagens para comunicação entre músicos e contratantes.

![Chat](https://github.com/user-attachments/assets/d8ebe5f2-9672-4167-85cb-cf2ab159230a)

---

## Interface atual (revisão de portfólio, 2026)

O fluxo e os wireframes acima são os do projeto original e ficam como histórico. Duas diferenças: a "barra de pesquisa" do cabeçalho virou a busca da página Explorar, e o rodapé agora existe em todas as páginas (com o selo "Demo · dados só neste navegador").

### Fluxo atual

```mermaid
flowchart LR
  Home --> Explorar
  Home --> Sobre["Como funciona"]
  Explorar --> Perfil["Perfil (?u=usuário)"]
  Perfil -->|Contate-me| Chat
  Chat -->|sem sessão| Entrar
  Entrar --> Esqueci["Esqueci a senha"]
  Entrar --> Cadastro
  Cadastro -->|entra na conta| Perfil
  Perfil -->|próprio perfil| Editar["Editar perfil"]
  Menu["Menu da conta"] --> Conta["Conta e dados"]
  Menu --> Sair --> Saiu["Você saiu"]
  Conta --> Privacidade
```

### Telas

Prints tirados no Chrome a partir do código atual (`ferramentas/capturar-telas.js`), em 1280 px e em 375 px.

| Tela | Desktop | Celular |
|------|---------|---------|
| Home | ![Home](../docs/img/home-desktop.png) | ![Home no celular](../docs/img/home-celular.png) |
| Explorar | ![Explorar](../docs/img/explorar-desktop.png) | ![Explorar no celular](../docs/img/explorar-celular.png) |
| Perfil | ![Perfil](../docs/img/perfil-desktop.png) | ![Perfil no celular](../docs/img/perfil-celular.png) |
| Mensagens | ![Mensagens](../docs/img/chat-desktop.png) | ![Mensagens no celular](../docs/img/chat-celular.png) |
| Entrar | ![Entrar](../docs/img/entrar-desktop.png) | ![Entrar no celular](../docs/img/entrar-celular.png) |
| Conta e dados | ![Conta](../docs/img/conta-desktop.png) | ![Conta no celular](../docs/img/conta-celular.png) |

### Estados de interface

Toda lista tem estado de carregando, vazio e erro: Explorar sem resultado ("Nenhum perfil com esses filtros", com botão para limpar), perfil não encontrado, chat sem conversas, imagem externa que não carrega (troca pela ilustração padrão). Sucesso e erro aparecem em avisos (toast) numa região `aria-live`, no lugar de `alert()`, e ações destrutivas usam um diálogo próprio com o foco começando em "Cancelar".
