// Peças comuns dos formulários: opções de UF e gêneros (de lib/constantes.js), erros por campo
// com aria-invalid/aria-describedby, e o botão de mostrar/ocultar senha.
(function (raiz) {
  const C = () => raiz.GigConstantes;

  // <select> de UF: primeira opção vazia com o texto pedido
  function preencherUFs(select, textoVazio) {
    select.replaceChildren(new Option(textoVazio, ''));
    C().UFS.forEach((uf) => select.add(new Option(uf, uf)));
  }

  // Checkboxes de gênero dentro de `container`, ids `${prefixo}${Genero}` (ex.: genreRock)
  function montarGeneros(container, prefixo, classeExtra = '') {
    container.replaceChildren();
    C().GENEROS.forEach((genero) => {
      const bloco = document.createElement('div');
      bloco.className = `form-check ${classeExtra}`.trim();
      const caixa = document.createElement('input');
      caixa.className = 'form-check-input';
      caixa.type = 'checkbox';
      caixa.id = prefixo + genero;
      caixa.value = genero;
      const rotulo = document.createElement('label');
      rotulo.className = 'form-check-label';
      rotulo.htmlFor = caixa.id;
      rotulo.textContent = genero;
      bloco.append(caixa, rotulo);
      container.appendChild(bloco);
    });
  }

  const marcados = (container) => Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map((c) => c.value);

  function limparErros(form) {
    form.querySelectorAll('[aria-invalid="true"]').forEach((campo) => {
      campo.removeAttribute('aria-invalid');
      // devolve a descrição original (texto de ajuda), sem a mensagem de erro
      if ('descricaoOriginal' in campo.dataset) {
        if (campo.dataset.descricaoOriginal) campo.setAttribute('aria-describedby', campo.dataset.descricaoOriginal);
        else campo.removeAttribute('aria-describedby');
        delete campo.dataset.descricaoOriginal;
      }
    });
    form.querySelectorAll('.is-invalid').forEach((campo) => campo.classList.remove('is-invalid'));
    form.querySelectorAll('.invalid-feedback[data-campo]').forEach((aviso) => {
      aviso.textContent = '';
      aviso.classList.remove('d-block');
    });
    const geral = form.querySelector('[data-erro-formulario]');
    if (geral) geral.textContent = '';
  }

  // erros: [{ campo, mensagem }]; idDoCampo traduz o nome da regra para o id do campo na tela
  function mostrarErros(form, erros, idDoCampo = {}) {
    erros.forEach(({ campo, mensagem }) => {
      const aviso = form.querySelector(`.invalid-feedback[data-campo="${campo}"]`);
      if (aviso) {
        aviso.textContent = mensagem;
        aviso.classList.add('d-block');
        if (!aviso.id) aviso.id = 'erro-' + campo;
      }
      const entrada = document.getElementById(idDoCampo[campo] || campo);
      if (entrada) {
        entrada.classList.add('is-invalid');
        entrada.setAttribute('aria-invalid', 'true');
        if (aviso) {
          const original = entrada.getAttribute('aria-describedby') || '';
          entrada.dataset.descricaoOriginal = original;
          entrada.setAttribute('aria-describedby', `${original} ${aviso.id}`.trim());
        }
      }
    });
    const primeiro = erros.length ? document.getElementById(idDoCampo[erros[0].campo] || erros[0].campo) : null;
    if (primeiro && primeiro.focus) primeiro.focus();
  }

  function mostrarErroGeral(form, texto) {
    const geral = form.querySelector('[data-erro-formulario]');
    if (geral) geral.textContent = texto;
  }

  // <button class="mostrar-senha" data-alvo="id"> alterna o tipo do campo de senha
  function ligarMostrarSenha(raizDom = document) {
    raizDom.querySelectorAll('.mostrar-senha[data-alvo]').forEach((botao) => {
      botao.addEventListener('click', () => {
        const campo = document.getElementById(botao.dataset.alvo);
        const mostrar = campo.type === 'password';
        campo.type = mostrar ? 'text' : 'password';
        botao.setAttribute('aria-pressed', String(mostrar));
        botao.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
        botao.querySelector('use').setAttribute('href', `../assets/icones.svg#${mostrar ? 'eye-slash' : 'eye'}`);
      });
    });
  }

  // Botão de envio ocupado enquanto o hash é calculado (PBKDF2 leva uns décimos de segundo)
  function ocupado(botao, sim, textoOcupado) {
    if (!botao) return;
    if (sim) {
      botao.dataset.textoOriginal = botao.textContent;
      botao.textContent = textoOcupado || 'Aguarde...';
    } else if (botao.dataset.textoOriginal) {
      botao.textContent = botao.dataset.textoOriginal;
    }
    botao.disabled = sim;
    botao.setAttribute('aria-busy', String(sim));
  }

  raiz.GigFormulario = { preencherUFs, montarGeneros, marcados, limparErros, mostrarErros, mostrarErroGeral, ligarMostrarSenha, ocupado };
})(window);
