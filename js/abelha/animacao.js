/* =====================================================================
   ANIMAÇÃO DA ABELHA · estado + atualização por quadro
   `state` é escrito pelo piloto (voo/piloto.js) e lido aqui para
   posicionar, explodir, bater as asas, abrir a lente e a flor.
   ===================================================================== */
import * as THREE from 'three';
import { renderer, view } from './cena.js';
import { M } from './materiais.js';
import { stage, craft, pivot, PARTS, arms, WING, GHOST, antennas, abd, furo, lensLocal, ledMats, logoMat, LED0, SPAN } from './modelo.js';
import { shadow, shadowMat, pad, flor, petalas } from './flor.js';
import { clamp, lerp, smooth, easeOutCubic } from '../util/math.js';

/**
 * Estado da abelha (unidades: x, y e s em pixels; ângulos em radianos).
 * lens: 0..1 zoom na câmera · lensCenter: 0..1 centraliza a lente · pad: 0..1 flor visível
 * wing: multiplicador de velocidade das asas · asasCalmas: 0..1 desacelera as asas (vista explodida)
 */
export const state = { x:0, y:0, s:400, yaw:0, pitch:0, roll:0, tilt:0, explode:0, prop:1, shadow:.2, lift:0,
                       lens:0, lensCenter:0, vis:1, pad:0, wing:1, asasCalmas:0 };

/** Relógio da animação (segundos; para quando a pausa está ligada). */
export const tempo = { t:0 };

/* ---------- Cor da quitina e do pólen luminoso (trocáveis pelo console) ---------- */
const colorTarget = new THREE.Color('#1b1c1f');
const ledTarget = new THREE.Color(LED0);
export function setColor(hex){
  colorTarget.set(hex);
  const lum = colorTarget.r * .2126 + colorTarget.g * .7152 + colorTarget.b * .0722;
  logoMat.color.set(lum > .45 ? '#141414' : '#ffffff');      // logo sempre legível
}
export function setLed(hex){ ledTarget.set(hex); }

/* ---------- Pirueta: 360° em 0,9 s ---------- */
let flipT = -1;
export function doFlip(){ if (flipT < 0) flipT = 0; }
export const girando = () => flipT >= 0;

let wingPhase = 0, visAtual = -1;
export function update(dt){
  tempo.t += dt;
  const t = tempo.t, S = state;

  // cores suaves
  const kc = 1 - Math.exp(-dt * 6);
  M.shell.color.lerp(colorTarget, kc);
  ledMats.forEach(m => m.color.lerp(ledTarget, kc));

  // palco: posição em tela, escala e inclinação de vista
  const k = S.s * view.wpp / SPAN;
  stage.position.set(S.x * view.wpp, -S.y * view.wpp, 0);
  stage.scale.setScalar(k);
  stage.rotation.set(S.tilt, 0, 0);
  pivot.position.copy(lensLocal).multiplyScalar(-S.lensCenter);   // centraliza a lente antes de abrir o furo

  // pirueta
  let flip = 0;
  if (flipT >= 0){ flipT += dt; const u = Math.min(1, flipT / .9); flip = easeOutCubic(u) * Math.PI * 2; if (u >= 1){ flipT = -1; flip = 0; } }

  // atitude de voo + flutuação (some no zoom da lente para não tremer)
  const bob = S.prop * (1 - S.lensCenter);
  craft.position.y = Math.sin(t * 1.7) * .035 * bob + S.lift;
  craft.rotation.set(S.pitch + Math.sin(t * 1.3) * .02 * bob, S.yaw, S.roll + Math.sin(t * 1.1 + 1) * .02 * bob + flip);

  // explosão: cada peça se afasta na sua direção
  for (const p of PARTS){
    const h = p.userData.home, d = p.userData.dir, r = p.userData.rot, e = S.explode;
    p.position.set(h.x + d.x * e * .6, h.y + d.y * e * .6, h.z + d.z * e * .6);
    p.rotation.set(r.x * e, r.y * e, r.z * e);
  }

  // asas: abrem com prop, batem com amplitude crescente; em repouso dobram sobre o abdômen
  const calmas = 1 - .8 * S.asasCalmas;
  wingPhase += dt * (6 + 52 * S.prop) * S.wing * calmas;
  const f = smooth(clamp(S.prop * 1.35, 0, 1));
  const amp = .85 * f * calmas, center = lerp(.1, .2, f);
  for (const a of arms){
    const s = a.mt.side, ph = wingPhase - a.mt.fase;
    a.root.rotation.y = s * lerp(a.mt.repouso, a.mt.voo, f);
    a.root.position.y = a.hingeY + .3 * S.explode;                 // asa sobe ao explodir
    a.flap.rotation.z = s * (center + amp * Math.sin(ph));        // batida
    a.flap.rotation.x = .32 * Math.cos(ph) * f;                    // torção da corda
    a.ghosts.forEach((g, i) => { g.rotation.z = s * (center + amp * GHOST[i]); g.visible = f > .02; });
  }
  WING.f.mats.blade.opacity = WING.h.mats.blade.opacity = 1 - S.prop * .55;
  WING.f.mats.ghost.opacity = WING.h.mats.ghost.opacity = Math.min(1, S.prop * 1.1) * .55 * .2 * f * (1 - S.asasCalmas);

  // vida: antenas tremulando e abdômen respirando
  for (const an of antennas){
    an.ant.rotation.x = Math.sin(t * 2.3 + an.s) * .06;
    an.fl.rotation.y = Math.sin(t * 3.1 + an.s * 2) * .08;
  }
  abd.rotation.x = -.2 + Math.sin(t * 2.1) * .025;
  abd.rotation.y = Math.sin(t * 1.3) * .04 * S.prop;
  abd.scale.setScalar(1 + Math.sin(t * 3) * .012);

  // furo da lente (revela o vídeo atrás do canvas)
  furo.scale.setScalar(Math.max(.001, clamp((S.lens - .6) / .25, 0, 1)));

  // sombra de contato
  shadowMat.opacity = S.shadow * clamp(1 - S.lift / 2.6, 0, 1);
  shadow.scale.set(.75 * (1 + S.lift * .35), 1.15 * (1 + S.lift * .35), 1);

  // flor: cresce e abre as pétalas conforme a abelha se aproxima (a posição vem da pré-venda)
  pad.visible = S.pad > .004;
  if (pad.visible){
    const bloom = clamp(S.pad * 1.25 - .1, 0, 1), b1 = bloom - 1;
    flor.scale.setScalar(.001 + Math.max(0, 1 + 2.70158 * b1 * b1 * b1 + 1.70158 * b1 * b1));   // easeOutBack
    for (const pt of petalas) pt.rotation.x = pt.userData.base + (1 - easeOutCubic(bloom)) * 1.1 + Math.sin(t * 1.3 + pt.parent.rotation.y * 3) * .015;
  }

  if (S.vis !== visAtual){ visAtual = S.vis; renderer.domElement.style.opacity = S.vis; }
}
