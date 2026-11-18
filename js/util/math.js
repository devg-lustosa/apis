/* =====================================================================
   UTILITÁRIOS · matemática, curvas de animação, aleatório com semente
   ===================================================================== */
import * as THREE from 'three';
import { BREAKPOINT } from '../config.js';

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeInOutCubic = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
export const smooth = t => t * t * (3 - 2 * t);

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const UP = V(0, 1, 0);

/** Gerador pseudoaleatório com semente: a pelagem e as pétalas saem iguais a cada carregamento. */
export function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export const RNG = mulberry32(20261117);

/** Número com vírgula decimal (pt-BR). */
export const fmt = (n, d = 1) => n.toFixed(d).replace('.', ',');

/** Progresso do scroll em alturas de tela (0 = topo da página). */
export const progresso = () => scrollY / innerHeight;

/** Layout de celular? */
export const ehCelular = () => innerWidth < BREAKPOINT;
