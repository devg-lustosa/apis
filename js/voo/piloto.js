/* =====================================================================
   PILOTO · leva a abelha até o alvo do scroll com uma mola, somando
   mouse, altitude, vento, rajadas e o zoom na câmera. Escreve em `state`.
   ===================================================================== */
import { VOO, MODOS } from '../config.js';
import { SPAN, HOLE_R } from '../abelha/modelo.js';
import { state, tempo } from '../abelha/animacao.js';
import { targetAt, zoomAt, KEYS } from './poses.js';
import { ponteiro } from './interacao.js';
import { clamp, lerp, smooth, progresso } from '../util/math.js';

const cur = {};                                 // posição atual (segue o alvo com mola)
const mouseS = { x:0, y:0 };                    // ponteiro suavizado
const rajada = { x:0, y:0, vx:0, vy:0 };        // deslocamento causado pelas rajadas
let iniciou = false, lastX = null, rollS = 0, hoverS = 0, tSim = 0, zoomC = 0;

/**
 * @param dt    tempo real do quadro (s)
 * @param dtSim tempo da simulação (0 quando o voo está pausado)
 */
export function pilotar(dt, dtSim){
  const prog = progresso(), modo = MODOS[VOO.modo];
  const T = targetAt(prog);
  tSim += dtSim;

  // mouse guia o voo enquanto a hero está na tela
  const km = 1 - Math.exp(-dt * 4);
  mouseS.x = lerp(mouseS.x, ponteiro.x, km); mouseS.y = lerp(mouseS.y, ponteiro.y, km);
  const w = clamp(1 - prog, 0, 1) * modo.mouse;
  T.yaw += mouseS.x * .25 * w;
  T.tilt += mouseS.y * .12 * w;
  T.x += mouseS.x * .03 * innerWidth * w;
  T.y += mouseS.y * .03 * innerHeight * w;

  // altitude
  T.lift = VOO.alt * .4;
  T.shadow *= clamp(1.25 - VOO.alt * .25, .35, 1.2);

  // vento: deriva lateral constante + balanço (some quando o zoom começa)
  const calma = (1 - smooth(clamp(zoomC / .22, 0, 1))) * lerp(1, .5, clamp(prog, 0, 1));
  const vv = VOO.vento / 40 * calma;
  T.x += (vv * .035 + Math.sin(tSim * .9) * vv * .012) * innerWidth;
  T.y += Math.sin(tSim * 1.7) * vv * .008 * innerHeight;

  // rajadas: impulsos aleatórios que a mola corrige
  const gp = VOO.rajadas / 100;
  if (dtSim > 0 && Math.random() < dtSim * gp * 1.4){
    rajada.vx += (Math.random() - .35) * gp * innerWidth * .5;
    rajada.vy += (Math.random() - .5) * gp * innerHeight * .35;
  }
  const amort = Math.exp(-dtSim * 3.2), volta = Math.exp(-dtSim * 2.2);
  rajada.vx *= amort; rajada.vy *= amort;
  rajada.x = (rajada.x + rajada.vx * dtSim) * volta; rajada.y = (rajada.y + rajada.vy * dtSim) * volta;
  T.x += rajada.x * calma; T.y += rajada.y * calma;

  // passar o mouse por cima aproxima um pouco a abelha
  hoverS = lerp(hoverS, ponteiro.sobre ? 1 : 0, 1 - Math.exp(-dt * 8));
  T.s *= 1 + .05 * hoverS;

  // entrada: a abelha chega voando pela direita
  if (!iniciou){ Object.assign(cur, T); cur.x += innerWidth * .55; cur.y -= innerHeight * .2; cur.yaw -= 1.1; cur.s *= .7; iniciou = true; }
  const ks = 1 - Math.exp(-dt * (tempo.t > 1.6 ? modo.mola : 3.2));
  for (const k of [...KEYS, 'pad']) cur[k] = lerp(cur[k], T[k], ks);

  // inclinação lateral pela velocidade + inclinação contra o vento
  const vx = lastX === null ? 0 : (cur.x - lastX) / Math.max(dt, 1e-4) / innerWidth; lastX = cur.x;
  rollS = lerp(rollS, clamp(-vx * .5 - vv * .16, -.5, .5), 1 - Math.exp(-dt * 6));

  // zoom na lente: centraliza a abelha de frente e escala até o furo cobrir a tela inteira
  zoomC = lerp(zoomC, zoomAt(prog), 1 - Math.exp(-dt * 12));
  const z = zoomC < .0005 ? 0 : zoomC;
  const c = smooth(clamp(z / .22, 0, 1));
  const zmax = Math.max(1, 1.1 * Math.hypot(innerWidth, innerHeight) / 2 * SPAN / (HOLE_R * cur.s));

  state.x = lerp(cur.x, 0, c); state.y = lerp(cur.y, 0, c); state.s = cur.s * Math.exp(z * Math.log(zmax));
  state.yaw = lerp(cur.yaw, 0, c); state.tilt = lerp(cur.tilt, 0, c); state.pitch = cur.pitch * (1 - c); state.roll = rollS * (1 - c);
  state.explode = cur.explode; state.prop = cur.prop; state.shadow = cur.shadow * (1 - c); state.lift = cur.lift * (1 - c);
  state.pad = cur.pad; state.lens = z; state.lensCenter = c;
  state.wing = modo.asas; state.asasCalmas = smooth(clamp(cur.explode * 1.4, 0, 1));
}
