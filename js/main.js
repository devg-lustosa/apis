/* =====================================================================
   APIS · PONTO DE ENTRADA
   Monta a abelha 3D, liga as seções da página e roda o laço de animação.

   Ordem de cada quadro:
     1. medir   → leituras de layout antes de qualquer escrita (evita recálculo forçado)
     2. pilotar → calcula o alvo do scroll e move a abelha com mola
     3. animar  → atualiza o modelo 3D (asas, explosão, flor…)
     4. página  → cada dobra atualiza o próprio DOM, só quando está perto da tela
     5. desenhar→ fundo 2D + cena 3D (pulados quando estão escondidos)
   ===================================================================== */
import * as THREE from 'three';
import { VOO } from './config.js';
import { renderer, scene, camera, resize, project, PR_MAX } from './abelha/cena.js';
import { anchors } from './abelha/modelo.js';
import { state, update, setColor, setLed, doFlip, girando } from './abelha/animacao.js';
import { pollenTrail, updatePollen, resizePollen } from './efeitos/polen.js';
import { resizeFundo, drawFundo, moveStreaks, fundoCoberto } from './efeitos/fundo.js';
import { pilotar } from './voo/piloto.js';
import { ligarInteracao, piruetaComPolen } from './voo/interacao.js';
import { atualizaNav } from './secoes/nav.js';
import { atualizaHero } from './secoes/hero.js';
import { atualizaLados, atualizaVisao, visao } from './secoes/controle.js';
import { atualizaAnatomia, aplicaDestaque, atualizaAnatomiaMobile } from './secoes/anatomia.js';
import { atualizaOndeVoa } from './secoes/onde-voa.js';
import { iniciarPrevenda, posicionaFlor, atualizaPrevenda, pararPolinizacao, garoaPolen } from './secoes/prevenda.js';
import { iniciarRodape, atualizaRodape } from './secoes/rodape.js';
import { lerp, progresso } from './util/math.js';

/* ---------- API no console (para testes): window.abelha ---------- */
window.abelha = {
  state, voo:VOO, setColor, setLed, doFlip, piruetaComPolen,
  anchorScreen:nome => anchors[nome] ? project(anchors[nome]) : null,
};

/* ---------- Inicialização ---------- */
iniciarPrevenda();
iniciarRodape();
ligarInteracao();
function redimensionar(){ resize(); resizePollen(); resizeFundo(); }
addEventListener('resize', redimensionar);
redimensionar();

/* ---------- Página: cada dobra só mexe no DOM quando está perto da tela ---------- */
let ladosFinal = false;
function atualizaPagina(dt){
  const prog = progresso();
  atualizaNav(prog);
  atualizaHero(prog);
  if (prog < 6.3){ atualizaLados(prog); ladosFinal = false; }
  else if (!ladosFinal){ atualizaLados(prog); ladosFinal = true; }     // garante os textos escondidos ao sair
  if ((prog > .9 && prog < 5.3) || state.lens > 0 || visao.visivel) atualizaVisao(prog, dt);
  if (prog > 5 && prog < 9.4) atualizaAnatomia();
  atualizaAnatomiaMobile();
  if (prog > 8.4 && prog < 13.6) atualizaOndeVoa();
  if (prog > 11.4){ atualizaPrevenda(); atualizaRodape(); }
  else pararPolinizacao();
}

/* ---------- Laço principal ---------- */
const clock = new THREE.Clock();
let tFundo = 0, cobertoDesenhado = false;
// resolução adaptativa: se a média passar de ~45 fps por 1,5 s, baixa um degrau (até 1x)
let mediaQuadro = 1 / 60, tempoLento = 0, prAtual = PR_MAX;

renderer.setAnimationLoop(() => {
  const real = clock.getDelta(), dt = Math.min(real, 1 / 20);
  const dtSim = VOO.pausa ? 0 : dt;           // pausa congela asas, pólen e vento

  mediaQuadro = lerp(mediaQuadro, real, .05);
  tempoLento = mediaQuadro > 1 / 45 ? tempoLento + real : 0;
  if (tempoLento > 1.5 && prAtual > 1){
    prAtual = Math.max(1, prAtual - .25); renderer.setPixelRatio(prAtual); redimensionar(); tempoLento = 0;
  }

  // 1. medir
  const fundoEscondido = fundoCoberto();
  // 2. pilotar · 3. animar
  pilotar(dt, dtSim);
  update(dtSim);
  aplicaDestaque(dt);
  posicionaFlor();
  scene.updateMatrixWorld();
  if (girando() && dtSim > 0) pollenTrail();
  garoaPolen(dtSim);
  updatePollen(dtSim);
  // 4. página
  atualizaPagina(dt);
  // 5. desenhar (com o vídeo em tela cheia, abelha e fundo ficam escondidos atrás dele)
  const pular = visao.coberto && cobertoDesenhado;
  tFundo += dtSim; moveStreaks(dtSim);
  if (!pular){ if (!fundoEscondido) drawFundo(tFundo); renderer.render(scene, camera); }
  cobertoDesenhado = visao.coberto;
});
