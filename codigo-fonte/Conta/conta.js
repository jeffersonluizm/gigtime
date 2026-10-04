// Conta e dados: trocar senha, baixar os dados, sair, apagar a conta e restaurar a demonstração.
// Toda ação sobre a conta pede a senha (a sessão local pode ser forjada; a senha é a prova).
// As regras ficam em lib/perfil.js (trocarSenha) e lib/conta.js (exportar, apagar, restaurar).
(function () {
  const logado = GigSessao.exigirLogin(sessionStorage, '../Conta/conta.html', (url) => { window.location.href = url; });
  if (!logado) return;

  const $ = (id) => document.getElementById(id);
  const eu = logado.username;

  function mostrarUso() {
    const uso = GigConta.usoDoArmazenamento(localStorage);
    const kb = (uso.caracteres * 2 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    const pct = (uso.percentual * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    $('usoArmazenamento').textContent = `O GigTime ocupa cerca de ${kb} KB (${pct}% do espaço típico de 5 MB) neste navegador.`;
  }
  $('contaUsuario').textContent = `${logado.name || eu} (${eu})`;
  mostrarUso();

  // Trocar senha
  const formSenha = $('formSenha');
  const ID_TROCA = { senhaAtual: 'senhaAtualTroca', novaSenha: 'novaSenha', confirmacao: 'confirmacaoSenha' };
  formSenha.addEventListener('submit', async (event) => {
    event.preventDefault();
    GigFormulario.limparErros(formSenha);
    const botao = $('salvarSenha');
    GigFormulario.ocupado(botao, true, 'Trocando...');
    let resultado;
    try {
      resultado = await GigPerfil.trocarSenha(GigArmazenamento.lerUsuarios(localStorage), eu, {
        atual: $('senhaAtualTroca').value, nova: $('novaSenha').value, confirmacao: $('confirmacaoSenha').value,
      });
    } catch (erro) {
      GigFormulario.mostrarErroGeral(formSenha, erro.message);
      return;
    } finally {
      GigFormulario.ocupado(botao, false);
    }
    if (!resultado.ok) {
      GigFormulario.mostrarErros(formSenha, resultado.erros, ID_TROCA);
      return;
    }
    try {
      GigArmazenamento.substituirUsuario(localStorage, resultado.usuario);
    } catch (erro) {
      if (!GigArmazenamento.ehErroDeCota(erro)) throw erro;
      GigFormulario.mostrarErroGeral(formSenha, 'Não há espaço no navegador para gravar a nova senha.');
      return;
    }
    formSenha.reset();
    GigAvisos.mostrar('Senha trocada. Use a nova senha no próximo login.');
  });

  // Baixar os dados (data: URL; o arquivo é pequeno e não depende de Blob)
  $('exportar').addEventListener('click', () => {
    const dados = GigConta.exportarDados(localStorage, eu);
    const link = $('linkExportado');
    link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dados, null, 2));
    link.download = `gigtime-${eu}.json`;
    $('exportado').hidden = false;
    link.click();
    GigAvisos.mostrar('Arquivo com os seus dados gerado.');
  });

  $('sairConta').addEventListener('click', () => {
    GigSessao.sair(sessionStorage);
    window.location.href = '../Acesso/saiu.html';
  });

  // Apagar a conta: senha certa + confirmação no diálogo
  const formApagar = $('formApagar');
  formApagar.addEventListener('submit', async (event) => {
    event.preventDefault();
    GigFormulario.limparErros(formApagar);
    const confere = await GigSenha.autenticar(GigArmazenamento.lerUsuarios(localStorage), eu, $('senhaApagar').value);
    if (!confere) {
      GigFormulario.mostrarErros(formApagar, [{ campo: 'senhaApagar', mensagem: 'Senha incorreta.' }]);
      return;
    }
    const certeza = await GigAvisos.confirmar({
      titulo: 'Apagar sua conta?',
      texto: 'O perfil e todas as suas conversas serão apagados deste navegador. Não dá para desfazer.',
      confirmar: 'Apagar conta',
      perigo: true,
    });
    if (!certeza) return;
    GigConta.apagarConta(localStorage, eu);
    GigSessao.sair(sessionStorage);
    GigAvisos.paraProximaPagina('Conta apagada. Seus dados saíram deste navegador.');
    window.location.href = '../Home/home.html';
  });

  $('restaurarDemo').addEventListener('click', async () => {
    const certeza = await GigAvisos.confirmar({
      titulo: 'Restaurar a demonstração?',
      texto: 'Todas as contas criadas e todas as conversas deste navegador serão apagadas. As 10 personas de exemplo voltam.',
      confirmar: 'Restaurar',
      perigo: true,
    });
    if (!certeza) return;
    GigConta.restaurarDemo(localStorage, GigUsuariosExemplo);
    GigSessao.sair(sessionStorage);
    GigAvisos.paraProximaPagina('Demonstração restaurada. Entre com lia.batera e a senha demo1234.');
    window.location.href = '../Home/home.html';
  });
})();
