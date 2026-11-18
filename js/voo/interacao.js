/* =====================================================================
   INTERAÇÃO · mouse guia o voo, clique na abelha = pirueta com pólen
   ===================================================================== */
import * as THREE from 'three';
import { camera } from '../abelha/cena.js';
import { pivot } from '../abelha/modelo.js';
import { state, doFlip, girando } from '../abelha/animacao.js';
import { pollenBurst } from '../efeitos/polen.js';
import { VOO } from '../config.js';

/** Ponteiro normalizado (−1..1) e se está sobre a abelha. */
export const ponteiro = { x:0, y:0, sobre:false };
/** Quantas piruetas o visitante já fez (a dica da hero some depois da primeira). */
export const contagem = { piruetas:0 };

// volume invisível que envolve corpo e asas, usado para detectar o clique
const hitProxy = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ visible:false }));
hitProxy.scale.set(1.25, .5, 1.0); hitProxy.position.set(0, -.02, -.25);
pivot.add(hitProxy);
const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();

/** O ponto (px) da tela está em cima da abelha? */
export function hitBee(cx, cy){
  ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.intersectObject(hitProxy, false).length > 0;
}

/** Pirueta de 360° soltando pólen (ignorada durante o zoom na câmera ou com o voo pausado). */
export function piruetaComPolen(){
  if (girando() || VOO.pausa || state.lens > .01) return;
  doFlip(); pollenBurst(); contagem.piruetas++;
}

/** Liga os eventos de ponteiro e clique. */
export function ligarInteracao(){
  addEventListener('pointermove', e => {
    ponteiro.x = e.clientX / innerWidth * 2 - 1; ponteiro.y = e.clientY / innerHeight * 2 - 1;
    const sobreUi = e.target.closest && e.target.closest('a, button, .nav');
    ponteiro.sobre = !sobreUi && state.lens < .01 && hitBee(e.clientX, e.clientY);
    document.documentElement.style.cursor = ponteiro.sobre ? 'pointer' : '';
  });
  addEventListener('click', e => {
    if (e.target.closest('a, button')) return;
    if (hitBee(e.clientX, e.clientY)) piruetaComPolen();
  });
}
