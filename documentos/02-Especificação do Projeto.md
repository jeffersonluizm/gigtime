# Especificação do Projeto

## Perfis de Usuários

<!-- [Enumere e faça o detalhamento dos perfis de usuários. Utilize o modelo de tabela abaixo para sintetizá-los.] -->

<table>
<tbody>
<tr align=center>
<th colspan="2">Perfil: Músico </th>
</tr>
<tr>
<td width="150px"><b>Descrição</b></td>
<td width="600px">Músico que já realizou apresentações ao vivo.</td>
</tr>
<tr>
<td><b>Necessidades</b></td>
<td>
  1. Um sistema fácil para negociar e fechar contratos com segurança;</br> <!-- o Br ali é para quebrar linha :) -->
  2. Um ambiente que permite o acesso dos contratantes ao seu protifólio;</br>
  3. Acesso a eventos de gêneros musicais especificos;</br>
  4. Garantia de estrutura adequada para apresentação;</br>
  5. Um ambiente que possibilite a interação com outros músicos;</br>
  6. Um sistema que permite registrar avaliações sobre os contratantes.
</td>
</tr>
<tr align=center>
<th colspan="2">Perfil: Contratantes </th>
</tr>
<tr>
<td width="150px"><b>Descrição</b></td>
<td width="600px">Estebelecimentos e eventos com música ao vivo.</td>
</tr>
<tr>
<td><b>Necessidades</b></td>
<td>
  1. Encontrar músicos disponíveis para apresentações frequentes e de última hora;</br>
  2. Visualizar feedbacks de outros contratantes sobre os músicos;</br>
  3. Monitorar os custos com música ao vivo e negociações;</br>
  4. Encontrar músicos especializados em um determinado gênero;</br>
  5. Encontrar músicos qualificados.
</td>
</tr>
</tbody>
</table>


## Histórias de Usuários

<!-- [Apresente aqui as histórias de usuários que são relevantes para o projeto da solução.]

> **Link Útil**:
> - [Como escrever boas histórias de usuário](https://medium.com/vertice/como-escrever-boas-users-stories-hist%C3%B3rias-de-usu%C3%A1rios-b29c75043fac)

[Utilize o modelo de tabela abaixo para apresentar as histórias de usuários.] -->

|EU COMO... `QUEM`   | QUERO/PRECISO ... `O QUE`                                                                                             |PARA ... `PORQUE`                                           |
|--------------------|-----------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| Banda              | <div align=center>Quero conseguir mais</br>oportunidades de trabalho</br>em minha área.</div>                         | <div align=center>Para conseguir mais</br>experiencia</div>|
| Músico Solo        | <div align=center>Quero expandir meu networking</div>                                                                 | <div align=center>Para criar mais conexões</br>com donos de</br>estabelecimentos e</br>aumentar minha relevância</br>no mercado</div> |
| Casa de Shows      | <div align=center>Quero ter uma maior variedade</br>de músicos de estilos diversos</br>(jazz, Funk, Samba, etc).</div>| <div align=center>Para que meu</br>estabelecimento seja único</br>criando um diferencial dos</br>outros atraindo um público</br>maior ao meu</br>estabelecimento.</div>|
| Bar                | <div align=center>Quero contratar músicos para</br>shows ao vivo em meu</br>estabelecimento.</div>                    | <div align=center>Para atrair um público maior</br>ao meu estabelecimento e</br>aumentar as vendas</div>|
| Restaurante        | <div align=center>Quero contratar bandas para</br>shows ao vivo em meu</br>estabelecimento.</div>                     | <div align=center>Para criar uma experiencia</br>mais agradável e confortável</br>aos meus clientes a fim de</br>fidelizá-los.</div>|

## Requisitos do Projeto

<!-- [Com base nas Histórias de Usuários, enumere os requisitos da solução. Lembre-se que cada requisito deve corresponder a uma, e somente uma, característica alvo da solução. Além disso, certifique-se de que todos os aspectos capturados nas Histórias de Usuário foram cobertos.] -->

### Requisitos Funcionais

<!-- [Utilize o modelo de tabela abaixo para apresentar os requisitos funcionais] -->

|ID    | Descrição                | Prioridade |
|-------|---------------------------------|----|
| RF-01 | <div align=center>Os usuários deverão poder se cadastrar na plataforma.</div>| Alta |  
| RF-02 | <div align=center>Os usuários deverão poder filtrar músicos/contratantes com base em gêneros musicais,</br>localidade e avaliação média.</div>| Alta |
| RF-03 | <div align=center>Os usuários deverão poder se comunicar por chat através da</br>plataforma.</div>| Baixa | 
| RF-04 | <div align=center>Perfis de músicos/bandas devem exibir uma página detalhada</br>com informações completas, incluindo vídeos, fotos</br> e disponibilidade.</div>| Alta |
| RF-05 | <div align=center>O sistema deve permitir login.</div>| Alta | 
| RF-06 | <div align=center>Os usuários deverão se cadastrar e aparecer na tela da categoria escolhida no cadastro de perfil (Artista/Contratante).</div>| Alta | 
| RF-07 | <div align=center>Os usuários poderão clicar no perfil do Artista/Contratante na página inicial e serem levados diretamente para o perfil escolhido.</div>| Alta |
| RF-08 | <div align=center>O site deve se encontrar totalmente responsivo nas principais das plataformas de uso (smartphones/tablets/notebooks/computadores).</div>| Alta |
| RF-09 | <div align=center>O usuário deve poder visualizar o próprio perfil.</div>| Alta |


**Prioridade: Alta / Média / Baixa. 

### Requisitos não Funcionais

<!-- [Utilize o modelo de tabela abaixo para apresentar os requisitos não-funcionais] -->

|ID      | Descrição               |Prioridade |
|--------|-------------------------|----|
| RNF-01 | <div align=center>A aplicação deve carregar rapidamente, especialmente em</br>páginas críticas como a busca por bandas e perfis.</div>| Alta | 
| RNF-02 | <div align=center>A aplicação deve ter resposta rápida nas interações com a</br>interface, como ao aplicar filtros de busca.</div>| Alta |
| RNF-03 | <div align=center>A arquitetura do sistema deve ser escalável para suportar um</br>número crescente de usuários (bandas e contratantes) sem</br>perda de desempenho.</div>| Alta | 
| RNF-04 | <div align=center>Possibilidade de integrar uma futura API para backend sem</br>reestruturar o frontend.</div>| Alta |
| RNF-05 | <div align=center>A interface deve ser simples e intuitiva.</div>| Alta | 
| RNF-06 | <div align=center>O design deve ser responsivo, adaptando-se bem a diferentes</br>tamanhos de tela, como dispositivos móveis e desktops.</div>| Alta |
| RNF-07 | <div align=center>Dados pessoais dos usuários devem ser armazenados de</br>maneira segura, protegendo-os contra acesso não</br>autorizado.</div>| Alta | 
| RNF-08 | <div align=center>O sistema deve funcionar nos principais navegadores</br>(Chrome, Firefox, Safari, Edge).</div>| Alta | 
| RNF-09 | <div align=center>O código deve ser organizado e documentado de forma que</br>futuras atualizações e correções possam ser feitas</br>facilmente.</div>| Média |
| RNF-10 | <div align=center>A arquitetura deve ser modular, permitindo que novos</br>recursos sejam adicionados sem impactar o sistema</br>existente.</div>| Alta | 

**Prioridade: Alta / Média / Baixa.

---

## Situação dos requisitos na revisão de portfólio (2026)

As tabelas acima são o registro original do projeto acadêmico (2024) e foram mantidas como histórico. A tabela abaixo mostra o estado de cada requisito no código atual e onde está a evidência (arquivos de teste em `testes/`, rodados com `npm test`).

### Requisitos funcionais

| ID | Situação | Como foi atendido | Evidência |
|----|----------|-------------------|-----------|
| RF-01 | Atendido | Cadastro com validação de usuário, e-mail, telefone, senha (8+ caracteres) e links; já entra na conta ao terminar | `registro.test.js`, `perfil.test.js` |
| RF-02 | Atendido | Explorar filtra por papel, estado, avaliação mínima, gêneros e texto; o filtro fica no endereço (`?papel=&uf=...`) | `filtros.test.js`, `cards.test.js` |
| RF-03 | Atendido (local) | Chat entre usuários no mesmo navegador, com lista de conversas, não lidas, paginação e atualização entre abas | `chat.test.js` |
| RF-04 | Atendido | Perfil com apresentação, disponibilidade, gêneros, selos, fotos de destaque (galeria com diálogo) e vídeo do YouTube | `perfil.test.js` |
| RF-05 | Atendido | Login com PBKDF2; volta para a página que pediu login; sessão expira após 2 horas sem uso | `senha.test.js`, `sessao.test.js` |
| RF-06 | Atendido | O perfil cadastrado aparece em Explorar e na Home conforme o papel escolhido | `armazenamento.test.js`, `cards.test.js` |
| RF-07 | Atendido | Cards da Home e de Explorar levam ao perfil por link de verdade (`perfil.html?u=<usuário>`) | `cards.test.js` |
| RF-08 | Atendido | Layout responsivo verificado em 375 px e 1280 px (prints em `docs/img/`) | revisão visual |
| RF-09 | Atendido | "Meu perfil" no menu da conta abre o próprio perfil, com o botão "Editar perfil" | `perfil.test.js` |
| RF-10 (novo) | Atendido | Edição do perfil com a senha atual obrigatória | `perfil.test.js`, `concorrencia.test.js` |
| RF-11 (novo) | Atendido | Conta e dados: trocar senha, baixar os dados (JSON), apagar a conta, restaurar a demonstração, sair | `conta.test.js`, `conta-pagina.test.js` |
| RF-12 (novo) | Atendido | Páginas de acesso e de sistema: esqueci a senha (honesta, sem e-mail), saiu, sessão expirada, erro e 404 | `paginas-sistema.test.js` |

### Requisitos não funcionais

| ID | Situação | Observação |
|----|----------|------------|
| RNF-01 | Atendido | Capa em ilustração SVG própria (23 KB), sem CDN, fontes com `font-display: swap`. Medido com Lighthouse em `docs/carga/` |
| RNF-02 | Atendido | Filtro sobre 5 mil perfis medido em `docs/carga/`; o laço O(n²) foi trocado por um `Map` |
| RNF-03 | Parcial | Sem servidor, o limite é a cota de cerca de 5 MB do localStorage (cerca de 6 mil perfis ou 30 mil mensagens curtas), medida em `docs/carga/` |
| RNF-04 | Encaminhado | As regras ficam em `codigo-fonte/lib/` e recebem o armazenamento como parâmetro; uma API pode ocupar esse lugar sem reescrever as telas |
| RNF-05 | Atendido | Identidade única, estados de carregando, vazio e erro, avisos no lugar de `alert()` |
| RNF-06 | Atendido | Igual ao RF-08 |
| RNF-07 | Reescrito como limitação | Sem servidor não há armazenamento "protegido contra acesso não autorizado": quem usa o mesmo navegador vê os dados. A senha fica só como hash PBKDF2 e a página Privacidade explica o que é guardado |
| RNF-08 | Atendido nos navegadores atuais | Usa recursos presentes em Chrome, Edge, Firefox e Safari recentes (WebCrypto, `<dialog>`, CSS `aspect-ratio`) |
| RNF-09 | Atendido | Código em camadas (`lib/`, `ui/`, páginas), comentado, com mais de 280 testes automatizados |
| RNF-10 | Atendido | Página nova = HTML com a sequência padrão de scripts + script da página; a estrutura comum é verificada em `paginas.test.js` |
