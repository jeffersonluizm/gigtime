# ADR 0002: modo demonstração num site sem servidor

- **Data:** 2026-10-04
- **Status:** aceita

## Contexto

A regra dos projetos de portfólio pede um modo demonstração controlado por flag de servidor (padrão desligado), senhas de demonstração vindas de configuração, `GET /api/demo` e contas protegidas. O GigTime não tem servidor (ADR 0001): não há onde ligar uma flag nem esconder uma senha.

## Decisão

Adaptar a regra ao desenho estático:

- **O site inteiro é a demonstração.** Os dados de exemplo são personas fictícias geradas por `ferramentas/gerar-demo.js`, gravadas só no navegador de quem visita e só quando ele ainda não tem dados. Nada aponta para um ambiente real.
- **Fonte única:** `codigo-fonte/dados/demo.js` define as contas ("Entrar como músico" = `lia.batera`, "Entrar como contratante" = `casa.lume`) e a senha pública. O gerador do seed lê a senha desse arquivo.
- **A senha é pública de propósito:** aparece na tela de login. Ela não protege nada além da própria demonstração local, e o hash do seed usa PBKDF2 como qualquer outra conta.
- **Entrar com um clique:** botões na Home e no Login, e o atalho `Login/login.html?demo=musico|contratante` para o README.
- **Contas protegidas:** as personas não trocam a senha nem são apagadas (`Conta/conta.js` usa `GigDemo.ehContaDemo`). "Restaurar a demonstração" continua disponível para voltar ao estado inicial.

## Consequências

Quem avalia entra com um clique e não consegue quebrar a demonstração para si mesmo. Não existe "produção com a flag desligada" porque não existe produção com dados reais; se o projeto ganhar uma API, a regra completa do modo demonstração (flag de servidor, `GET /api/demo`) passa a valer.
