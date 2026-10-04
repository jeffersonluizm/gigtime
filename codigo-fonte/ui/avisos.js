// Avisos da interface no lugar de alert()/confirm():
// - mostrar(texto, tipo): toast numa região aria-live (o leitor de tela anuncia sem roubar o foco)
// - paraProximaPagina(texto, tipo): guarda o aviso para mostrar depois de um redirecionamento
// - confirmar({...}): diálogo próprio (<dialog>) para ações destrutivas; devolve Promise<boolean>
(function (raiz) {
  const CHAVE_PENDENTE = 'gigtime:aviso';
  const DURACAO_MS = 6000;
  const ICONES = { sucesso: 'check-circle-fill', erro: 'exclamation-triangle-fill', info: 'info-circle' };
  const icone = (nome) => `<svg class="icone" aria-hidden="true" focusable="false"><use href="../assets/icones.svg#${nome}"></use></svg>`;

  function regiao() {
    let el = document.getElementById('avisos');
    if (!el) {
      el = document.createElement('div');
      el.id = 'avisos';
      el.className = 'avisos';
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    return el;
  }

  function mostrar(texto, tipo = 'sucesso') {
    const aviso = document.createElement('div');
    aviso.className = `aviso aviso-${tipo}`;
    aviso.innerHTML = `${icone(ICONES[tipo] || ICONES.info)}<span></span><button type="button" aria-label="Fechar aviso">${icone('x-lg')}</button>`;
    aviso.querySelector('span').textContent = texto;
    const fechar = () => aviso.remove();
    aviso.querySelector('button').addEventListener('click', fechar);
    regiao().appendChild(aviso);
    raiz.setTimeout(fechar, DURACAO_MS);
    return aviso;
  }

  function paraProximaPagina(texto, tipo = 'sucesso') {
    try {
      raiz.sessionStorage.setItem(CHAVE_PENDENTE, JSON.stringify({ texto, tipo }));
    } catch (e) { /* sem sessão disponível: o aviso só não aparece */ }
  }

  function mostrarPendente() {
    let pendente = null;
    try {
      pendente = JSON.parse(raiz.sessionStorage.getItem(CHAVE_PENDENTE));
      raiz.sessionStorage.removeItem(CHAVE_PENDENTE);
    } catch (e) { /* ignora */ }
    if (pendente && pendente.texto) mostrar(pendente.texto, pendente.tipo);
  }

  // opcoes: { titulo, texto, confirmar = 'Confirmar', cancelar = 'Cancelar', perigo = false }
  function confirmar(opcoes) {
    return new Promise((resolver) => {
      const dialogo = document.createElement('dialog');
      dialogo.className = 'dialogo';
      dialogo.setAttribute('aria-labelledby', 'dialogoTitulo');
      dialogo.setAttribute('aria-describedby', 'dialogoTexto');
      dialogo.innerHTML = `
        <h2 id="dialogoTitulo"></h2>
        <p id="dialogoTexto" class="mb-0"></p>
        <div class="acoes">
          <button type="button" class="btn btn-gig-secundario" data-resposta="nao"></button>
          <button type="button" class="btn ${opcoes.perigo ? 'btn-perigo' : 'btn-gig'}" data-resposta="sim"></button>
        </div>`;
      dialogo.querySelector('h2').textContent = opcoes.titulo;
      dialogo.querySelector('p').textContent = opcoes.texto || '';
      dialogo.querySelector('[data-resposta="nao"]').textContent = opcoes.cancelar || 'Cancelar';
      dialogo.querySelector('[data-resposta="sim"]').textContent = opcoes.confirmar || 'Confirmar';
      const anterior = document.activeElement;

      const encerrar = (resposta) => {
        if (typeof dialogo.close === 'function' && dialogo.open) dialogo.close();
        dialogo.remove();
        if (anterior && anterior.focus) anterior.focus();
        resolver(resposta);
      };
      dialogo.addEventListener('click', (event) => {
        const botao = event.target.closest('[data-resposta]');
        if (botao) encerrar(botao.dataset.resposta === 'sim');
      });
      dialogo.addEventListener('cancel', (event) => { event.preventDefault(); encerrar(false); }); // Esc

      document.body.appendChild(dialogo);
      if (typeof dialogo.showModal === 'function') dialogo.showModal();
      else dialogo.setAttribute('open', '');
      // Foco começa em "Cancelar": a ação destrutiva nunca é o padrão
      dialogo.querySelector('[data-resposta="nao"]').focus();
    });
  }

  raiz.GigAvisos = { mostrar, paraProximaPagina, mostrarPendente, confirmar };
})(window);
