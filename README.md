# APIS — landing page

Abelha robótica polinizadora em 3D (Three.js), com a página montada em cinco dobras e um rodapé.

## Como rodar

A página usa módulos ES, então precisa de um servidor local (abrir o `index.html` com dois cliques não funciona):

- **VS Code:** extensão *Live Server* → botão direito no `index.html` → *Open with Live Server*
- **Terminal:** dentro desta pasta, `npx serve` e abra o endereço que aparecer

## Estrutura

```
apis/
├── index.html              marcação da página (sem CSS nem JS embutidos)
├── css/
│   ├── base.css            cores, fontes, reset, camadas fixas, animações globais
│   ├── nav.css             navegação fixa
│   ├── hero.css            1ª dobra · hero
│   ├── controle.css        2ª dobra · controle total + visão da câmera (vídeo) e HUD
│   ├── anatomia.css        3ª dobra · vista explodida
│   ├── onde-voa.css        4ª dobra · galeria horizontal
│   ├── prevenda.css        5ª dobra · flor 3D + kits
│   └── rodape.css          rodapé
├── js/
│   ├── main.js             ponto de entrada: inicializa tudo e roda o laço de animação
│   ├── config.js           ★ tudo o que se ajusta: poses, tempos, vídeo, preços, navegação, voo
│   ├── util/math.js        clamp, lerp, curvas, aleatório com semente
│   ├── abelha/             núcleo 3D (não depende da página)
│   │   ├── cena.js         renderer, câmera, luzes, conversão tela ↔ mundo
│   │   ├── texturas.js     texturas desenhadas em canvas
│   │   ├── materiais.js    materiais da abelha
│   │   ├── geometria.js    peças genéricas (esfera, tubo, pelos instanciados)
│   │   ├── modelo.js       a abelha: tórax, escudo, abdômen, asas, pernas, cabeça, lente
│   │   ├── flor.js         sombra de contato e flor 3D
│   │   └── animacao.js     estado + atualização por quadro (asas, explosão, pirueta…)
│   ├── voo/                coreografia
│   │   ├── poses.js        transforma config.POSES no alvo de cada ponto do scroll
│   │   ├── piloto.js       mola, mouse, vento, rajadas e zoom na câmera
│   │   └── interacao.js    clique na abelha → pirueta com pólen
│   ├── efeitos/
│   │   ├── polen.js        partículas de pólen
│   │   └── fundo.js        fundo amarelo animado (anéis e vento)
│   └── secoes/             um arquivo por dobra (só mexe no próprio DOM)
│       ├── nav.js · hero.js · controle.js · anatomia.js
│       └── onde-voa.js · prevenda.js · rodape.js
└── media/
    ├── visao-abelha.mp4 · visao-abelha-720.mp4   vídeo da câmera (1080p / 720p, 60 fps)
    └── locais/                                   fotos da galeria "Onde voa"
```

Dependências seguem uma direção só: `config` → `util` → `abelha` → `efeitos` / `voo` → `secoes` → `main`. Não há imports circulares.

## Onde mexer

| Quero mudar… | Arquivo |
| --- | --- |
| Onde a abelha fica em cada dobra, tamanho, giro | `js/config.js` → `POSES` |
| Quando o zoom na câmera começa e quanto scroll o vídeo ocupa | `js/config.js` → `DOBRA2` |
| Preços, parcelas, desconto Pix, fim da pré-venda, estoque | `js/config.js` → `PREVENDA` (valores de exemplo) |
| Ordem das peças na anatomia do celular | `js/config.js` → `ANA_MOB` |
| Vento, rajadas, altitude, modo de voo | `js/config.js` → `VOO` (ou no console: `abelha.voo`) |
| Textos, links, fotos | `index.html` |
| Cores e fontes | `css/base.css` → `:root` |
| Forma da abelha ou da flor | `js/abelha/modelo.js`, `js/abelha/flor.js` |

## Console (para testes)

```js
abelha.piruetaComPolen()      // pirueta com pólen
abelha.setColor('#e9e8e4')    // cor da quitina
abelha.setLed('#2fd3ff')      // cor do pólen luminoso
abelha.voo.vento = 30         // vento mais forte
```
