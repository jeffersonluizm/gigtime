// Roda em todas as páginas, antes do script da página: prepara o armazenamento local.
// Dados (usuários e mensagens) ficam no localStorage; o usuário logado fica no sessionStorage
// (a sessão vale por aba). Quem vinha de versões antigas é migrado aqui.
// Cada passo é isolado: armazenamento cheio ou bloqueado não pode derrubar a página.
(function () {
  // Armazenamento bloqueado (ex.: cookies desativados): sem ele o site não funciona; vai para a página de erro
  try {
    window.localStorage.getItem(GigArmazenamento.CHAVE_USUARIOS);
  } catch (erro) {
    if (!/\/Sistema\/erro\.html$/.test(window.location.pathname)) {
      (window.__gigNavegar || ((destino) => window.location.replace(destino)))('../Sistema/erro.html?motivo=armazenamento');
    }
    return;
  }

  function tentarGravar(descricao, passo) {
    try {
      passo();
    } catch (erro) {
      console.warn(`GigTime: não foi possível ${descricao} (${erro.name}: ${erro.message})`);
    }
  }

  tentarGravar('migrar as chaves antigas', () => GigArmazenamento.migrarChavesAntigas(localStorage));
  tentarGravar('migrar os usuários da sessão antiga', () => GigArmazenamento.migrarDaSessao(localStorage, sessionStorage));
  // Primeira visita: personas e, se ainda não há nenhuma mensagem, as conversas de demonstração
  tentarGravar('gravar os usuários de exemplo', () => {
    const semeou = GigArmazenamento.semearSeVazio(localStorage, GigUsuariosExemplo);
    if (semeou && GigMensagens.chavesDeMensagens(localStorage).every((chave) => localStorage.getItem(chave) === null)) {
      GigMensagens.semearConversas(localStorage, GigDemo.conversas);
    }
  });
  // Senhas em texto puro de versões antigas viram hash (assíncrono; o login aceita as duas formas)
  GigSenha.migrarSenhasDoStorage(localStorage, GigArmazenamento.CHAVE_USUARIOS).catch((erro) => console.warn(erro.message));

  // Objetos copiados para a sessão não guardam senha (versões antigas guardavam o usuário inteiro)
  [GigConstantes.CHAVES_SESSAO.LOGADO, GigConstantes.CHAVES_SESSAO.ESCOLHIDO].forEach((chave) => {
    const salvo = GigArmazenamento.lerJSON(sessionStorage, chave);
    if (salvo && ('password' in salvo || 'passwordHash' in salvo)) {
      tentarGravar('limpar a senha da sessão', () => sessionStorage.setItem(chave, JSON.stringify(GigArmazenamento.usuarioPublico(salvo))));
    }
  });
})();
