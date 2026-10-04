# Publicar a demonstração no GitHub Pages

O GigTime é um site estático: o GitHub Pages hospeda de graça, com HTTPS e CDN, e a demonstração nunca "dorme". O workflow `.github/workflows/pages.yml` já faz tudo: roda os testes, monta a pasta do site (só `index.html`, `404.html` e `codigo-fonte/`) e publica.

## 1. Criar o repositório e enviar o código

1. No GitHub, crie um repositório **público** (por exemplo, `gigtime`). Não marque "Add a README".
2. Na pasta do projeto:

   ```
   git remote add origin https://github.com/<seu-usuario>/gigtime.git
   git push -u origin main
   ```

   Se o trabalho ainda estiver na branch `feat/portfolio-ui-ux`, faça o merge na `main` antes (o workflow publica a partir da `main`).

## 2. Ativar o Pages com GitHub Actions (uma vez)

1. No repositório: **Settings > Pages**.
2. Em **Build and deployment > Source**, escolha **GitHub Actions**.
3. Vá em **Actions > Publicar no GitHub Pages > Run workflow** (ou faça um novo push na `main`).

O primeiro deploy leva de 1 a 2 minutos. O endereço aparece no resumo do workflow e em Settings > Pages, no formato:

```
https://<seu-usuario>.github.io/gigtime/
```

Não há variáveis nem segredos para configurar. O único valor que depende do endereço é a imagem de compartilhamento (Open Graph): o workflow troca `__URL_DO_SITE__` pelo endereço publicado na hora de montar o site.

## 3. Conferir (2 minutos)

| Verificação | Como | Esperado |
|---|---|---|
| Página inicial | Abrir `https://<seu-usuario>.github.io/gigtime/` | Redireciona para a Home do GigTime |
| Entrar com um clique | Home > "Entrar como músico" | Entra como Lia Fontes e abre Explorar |
| Chat entre duas pessoas | Outra aba > "Entrar como contratante" > abrir o perfil da Lia > Contate-me | As mensagens aparecem nas duas abas |
| 404 | Abrir `https://<seu-usuario>.github.io/gigtime/nao-existe` | Página "Página não encontrada" do GigTime, com links que voltam para o site |
| HTTPS | Cadeado no navegador | Conexão segura (a criptografia das senhas exige HTTPS) |
| Compartilhamento | Colar o link no LinkedIn Post Inspector (https://www.linkedin.com/post-inspector/) | Cartão com a imagem laranja do GigTime |

## 4. Atualizar o README

Troque `SEU-USUARIO` nos três links do início do `README.md` pelo seu usuário do GitHub (e `gigtime` pelo nome do repositório, se for outro) e faça um push: o workflow publica de novo.

## Observações

- O workflow de testes (`.github/workflows/ci.yml`) roda em todo push e pull request.
- No GitHub Pages a origem `https://<seu-usuario>.github.io` é dividida com os seus outros repositórios publicados: por isso todas as chaves do GigTime no armazenamento começam com `gigtime:`.
- Para tirar a demonstração do ar: Settings > Pages > **Unpublish site**.
