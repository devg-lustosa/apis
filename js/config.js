/* =====================================================================
   CONFIGURAÇÃO DA PÁGINA
   Tudo o que costuma ser ajustado (coreografia, tempos, preços, vídeo)
   fica aqui. Os demais arquivos só leem estes valores.

   Unidade de scroll: "alturas de tela". 0 = topo da página, 1 = uma
   tela abaixo, e assim por diante. As seções têm estas alturas:
     hero 1 · controle 5 · anatomia 3 · onde voa 4 · pré-venda 2 · rodapé 1
   ===================================================================== */

/** Abaixo desta largura (px) a página usa o layout de celular. */
export const BREAKPOINT = 900;

/* ---------------------------------------------------------------------
   POSES DA ABELHA AO LONGO DO SCROLL
   secao + p = ponto do scroll (alturas de tela)
   x, y      = posição em fração da tela, a partir do centro
   s         = largura da abelha (ponta a ponta das asas) em fração da largura da tela
   yaw/tilt  = giro e inclinação de vista (radianos)
   explode   = 0 montada · 1 vista explodida
   prop      = 0 asas dobradas · 1 voando
   lift      = altura acima do chão (unidades da abelha)
   anchor    = 'pad' faz a abelha ir até a div #pad (flor da pré-venda)
   ease      = 'linear' para movimento constante; omitido = suave
   mobile    = valores que substituem os da pose abaixo do BREAKPOINT
   Campos omitidos herdam o valor da pose anterior.
   --------------------------------------------------------------------- */
export const POSES = [
  // 1ª dobra (hero): alto à direita, sobre a headline
  { secao:0, p:0, x:.17, y:-.17, s:.32, yaw:-.5, tilt:.42, explode:0, prop:1, shadow:.26, lift:.48, anchor:null,
    mobile:{ x:0, y:-.12, s:.82, yaw:-.4, tilt:.42 } },
  // 2ª dobra: para no centro, de frente, entre os dois textos
  { secao:1, p:0, x:0, y:.03, s:.27, yaw:0, tilt:.1, lift:.25, shadow:.2,
    mobile:{ x:0, y:.02, s:.66, yaw:0, tilt:.1 } },
  { secao:4, p:.6 },   // segura no centro durante o zoom, o vídeo e a volta
  { secao:5, p:0 },
  // 3ª dobra (anatomia): centralizada, vista de cima, e se desmonta com o scroll
  { secao:6, p:0, x:0, y:.14, s:.38, yaw:-.35, tilt:.55, lift:.3, shadow:.3, explode:0,
    mobile:{ x:0, y:-.1, s:.58, yaw:-.35, tilt:.55 } },
  { secao:7, p:.35, explode:1 },
  { secao:8, p:0 },
  // 4ª dobra (onde voa): se remonta, encolhe e voa ao longo da linha do tempo, embaixo
  { secao:8, p:.6, explode:0, x:-.4, y:.4, s:.09, yaw:1.57, tilt:.25, lift:.2, shadow:.14,
    mobile:{ x:-.34, y:.4, s:.2, yaw:1.57, tilt:.25 } },
  { secao:9, p:0 },
  { secao:12, p:0, x:.4, ease:'linear', mobile:{ x:.34, y:.4, s:.2, yaw:1.57, tilt:.25 } },
  // 5ª dobra (pré-venda): vem até a flor (div #pad), desce e fica pairando sobre ela
  { secao:12, p:.7, anchor:'pad', s:.27, yaw:.5, tilt:.45, lift:1.5, prop:1, shadow:0, explode:0, ease:'suave',
    mobile:{ s:.62, yaw:.5, tilt:.45 } },
  { secao:13, p:.6, lift:.85 },          // paira sobre a flor, batendo as asas
  { secao:14, p:0 },
  // depois disso a abelha continua sobre a flor (sobe junto com a seção quando o rodapé entra)
];

/** Altura (lift) em que a abelha paira sobre a flor; usada para saber quando soltar pólen. */
export const LIFT_FLOR = .85;

/* ---------------------------------------------------------------------
   2ª DOBRA · zoom na câmera e vídeo (a seção começa em 1 e fica presa até 5)
   --------------------------------------------------------------------- */
export const DOBRA2 = {
  zoomIn:  [1.45, 2.25],   // entra na câmera
  video:   [2.25, 3.95],   // vídeo avança com o scroll
  zoomOut: [3.95, 4.6],    // sai da câmera
};

/** Vídeo da visão da abelha: 1080p no desktop, 720p no celular (60 fps, todo quadro é quadro-chave). */
export const VIDEO = {
  desktop:'media/visao-abelha.mp4',
  celular:'media/visao-abelha-720.mp4',
};

/* ---------------------------------------------------------------------
   3ª DOBRA · no celular, as peças se revezam neste trecho do scroll (ordem dos cards 01 → 06)
   --------------------------------------------------------------------- */
export const ANA_MOB = {
  inicio:6.8, fim:7.98,
  ordem:['lente', 'olho', 'asaEsq', 'antena', 'abdomen', 'polen'],
};

/* ---------------------------------------------------------------------
   5ª DOBRA · PRÉ-VENDA — valores de EXEMPLO.
   Troque pelos preços, data e estoque reais antes de publicar.
   --------------------------------------------------------------------- */
export const PREVENDA = {
  kits:{
    essencial:{ nome:'Essencial', preco:6990 },
    pomar:    { nome:'Pomar',     preco:14990 },
    frota:    { nome:'Frota',     preco:29990 },
  },
  parcelas:12, descontoPix:.05,
  fim:'2026-12-31T23:59:59-03:00',      // fim da pré-venda (o contador usa esta data)
  reservado:83, restam:214,             // lote atual
};

/* ---------------------------------------------------------------------
   NAVEGAÇÃO · até que ponto do scroll cada aba fica ativa
   tema: 'claro' escurece nav e moldura; pólen dourado só nas seções de fundo claro
   --------------------------------------------------------------------- */
export const TRECHOS = [
  { id:'topo',     ate:.6 },
  { id:'controle', ate:5.5 },
  { id:'anatomia', ate:8.6,   claro:true, polenDourado:true },
  { id:'onde-voa', ate:12.6,  claro:true, polenDourado:true },
  { id:'preco',    ate:14.45, claro:true },
  { id:'rodape',   ate:Infinity },
];

/* ---------------------------------------------------------------------
   VOO · vento, rajadas, altitude e modo (também ajustável pelo console: window.abelha.voo)
   --------------------------------------------------------------------- */
export const MODOS = {
  suave:  { mola:4,  mouse:.6,  asas:.8  },
  normal: { mola:7,  mouse:1,   asas:1   },
  agil:   { mola:12, mouse:1.5, asas:1.3 },
};
export const VOO = { vento:12, rajadas:40, alt:1.2, modo:'normal', pausa:false };
