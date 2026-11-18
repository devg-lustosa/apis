/* =====================================================================
   POSES · transforma a lista de config.POSES no alvo da abelha para
   qualquer ponto do scroll (com herança, celular e âncora na flor).
   ===================================================================== */
import { POSES, DOBRA2 } from '../config.js';
import { SPAN, FOOT } from '../abelha/modelo.js';
import { clamp, lerp, easeInOutCubic, ehCelular } from '../util/math.js';

/** Campos que se misturam entre duas poses. */
export const KEYS = ['x', 'y', 's', 'yaw', 'pitch', 'tilt', 'explode', 'prop', 'shadow', 'lift'];

const padEl = document.getElementById('pad');

// herança: cada pose recebe os valores da anterior
export const poses = [];
{
  let prev = { x:0, y:0, s:.3, yaw:0, pitch:0, tilt:0, explode:0, prop:1, shadow:.2, lift:0, anchor:null, mobile:null };
  for (const P of POSES){ const r = { ...prev, ...P }; r.pos = P.secao + (P.p || 0); poses.push(r); prev = r; }
}

/** Pose da flor da pré-venda (a primeira com anchor 'pad'). */
export const POSE_FLOR = poses.find(p => p.anchor === 'pad');

/** Converte uma pose (frações da tela) em pixels, com variação de celular e âncora na div #pad. */
export function resolvePose(P0){
  const mobile = ehCelular();
  const P = mobile && P0.mobile ? { ...P0, ...P0.mobile } : P0;
  let s = Math.min(P.s * innerWidth, (mobile ? .5 : .78) * innerHeight * 1.6), x = P.x * innerWidth, y = P.y * innerHeight;
  if (P.anchor === 'pad' && padEl){
    const r = padEl.getBoundingClientRect(), kpx = s / SPAN;
    x = r.left + r.width / 2 - innerWidth / 2;
    y = r.top + r.height / 2 - innerHeight / 2 - FOOT * kpx * Math.cos(P.tilt);
  }
  return { ...P, x, y, s, pad:P.anchor === 'pad' ? 1 : 0 };
}

/** Alvo da abelha no ponto `prog` do scroll: mistura as duas poses vizinhas. */
export function targetAt(prog){
  if (prog <= poses[0].pos || poses.length === 1) return resolvePose(poses[0]);
  let i = 0; while (i < poses.length - 1 && prog >= poses[i + 1].pos) i++;
  const A = resolvePose(poses[i]);
  if (i >= poses.length - 1) return A;
  const B = resolvePose(poses[i + 1]);
  const raw = clamp((prog - poses[i].pos) / (poses[i + 1].pos - poses[i].pos), 0, 1);
  const t = B.ease === 'linear' ? raw : easeInOutCubic(raw);
  const out = {};
  for (const k of KEYS) out[k] = lerp(A[k], B[k], t);
  out.s = Math.exp(lerp(Math.log(A.s), Math.log(B.s), t));   // tamanho em escala logarítmica
  out.pad = lerp(A.pad, B.pad, t);
  return out;
}

/** Quanto do zoom na câmera (0..1) no ponto `prog` (2ª dobra). */
export function zoomAt(prog){
  const [a, b] = DOBRA2.zoomIn, [c, d] = DOBRA2.zoomOut;
  if (prog <= a || prog >= d) return 0;
  if (prog < b) return easeInOutCubic((prog - a) / (b - a));
  if (prog <= c) return 1;
  return 1 - easeInOutCubic((prog - c) / (d - c));
}
