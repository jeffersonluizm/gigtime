# Registro de Testes de Software

<span style="color:red">Pré-requisitos: <a href="https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2024-2-e1-proj-web-t10-pmv-ads-2024-2-e1-proj-gigtime/blob/main/documentos/04-Projeto%20de%20Interface.md"> Projeto de Interface</a></span>, <a href="https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2024-2-e1-proj-web-t10-pmv-ads-2024-2-e1-proj-gigtime/blob/main/documentos/07-Plano%20de%20Testes%20de%20Software.md"> Plano de Testes de Software</a>

Os testes funcionais realizados na aplicação web são descritos a seguir.

Responsável: Jefferson

RF-01	
Os usuários deverão poder se cadastrar na plataforma.
https://imgur.com/90Xe4sf

RF-02	
Os usuários deverão poder filtrar músicos/contratantes com base em gêneros musicais,
localidade e avaliação média.
https://imgur.com/V4FzGh2

RF-03	
Os usuários deverão poder se comunicar por chat através da
plataforma.
https://imgur.com/G0MgS4b

RF-04	
Perfis de músicos/bandas devem exibir uma página detalhada
com informações completas, incluindo vídeos, fotos
e disponibilidade.
https://imgur.com/xeojsKl

RF-05	
O sistema deve permitir login.
https://imgur.com/bbgIIXw

RF-06	
Os usuários deverão se cadastrar e aparecer na tela da categoria escolhida no cadastro de perfil (Artista/Contratante).
https://imgur.com/tra33LP

RF-07	
O usuário deve poder visualizar o próprio perfil.
https://imgur.com/qj3nDKU

---

## Registro dos testes automatizados (revisão de portfólio, 2026)

Os registros acima (links de imagens) são os testes manuais de 2024 e ficam como histórico; o último item (RF-07) na verdade descreve o RF-09.

| Data | Comando | Ambiente | Resultado |
|------|---------|----------|-----------|
| 2026-10-04 | `npm test` | Windows 11, Node.js 24.11.1, jsdom 26 | **286 testes, 286 passaram, 0 falhas** |
| 2026-10-04 | `node ferramentas/verificar-acessibilidade.js` (axe-core 4, WCAG 2.1 AA) | Chrome 154 headless, 15 telas em 1280 px e 375 px | **0 violações** |
| 2026-10-04 | Teste de carga (H1 a H13) | Chrome 154 headless, Lighthouse 12, autocannon 8 | Ver `docs/carga/2026-10-04-resultados.md` |

Os testes também rodam no GitHub Actions a cada push (`.github/workflows/ci.yml`) e antes de cada publicação no GitHub Pages (`.github/workflows/pages.yml`).

