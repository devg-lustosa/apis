/* =====================================================================
   FUNDO ANIMADO · gradiente amarelo, anéis do "zumbido" saindo da abelha
   e traços de vento. Canvas 2D fixo atrás de todo o conteúdo.
   ===================================================================== */
import { state } from '../abelha/animacao.js';
import { VOO } from '../config.js';
import { lerp } from '../util/math.js';

const fundo = document.getElementById('fundo'), fx = fundo.getContext('2d');
let fr = 1;
const STREAKS = [...Array(140)].map(() => ({ x:Math.random(), y:Math.random(), l:.4 + Math.random() * .6, a:.18 + Math.random() * .4, v:.6 + Math.random() * .8 }));

/** Desenha em resolução reduzida (o CSS estica; por ser só gradiente e anéis suaves, não se nota). */
export function resizeFundo(){ fr = .6; fundo.width = Math.round(innerWidth * fr); fundo.height = Math.round(innerHeight * fr); }

export function drawFundo(t){
  const W = fundo.width, H = fundo.height, D = Math.hypot(W, H);
  const bx = (innerWidth / 2 + state.x) * fr, by = (innerHeight / 2 + state.y) * fr;
  const g = fx.createRadialGradient(bx, by, 0, bx, by, D * .85);
  g.addColorStop(0, '#ffd84a'); g.addColorStop(.4, '#ffbe1a'); g.addColorStop(1, '#f59e0b');
  fx.fillStyle = g; fx.fillRect(0, 0, W, H);
  // anéis concêntricos saindo da abelha
  const gap = 150 * fr, off = (t * 26 * fr) % gap;
  for (let r = off + 40 * fr; r < D; r += gap){
    const a = .17 * Math.pow(1 - r / D, 1.3);
    fx.strokeStyle = `rgba(255,255,255,${a.toFixed(3)})`; fx.lineWidth = 48 * fr;
    fx.beginPath(); fx.arc(bx, by, r, 0, Math.PI * 2); fx.stroke();
  }
  // traços de vento: mais numerosos, longos e horizontais com vento forte
  const vv = VOO.vento / 40, ang = lerp(1.15, .22, vv), cs = Math.cos(ang), sn = Math.sin(ang);
  const n = Math.round(24 + vv * 110), comp = (22 + vv * 90) * fr;
  fx.lineCap = 'round'; fx.lineWidth = 1.4 * fr;
  for (let i = 0; i < n; i++){
    const s = STREAKS[i], L = comp * s.l, x = s.x * (W + 200 * fr) - 100 * fr, y = s.y * (H + 200 * fr) - 100 * fr;
    fx.strokeStyle = `rgba(255,255,255,${(s.a * (.55 + vv * .45)).toFixed(3)})`;
    fx.beginPath(); fx.moveTo(x, y); fx.lineTo(x - cs * L, y - sn * L); fx.stroke();
  }
}

export function moveStreaks(dt){
  const vv = VOO.vento / 40, ang = lerp(1.15, .22, vv), sp = (60 + vv * 520) / innerWidth;
  for (const s of STREAKS){
    s.x += Math.cos(ang) * sp * s.v * dt; s.y += Math.sin(ang) * sp * s.v * dt * innerWidth / innerHeight;
    if (s.x > 1){ s.x -= 1; s.y = Math.random(); } if (s.y > 1){ s.y -= 1; s.x = Math.random(); }
  }
}

/** O fundo fica escondido atrás das seções opacas: nesses trechos não precisa redesenhar. */
const opacas = [...document.querySelectorAll('.anatomia, .ondevoa, .rodape')];
export function fundoCoberto(){
  for (const el of opacas){ const r = el.getBoundingClientRect(); if (r.top <= 0 && r.bottom >= innerHeight) return true; }
  return false;
}
