/* =====================================================================
   MATERIAIS DA ABELHA
   ===================================================================== */
import * as THREE from 'three';
import { furTex, hexTex } from './texturas.js';

export const M = {
  // quitina brilhante (cabeça, listras pretas, escudo, segmentos das pernas) — cor trocável via setColor
  shell:  new THREE.MeshPhysicalMaterial({ color:'#1b1c1f', roughness:.32, metalness:.25, clearcoat:.8, clearcoatRoughness:.2, side:THREE.DoubleSide }),
  // corpo fosco (coxas, pescoço, língua)
  body:   new THREE.MeshPhysicalMaterial({ color:'#111214', roughness:.55, metalness:.2, sheen:.5, sheenColor:'#6b5532', sheenRoughness:.6 }),
  // pelagem dourada aveludada (tórax e faixas amarelas)
  fur:    new THREE.MeshPhysicalMaterial({ color:'#ffc64a', map:furTex, roughness:.9, metalness:0, sheen:1, sheenColor:'#ffe7a0', sheenRoughness:.3 }),
  // âmbar-mel de destaque (tégulas, clípeo, anel do ocelo)
  accent: new THREE.MeshPhysicalMaterial({ color:'#ffb000', roughness:.35, metalness:.1, emissive:'#ff7a00', emissiveIntensity:.08, clearcoat:.5 }),
  // metal escuro (ferrão, mandíbulas, garras, articulações)
  metal:  new THREE.MeshPhysicalMaterial({ color:'#2b2c30', roughness:.28, metalness:.9 }),
  // vidro (espiráculos, ocelos laterais)
  glass:  new THREE.MeshPhysicalMaterial({ color:'#050507', roughness:.04, metalness:1 }),
  // lente iridescente (ocelo mediano)
  lens:   new THREE.MeshPhysicalMaterial({ color:'#08080c', roughness:.02, metalness:.9, iridescence:1, iridescenceIOR:1.8, iridescenceThicknessRange:[180, 700], clearcoat:1 }),
  // almofada dos pés
  rubber: new THREE.MeshStandardMaterial({ color:'#0d0d0e', roughness:.9 }),
  // pelos instanciados (a cor vem de cada instância)
  hair:   new THREE.MeshStandardMaterial({ color:'#ffffff', roughness:.72, metalness:0 }),
};
// olhos compostos = lente + relevo hexagonal
M.eye = M.lens.clone();
M.eye.color.set('#120c08'); M.eye.roughness = .12; M.eye.bumpMap = hexTex; M.eye.bumpScale = 3;

/** "Furo" da lente: zera cor e alfa do pixel e revela o HTML atrás do canvas (o vídeo da câmera). */
export const holeMat = new THREE.MeshBasicMaterial({
  transparent:true, depthWrite:false, blending:THREE.CustomBlending, blendEquation:THREE.AddEquation,
  blendSrc:THREE.ZeroFactor, blendDst:THREE.ZeroFactor, blendSrcAlpha:THREE.ZeroFactor, blendDstAlpha:THREE.ZeroFactor,
});
